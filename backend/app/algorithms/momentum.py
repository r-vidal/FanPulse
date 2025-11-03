"""
Momentum Index Algorithm

Calculates a 0-10 momentum score based on:
- Stream Growth Rate (30%)
- Engagement Velocity (25%)
- Playlist Momentum (20%)
- Social Virality (15%)
- Press & Discovery (10%)
"""
import numpy as np
from typing import List, Dict


def calculate_moving_average(data: List[float], window: int) -> float:
    """Calculate moving average"""
    if len(data) < window:
        return np.mean(data) if data else 0
    return np.mean(data[-window:])


def calculate_momentum_index(
    daily_streams: List[int],
    engagement_data: List[float],
    playlist_additions: int,
    social_mentions: int,
    press_mentions: int
) -> Dict[str, float]:
    """
    Calculate Momentum Index (0-10)

    Args:
        daily_streams: List of daily stream counts (last 90 days)
        engagement_data: List of daily engagement rates
        playlist_additions: Number of new playlist adds (last 7 days)
        social_mentions: Number of social media mentions
        press_mentions: Number of press/blog mentions

    Returns:
        Dictionary with momentum score and components
    """
    # Stream Growth Rate (30%)
    ma_7 = calculate_moving_average(daily_streams, 7)
    ma_21 = calculate_moving_average(daily_streams, 21)
    ma_90 = calculate_moving_average(daily_streams, 90)

    if ma_21 > 0:
        acceleration = (ma_7 - ma_21) / ma_21
    else:
        acceleration = 0

    stream_score = min(3.0, max(0, acceleration * 10))

    # Engagement Velocity (25%)
    if len(engagement_data) > 7:
        recent_engagement = np.mean(engagement_data[-7:])
        past_engagement = np.mean(engagement_data[-30:-7])
        if past_engagement > 0:
            engagement_change = (recent_engagement - past_engagement) / past_engagement
        else:
            engagement_change = 0
    else:
        engagement_change = 0

    engagement_score = min(2.5, max(0, engagement_change * 10))

    # Playlist Momentum (20%)
    playlist_score = min(2.0, playlist_additions * 0.1)

    # Social Virality (15%)
    social_score = min(1.5, social_mentions * 0.01)

    # Press & Discovery (10%)
    discovery_score = min(1.0, press_mentions * 0.2)

    # Total momentum
    momentum = (
        stream_score +
        engagement_score +
        playlist_score +
        social_score +
        discovery_score
    )

    return {
        'momentum': min(10.0, momentum),
        'stream_score': stream_score,
        'engagement_score': engagement_score,
        'playlist_score': playlist_score,
        'social_score': social_score,
        'discovery_score': discovery_score
    }
