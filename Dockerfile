FROM node:15.4-alpine3.10

RUN apk add git
RUN npm install -g npm@7.4.3

# Create app directory
WORKDIR /usr/src/app

USER node
