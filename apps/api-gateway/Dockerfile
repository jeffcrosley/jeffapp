# apps/api-gateway/Dockerfile

# ----------------- STAGE 1: Build Stage -----------------
# Uses a full Node image to handle all build tasks (installing dependencies, running Nx build)
FROM node:lts-alpine as build
WORKDIR /app

# Copy project-wide dependency files from the monorepo root
# Since Render's Root Directory is now /, the COPY source path starts at /
COPY package.json ./
COPY package-lock.json ./

# Install dependencies (they will be installed in /app)
RUN npm install

# Copy the source code for the API Gateway project (relative to the Dockerfile)
COPY . .

# Use Nx to build the specific API Gateway application
# Nx outputs the production-ready code to a specific directory (e.g., dist/apps/api-gateway)
ARG PROJECT_NAME=api-gateway
RUN npx nx build ${PROJECT_NAME} --prod

# ----------------- STAGE 2: Production Stage -----------------
# Uses a lean, production-optimized image (alpine for size)
FROM node:lts-slim as production
WORKDIR /app

# 1. Copy the production-ready node_modules from the build stage
# We copy the *entire* node_modules folder from the build stage.
# This contains 'tslib' and any other production dependencies.
COPY --from=build /app/node_modules ./node_modules

# 2. Copy the built artifact (main.js, etc.) from the build stage's dist folder
COPY --from=build /app/dist/apps/api-gateway ./

# Set the environment variable for Node.js
ENV NODE_ENV production
ENV PORT 3333

# Expose the internal port (Render manages the external port)
EXPOSE 3333

# Define the command to start the application
CMD [ "node", "main.js" ] 
# Note: The 'main.js' here refers to the final bundled/compiled entry point in the 'dist' folder.