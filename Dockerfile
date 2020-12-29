FROM node:lts-alpine
ARG BRANCH=master
ARG BUILD_DATE=unknown
ARG COMMIT=unknown
ARG COMMIT_DATE=unknown
ARG VERSION=unknown

# Including tini instead of doing --init because who remebers that
RUN apk add --no-cache tini ffmpeg perl make python3 git gcc
# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--"]

# Create app directory
WORKDIR /usr/src/app

WORKDIR /usr/src/app/tmp

COPY . .

WORKDIR /usr/src/app

RUN cd tmp \
    && npm ci \
    && npm run build \
    && cd - \
    && cp -Rp tmp/server/* . \
    && rm -rf tmp

LABEL vendor="medifor" \
    name="medifor-demo-ui" \
    build-date=$BUILD_DATE \
    vcs-ref=$COMMIT \
    version=$VERSION \
    branch=$BRANCH \
    vsc-ref-date=$COMMIT_DATE

EXPOSE 3000
ENV NODE_ENV production
CMD [ "node", "server.js" ]