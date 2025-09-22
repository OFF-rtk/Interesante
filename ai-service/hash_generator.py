#!/usr/bin/env python3

import sys
import json
import numpy as np
from PIL import Image
import imagehash
import cv2
from scipy.fft import dct
import tensorflow as tf
import tensorflow_hub as hub
from datetime import datetime

class HashGenerator:
    def __init__(self):
        # Load TensorFlow Hub model for feature extraction
        try:
            # Using MobileNetV2 for semantic features (lighter than CLIP)
            self.feature_extractor = hub.load("https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/feature_vector/5")
            self.tf_available = True
            print("TensorFlow feature extractor loaded successfully", file=sys.stderr)
        except Exception as e:
            print(f"TensorFlow model unavailable: {e}", file=sys.stderr)
            self.tf_available = False

    def generate_phash(self, image_path):
        """Generate perceptual hash using imagehash library"""
        try:
            with Image.open(image_path) as img:
                # Convert to grayscale and resize for consistency
                img = img.convert('L').resize((32, 32), Image.Resampling.LANCZOS)
                phash = imagehash.phash(img, hash_size=16)
                return str(phash)
        except Exception as e:
            print(f"pHash generation failed: {e}", file=sys.stderr)
            return None

    def generate_dct_hash(self, image_path):
        """Generate DCT-based hash for more robust comparison"""
        try:
            # Read and preprocess image
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                raise ValueError(f"Could not read image: {image_path}")

            # Resize to standard size
            img = cv2.resize(img, (32, 32))

            # Apply DCT
            dct_coeffs = dct(dct(img.T, norm='ortho').T, norm='ortho')

            # Take low-frequency coefficients (top-left 8x8)
            low_freq = dct_coeffs[:8, :8]

            # Generate binary hash based on median
            median = np.median(low_freq)
            hash_binary = (low_freq > median).astype(int)

            # Convert to hex string
            hash_string = ''.join(str(bit) for row in hash_binary for bit in row)
            hash_hex = hex(int(hash_string, 2))[2:]

            return hash_hex

        except Exception as e:
            print(f"DCT hash generation failed: {e}", file=sys.stderr)
            return None

    def extract_advanced_features(self, image_path):
        """Extract advanced visual features"""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return {}

            # Convert to different color spaces
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

            # Basic statistics
            brightness = np.mean(gray)
            contrast = np.std(gray)

            # Complexity (edge density)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size

            # Dominant colors (simplified)
            dominant_colors = self._extract_dominant_colors(img)

            # Texture features (using Local Binary Pattern concept, simplified)
            texture_complexity = np.std(cv2.Laplacian(gray, cv2.CV_64F))

            return {
                'brightness': float(brightness),
                'contrast': float(contrast),
                'edge_density': float(edge_density),
                'complexity': float(texture_complexity),
                'dominant_colors': dominant_colors,
                'image_dimensions': img.shape[:2]
            }

        except Exception as e:
            print(f"Advanced feature extraction failed: {e}", file=sys.stderr)
            return {}

    def _extract_dominant_colors(self, img, k=3):
        """Extract dominant colors using K-means clustering"""
        try:
            # Reshape image to be a list of pixels
            data = img.reshape((-1, 3))
            data = np.float32(data)

            # Apply K-means
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

            # Convert centers to integers and return as list
            centers = np.uint8(centers)
            return [center.tolist() for center in centers]

        except Exception as e:
            print(f"Dominant color extraction failed: {e}", file=sys.stderr)
            return []

    def generate_tf_embedding(self, image_path):
        """Generate TensorFlow embedding if available"""
        if not self.tf_available:
            return None

        try:
            # Load and preprocess image
            img = tf.io.read_file(image_path)
            img = tf.image.decode_image(img, channels=3)
            img = tf.image.resize(img, [224, 224])
            img = tf.cast(img, tf.float32) / 255.0
            img = tf.expand_dims(img, 0)

            # Generate embedding
            embedding = self.feature_extractor(img)
            return embedding.numpy().flatten().tolist()

        except Exception as e:
            print(f"TensorFlow embedding failed: {e}", file=sys.stderr)
            return None

    def generate_all_features(self, image_path):
        """
        Generate all available features for comprehensive analysis
        Perfect for Copyright Shield certificate generation
        """
        try:
            features = {
                'timestamp': datetime.utcnow().isoformat(),
                'image_path': image_path,
                'phash': self.generate_phash(image_path),
                'dct_hash': self.generate_dct_hash(image_path),
                'advanced_features': self.extract_advanced_features(image_path)
            }

            # Add TensorFlow embedding if available
            if self.tf_available:
                features['tf_embedding'] = self.generate_tf_embedding(image_path)
            else:
                features['tf_embedding'] = None

            return features

        except Exception as e:
            print(f"Feature generation failed: {e}", file=sys.stderr)
            return {
                'error': str(e),
                'timestamp': datetime.now(datetime.timezone.utc).isoformat()
            }

    def generate_certificate_data(self, image_path, additional_metadata=None):
        """
        Generate certificate-ready data with enhanced metadata
        Specifically designed for Copyright Shield certificates
        """
        try:
            # Generate all features
            features = self.generate_all_features(image_path)

            # Certificate-specific formatting
            certificate_data = {
                'generation_timestamp': datetime.utcnow().isoformat(),
                'content_fingerprint': {
                    'perceptual_hash': features.get('phash'),
                    'dct_hash': features.get('dct_hash'),
                    'has_tensorflow_embedding': features.get('tf_embedding') is not None
                },
                'visual_analysis': features.get('advanced_features', {}),
                'technical_metadata': {
                    'algorithm_version': 'copyright-shield-v1',
                    'tensorflow_available': self.tf_available,
                    'processing_engine': 'HashGenerator'
                }
            }

            # Add any additional metadata
            if additional_metadata:
                certificate_data['additional_metadata'] = additional_metadata

            return certificate_data

        except Exception as e:
            print(f"Certificate data generation failed: {e}", file=sys.stderr)
            return {'error': str(e)}

if __name__ == "__main__":
    # Test functionality
    generator = HashGenerator()

    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = generator.generate_certificate_data(image_path)
        print(json.dumps(result, indent=2))
    else:
        print("HashGenerator ready for Copyright Shield")
        print(f"TensorFlow available: {generator.tf_available}")