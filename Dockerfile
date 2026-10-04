# Local delivery runtime. Default command is `serve` (scheduled pull + Discord post).
# One-shot test: `docker compose run --rm discord run-job <name>`.
# Published npm package identity is unchanged; this image is a separate artifact.

FROM node:20-bookworm-slim AS build

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime

ARG VERSION=dev

LABEL org.opencontainers.image.title="Truss Agent" \
  org.opencontainers.image.description="Run scheduled Truss threat-intelligence delivery jobs in your environment." \
  org.opencontainers.image.source="https://github.com/truss-security/truss-agent-mcp" \
  org.opencontainers.image.documentation="https://github.com/truss-security/truss-agent-mcp" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.vendor="Truss Security" \
  org.opencontainers.image.version="${VERSION}"

RUN groupadd --gid 10001 truss \
  && useradd --uid 10001 --gid truss --create-home --shell /usr/sbin/nologin truss

WORKDIR /app
COPY --from=build --chown=truss:truss /src/package.json ./package.json
COPY --from=build --chown=truss:truss /src/node_modules ./node_modules
COPY --from=build --chown=truss:truss /src/dist ./dist
COPY --chown=truss:truss config/connections.example.json config/jobs.example.json config/agent.example.json /usr/local/share/truss/examples/

USER truss

ENTRYPOINT ["node", "dist/truss-cli.js"]
CMD ["serve"]
