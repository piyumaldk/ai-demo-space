######################
# Node Build Stage   #
######################
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

########################
# Final Static Server  #
########################
FROM nginx:alpine

ARG USERNAME=appuser
ARG USER_UID=10001
ARG USER_GID=$USER_UID

WORKDIR /app
RUN mkdir -p /tmp && mkdir -p /home/$USERNAME && \
    addgroup -g $USER_GID $USERNAME && \
    adduser -D -u $USER_UID -G $USERNAME $USERNAME && \
    chown -R $USER_UID:$USER_GID /home/$USERNAME && \
    apk upgrade --no-cache && \
    apk add --no-cache libcrypto3 libssl3 && \
    chown -R $USER_UID:$USER_GID /app && chmod -R 755 /app && \
    chown -R $USER_UID:$USER_GID /tmp && \
    mkdir -p /tmp/nginx/cache /tmp/nginx/logs /tmp/nginx/run && \
    ln -sf /tmp/nginx/cache /var/cache/nginx && \
    ln -sf /tmp/nginx/logs /var/log/nginx && \
    ln -sf /tmp/nginx/run /var/run/nginx && \
    chown -R $USER_UID:$USER_GID /tmp/nginx && \
    touch /tmp/nginx/nginx.pid && \
    chown $USER_UID:$USER_GID /tmp/nginx/nginx.pid && \
    chmod 666 /tmp/nginx/nginx.pid

USER 10001

COPY --chown=$USER_UID:$USER_GID production/nginx.conf /etc/nginx/
COPY --chown=$USER_UID:$USER_GID --from=build /app/dist /app/
COPY --chown=$USER_UID:$USER_GID production/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

STOPSIGNAL SIGQUIT
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
