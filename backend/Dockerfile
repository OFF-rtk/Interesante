FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    vips-dev \
    build-base

# Fix: Create Python virtual environment to avoid system packages conflict
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install yt-dlp inside the virtual environment (no more errors!)
RUN pip install --no-cache-dir yt-dlp

WORKDIR /app

# Copy package files for better caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3001

# Development command
CMD ["pnpm", "run", "start:dev"]
