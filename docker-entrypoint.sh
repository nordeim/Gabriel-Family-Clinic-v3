#!/bin/sh
# ============================================================================
# Gabriel Family Clinic - Docker Entrypoint Script
# ============================================================================
# Handles runtime initialization and graceful shutdown
# ============================================================================

set -e

echo "Starting Gabriel Family Clinic Application..."
echo "Environment: ${NODE_ENV}"
echo "Instance ID: ${INSTANCE_ID:-default}"

# Run database migrations (if needed)
if [ "${RUN_MIGRATIONS}" = "true" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy
fi

# Health check file
touch /tmp/healthy

# Graceful shutdown handler
graceful_shutdown() {
    echo "Received shutdown signal, starting graceful shutdown..."
    
    # Remove health check file to stop receiving traffic
    rm -f /tmp/healthy
    
    # Wait for ongoing requests to complete (max 30s)
    sleep 5
    
    # Kill the application
    kill -TERM "$NODE_PID"
    wait "$NODE_PID"
    
    echo "Graceful shutdown completed"
    exit 0
}

# Trap termination signals
trap graceful_shutdown SIGTERM SIGINT

# Start the application
echo "Starting Next.js server on port ${PORT:-3000}..."
node server.js &
NODE_PID=$!

# Wait for the process
wait "$NODE_PID"
