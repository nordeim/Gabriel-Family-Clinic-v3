#!/bin/bash
# security-scan.sh

echo "Running security scan on Docker images..."

# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest

# Scan with Snyk (requires SNYK_TOKEN)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -e SNYK_TOKEN=${SNYK_TOKEN} \
  snyk/snyk:docker test ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest
