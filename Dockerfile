# syntax=docker/dockerfile:1
# https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/reference.md

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/playwright AS playwright

RUN mkdir /app \
  && cd app \
  && npm init --yes \
  &&  npm install playwright \
  &&  npx playwright install \
  &&  npx playwright install-deps \
  && npm install prom-client

WORKDIR /app

COPY ./onvista.js .

EXPOSE 10000

CMD ["node", "onvista.js"]
