# Recipe lines use TABS. `@@` markers in the generator are converted on write.
SHELL := /bin/bash
COMPOSE := docker compose
.DEFAULT_GOAL := help
.PHONY: help doctor install up wait down reset logs seed dev smoke full full-down verify

help: ## Show this help
	@printf "\n  \033[1mMEAN boilerplate\033[0m\n\n"
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "};{printf "  \033[36m%-12s\033[0m %s\n",$$1,$$2}'
	@printf "\n"

doctor: ## Check node, docker and port availability
	node scripts/doctor.mjs

install: ## Install every workspace from the root (shared builds itself)
	npm ci

up: ## Start MongoDB (rs0 + auth) and mongo-express, and wait for a writable primary
	test -f .env || cp .env.example .env
	$(COMPOSE) up -d --wait
	$(COMPOSE) ps

down: ## Stop containers, KEEP the data volume
	$(COMPOSE) down

reset: ## Stop containers and DESTROY the data volume, then start clean and seed
	$(COMPOSE) down -v
	$(MAKE) up
	$(MAKE) seed

logs: ## Tail the database logs
	$(COMPOSE) logs -f mongo mongo-init

seed: ## Load demo + admin users and sample tasks
	npm run seed

dev: ## Run the API and the Angular dev server on the host
	npm run dev

smoke: ## Curl the whole auth + tasks flow against a running API
	npm run smoke

full: ## Build and run EVERYTHING in containers (nginx :8080 -> api -> mongo)
	$(COMPOSE) -f docker-compose.full.yml up -d --build --wait
	$(COMPOSE) -f docker-compose.full.yml ps

full-down: ## Stop the fully containerized stack
	$(COMPOSE) -f docker-compose.full.yml down

verify: ## The whole gate: toolchain, lint, format, typecheck, tests, builds
	npm run verify
