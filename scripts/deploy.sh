#!/bin/bash

# ============================================================================
# ERP SYSTEM DEPLOYMENT SCRIPT
# Supports: SaaS Cloud, On-Premises, and Hybrid Deployments
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOYMENT_TYPE="cloud"
ENVIRONMENT="production"
SKIP_BACKUP=false
FORCE_REBUILD=false

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
ERP System Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -t, --type TYPE         Deployment type: cloud, onpremise, hybrid (default: cloud)
    -e, --env ENV          Environment: development, staging, production (default: production)
    -s, --skip-backup      Skip database backup before deployment
    -f, --force-rebuild    Force rebuild of Docker images
    -h, --help             Show this help message

EXAMPLES:
    # Deploy to cloud (SaaS)
    $0 --type cloud --env production

    # Deploy on-premises
    $0 --type onpremise --env production

    # Deploy hybrid setup
    $0 --type hybrid --env production --force-rebuild

REQUIREMENTS:
    - Docker and Docker Compose installed
    - Environment variables configured (.env file)
    - For on-premise: Valid license file (license.json)
EOF
}

validate_environment() {
    log_info "Validating deployment environment..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi

    # Check environment file
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Please create it from .env.example"
        exit 1
    fi

    # Validate deployment type specific requirements
    case $DEPLOYMENT_TYPE in
        "onpremise")
            if [ ! -f "license.json" ] && [ -z "$LICENSE_DATA" ]; then
                log_error "On-premise deployment requires license.json file or LICENSE_DATA environment variable"
                exit 1
            fi
            ;;
        "cloud")
            if [ -z "$RAZORPAY_KEY_ID" ] || [ -z "$RAZORPAY_KEY_SECRET" ]; then
                log_warning "Payment gateway credentials not configured for SaaS deployment"
            fi
            ;;
    esac

    log_success "Environment validation completed"
}

backup_database() {
    if [ "$SKIP_BACKUP" = true ]; then
        log_info "Skipping database backup as requested"
        return
    fi

    log_info "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p backups

    # Generate backup filename with timestamp
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

    # Create backup using Docker
    if docker-compose ps | grep -q postgres; then
        docker-compose exec -T postgres pg_dump -U erp_user -d erp_system > "$BACKUP_FILE"
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_warning "Database container not running, skipping backup"
    fi
}

deploy_application() {
    log_info "Starting deployment for $DEPLOYMENT_TYPE environment..."

    # Set deployment type in environment
    export DEPLOYMENT_TYPE=$DEPLOYMENT_TYPE

    # Build and deploy based on environment
    if [ "$FORCE_REBUILD" = true ]; then
        log_info "Force rebuilding Docker images..."
        docker-compose build --no-cache
    fi

    # Deploy the application
    case $DEPLOYMENT_TYPE in
        "cloud")
            log_info "Deploying SaaS Cloud configuration..."
            docker-compose --profile backup up -d
            ;;
        "onpremise")
            log_info "Deploying On-Premises configuration..."
            docker-compose up -d
            ;;
        "hybrid")
            log_info "Deploying Hybrid configuration..."
            docker-compose --profile proxy --profile backup up -d
            ;;
    esac

    # Wait for services to be healthy
    log_info "Waiting for services to start..."
    sleep 30

    # Check health
    check_deployment_health
}

check_deployment_health() {
    log_info "Checking deployment health..."

    # Check if application is responding
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:3000/api/health > /dev/null; then
            log_success "Application is healthy and responding"
            break
        else
            log_info "Waiting for application to be ready... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        fi
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "Deployment health check failed. Application is not responding."
        exit 1
    fi

    # Show deployment summary
    show_deployment_summary
}

show_deployment_summary() {
    log_success "Deployment completed successfully!"
    echo
    echo "================================================"
    echo "         DEPLOYMENT SUMMARY"
    echo "================================================"
    echo "Deployment Type: $DEPLOYMENT_TYPE"
    echo "Environment: $ENVIRONMENT"
    echo "Application URL: http://localhost:3000"
    echo "Health Check: http://localhost:3000/api/health"
    
    if [ "$DEPLOYMENT_TYPE" = "hybrid" ]; then
        echo "Traefik Dashboard: http://localhost:8080"
    fi
    
    echo
    echo "Services Running:"
    docker-compose ps
    echo
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    echo "================================================"
}

cleanup_old_deployments() {
    log_info "Cleaning up old deployments..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backup files (keep last 7 days)
    find backups -name "*.sql" -mtime +7 -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -t|--type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -f|--force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate deployment type
if [[ ! "$DEPLOYMENT_TYPE" =~ ^(cloud|onpremise|hybrid)$ ]]; then
    log_error "Invalid deployment type: $DEPLOYMENT_TYPE"
    log_error "Valid types: cloud, onpremise, hybrid"
    exit 1
fi

# Main deployment flow
main() {
    log_info "Starting ERP System Deployment"
    log_info "Type: $DEPLOYMENT_TYPE | Environment: $ENVIRONMENT"
    
    validate_environment
    backup_database
    deploy_application
    cleanup_old_deployments
    
    log_success "Deployment process completed successfully!"
}

# Run main function
main 