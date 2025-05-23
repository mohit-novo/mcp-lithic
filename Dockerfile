FROM node:20-alpine

WORKDIR /app

# Install dependencies for the build
COPY package*.json ./
RUN npm install

# Copy TypeScript source and config
COPY tsconfig.json ./
COPY src/ ./src/
COPY mcp-config.json ./

# Build TypeScript code
RUN npm run build

# Clean up dev dependencies to reduce image size
RUN npm prune --production

# Set executable permissions
RUN chmod +x build/index.js

# Create a non-root user to run the app
RUN addgroup -S mcp && adduser -S mcp -G mcp
USER mcp

# Define default environment variables
ENV NODE_ENV=production
ENV LITHIC_API_BASE_URL=https://sandbox.lithic.com/v1

# Expose MCP server (stdin/stdout)
ENTRYPOINT ["node", "build/index.js"] 