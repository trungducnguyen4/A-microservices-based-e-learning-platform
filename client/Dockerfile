# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies with force resolution
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-audit && \
    npm rebuild esbuild

# Copy all source files
COPY . .

ARG VITE_GROQ_API_KEY
ENV VITE_GROQ_API_KEY=${VITE_GROQ_API_KEY}

# Debug: Verify index.html type before build
RUN ls -la index.html && \
    if [ -f index.html ]; then echo "✓ index.html is a FILE"; else echo "✗ index.html is NOT a file"; exit 1; fi

ENV NODE_OPTIONS="--max-old-space-size=3072"
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]