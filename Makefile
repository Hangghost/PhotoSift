.PHONY: help dev dev-backend dev-frontend stop restart \
       build build-backend build-frontend \
       lint typecheck format check \
       install lock \
       db-reset clean clean-all \
       logs shell-backend shell-frontend health \
       prod

COMPOSE := docker compose
COMPOSE_DEV := docker compose -p photosift-dev
COMPOSE_PROD := docker compose -p photosift-prod -f docker-compose.yml

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Development ──────────────────────────────────────────────

dev: ## Start full dev environment (with hot-reload)
	$(COMPOSE_DEV) up --build

dev-backend: ## Start only the backend container
	$(COMPOSE_DEV) up --build backend

dev-frontend: ## Start only the frontend container
	$(COMPOSE_DEV) up --build frontend

pause-dev: ## Pause development containers (keep containers, stop running)
	$(COMPOSE_DEV) stop

pause-prod: ## Pause production containers (keep containers, stop running)
	$(COMPOSE_PROD) stop

resume-dev: ## Resume paused development containers
	$(COMPOSE_DEV) start

resume-prod: ## Resume paused production containers
	$(COMPOSE_PROD) start

stop-dev: ## Stop and remove development containers
	$(COMPOSE_DEV) down

stop-prod: ## Stop and remove production containers
	$(COMPOSE_PROD) down

stop: ## Stop and remove all containers (both dev and prod)
	$(COMPOSE_DEV) down
	$(COMPOSE_PROD) down

restart-dev: ## Restart running development containers
	$(COMPOSE_DEV) restart

restart-prod: ## Restart running production containers
	$(COMPOSE_PROD) restart

# ─── Production ───────────────────────────────────────────────

prod: ## Start production environment (no override, Nginx serves frontend)
	$(COMPOSE_PROD) up --build -d

deploy: ## Rebuild and restart production environment (for updates)
	@echo "🔄 Stopping existing containers..."
	$(COMPOSE_PROD) down
	@echo "🏗️  Building production images..."
	$(COMPOSE_PROD) build --no-cache
	@echo "🚀 Starting production environment..."
	$(COMPOSE_PROD) up -d
	@echo ""
	@echo "✅ PhotoSift deployed successfully!"
	@echo "   Frontend: http://localhost:8888"
	@echo "   Backend:  http://localhost:8000"
	@echo ""
	@echo "📝 Useful commands:"
	@echo "   make logs-prod   - View production logs"
	@echo "   make status      - Check container status"
	@echo "   make stop-prod   - Stop production containers"

build: ## Build all production images
	$(COMPOSE_PROD) build

build-backend: ## Build only the backend image
	$(COMPOSE_PROD) build backend

build-frontend: ## Build only the frontend image
	$(COMPOSE_PROD) build frontend

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
	$(COMPOSE_DEV) down --rmi all --volumes --remove-orphans
	$(COMPOSE_PROD) down --rmi all --volumes --remove-orphans

# ─── Utilities ────────────────────────────────────────────────

status: ## Show container status and health
	@echo "📊 Development Containers:"
	@$(COMPOSE_DEV) ps 2>/dev/null || echo "  (none running)"
	@echo ""
	@echo "📊 Production Containers:"
	@$(COMPOSE_PROD) ps 2>/dev/null || echo "  (none running)"
	@echo ""
	@echo "🏥 Health Check:"
	@echo -n "  Backend:  "
	@curl -sf http://localhost:8000/api/health > /dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Unreachable"
	@echo -n "  Dev Frontend (3002):  "
	@curl -sf http://localhost:3002 > /dev/null 2>&1 && echo "✅ Reachable" || echo "❌ Unreachable"
	@echo -n "  Prod Frontend (8888): "
	@curl -sf http://localhost:8888 > /dev/null 2>&1 && echo "✅ Reachable" || echo "❌ Unreachable"
	@echo ""
	@echo "🔗 Access URLs:"
	@echo "  Dev Frontend:  http://localhost:3002"
	@echo "  Prod Frontend: http://localhost:8888"
	@echo "  Backend API:   http://localhost:8000"

logs: logs-dev ## Show development container logs (alias)

logs-dev: ## Show development container logs (follow)
	$(COMPOSE_DEV) logs -f

logs-prod: ## Show production container logs (follow)
	$(COMPOSE_PROD) logs -f

shell-backend: ## Open a shell in the dev backend container
	$(COMPOSE_DEV) exec backend bash

shell-frontend: ## Open a shell in the dev frontend container
	$(COMPOSE_DEV) exec frontend sh

shell-backend-prod: ## Open a shell in the prod backend container
	$(COMPOSE_PROD) exec backend bash

shell-frontend-prod: ## Open a shell in the prod frontend container
	$(COMPOSE_PROD) exec frontend sh

health: ## Check backend health endpoint
	@curl -sf http://localhost:8000/api/health | python3 -m json.tool || echo "Backend is not reachable"
