# ---- Build stage ----
FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy frontend source and build
COPY apps/frontend ./apps/frontend

RUN pnpm --filter @cubepath/frontend build

# ---- Production stage ----
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config from builder
COPY --from=builder /app/apps/frontend/nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from builder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
