# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Install necessary dependencies
RUN apk add --no-cache python3 make g++ 

# Copy package.json and package-lock.json for caching dependencies
COPY package*.json ./

# Install dependencies with npm ci for cleaner installs
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runtime

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose the application's port
EXPOSE 3000

# Define the default command
CMD ["npm", "start"]