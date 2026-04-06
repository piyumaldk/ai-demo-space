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
FROM node:20-alpine

ARG USERNAME=appuser
ARG USER_UID=10001
ARG USER_GID=$USER_UID

RUN addgroup -g $USER_GID $USERNAME && \
    adduser -D -u $USER_UID -G $USERNAME $USERNAME && \
    npm install -g serve && \
    mkdir -p /app && chown -R $USER_UID:$USER_GID /app

COPY --chown=$USER_UID:$USER_GID --from=build /app/dist /app

USER 10001

EXPOSE 8080

CMD ["serve", "-s", "/app", "-l", "8080"]
