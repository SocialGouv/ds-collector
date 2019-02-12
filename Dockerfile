FROM node:10

LABEL maintainer="Incubateur des Ministères Sociaux <incubateur@sg.social.gouv.fr>"

COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

WORKDIR /app

RUN yarn --frozen-lockfile && yarn cache clean

COPY ./public /app/public
COPY ./openapi.json /app/openapi.json

COPY ./src /app/src

ENV NODE_ENV=production

ENTRYPOINT ["yarn", "start"]
