FROM node:20-alpine

# Install system dependencies (remove version constraints)
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    vips-dev \
    build-base

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install yt-dlp
RUN pip install --no-cache-dir yt-dlp

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Create temp directory with proper permissions
RUN mkdir -p /tmp/video-processing && \
    chmod 755 /tmp/video-processing

EXPOSE 3001

# Development command
CMD ["pnpm", "run", "start:dev"]
