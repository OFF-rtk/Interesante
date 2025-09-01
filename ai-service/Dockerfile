# ──────────────────────────────────────────────────────────────
#  AI-SERVICE  (Python + TensorFlow + OpenCV) – Debian Bookworm
# ──────────────────────────────────────────────────────────────
FROM python:3.10-bookworm

# — System libs needed by OpenCV / SciPy / Pillow / TensorFlow —
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config \
    libjpeg-dev libpng-dev libtiff-dev \
    libavcodec-dev libavformat-dev libswscale-dev \
    libgtk-3-dev \
    libopenblas-dev liblapack-dev gfortran \
    curl && \
    rm -rf /var/lib/apt/lists/*

# — Python virtual-env (keeps global site-packages clean) —
ENV VENV_PATH=/opt/venv
RUN python3 -m venv "${VENV_PATH}"
ENV PATH="${VENV_PATH}/bin:${PATH}"

# — Python deps (CPU-only TensorFlow) —
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# — App code —
WORKDIR /app
COPY . .

# Optional shared scratch space for video frames
RUN mkdir -p /tmp/video-processing && chmod 755 /tmp/video-processing

# — Runtime config —
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "app.py"]
