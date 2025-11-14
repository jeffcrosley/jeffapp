# apps/api-gateway/Dockerfile

# ----------------- STAGE 1: Build Stage -----------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency files first for better caching
COPY package.json package-lock.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the API Gateway with Nx
RUN npx nx build api-gateway --configuration=production

# ----------------- STAGE 2: Production Stage -----------------
FROM node:20-alpine AS production
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3333

# Copy dependency files
COPY package.json package-lock.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifact from build stage
COPY --from=build /app/dist/apps/api-gateway ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3333/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "main.js"]