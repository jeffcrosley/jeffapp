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

# Copy only the necessary files for running the application from the build stage
# 1. Copy the built artifact from the build stage's dist folder
COPY --from=build /app/dist/apps/api-gateway ./

# 2. Re-create node_modules for production-only dependencies for security/size
#    This assumes your dependency management is clean and only production deps are needed at runtime
#    We only need the dependencies of the API Gateway, which should be included in its build output's package.json
#    In a complex monorepo, you might copy the root package.json and run 'npm install --production'
#    For simplicity here, we assume the built output has its own necessary structure.

# Set the environment variable for Node.js
ENV NODE_ENV production
ENV PORT 3333

# Expose the internal port (Render manages the external port)
EXPOSE 3333

# Define the command to start the application
CMD [ "node", "main.js" ] 
# Note: The 'main.js' here refers to the final bundled/compiled entry point in the 'dist' folder.