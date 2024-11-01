FROM node:18.19.1-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.17.1-alpine
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist/pocketbase-demo/browser /usr/share/nginx/html
EXPOSE 80

# local:
# docker auth
# docker buildx build --platform linux/amd64,linux/arm64 -t nergy101/pocketbase-demo:latest --push .
# docker login
# docker push nergy101/pocketbase-demo:latest
# on VM:
# docker pull nergy101/pocketbase-demo:latest &&
# docker stop pocketbase-demo && docker rm pocketbase-demo &&
# docker run --restart unless-stopped -p 4002:80 -d --name pocketbase-demo nergy101/pocketbase-demo:latest
