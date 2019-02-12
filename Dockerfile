FROM node:10

LABEL maintainer="Incubateur des Ministères Sociaux <incubateur@sg.social.gouv.fr>"

COPY ./package.json /app/package.json

WORKDIR /app

COPY ./dist /app/dist

ENV NODE_ENV=production

ENTRYPOINT ["yarn", "start"]
