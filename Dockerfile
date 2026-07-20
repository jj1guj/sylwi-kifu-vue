# --- Build stage ---
FROM node:24-slim AS build

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# --- Production stage ---
FROM node:24-slim AS production

WORKDIR /app
ENV NODE_ENV=production

# @napi-rs/canvas requires some native libraries
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  libfontconfig1 \
  libfreetype6 \
  libpng16-16 \
  libjpeg62-turbo \
  libglib2.0-0 \
  libcairo2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 && \
  rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server source (run with tsx)
COPY server ./server
COPY src/modules ./src/modules
COPY tsconfig.json ./

EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
