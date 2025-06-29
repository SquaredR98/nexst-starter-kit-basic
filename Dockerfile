# ============================================================================
# MULTI-STAGE DOCKERFILE - Production Ready
# Supports both SaaS and On-Premises Deployments
# ============================================================================

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Production Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Create system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Copy other necessary files
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create directories for uploads, logs, and backups
RUN mkdir -p uploads logs backups
RUN chown -R nextjs:nodejs uploads logs backups

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Install curl for health check
USER root
RUN apk add --no-cache curl
USER nextjs

# Start the application
CMD ["npm", "start"]

# Labels for better container management
LABEL org.opencontainers.image.title="ERP System"
LABEL org.opencontainers.image.description="Multi-tenant ERP system with ABAC security"
LABEL org.opencontainers.image.vendor="Your Company"
LABEL org.opencontainers.image.source="https://github.com/your-org/erp-system"
LABEL deployment.type="multi" 
LABEL deployment.supports="cloud,onpremise,hybrid" 