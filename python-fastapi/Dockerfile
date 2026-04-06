######################
# Python Build Stage #
######################
FROM python:3.12-alpine AS build

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

COPY . .

######################
# Final Runtime Stage #
######################
FROM python:3.12-alpine

ARG USERNAME=appuser
ARG USER_UID=10001
ARG USER_GID=$USER_UID

RUN addgroup -g $USER_GID $USERNAME && \
    adduser -D -u $USER_UID -G $USERNAME $USERNAME && \
    apk upgrade --no-cache

WORKDIR /app

COPY --from=build /install /usr/local
COPY --chown=$USER_UID:$USER_GID --from=build /app /app

USER 10001

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
