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

RUN addgroup -g $USER_GID $USERNAME && \
    adduser -D -u $USER_UID -G $USERNAME $USERNAME && \
    apk upgrade --no-cache && \
    mkdir -p /tmp/nginx/cache /tmp/nginx/logs /tmp/nginx/run && \
    ln -sf /tmp/nginx/cache /var/cache/nginx && \
    ln -sf /tmp/nginx/logs /var/log/nginx && \
    ln -sf /tmp/nginx/run /var/run/nginx && \
    touch /tmp/nginx/nginx.pid && \
    chown -R $USER_UID:$USER_GID /tmp/nginx && \
    chmod 666 /tmp/nginx/nginx.pid && \
    mkdir -p /app && \
    chown -R $USER_UID:$USER_GID /app

COPY --chown=$USER_UID:$USER_GID --from=build /app/dist /app

COPY --chown=$USER_UID:$USER_GID nginx.conf /etc/nginx/nginx.conf

USER 10001

EXPOSE 8080

STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
