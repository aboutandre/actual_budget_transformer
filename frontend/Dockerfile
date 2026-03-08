FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:20-alpine AS serve
WORKDIR /app
COPY --from=build /app/build ./build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build"]

