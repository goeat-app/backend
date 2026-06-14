FROM node:22-alpine

RUN apk add --no-cache openjdk17-jre-headless wget \
  && npm install -g firebase-tools

WORKDIR /firebase

COPY firebase.json .firebaserc entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 9099 4000

ENTRYPOINT ["./entrypoint.sh"]
