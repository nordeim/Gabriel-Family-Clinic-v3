/**
 * Health check script for Docker container
 * Verifies application is running and responsive
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0); // Healthy
  } else {
    process.exit(1); // Unhealthy
  }
});

req.on('error', () => {
  process.exit(1); // Unhealthy
});

req.on('timeout', () => {
  req.abort();
  process.exit(1); // Unhealthy
});

req.end();
