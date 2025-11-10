#!/bin/bash
# performance-test.sh

echo "Running performance tests..."

# Test with k6
docker run --rm -i \
  -v "$PWD/tests/k6:/scripts" \
  grafana/k6 run /scripts/load-test.js

# Test with Apache Bench
docker run --rm httpd:alpine \
  ab -n 1000 -c 10 http://app:3000/api/health
