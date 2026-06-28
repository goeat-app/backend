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

COPY package.json firebase.json .firebaserc tsconfig.json ./
COPY dist ./dist
COPY node_modules ./node_modules
COPY ml/prediction_service ./ml/prediction_service
COPY docker/firebase-emulator/entrypoint.sh ./entrypoint.sh
RUN python3.11 -m venv ml/prediction_service/venv \
  && ml/prediction_service/venv/bin/python -m pip install --upgrade pip \
  && ml/prediction_service/venv/bin/python -m pip install -r ml/prediction_service/requirements.txt \
  && chmod +x entrypoint.sh

EXPOSE 9099 4000 5001

ENTRYPOINT ["./entrypoint.sh"]
