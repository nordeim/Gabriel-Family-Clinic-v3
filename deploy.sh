#!/bin/bash
# ============================================================================
# Gabriel Family Clinic - Deployment Script
# ============================================================================
# Automated deployment with blue-green strategy
# ============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGISTRY=${DOCKER_REGISTRY:-docker.io}
IMAGE_NAME=${DOCKER_IMAGE_NAME:-gabriel-clinic}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Gabriel Family Clinic - Deployment Script${NC}"
echo -e "${BLUE}===========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"

# Function to check health
check_health() {
    local container=$1
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking health of $container"
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $container curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}✗${NC}"
    return 1
}

# Build and tag image
echo "Building Docker image..."
docker build -t ${REGISTRY}/${IMAGE_NAME}:${VERSION} .

# Push to registry
echo "Pushing image to registry..."
docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}

# Deploy based on environment
case $ENVIRONMENT in
    production)
        echo "Deploying to production with blue-green strategy..."
        
        # Determine which container is active
        if docker ps | grep -q gfc-app-blue; then
            ACTIVE=blue
            INACTIVE=green
        else
            ACTIVE=green
            INACTIVE=blue
        fi
        
        echo "Active: $ACTIVE, Deploying to: $INACTIVE"
        
        # Update inactive container
        export ${INACTIVE^^}_TAG=$VERSION
        docker-compose -f docker-compose.prod.yml up -d app-$INACTIVE
        
        # Wait for health check
        if check_health "gfc-app-$INACTIVE"; then
            echo "Health check passed, switching traffic..."
            
            # Update nginx to route to new container
            docker exec gfc-nginx nginx -s reload
            
            echo -e "${GREEN}Deployment successful!${NC}"
            
            # Optional: Stop old container after successful deployment
            read -p "Stop old container ($ACTIVE)? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker-compose -f docker-compose.prod.yml stop app-$ACTIVE
            fi
        else
            echo -e "${RED}Health check failed, rolling back...${NC}"
            docker-compose -f docker-compose.prod.yml stop app-$INACTIVE
            exit 1
        fi
        ;;
        
    staging)
        echo "Deploying to staging..."
        docker-compose -f docker-compose.staging.yml up -d
        ;;
        
    development)
        echo "Deploying to development..."
        docker-compose up -d
        ;;
        
    *)
        echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Deployment complete!${NC}"
