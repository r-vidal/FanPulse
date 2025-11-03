"""
Fan Value Score (FVS) Algorithm

Calculates a 0-100 score for each fan based on:
- Listening Intensity (40%)
- Engagement Recency (30%)
- Social Engagement (20%)
- Monetization History (10%)
"""
from typing import Dict


def calculate_fvs(
    listening_hours: float,
    percentile_rank: float,
    days_since_last_listen: int,
    social_engagement_count: int,
    monetization_score: float
) -> float:
    """
    Calculate Fan Value Score (FVS)

    Args:
        listening_hours: Monthly listening hours
        percentile_rank: Top listener percentile (0-100)
        days_since_last_listen: Days since last listen
        social_engagement_count: Number of social interactions
        monetization_score: Monetization score (0-10)

    Returns:
        FVS score (0-100)
    """
    # Listening Intensity (40%)
    listening_intensity = min(40, (listening_hours * 2) + (percentile_rank * 0.2))

    # Engagement Recency (30%)
    engagement_recency = max(0, 30 - days_since_last_listen)

    # Social Engagement (20%)
    social_engagement = min(20, social_engagement_count * 2)

    # Monetization History (10%)
    monetization = min(10, monetization_score)

    # Total FVS
    fvs = listening_intensity + engagement_recency + social_engagement + monetization

    return min(100, max(0, fvs))


def calculate_batch_fvs(fans_data: list) -> Dict[str, float]:
    """
    Calculate FVS for multiple fans

    Args:
        fans_data: List of fan data dictionaries

    Returns:
        Dictionary mapping fan_id to FVS score
    """
    results = {}
    for fan in fans_data:
        fvs = calculate_fvs(
            listening_hours=fan.get('listening_hours', 0),
            percentile_rank=fan.get('percentile_rank', 0),
            days_since_last_listen=fan.get('days_since_last_listen', 999),
            social_engagement_count=fan.get('social_engagement_count', 0),
            monetization_score=fan.get('monetization_score', 0)
        )
        results[fan['id']] = fvs

    return results
