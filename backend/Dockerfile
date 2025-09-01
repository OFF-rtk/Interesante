FROM node:20-alpine

# Install only what Node.js backend needs (NO PYTHON!)
RUN apk add --no-cache \
    curl \
    python3 \
    py3-pip \
    ffmpeg && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

# Node.js app setup
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Create temp directory with proper permissions
RUN mkdir -p /tmp/video-processing && chmod 755 /tmp/video-processing

EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]
