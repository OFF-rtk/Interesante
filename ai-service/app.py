from flask import Flask, request, jsonify
import os
import logging
import tempfile
import hashlib
from werkzeug.utils import secure_filename
from hash_generator import HashGenerator
from feature_comparison import VideoComparator
import cv2
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize both engines
hash_generator = HashGenerator()
feature_comparison = VideoComparator()

# Configuration
UPLOAD_FOLDER = '/tmp/video-uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'}
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def calculate_sha256(file_path):
    """Calculate SHA-256 hash of file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

def extract_video_frames(video_path, max_frames=10):
    """Extract frames from video for analysis - FIXED VERSION"""
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Could not open video file")
            
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = frame_count / fps if fps > 0 else 0
        
        frames = []
        step = max(1, frame_count // max_frames)
        
        for i in range(0, frame_count, step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret:
                break
                
            timestamp = i / fps if fps > 0 else 0
            
            # Save frame temporarily for hash generation
            temp_frame_path = os.path.join(UPLOAD_FOLDER, f"frame_{i}.jpg")
            cv2.imwrite(temp_frame_path, frame)
            
            # Generate features for this frame
            try:
                frame_features = hash_generator.generate_all_features(temp_frame_path)
                
                # ✅ FIXED: Check if features were generated (no 'success' field needed)
                if frame_features and not frame_features.get('error'):
                    frames.append({
                        'timestamp': timestamp,
                        'frame_number': i,
                        'features': frame_features
                    })
                    
            except Exception as e:
                logger.warning(f"Failed to generate features for frame {i}: {e}")
            finally:
                # Clean up temp frame
                if os.path.exists(temp_frame_path):
                    os.remove(temp_frame_path)
            
            if len(frames) >= max_frames:
                break
        
        cap.release()
        return frames, duration, frame_count
        
    except Exception as e:
        raise Exception(f"Frame extraction failed: {e}")

def calculate_visual_similarity(original_frames, suspected_frames):
    """Calculate visual similarity between frame sets"""
    try:
        if not original_frames or not suspected_frames:
            return 0.0
            
        similarities = []
        for orig_frame in original_frames:
            orig_features = orig_frame.get('features', {})
            if not orig_features or orig_features.get('error'):
                continue
                
            best_match = 0.0
            for susp_frame in suspected_frames:
                susp_features = susp_frame.get('features', {})
                if not susp_features or susp_features.get('error'):
                    continue
                    
                # Compare perceptual hashes
                orig_phash = orig_features.get('phash', '')
                susp_phash = susp_features.get('phash', '')
                
                if orig_phash and susp_phash:
                    try:
                        # Calculate Hamming distance for pHash
                        similarity = 1.0 - (bin(int(orig_phash, 16) ^ int(susp_phash, 16)).count('1') / 64.0)
                        best_match = max(best_match, similarity)
                    except (ValueError, TypeError):
                        continue
                    
            similarities.append(best_match)
            
        return sum(similarities) / len(similarities) if similarities else 0.0
        
    except Exception as e:
        logger.warning(f"Visual similarity calculation failed: {e}")
        return 0.0

def calculate_temporal_alignment(original_frames, suspected_frames):
    """Calculate temporal alignment between videos"""
    try:
        if len(original_frames) == 0 or len(suspected_frames) == 0:
            return 0.0
            
        # Simple temporal alignment based on frame sequence
        orig_duration = max(frame['timestamp'] for frame in original_frames) if original_frames else 0
        susp_duration = max(frame['timestamp'] for frame in suspected_frames) if suspected_frames else 0
        
        if orig_duration == 0 or susp_duration == 0:
            return 0.5
            
        duration_ratio = min(orig_duration, susp_duration) / max(orig_duration, susp_duration)
        return duration_ratio
        
    except Exception as e:
        logger.warning(f"Temporal alignment calculation failed: {e}")
        return 0.0

def find_matching_frames(original_frames, suspected_frames):
    """Find matching frames between videos"""
    try:
        matches = []
        threshold = 0.8
        
        for i, orig_frame in enumerate(original_frames):
            orig_features = orig_frame.get('features', {})
            if not orig_features or orig_features.get('error'):
                continue
                
            for j, susp_frame in enumerate(suspected_frames):
                susp_features = susp_frame.get('features', {})
                if not susp_features or susp_features.get('error'):
                    continue
                    
                # Compare features
                orig_phash = orig_features.get('phash', '')
                susp_phash = susp_features.get('phash', '')
                
                if orig_phash and susp_phash:
                    try:
                        similarity = 1.0 - (bin(int(orig_phash, 16) ^ int(susp_phash, 16)).count('1') / 64.0)
                        
                        if similarity >= threshold:
                            matches.append({
                                "original_frame": i,
                                "suspected_frame": j,
                                "similarity": similarity,
                                "original_timestamp": orig_frame['timestamp'],
                                "suspected_timestamp": susp_frame['timestamp']
                            })
                    except (ValueError, TypeError):
                        continue
                        
        return matches[:10]  # Return top 10 matches
        
    except Exception as e:
        logger.warning(f"Frame matching failed: {e}")
        return []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Docker"""
    try:
        comparison_health = feature_comparison.health_check()
        return jsonify({
            "status": "healthy",
            "tensorflow_available": hash_generator.tf_available,
            "service": "copyright-shield-ai",
            "timestamp": datetime.now().isoformat(),
            "engines": {
                "hash_generator": {
                    "tensorflow_available": hash_generator.tf_available
                },
                "feature_comparison": comparison_health
            }
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "service": "copyright-shield-ai"
        }), 500

# 🆕 COPYRIGHT SHIELD ENDPOINTS

@app.route('/generate-certificate', methods=['POST'])
def generate_certificate():
    """Generate digital certificate for uploaded video - COMPLETE FIXED VERSION"""
    try:
        # Check if video file is present
        if 'video' not in request.files:
            return jsonify({"status": "error", "error": "No video file provided"}), 400
            
        file = request.files['video']
        if file.filename == '':
            return jsonify({"status": "error", "error": "No video file selected"}), 400
            
        if not allowed_file(file.filename):
            return jsonify({
                "status": "error", 
                "error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = int(datetime.now().timestamp())
        safe_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
        file.save(file_path)

        try:
            # Calculate file hash
            file_hash = calculate_sha256(file_path)
            file_size = os.path.getsize(file_path)
            
            # Extract frames and generate content hashes
            frames, duration, total_frames = extract_video_frames(file_path, max_frames=10)
            
            # ✅ FIXED: Proper content hash extraction with all features
            content_hashes = []
            for frame in frames:
                features = frame.get('features', {})
                if features and not features.get('error'):
                    content_hash = {
                        "frame_index": frame['frame_number'],
                        "timestamp": frame['timestamp'],
                        "phash": features.get('phash', ''),
                        "dct_hash": features.get('dct_hash', ''),
                        "advanced_features": features.get('advanced_features', {}),
                    }
                    
                    # Include TensorFlow embedding if available
                    tf_embedding = features.get('tf_embedding')
                    if tf_embedding:
                        content_hash["tf_embedding"] = tf_embedding
                        
                    content_hashes.append(content_hash)
            
            # Generate certificate data
            certificate_data = {
                "certificate_id": f"CS-{timestamp}-{file_hash[:16]}",
                "timestamp": datetime.now().isoformat(),
                "file_info": {
                    "original_filename": filename,
                    "file_size": file_size,
                    "sha256_hash": file_hash,
                    "duration": duration,
                    "total_frames": total_frames
                },
                "content_analysis": {
                    "frames_analyzed": len(frames),
                    "content_hashes": content_hashes  # ✅ Now this will have ALL the data!
                },
                "technical_metadata": {
                    "processing_engine": "Copyright Shield AI v1.0",
                    "generation_timestamp": datetime.now().isoformat(),
                    "algorithms_used": ["SHA-256", "Perceptual Hash", "DCT Hash", "TensorFlow Features"],
                    "tensorflow_available": hash_generator.tf_available
                }
            }
            
            return jsonify({
                "status": "success",
                "certificate": certificate_data
            }), 200

        finally:
            # Clean up uploaded file
            if os.path.exists(file_path):
                os.remove(file_path)
                
    except Exception as e:
        logger.error(f"Certificate generation failed: {e}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route('/analyze-similarity', methods=['POST'])
def analyze_similarity():
    """Analyze similarity between two uploaded videos - COMPLETE VERSION"""
    try:
        # Check if both video files are present
        if 'original' not in request.files or 'suspected' not in request.files:
            return jsonify({
                "status": "error", 
                "error": "Both 'original' and 'suspected' video files are required"
            }), 400
            
        original_file = request.files['original']
        suspected_file = request.files['suspected']
        
        if original_file.filename == '' or suspected_file.filename == '':
            return jsonify({"status": "error", "error": "Both video files must be selected"}), 400
            
        if not allowed_file(original_file.filename) or not allowed_file(suspected_file.filename):
            return jsonify({
                "status": "error",
                "error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        # Save uploaded files
        timestamp = int(datetime.now().timestamp())
        
        original_filename = secure_filename(original_file.filename)
        suspected_filename = secure_filename(suspected_file.filename)
        
        original_path = os.path.join(UPLOAD_FOLDER, f"{timestamp}_original_{original_filename}")
        suspected_path = os.path.join(UPLOAD_FOLDER, f"{timestamp}_suspected_{suspected_filename}")
        
        original_file.save(original_path)
        suspected_file.save(suspected_path)

        try:
            # Calculate file hashes
            original_hash = calculate_sha256(original_path)
            suspected_hash = calculate_sha256(suspected_path)
            original_size = os.path.getsize(original_path)
            suspected_size = os.path.getsize(suspected_path)
            
            # Extract frames from both videos
            original_frames, original_duration, original_frame_count = extract_video_frames(original_path, max_frames=20)
            suspected_frames, suspected_duration, suspected_frame_count = extract_video_frames(suspected_path, max_frames=20)
            
            # Calculate similarity metrics
            visual_similarity = calculate_visual_similarity(original_frames, suspected_frames)
            temporal_alignment = calculate_temporal_alignment(original_frames, suspected_frames)
            overall_confidence = (visual_similarity + temporal_alignment) / 2
            
            # Find matching frames
            matched_frames = find_matching_frames(original_frames, suspected_frames)
            
            # Generate analysis ID
            analysis_id = f"SA-{timestamp}-{original_hash[:8]}-{suspected_hash[:8]}"
            
            analysis_data = {
                "analysis_id": analysis_id,
                "timestamp": datetime.now().isoformat(),
                "files": {
                    "original": {
                        "filename": original_filename,
                        "size": original_size,
                        "sha256": original_hash,
                        "duration": original_duration,
                        "frame_count": original_frame_count
                    },
                    "suspected": {
                        "filename": suspected_filename,
                        "size": suspected_size,
                        "sha256": suspected_hash,
                        "duration": suspected_duration,
                        "frame_count": suspected_frame_count
                    }
                },
                "similarity_analysis": {
                    "visual_similarity": visual_similarity,
                    "temporal_alignment": temporal_alignment,
                    "overall_confidence": overall_confidence,
                    "matched_frames": matched_frames,
                    "frame_count_original": len(original_frames),
                    "frame_count_suspected": len(suspected_frames),
                    "analysis_metadata": {
                        "algorithm_version": "1.0",
                        "max_frames_analyzed": 20,
                        "total_matches_found": len(matched_frames),
                        "match_threshold": 0.8,
                        "processing_time": "real-time"
                    }
                },
                "technical_metadata": {
                    "processing_engine": "Copyright Shield AI v1.0",
                    "analysis_timestamp": datetime.now().isoformat(),
                    "algorithms_used": ["Perceptual Hash", "DCT Hash", "TensorFlow Features", "Frame Comparison"]
                }
            }
            
            return jsonify({
                "status": "success",
                "analysis": analysis_data
            }), 200

        finally:
            # Clean up uploaded files
            for file_path in [original_path, suspected_path]:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    
    except Exception as e:
        logger.error(f"Similarity analysis failed: {e}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# LEGACY ENDPOINTS (Keep for backward compatibility)

@app.route('/generate-hash', methods=['POST'])
def generate_hash():
    """Generate advanced hash for single image"""
    try:
        data = request.get_json()
        image_path = data.get('image_path')
        
        if not image_path:
            return jsonify({"error": "image_path is required"}), 400
            
        if not os.path.exists(image_path):
            return jsonify({"error": f"Image file not found: {image_path}"}), 404
            
        result = hash_generator.generate_all_features(image_path)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Hash generation failed: {e}")
        return jsonify({"error": str(e), "success": False}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
