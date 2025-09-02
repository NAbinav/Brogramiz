FROM docker:24.0.7-dind

RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    py3-virtualenv \
    bash \
    curl \
    jq \
    wget \
    git \
    ca-certificates

# Set up Go environment
ENV GO_VERSION=1.22.1
ENV GOPATH=/go
ENV PATH=$GOPATH/bin:/usr/local/go/bin:$PATH

WORKDIR /app

COPY requirements.txt ./
RUN python3 -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install -r requirements.txt

ENV PATH="/venv/bin:$PATH"

COPY . .

EXPOSE 8080

ENV DOCKER_HOST="unix:///var/run/docker.sock"

CMD ["sh", "-c", "dockerd & sleep 5 && echo 'Docker daemon started' && uvicorn app:app --host 0.0.0.0 --port 8080"]
