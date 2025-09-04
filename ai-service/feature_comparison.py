#!/usr/bin/env python3

import sys
import json
import numpy as np
import cv2
import yt_dlp
import os
import tempfile
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import time
from scipy.spatial.distance import cosine

# 🎯 Import your existing hash generator
from hash_generator import AdvancedHashGenerator

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
    sequence_matches: List[Dict]
    algorithm_details: Dict
    processing_time_ms: int

@dataclass
class VideoAnalysisRequest:
    original_frames: List[Dict]
    suspect_frames: List[Dict]
    options: Dict

class ProductionFeatureComparison:
    """Production-ready AI engine for video copyright detection"""
    
    def __init__(self):
        """Initialize with your existing hash generator"""
        # 🚀 Use your existing, tested hash generator
        self.hash_generator = AdvancedHashGenerator()
        
        # Performance settings
        self.max_workers = 4
        self.batch_size = 32
        self.max_frames_per_video = 100
        
        # Similarity thresholds
        self.phash_threshold = 0.85
        self.dct_threshold = 0.80
        self.embedding_threshold = 0.75
    
    def extract_youtube_frames(
        self, 
        youtube_video_id: str, 
        max_frames: int = 50,
        interval_seconds: float = 5.0,
        quality: str = "medium"
    ) -> List[FrameFeatures]:
        """Extract frames from YouTube video using yt-dlp"""
        
        start_time = time.time()
        temp_dir = tempfile.mkdtemp()
        
        try:
            # YouTube URL
            video_url = f"https://www.youtube.com/watch?v={youtube_video_id}"
            
            # yt-dlp options
            ydl_opts = {
                'format': 'best[height<=720]' if quality == 'medium' else 'best[height<=480]',
                'outtmpl': f'{temp_dir}/video.%(ext)s',
                'quiet': True,
                'no_warnings': True,
            }
            
            # Download video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=True)
                video_path = f"{temp_dir}/video.{info['ext']}"
            
            # Extract frames using OpenCV
            raw_frames = self._extract_frames_from_video(
                video_path, max_frames, interval_seconds
            )
            
            # Process each frame using YOUR existing hash generator
            processed_frames = []
            for i, frame_data in enumerate(raw_frames):
                frame_path = f"{temp_dir}/frame_{i:04d}.jpg"
                cv2.imwrite(frame_path, frame_data['frame'])
                
                # 🎯 Use YOUR existing hash generator functions
                features = self._process_frame_with_existing_generator(
                    frame_path,
                    frame_data['timestamp'],
                    frame_data['frame']
                )
                processed_frames.append(features)
            
            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"✅ Extracted {len(processed_frames)} frames in {processing_time}ms")
            
            return processed_frames
            
        except Exception as e:
            logger.error(f"❌ YouTube frame extraction failed: {e}")
            raise Exception(f"Frame extraction failed: {e}")
        
        finally:
            self._cleanup_temp_dir(temp_dir)
    
    def _process_frame_with_existing_generator(
        self, 
        frame_path: str,
        timestamp: float,
        frame_array: np.ndarray
    ) -> FrameFeatures:
        """Process single frame using YOUR existing hash generator"""
        
        try:
            # 🚀 Use your existing, tested hash generation functions
            hash_results = self.hash_generator.generate_all_features(frame_path)
            
            if not hash_results.get('success', False):
                logger.warning(f"⚠️ Hash generation failed for frame at {timestamp}")
                hash_results = {
                    'phash': '0' * 64,
                    'dct_hash': '0' * 16,
                    'tf_embedding': None,
                    'advanced_features': {}
                }
            
            features = FrameFeatures(
                timestamp=timestamp,
                phash=hash_results.get('phash', ''),
                dct_hash=hash_results.get('dct_hash', ''),
                tf_embedding=hash_results.get('tf_embedding'),
                advanced_features=hash_results.get('advanced_features', {}),
                frame_path=frame_path,
                width=frame_array.shape[1],
                height=frame_array.shape[0]
            )
            
            return features
            
        except Exception as e:
            logger.error(f"❌ Frame processing failed: {e}")
            raise
    
    def _extract_frames_from_video(
        self, 
        video_path: str, 
        max_frames: int, 
        interval_seconds: float
    ) -> List[Dict]:
        """Extract frames from video file"""
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        # Calculate frame interval
        frame_interval = int(fps * interval_seconds) if fps > 0 else 1
        frames_to_extract = min(max_frames, int(duration / interval_seconds) if interval_seconds > 0 else max_frames)
        
        frames = []
        frame_count = 0
        extracted_count = 0
        
        while cap.isOpened() and extracted_count < frames_to_extract:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                timestamp = frame_count / fps if fps > 0 else frame_count
                frames.append({
                    'frame': frame,
                    'timestamp': timestamp,
                    'frame_index': extracted_count
                })
                extracted_count += 1
            
            frame_count += 1
        
        cap.release()
        return frames
    
    def analyze_video_similarity(
        self, 
        original_frames: List[Dict], 
        suspect_frames: List[Dict], 
        options: Dict = None
    ) -> SimilarityResult:
        """Main similarity analysis using existing hash functions"""
        
        start_time = time.time()
        
        try:
            # Convert to FrameFeatures if needed
            if original_frames and not isinstance(original_frames[0], FrameFeatures):
                original_features = self._convert_frames_to_features(original_frames)
            else:
                original_features = original_frames
                
            if suspect_frames and not isinstance(suspect_frames[0], FrameFeatures):
                suspect_features = self._convert_frames_to_features(suspect_frames)
            else:
                suspect_features = suspect_frames
            
            # Calculate similarities using existing hash data
            similarities = self._calculate_multi_modal_similarity(
                original_features, suspect_features
            )
            
            # Detect temporal patterns
            temporal_score = self._detect_temporal_patterns(
                original_features, suspect_features
            )
            
            # Find sequence matches
            sequence_matches = self._find_sequence_matches(
                original_features, suspect_features
            )
            
            # Calculate overall confidence
            overall_confidence = self._calculate_overall_confidence(
                similarities, temporal_score, sequence_matches
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            result = SimilarityResult(
                visual_similarity=similarities.get('combined_visual', 0.0),
                temporal_alignment=temporal_score,
                overall_confidence=overall_confidence,
                sequence_matches=sequence_matches,
                algorithm_details=similarities,
                processing_time_ms=processing_time
            )
            
            logger.info(f"✅ Video similarity analysis completed in {processing_time}ms")
            return result
            
        except Exception as e:
            logger.error(f"❌ Video similarity analysis failed: {e}")
            raise
    
    def _convert_frames_to_features(self, frames_data: List[Dict]) -> List[FrameFeatures]:
        """Convert request frame data to FrameFeatures using existing generator"""
        features_list = []
        
        for frame_data in frames_data:
            try:
                if 'features' in frame_data:
                    # Pre-extracted features
                    features = FrameFeatures(
                        timestamp=frame_data['timestamp'],
                        phash=frame_data['features'].get('phash', ''),
                        dct_hash=frame_data['features'].get('dct_hash', ''),
                        tf_embedding=frame_data['features'].get('tf_embedding'),
                        advanced_features=frame_data['features'].get('advanced_features', {}),
                        frame_path=frame_data.get('frame_path'),
                        width=frame_data.get('width', 0),
                        height=frame_data.get('height', 0)
                    )
                else:
                    # Extract features from image using YOUR existing generator
                    if 'frame_url' in frame_data or 'frame_path' in frame_data:
                        image_path = frame_data.get('frame_url') or frame_data.get('frame_path')
                        
                        # 🚀 Use your existing hash generator
                        hash_results = self.hash_generator.generate_all_features(image_path)
                        
                        if hash_results.get('success', False):
                            features = FrameFeatures(
                                timestamp=frame_data['timestamp'],
                                phash=hash_results.get('phash', ''),
                                dct_hash=hash_results.get('dct_hash', ''),
                                tf_embedding=hash_results.get('tf_embedding'),
                                advanced_features=hash_results.get('advanced_features', {}),
                                frame_path=image_path,
                                width=frame_data.get('width', 0),
                                height=frame_data.get('height', 0)
                            )
                        else:
                            continue
                    else:
                        continue
                
                features_list.append(features)
            except Exception as e:
                logger.error(f"❌ Frame conversion failed: {e}")
                continue
        
        return features_list
    
    def _calculate_multi_modal_similarity(
        self, 
        original_features: List[FrameFeatures], 
        suspect_features: List[FrameFeatures]
    ) -> Dict[str, float]:
        """Calculate similarity using existing hash data"""
        
        similarities = {
            'perceptual_similarity': 0.0,
            'dct_similarity': 0.0,
            'embedding_similarity': 0.0,
            'advanced_similarity': 0.0,
            'combined_visual': 0.0
        }
        
        if not original_features or not suspect_features:
            return similarities
        
        # Calculate pairwise similarities using existing hashes
        phash_scores = []
        dct_scores = []
        embedding_scores = []
        advanced_scores = []
        
        for orig_feat in original_features:
            best_phash = 0.0
            best_dct = 0.0
            best_embedding = 0.0
            best_advanced = 0.0
            
            for susp_feat in suspect_features:
                # Use existing hash comparison methods
                phash_sim = self._compare_hashes(orig_feat.phash, susp_feat.phash)
                best_phash = max(best_phash, phash_sim)
                
                dct_sim = self._compare_hashes(orig_feat.dct_hash, susp_feat.dct_hash)
                best_dct = max(best_dct, dct_sim)
                
                if orig_feat.tf_embedding and susp_feat.tf_embedding:
                    emb_sim = self._cosine_similarity(
                        orig_feat.tf_embedding, susp_feat.tf_embedding
                    )
                    best_embedding = max(best_embedding, emb_sim)
                
                adv_sim = self._compare_advanced_features(
                    orig_feat.advanced_features, susp_feat.advanced_features
                )
                best_advanced = max(best_advanced, adv_sim)
            
            phash_scores.append(best_phash)
            dct_scores.append(best_dct)
            embedding_scores.append(best_embedding)
            advanced_scores.append(best_advanced)
        
        # Calculate average similarities
        similarities['perceptual_similarity'] = np.mean(phash_scores) if phash_scores else 0.0
        similarities['dct_similarity'] = np.mean(dct_scores) if dct_scores else 0.0
        similarities['embedding_similarity'] = np.mean(embedding_scores) if embedding_scores else 0.0
        similarities['advanced_similarity'] = np.mean(advanced_scores) if advanced_scores else 0.0
        
        # Combined visual similarity (weighted average)
        similarities['combined_visual'] = (
            similarities['perceptual_similarity'] * 0.35 +
            similarities['dct_similarity'] * 0.25 +
            similarities['embedding_similarity'] * 0.25 +
            similarities['advanced_similarity'] * 0.15
        )
        
        return similarities
    
    def _detect_temporal_patterns(
        self, 
        original_features: List[FrameFeatures], 
        suspect_features: List[FrameFeatures]
    ) -> float:
        """Detect temporal patterns and alignment"""
        
        if len(original_features) < 3 or len(suspect_features) < 3:
            return 0.0
        
        try:
            # Create similarity matrix
            similarity_matrix = np.zeros((len(original_features), len(suspect_features)))
            
            for i, orig_feat in enumerate(original_features):
                for j, susp_feat in enumerate(suspect_features):
                    # Calculate frame-to-frame similarity
                    phash_sim = self._compare_hashes(orig_feat.phash, susp_feat.phash)
                    dct_sim = self._compare_hashes(orig_feat.dct_hash, susp_feat.dct_hash)
                    
                    frame_similarity = (phash_sim * 0.6 + dct_sim * 0.4)
                    similarity_matrix[i, j] = frame_similarity
            
            # Find best alignment using dynamic programming
            alignment_score = self._find_best_alignment(similarity_matrix)
            
            return alignment_score
            
        except Exception as e:
            logger.error(f"❌ Temporal pattern detection failed: {e}")
            return 0.0
    
    def _find_best_alignment(self, similarity_matrix: np.ndarray) -> float:
        """Find best sequence alignment using dynamic programming"""
        
        rows, cols = similarity_matrix.shape
        if rows == 0 or cols == 0:
            return 0.0
        
        # Dynamic programming matrix
        dp = np.zeros((rows + 1, cols + 1))
        
        # Fill the DP matrix
        for i in range(1, rows + 1):
            for j in range(1, cols + 1):
                current_sim = similarity_matrix[i-1, j-1]
                
                # Three possible moves
                diagonal = dp[i-1, j-1] + current_sim
                up = dp[i-1, j] + current_sim * 0.5
                left = dp[i, j-1] + current_sim * 0.5
                
                dp[i, j] = max(diagonal, up, left)
        
        # Normalize by sequence lengths
        max_possible_score = min(rows, cols)
        if max_possible_score > 0:
            alignment_score = dp[rows, cols] / max_possible_score
            return min(alignment_score, 1.0)
        
        return 0.0
    
    def _find_sequence_matches(
        self, 
        original_features: List[FrameFeatures], 
        suspect_features: List[FrameFeatures]
    ) -> List[Dict]:
        """Find specific sequence matches between videos"""
        
        matches = []
        min_sequence_length = 3
        similarity_threshold = 0.7
        
        if len(original_features) < min_sequence_length or len(suspect_features) < min_sequence_length:
            return matches
        
        try:
            # Look for sequence matches
            for i in range(len(original_features) - min_sequence_length + 1):
                for j in range(len(suspect_features) - min_sequence_length + 1):
                    
                    sequence_similarities = []
                    
                    for k in range(min_sequence_length):
                        if i + k >= len(original_features) or j + k >= len(suspect_features):
                            break
                        
                        orig_feat = original_features[i + k]
                        susp_feat = suspect_features[j + k]
                        
                        phash_sim = self._compare_hashes(orig_feat.phash, susp_feat.phash)
                        dct_sim = self._compare_hashes(orig_feat.dct_hash, susp_feat.dct_hash)
                        frame_sim = (phash_sim * 0.6 + dct_sim * 0.4)
                        
                        sequence_similarities.append(frame_sim)
                    
                    avg_similarity = np.mean(sequence_similarities)
                    if avg_similarity >= similarity_threshold:
                        
                        # Extend sequence
                        extended_length = min_sequence_length
                        while (i + extended_length < len(original_features) and 
                               j + extended_length < len(suspect_features)):
                            
                            orig_feat = original_features[i + extended_length]
                            susp_feat = suspect_features[j + extended_length]
                            
                            phash_sim = self._compare_hashes(orig_feat.phash, susp_feat.phash)
                            dct_sim = self._compare_hashes(orig_feat.dct_hash, susp_feat.dct_hash)
                            frame_sim = (phash_sim * 0.6 + dct_sim * 0.4)
                            
                            if frame_sim >= similarity_threshold:
                                sequence_similarities.append(frame_sim)
                                extended_length += 1
                            else:
                                break
                        
                        match = {
                            'original_timestamp': original_features[i].timestamp,
                            'suspect_timestamp': suspect_features[j].timestamp,
                            'confidence': float(np.mean(sequence_similarities)),
                            'frame_matches': extended_length,
                            'duration': original_features[i + extended_length - 1].timestamp - original_features[i].timestamp,
                            'sequence_start_original': i,
                            'sequence_start_suspect': j,
                            'sequence_length': extended_length
                        }
                        
                        matches.append(match)
            
            # Remove overlapping matches, keep best ones
            matches = self._remove_overlapping_matches(matches)
            matches.sort(key=lambda x: x['confidence'], reverse=True)
            
            return matches[:10]
            
        except Exception as e:
            logger.error(f"❌ Sequence matching failed: {e}")
            return []
    
    def _remove_overlapping_matches(self, matches: List[Dict]) -> List[Dict]:
        """Remove overlapping sequence matches"""
        if not matches:
            return matches
        
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        
        non_overlapping = []
        used_original_frames = set()
        used_suspect_frames = set()
        
        for match in matches:
            orig_start = match['sequence_start_original']
            orig_end = orig_start + match['sequence_length']
            susp_start = match['sequence_start_suspect']
            susp_end = susp_start + match['sequence_length']
            
            orig_range = set(range(orig_start, orig_end))
            susp_range = set(range(susp_start, susp_end))
            
            if (not orig_range.intersection(used_original_frames) and 
                not susp_range.intersection(used_suspect_frames)):
                
                non_overlapping.append(match)
                used_original_frames.update(orig_range)
                used_suspect_frames.update(susp_range)
        
        return non_overlapping
    
    def _calculate_overall_confidence(
        self, 
        similarities: Dict[str, float], 
        temporal_score: float,
        sequence_matches: List[Dict]
    ) -> float:
        """Calculate overall confidence combining all factors"""
        
        # Base visual similarity (70% weight)
        visual_component = similarities['combined_visual'] * 0.70
        
        # Temporal alignment (20% weight)
        temporal_component = temporal_score * 0.20
        
        # Sequence match bonus (10% weight)
        sequence_component = 0.0
        if sequence_matches:
            best_sequence_confidence = max(match['confidence'] for match in sequence_matches)
            sequence_component = best_sequence_confidence * 0.10
        
        overall_confidence = visual_component + temporal_component + sequence_component
        
        # Apply confidence penalties
        if len(sequence_matches) == 0:
            overall_confidence *= 0.8
        
        if temporal_score < 0.3:
            overall_confidence *= 0.9
        
        return min(overall_confidence, 1.0)
    
    def health_check(self) -> Dict:
        """Health check using existing hash generator"""
        return {
            "status": "healthy",
            "tensorflow_available": self.hash_generator.tf_available,
            "capabilities": ["perceptual_hash", "dct_hash", "advanced_features", "tensorflow_embeddings", "youtube_extraction", "temporal_analysis"],
            "version": "2.0.0",
            "hash_generator_status": {
                "tensorflow_available": self.hash_generator.tf_available
            }
        }
    
    # Utility methods
    def _compare_hashes(self, hash1: str, hash2: str) -> float:
        """Compare two hash strings using Hamming distance"""
        if not hash1 or not hash2 or len(hash1) != len(hash2):
            return 0.0
        
        differences = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
        max_diff = len(hash1)
        similarity = 1.0 - (differences / max_diff)
        return similarity
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        try:
            similarity = 1.0 - cosine(vec1, vec2)
            return max(0.0, similarity)
        except:
            return 0.0
    
    def _compare_advanced_features(self, features1: Dict, features2: Dict) -> float:
        """Compare advanced feature dictionaries"""
        if not features1 or not features2:
            return 0.0
        
        similarities = []
        
        for key in ['brightness', 'contrast', 'complexity', 'edge_density', 'texture_energy']:
            if key in features1 and key in features2:
                val1, val2 = features1[key], features2[key]
                if val1 == 0 and val2 == 0:
                    sim = 1.0
                else:
                    diff = abs(val1 - val2) / max(abs(val1), abs(val2), 1e-7)
                    sim = 1.0 - min(diff, 1.0)
                similarities.append(sim)
        
        return np.mean(similarities) if similarities else 0.0
    
    def _cleanup_temp_dir(self, temp_dir: str):
        """Clean up temporary directory"""
        try:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            logger.warning(f"⚠️ Temp cleanup failed: {e}")


def main():
    """Main function for testing"""
    
    if len(sys.argv) < 2:
        print("Usage: python3 feature_comparison.py <command> [args...]")
        print("Commands:")
        print("  health - Health check")
        print("  extract <youtube_id> - Extract frames from YouTube video")
        print("  analyze <original_frames_json> <suspect_frames_json> - Analyze similarity")
        sys.exit(1)
    
    command = sys.argv[1]
    engine = ProductionFeatureComparison()
    
    try:
        if command == "health":
            result = engine.health_check()
            print(json.dumps(result, indent=2))
        
        elif command == "extract":
            if len(sys.argv) < 3:
                print("Usage: python3 feature_comparison.py extract <youtube_id>")
                sys.exit(1)
            
            youtube_id = sys.argv[2]
            frames = engine.extract_youtube_frames(youtube_id)
            
            result = {
                "frames": [{
                    "timestamp": frame.timestamp,
                    "phash": frame.phash,
                    "dct_hash": frame.dct_hash,
                    "tf_embedding": frame.tf_embedding,
                    "advanced_features": frame.advanced_features,
                    "width": frame.width,
                    "height": frame.height
                } for frame in frames],
                "total_frames": len(frames),
                "success": True
            }
            
            print(json.dumps(result, indent=2))
        
        elif command == "analyze":
            if len(sys.argv) < 4:
                print("Usage: python3 feature_comparison.py analyze <original_frames_json> <suspect_frames_json>")
                sys.exit(1)
            
            with open(sys.argv[2], 'r') as f:
                original_frames = json.load(f)
            
            with open(sys.argv[3], 'r') as f:
                suspect_frames = json.load(f)
            
            result = engine.analyze_video_similarity(original_frames, suspect_frames)
            
            result_dict = {
                "visual_similarity": result.visual_similarity,
                "temporal_alignment": result.temporal_alignment,
                "overall_confidence": result.overall_confidence,
                "sequence_matches": result.sequence_matches,
                "algorithm_details": result.algorithm_details,
                "processing_time_ms": result.processing_time_ms,
                "success": True
            }
            
            print(json.dumps(result_dict, indent=2))
        
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
    
    except Exception as e:
        error_result = {
            "error": str(e),
            "success": False
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
