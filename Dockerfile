FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
EXPOSE 4200
CMD ["bunx", "ng", "serve", "--host", "0.0.0.0", "--poll", "500"]