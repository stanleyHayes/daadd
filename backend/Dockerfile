# syntax=docker/dockerfile:1

# -----------------------------
# Stage 1: Build the backend
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies first for native modules
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including dev deps needed for build)
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# -----------------------------
# Stage 2: Production image
# -----------------------------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Build dependencies for any optional native modules (e.g., msgpackr)
RUN apk add --no-cache python3 make g++

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Do not copy .env — secrets are injected at runtime

EXPOSE 4000

CMD ["node", "dist/server.js"]
