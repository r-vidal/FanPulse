.PHONY: help install dev stop clean test lint

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev: ## Start development environment with Docker
	docker-compose up -d

dev-logs: ## Show logs from all services
	docker-compose logs -f

stop: ## Stop all services
	docker-compose down

clean: ## Stop services and remove volumes
	docker-compose down -v

test-backend: ## Run backend tests
	cd backend && pytest

test-frontend: ## Run frontend tests
	cd frontend && npm test

lint-backend: ## Lint backend code
	cd backend && black . && flake8 app

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

migrate: ## Run database migrations
	cd backend && alembic upgrade head

migrate-create: ## Create a new migration
	@read -p "Enter migration message: " msg; \
	cd backend && alembic revision --autogenerate -m "$$msg"

backend-shell: ## Open backend container shell
	docker-compose exec backend bash

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U fanpulse -d fanpulse

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli
