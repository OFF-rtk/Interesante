from flask import Flask, request, jsonify
import os
import logging
from hash_generator import AdvancedHashGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize hash generator
hash_generator = AdvancedHashGenerator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Docker"""
    return jsonify({
        "status": "healthy",
        "tensorflow_available": hash_generator.tf_available,
        "service": "ai-service"
    }), 200

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
        
        # Generate hash using your existing logic
        result = hash_generator.generate_all_features(image_path)
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Hash generation failed: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/generate-batch', methods=['POST'])
def generate_batch():
    """Generate hashes for multiple images (for batch processing)"""
    try:
        data = request.get_json()
        image_paths = data.get('image_paths', [])
        
        if not image_paths:
            return jsonify({"error": "image_paths array is required"}), 400
        
        results = []
        for image_path in image_paths:
            try:
                if os.path.exists(image_path):
                    result = hash_generator.generate_all_features(image_path)
                    result['image_path'] = image_path
                else:
                    result = {
                        "image_path": image_path,
                        "error": "File not found",
                        "success": False
                    }
            except Exception as e:
                result = {
                    "image_path": image_path,
                    "error": str(e),
                    "success": False
                }
            
            results.append(result)
        
        return jsonify({"results": results}), 200
        
    except Exception as e:
        logger.error(f"Batch generation failed: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
