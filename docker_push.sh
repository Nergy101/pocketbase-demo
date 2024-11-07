docker login
docker buildx build --platform linux/amd64,linux/arm64 -t nergy101/pocketbase-demo:latest --push .
docker push nergy101/pocketbase-demo:latest
