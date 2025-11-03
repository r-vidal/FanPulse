"""Release Optimizer background tasks"""
import logging
from datetime import datetime, timedelta, date
from typing import List
from app.core.celery_app import celery_app
from app.core.database import get_db_sync
from app.models.artist import Artist
from app.models.release import ReleaseScore, CompetingRelease
from app.services.release_optimizer import ReleaseOptimizer
from app.services.platforms.spotify import SpotifyService
import asyncio

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.releases.calculate_release_scores")
def calculate_release_scores_task() -> dict:
    """
    Calculate release scores for all artists

    Runs weekly (Monday) via Celery Beat to pre-calculate optimal
    release dates for the next 8 weeks.

    Returns:
        Summary of calculations
    """
    try:
        logger.info("Starting release scores calculation batch")

        db = next(get_db_sync())

        # Get all artists
        artists = db.query(Artist).all()

        if not artists:
            logger.warning("No artists found for release score calculation")
            return {
                "status": "success",
                "artists_processed": 0,
                "message": "No artists to process",
            }

        optimizer = ReleaseOptimizer(db)
        success_count = 0
        failed_count = 0

        for artist in artists:
            try:
                # Calculate scores for 8 weeks ahead
                scores = optimizer.calculate_release_scores(str(artist.id), weeks_ahead=8)

                # Delete old scores for this artist
                db.query(ReleaseScore).filter(
                    ReleaseScore.artist_id == artist.id
                ).delete(synchronize_session=False)

                # Save new scores
                for score in scores:
                    db.add(score)

                db.commit()

                success_count += 1
                logger.info(f"Calculated release scores for artist {artist.name} ({len(scores)} dates)")

            except Exception as e:
                logger.error(f"Failed to calculate scores for artist {artist.id}: {e}")
                failed_count += 1
                db.rollback()

        logger.info(
            f"Release scores calculation complete: {success_count} succeeded, "
            f"{failed_count} failed"
        )

        return {
            "status": "success",
            "artists_processed": success_count,
            "artists_failed": failed_count,
            "total_artists": len(artists),
        }

    except Exception as e:
        logger.error(f"Error in release scores calculation batch: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@celery_app.task(name="app.tasks.releases.scrape_competing_releases")
def scrape_competing_releases_task() -> dict:
    """
    Scrape new music releases from Spotify

    Runs daily via Celery Beat to keep competing releases data fresh.
    Fetches "New Releases" from Spotify for the next 4 weeks.

    Returns:
        Summary of scraping operation
    """
    try:
        logger.info("Starting competing releases scraping")

        db = next(get_db_sync())

        # Get date range: today to 4 weeks ahead
        start_date = datetime.utcnow().date()
        end_date = start_date + timedelta(weeks=4)

        # Delete old competing releases (older than yesterday)
        yesterday = datetime.utcnow().date() - timedelta(days=1)
        deleted_count = db.query(CompetingRelease).filter(
            CompetingRelease.release_date < yesterday
        ).delete(synchronize_session=False)

        logger.info(f"Deleted {deleted_count} old competing releases")

        # Scrape new releases from Spotify
        competing_releases = asyncio.run(
            _scrape_spotify_new_releases(start_date, end_date)
        )

        # Save to database
        added_count = 0
        for release_data in competing_releases:
            # Check if already exists
            existing = db.query(CompetingRelease).filter(
                CompetingRelease.artist_spotify_id == release_data["artist_spotify_id"],
                CompetingRelease.release_date == release_data["release_date"]
            ).first()

            if not existing:
                competing_release = CompetingRelease(**release_data)
                db.add(competing_release)
                added_count += 1

        db.commit()

        logger.info(
            f"Scraping complete: {added_count} new releases added, "
            f"{deleted_count} old releases removed"
        )

        return {
            "status": "success",
            "releases_added": added_count,
            "releases_deleted": deleted_count,
            "date_range": f"{start_date} to {end_date}",
        }

    except Exception as e:
        logger.error(f"Error in competing releases scraping: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


async def _scrape_spotify_new_releases(
    start_date: date,
    end_date: date
) -> List[dict]:
    """
    Scrape new releases from Spotify New Releases endpoint

    Args:
        start_date: Start of date range
        end_date: End of date range

    Returns:
        List of release data dictionaries
    """
    spotify = SpotifyService()
    releases_data = []

    try:
        # Get Spotify access token
        access_token = await spotify.get_client_credentials_token()

        # Fetch new releases
        # Note: Spotify's "new releases" endpoint returns recent/upcoming albums
        # We'll fetch and filter by release date

        offset = 0
        limit = 50
        max_results = 200  # Don't fetch too many in one run

        while offset < max_results:
            response = await spotify.make_request(
                method="GET",
                url=f"{spotify.base_url}/browse/new-releases",
                headers={"Authorization": f"Bearer {access_token}"},
                params={
                    "limit": limit,
                    "offset": offset,
                    "country": "US",  # Can be made configurable
                }
            )

            albums = response.get("albums", {}).get("items", [])

            if not albums:
                break

            for album in albums:
                try:
                    # Parse release date
                    release_date_str = album.get("release_date")
                    if not release_date_str:
                        continue

                    # Spotify dates can be "YYYY-MM-DD", "YYYY-MM", or "YYYY"
                    if len(release_date_str) == 10:  # YYYY-MM-DD
                        album_release_date = datetime.strptime(
                            release_date_str, "%Y-%m-%d"
                        ).date()
                    elif len(release_date_str) == 7:  # YYYY-MM
                        album_release_date = datetime.strptime(
                            release_date_str, "%Y-%m"
                        ).date()
                    else:  # YYYY
                        album_release_date = datetime.strptime(
                            release_date_str, "%Y"
                        ).date()

                    # Filter by date range
                    if not (start_date <= album_release_date <= end_date):
                        continue

                    # Get artist info
                    artists_data = album.get("artists", [])
                    if not artists_data:
                        continue

                    primary_artist = artists_data[0]
                    artist_id = primary_artist.get("id")
                    artist_name = primary_artist.get("name")

                    # Fetch artist details for followers/popularity
                    artist_details = await spotify.get_artist_data(
                        platform_artist_id=artist_id,
                        access_token=access_token
                    )

                    # Determine if major release
                    followers = artist_details.get("followers", 0)
                    is_major = followers >= 1_000_000  # 1M+ followers

                    # Create release data
                    release_data = {
                        "release_date": album_release_date,
                        "artist_name": artist_name,
                        "artist_spotify_id": artist_id,
                        "album_name": album.get("name"),
                        "album_type": album.get("album_type"),  # album, single, compilation
                        "artist_followers": followers,
                        "artist_popularity": artist_details.get("popularity", 0),
                        "artist_monthly_listeners": None,  # Not available in public API
                        "genres": artist_details.get("genres", []),
                        "spotify_url": album.get("external_urls", {}).get("spotify"),
                        "total_tracks": album.get("total_tracks", 0),
                        "is_major_release": is_major,
                        "raw_data": {
                            "album": album,
                            "artist": artist_details,
                        }
                    }

                    releases_data.append(release_data)

                except Exception as e:
                    logger.warning(f"Failed to parse album: {e}")
                    continue

            offset += limit

            # Rate limiting
            await asyncio.sleep(0.5)

        logger.info(f"Scraped {len(releases_data)} competing releases from Spotify")

        return releases_data

    except Exception as e:
        logger.error(f"Error scraping Spotify new releases: {e}")
        return []

    finally:
        await spotify.close()
