FROM node:22-alpine

RUN apk add --no-cache openjdk17-jre-headless wget \
  && npm install -g firebase-tools

WORKDIR /workspace

COPY package.json firebase.json .firebaserc tsconfig.json ./
COPY dist ./dist
COPY node_modules ./node_modules
COPY docker/firebase-emulator/entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 9099 4000 5001

ENTRYPOINT ["./entrypoint.sh"]
