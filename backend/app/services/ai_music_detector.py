"""
AI Music Detection Service
Detects if music is AI-generated using audio analysis
"""

import logging
import requests
import numpy as np
from typing import Tuple, Optional
import librosa
import io

logger = logging.getLogger(__name__)


class AIMusicDetector:
    """
    Service to detect AI-generated music
    Uses audio fingerprinting and pattern analysis
    """

    def __init__(self):
        self.confidence_threshold = 0.7

    def detect_ai_music(self, audio_url: str) -> Tuple[bool, float]:
        """
        Detect if music from URL is AI-generated

        Args:
            audio_url: URL to audio preview (30s MP3 from Spotify)

        Returns:
            Tuple of (is_ai_generated: bool, confidence: float)
        """
        try:
            logger.info(f"Analyzing audio from: {audio_url}")

            # Download audio
            response = requests.get(audio_url, timeout=10)
            response.raise_for_status()

            # Load audio with librosa
            audio_data = io.BytesIO(response.content)
            y, sr = librosa.load(audio_data, sr=22050, duration=30)

            # Extract features
            features = self._extract_features(y, sr)

            # Analyze for AI patterns
            ai_score = self._analyze_ai_patterns(features)

            is_ai = ai_score > self.confidence_threshold

            logger.info(f"AI Detection: {is_ai} (confidence: {ai_score:.2f})")

            return is_ai, ai_score

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download audio: {e}")
            # Return unknown with low confidence
            return False, 0.0

        except Exception as e:
            logger.error(f"Error detecting AI music: {e}")
            return False, 0.0

    def _extract_features(self, y: np.ndarray, sr: int) -> dict:
        """Extract audio features for analysis"""
        features = {}

        try:
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]

            features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
            features['spectral_centroid_std'] = float(np.std(spectral_centroids))
            features['spectral_rolloff_mean'] = float(np.mean(spectral_rolloff))
            features['spectral_bandwidth_mean'] = float(np.mean(spectral_bandwidth))

            # MFCC (Mel-frequency cepstral coefficients)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            features['mfcc_mean'] = float(np.mean(mfccs))
            features['mfcc_std'] = float(np.std(mfccs))

            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            features['zcr_mean'] = float(np.mean(zcr))

            # Chroma features
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            features['chroma_mean'] = float(np.mean(chroma))
            features['chroma_std'] = float(np.std(chroma))

            # Tempo
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            features['tempo'] = float(tempo)

            # RMS Energy
            rms = librosa.feature.rms(y=y)[0]
            features['rms_mean'] = float(np.mean(rms))
            features['rms_std'] = float(np.std(rms))

            # Harmonic and percussive components
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            features['harmonic_ratio'] = float(np.sum(np.abs(y_harmonic)) / (np.sum(np.abs(y)) + 1e-6))
            features['percussive_ratio'] = float(np.sum(np.abs(y_percussive)) / (np.sum(np.abs(y)) + 1e-6))

        except Exception as e:
            logger.error(f"Error extracting features: {e}")

        return features

    def _analyze_ai_patterns(self, features: dict) -> float:
        """
        Analyze features for AI-generated music patterns

        AI-generated music often has:
        - Very consistent spectral characteristics (low variance)
        - Perfect tempo consistency
        - Unnatural harmonic patterns
        - Lack of human performance micro-variations
        - Overly compressed dynamic range

        Returns:
            Confidence score (0.0 to 1.0) that music is AI-generated
        """
        score = 0.0
        indicators = 0

        try:
            # 1. Check spectral consistency (AI is too consistent)
            if 'spectral_centroid_std' in features:
                # Low variance indicates AI (human performance varies more)
                if features['spectral_centroid_std'] < 500:
                    score += 0.15
                indicators += 1

            # 2. Check MFCC variance (AI has low variance)
            if 'mfcc_std' in features:
                if features['mfcc_std'] < 20:
                    score += 0.15
                indicators += 1

            # 3. Check tempo consistency (AI is metronomic)
            if 'tempo' in features:
                tempo = features['tempo']
                # Very precise tempos (multiples of 10) are suspicious
                if tempo % 10 == 0 or tempo % 5 == 0:
                    score += 0.10
                indicators += 1

            # 4. Check harmonic ratio (AI can have unnatural ratios)
            if 'harmonic_ratio' in features and 'percussive_ratio' in features:
                harmonic_ratio = features['harmonic_ratio']
                percussive_ratio = features['percussive_ratio']

                # Perfectly balanced = suspicious
                balance_diff = abs(harmonic_ratio - percussive_ratio)
                if balance_diff < 0.1:
                    score += 0.10
                indicators += 1

            # 5. Check dynamic range (AI often has compressed range)
            if 'rms_std' in features:
                # Very low RMS variance = overly compressed
                if features['rms_std'] < 0.05:
                    score += 0.15
                indicators += 1

            # 6. Check zero crossing rate consistency
            if 'zcr_mean' in features:
                zcr = features['zcr_mean']
                # AI tends to have very consistent ZCR
                if 0.04 < zcr < 0.06:  # Suspiciously narrow range
                    score += 0.10
                indicators += 1

            # 7. Check chroma consistency
            if 'chroma_std' in features:
                # Very low chroma variance = AI
                if features['chroma_std'] < 0.1:
                    score += 0.15
                indicators += 1

            # 8. Check spectral rolloff (AI has characteristic patterns)
            if 'spectral_rolloff_mean' in features:
                rolloff = features['spectral_rolloff_mean']
                # AI often has rolloff in specific ranges
                if 3000 < rolloff < 4000:
                    score += 0.10
                indicators += 1

            # Normalize score
            if indicators > 0:
                score = min(1.0, score)

            # Add baseline uncertainty
            # Even with clear patterns, we maintain some uncertainty
            score = score * 0.95

        except Exception as e:
            logger.error(f"Error analyzing AI patterns: {e}")
            score = 0.0

        return score

    def detect_deepfake_vocals(self, audio_url: str) -> Tuple[bool, float]:
        """
        Detect AI-generated/deepfake vocals

        This is a more advanced check specifically for vocal synthesis

        Returns:
            Tuple of (is_deepfake: bool, confidence: float)
        """
        try:
            # Download and load audio
            response = requests.get(audio_url, timeout=10)
            response.raise_for_status()

            audio_data = io.BytesIO(response.content)
            y, sr = librosa.load(audio_data, sr=22050, duration=30)

            # Isolate vocals using harmonic-percussive separation
            y_harmonic, _ = librosa.effects.hpss(y)

            # Extract vocal-specific features
            features = {}

            # Pitch stability (AI vocals are too stable)
            pitches, magnitudes = librosa.piptrack(y=y_harmonic, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)

            if pitch_values:
                pitch_std = float(np.std(pitch_values))
                features['pitch_stability'] = pitch_std

                # AI vocals have unnaturally low pitch variance
                if pitch_std < 20:
                    return True, 0.8
                elif pitch_std < 50:
                    return True, 0.6

            # Formant analysis (AI has characteristic formant patterns)
            # This would require more advanced DSP

            return False, 0.3

        except Exception as e:
            logger.error(f"Error detecting deepfake vocals: {e}")
            return False, 0.0

    def analyze_production_quality(self, audio_url: str) -> dict:
        """
        Analyze production quality indicators

        Returns dict with:
        - mastering_quality (0-100)
        - mixing_balance (0-100)
        - dynamic_range (dB)
        - professional_score (0-100)
        """
        try:
            response = requests.get(audio_url, timeout=10)
            response.raise_for_status()

            audio_data = io.BytesIO(response.content)
            y, sr = librosa.load(audio_data, sr=22050, duration=30)

            # Calculate dynamic range
            rms = librosa.feature.rms(y=y)[0]
            dynamic_range = float(20 * np.log10(np.max(rms) / (np.min(rms) + 1e-6)))

            # Calculate mastering quality (based on frequency balance)
            spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
            mastering_quality = float(min(100, np.mean(spectral_contrast) * 10))

            # Calculate mixing balance
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            harmonic_energy = np.sum(y_harmonic ** 2)
            percussive_energy = np.sum(y_percussive ** 2)
            total_energy = harmonic_energy + percussive_energy

            if total_energy > 0:
                balance = 1 - abs(harmonic_energy / total_energy - 0.6)
                mixing_balance = float(balance * 100)
            else:
                mixing_balance = 50.0

            # Overall professional score
            professional_score = (mastering_quality * 0.4 +
                                mixing_balance * 0.3 +
                                min(100, dynamic_range * 5) * 0.3)

            return {
                'mastering_quality': round(mastering_quality, 2),
                'mixing_balance': round(mixing_balance, 2),
                'dynamic_range_db': round(dynamic_range, 2),
                'professional_score': round(professional_score, 2)
            }

        except Exception as e:
            logger.error(f"Error analyzing production quality: {e}")
            return {
                'mastering_quality': 50.0,
                'mixing_balance': 50.0,
                'dynamic_range_db': 10.0,
                'professional_score': 50.0
            }
