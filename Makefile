.PHONY: help dev dev-backend dev-frontend stop restart \
       build build-backend build-frontend \
       lint typecheck format check \
       install lock \
       db-reset clean clean-all \
       logs shell-backend shell-frontend health \
       prod

COMPOSE := docker compose
PHOTOS_DIR ?= $(HOME)/Pictures

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Development ──────────────────────────────────────────────

dev: ## Start full dev environment (with hot-reload)
	PHOTOS_DIR=$(PHOTOS_DIR) $(COMPOSE) up --build

dev-backend: ## Start only the backend container
	PHOTOS_DIR=$(PHOTOS_DIR) $(COMPOSE) up --build backend

dev-frontend: ## Start only the frontend container
	PHOTOS_DIR=$(PHOTOS_DIR) $(COMPOSE) up --build frontend

stop: ## Stop all containers
	$(COMPOSE) down

restart: ## Restart all containers
	$(COMPOSE) restart

# ─── Production ───────────────────────────────────────────────

prod: ## Start production environment (no override, Nginx serves frontend)
	PHOTOS_DIR=$(PHOTOS_DIR) $(COMPOSE) -f docker-compose.yml up --build -d

build: ## Build all production images
	$(COMPOSE) -f docker-compose.yml build

build-backend: ## Build only the backend image
	$(COMPOSE) -f docker-compose.yml build backend

build-frontend: ## Build only the frontend image
	$(COMPOSE) -f docker-compose.yml build frontend

# ─── Code Quality ─────────────────────────────────────────────

lint: ## Run linters (frontend ESLint + backend Ruff)
	cd frontend && npm run lint
	cd backend && uv run ruff check .

typecheck: ## Run TypeScript type checking
	cd frontend && npx tsc --noEmit

format: ## Format code (backend Ruff)
	cd backend && uv run ruff format .
	cd backend && uv run ruff check --fix .

check: lint typecheck ## Run all checks (lint + typecheck)

# ─── Dependencies ─────────────────────────────────────────────

install: ## Install all dependencies (frontend + backend)
	cd backend && uv sync
	cd frontend && npm install

lock: ## Update lock files
	cd backend && uv lock
	cd frontend && npm install --package-lock-only

# ─── Database ─────────────────────────────────────────────────

db-reset: ## Reset SQLite database (WARNING: deletes all data)
	rm -f ~/.photo-workflow/data.db
	@echo "Database reset. It will be recreated on next backend start."

# ─── Cleanup ──────────────────────────────────────────────────

clean: ## Remove build artifacts and caches
	rm -rf frontend/dist frontend/node_modules/.vite
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

clean-all: clean ## Clean + remove Docker images and volumes
	$(COMPOSE) down --rmi all --volumes --remove-orphans

# ─── Utilities ────────────────────────────────────────────────

logs: ## Show container logs (follow)
	$(COMPOSE) logs -f

shell-backend: ## Open a shell in the backend container
	$(COMPOSE) exec backend bash

shell-frontend: ## Open a shell in the frontend container
	$(COMPOSE) exec frontend sh

health: ## Check backend health endpoint
	@curl -sf http://localhost:8000/api/health | python3 -m json.tool || echo "Backend is not reachable"
