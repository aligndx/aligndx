FROM node:16-alpine AS ui-builder
WORKDIR /ui
COPY ui/ ./
RUN npm run build

FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

COPY --from=ui-builder /ui/out ./ui/out

RUN go build -o app .

FROM alpine:latest

COPY --from=builder /app/app .
ENTRYPOINT ["./app"]