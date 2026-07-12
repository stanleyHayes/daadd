FROM node:20-alpine AS base
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

RUN npm install

COPY shared ./shared
COPY frontend ./frontend

# Development
FROM base AS development
WORKDIR /app/frontend
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build
FROM base AS build
WORKDIR /app
RUN npm run build:shared && npm run build:frontend

# Production - serve with nginx
FROM nginx:alpine AS production
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
