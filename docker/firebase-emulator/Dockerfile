FROM node:22-alpine

RUN apk add --no-cache openjdk17-jre-headless wget \
  && npm install -g firebase-tools

WORKDIR /workspace

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

EXPOSE 4000 5001 9099 9199

CMD ["firebase", "emulators:start", "--only", "functions,auth,storage"]
