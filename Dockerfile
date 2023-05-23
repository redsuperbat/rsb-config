FROM golang:alpine3.14 as backend-builder

RUN apk add git

WORKDIR /app

COPY ./backend .

RUN go build

FROM node:slim as frontend-builder

WORKDIR /app

COPY ./frontend .

RUN npm install

RUN npm run build


FROM alpine:3.14

WORKDIR /app

COPY --from=frontend-builder /app/dist dist

COPY --from=backend-builder /app/config .

ENTRYPOINT ["./config"]