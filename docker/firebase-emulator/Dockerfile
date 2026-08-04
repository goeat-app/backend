FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    python3 \
    python3-pip \
    python3-venv \
    wget \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g firebase-tools

WORKDIR /workspace

RUN corepack enable

COPY . ./
RUN yarn install --frozen-lockfile

EXPOSE 4000 5001 9099

CMD ["firebase", "emulators:start", "--only", "functions,auth"]
