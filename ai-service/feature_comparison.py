#!/usr/bin/env python3

import sys
import json
import numpy as np
import cv2
import os
import tempfile
import logging
import time
from typing import List, Dict, Optional
from dataclasses import dataclass
from scipy.spatial.distance import cosine

# Import existing hash generator
from hash_generator import HashGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FrameFeatures:
    timestamp: float
    phash: str
    dct_hash: str
    tf_embedding: Optional[List[float]]
    advanced_features: Dict
    frame_path: Optional[str] = None
    width: int = 0
    height: int = 0

@dataclass
class SimilarityResult:
    visual_similarity: float
    temporal_alignment: float
    overall_confidence: float
    matched_frames: List[Dict]
    frame_count_original: int
    frame_count_suspected: int
    analysis_metadata: Dict

class VideoComparator:
    """
    Stripped-down video comparison engine for Copyright Shield
    Removes YouTube dependencies, focuses on user-uploaded file analysis
    """

    def __init__(self):
        self.hash_generator = HashGenerator()
        logger.info("VideoComparator initialized for Copyright Shield")

    def health_check(self) -> Dict:
        """Health check for the comparator"""
        try:
            return {
                "status": "healthy",
                "hash_generator_available": True,
                "tensorflow_available": self.hash_generator.tf_available,
                "opencv_available": True
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def extract_frames_from_video(self, video_path: str, max_frames: int = 10) -> List[str]:
        """
        Extract frames from video file and save as temporary images
        Returns list of frame file paths
        """
        frame_paths = []
        temp_dir = tempfile.mkdtemp()

        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception(f"Could not open video: {video_path}")

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            duration = total_frames / fps

            # Calculate frame intervals for even distribution
            if total_frames > max_frames:
                frame_interval = total_frames // max_frames
            else:
                frame_interval = 1

            frame_count = 0
            extracted_count = 0

            while cap.isOpened() and extracted_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % frame_interval == 0:
                    # Save frame as temporary file
                    frame_filename = f"frame_{extracted_count:04d}.jpg"
                    frame_path = os.path.join(temp_dir, frame_filename)
                    cv2.imwrite(frame_path, frame)
                    frame_paths.append(frame_path)
                    extracted_count += 1

                frame_count += 1

            cap.release()
            logger.info(f"Extracted {len(frame_paths)} frames from {video_path}")
            return frame_paths

        except Exception as e:
            logger.error(f"Frame extraction failed: {str(e)}")
            # Clean up on failure
            for path in frame_paths:
                if os.path.exists(path):
                    os.remove(path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
            raise

    def extract_video_features(self, video_path: str, max_frames: int = 10) -> List[FrameFeatures]:
        """
        Extract features from video frames for analysis
        """
        features_list = []
        frame_paths = []

        try:
            # Extract frames
            frame_paths = self.extract_frames_from_video(video_path, max_frames)

            # Get video metadata
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps
            cap.release()

            # Process each frame
            for i, frame_path in enumerate(frame_paths):
                try:
                    # Generate all features for this frame
                    frame_features = self.hash_generator.generate_all_features(frame_path)

                    # Calculate timestamp
                    timestamp = (i / len(frame_paths)) * duration

                    # Get frame dimensions
                    img = cv2.imread(frame_path)
                    height, width = img.shape[:2] if img is not None else (0, 0)

                    features = FrameFeatures(
                        timestamp=timestamp,
                        phash=frame_features.get('phash', ''),
                        dct_hash=frame_features.get('dct_hash', ''),
                        tf_embedding=frame_features.get('tf_embedding'),
                        advanced_features=frame_features.get('advanced_features', {}),
                        frame_path=frame_path,
                        width=width,
                        height=height
                    )

                    features_list.append(features)

                except Exception as e:
                    logger.warning(f"Failed to process frame {i}: {str(e)}")
                    continue

            # Add duration metadata to first feature
            if features_list:
                features_list[0].advanced_features['duration'] = duration
                features_list[0].advanced_features['total_frames'] = total_frames
                features_list[0].advanced_features['fps'] = fps

            return features_list

        finally:
            # Clean up temporary frame files
            for path in frame_paths:
                if os.path.exists(path):
                    os.remove(path)

    def calculate_frame_similarity(self, features1: FrameFeatures, features2: FrameFeatures) -> float:
        """
        Calculate similarity between two frames using multiple methods
        """
        similarities = []

        try:
            # pHash similarity (Hamming distance)
            if features1.phash and features2.phash:
                # Convert hex to binary and calculate Hamming distance
                phash1_bin = bin(int(features1.phash, 16))[2:].zfill(64)
                phash2_bin = bin(int(features2.phash, 16))[2:].zfill(64)
                hamming_dist = sum(c1 != c2 for c1, c2 in zip(phash1_bin, phash2_bin))
                phash_similarity = 1 - (hamming_dist / 64.0)
                similarities.append(phash_similarity)

            # DCT hash similarity
            if features1.dct_hash and features2.dct_hash:
                dct1_bin = bin(int(features1.dct_hash, 16))[2:].zfill(64)
                dct2_bin = bin(int(features2.dct_hash, 16))[2:].zfill(64)
                dct_hamming = sum(c1 != c2 for c1, c2 in zip(dct1_bin, dct2_bin))
                dct_similarity = 1 - (dct_hamming / 64.0)
                similarities.append(dct_similarity)

            # TensorFlow embedding similarity (cosine)
            if (features1.tf_embedding and features2.tf_embedding and 
                len(features1.tf_embedding) > 0 and len(features2.tf_embedding) > 0):
                tf_similarity = 1 - cosine(features1.tf_embedding, features2.tf_embedding)
                similarities.append(tf_similarity)

            # Advanced features similarity (brightness, contrast, etc.)
            if features1.advanced_features and features2.advanced_features:
                advanced_sim = self._calculate_advanced_similarity(
                    features1.advanced_features, 
                    features2.advanced_features
                )
                similarities.append(advanced_sim)

            # Return weighted average
            if similarities:
                return sum(similarities) / len(similarities)
            else:
                return 0.0

        except Exception as e:
            logger.error(f"Frame similarity calculation failed: {str(e)}")
            return 0.0

    def _calculate_advanced_similarity(self, features1: Dict, features2: Dict) -> float:
        """Calculate similarity based on advanced features"""
        try:
            similarities = []

            # Compare numerical features
            numerical_features = ['brightness', 'contrast', 'complexity', 'edge_density']
            for feature in numerical_features:
                if feature in features1 and feature in features2:
                    val1, val2 = features1[feature], features2[feature]
                    if val1 > 0 and val2 > 0:  # Avoid division by zero
                        similarity = 1 - abs(val1 - val2) / max(val1, val2)
                        similarities.append(similarity)

            # Compare dominant colors (simplified)
            if 'dominant_colors' in features1 and 'dominant_colors' in features2:
                # This is a simplified comparison - could be enhanced
                similarities.append(0.5)  # Placeholder

            return sum(similarities) / len(similarities) if similarities else 0.0

        except Exception as e:
            logger.error(f"Advanced similarity calculation failed: {str(e)}")
            return 0.0

    def analyze_video_similarity(self, original_path: str, suspected_path: str, 
                               max_frames: int = 20) -> SimilarityResult:
        """
        Analyze similarity between two video files
        """
        try:
            # Extract features from both videos
            logger.info(f"Analyzing similarity between {original_path} and {suspected_path}")

            original_features = self.extract_video_features(original_path, max_frames)
            suspected_features = self.extract_video_features(suspected_path, max_frames)

            if not original_features or not suspected_features:
                raise Exception("Could not extract features from one or both videos")

            # Find best matches between frames
            matched_frames = []
            frame_similarities = []

            for i, orig_frame in enumerate(original_features):
                best_match_similarity = 0.0
                best_match_index = -1

                for j, susp_frame in enumerate(suspected_features):
                    similarity = self.calculate_frame_similarity(orig_frame, susp_frame)
                    if similarity > best_match_similarity:
                        best_match_similarity = similarity
                        best_match_index = j

                if best_match_similarity > 0.3:  # Threshold for considering a match
                    matched_frames.append({
                        "original_frame": i,
                        "suspected_frame": best_match_index,
                        "similarity": best_match_similarity,
                        "original_timestamp": orig_frame.timestamp,
                        "suspected_timestamp": suspected_features[best_match_index].timestamp
                    })

                frame_similarities.append(best_match_similarity)

            # Calculate overall metrics
            visual_similarity = sum(frame_similarities) / len(frame_similarities)

            # Temporal alignment (how well the timing matches)
            temporal_alignment = 0.0
            if matched_frames:
                time_diffs = []
                for match in matched_frames:
                    time_diff = abs(match["original_timestamp"] - match["suspected_timestamp"])
                    time_diffs.append(time_diff)
                avg_time_diff = sum(time_diffs) / len(time_diffs)
                # Convert to similarity score (lower diff = higher similarity)
                temporal_alignment = max(0.0, 1.0 - (avg_time_diff / 30.0))  # 30 sec max diff

            # Overall confidence
            match_ratio = len(matched_frames) / len(original_features)
            overall_confidence = (visual_similarity * 0.6 + temporal_alignment * 0.2 + match_ratio * 0.2)

            result = SimilarityResult(
                visual_similarity=round(visual_similarity, 4),
                temporal_alignment=round(temporal_alignment, 4),
                overall_confidence=round(overall_confidence, 4),
                matched_frames=matched_frames,
                frame_count_original=len(original_features),
                frame_count_suspected=len(suspected_features),
                analysis_metadata={
                    "algorithm_version": "copyright-shield-v1",
                    "max_frames_analyzed": max_frames,
                    "total_matches_found": len(matched_frames),
                    "match_threshold": 0.3,
                    "processing_time": time.time()
                }
            )

            logger.info(f"Analysis complete: {overall_confidence:.2%} confidence")
            return result

        except Exception as e:
            logger.error(f"Video similarity analysis failed: {str(e)}")
            raise

if __name__ == "__main__":
    # Test functionality if run directly
    comparator = VideoComparator()
    health = comparator.health_check()
    print(json.dumps(health, indent=2))