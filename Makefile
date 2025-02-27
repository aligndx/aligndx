COMPOSE_FILE_PROD = deploy/docker-compose.yml
COMPOSE_FILE_DEV = deploy/docker-compose.dev.yml
ENV_FILE = .env

# Default compose file
COMPOSE_FILE = $(COMPOSE_FILE_DEV)

# If COMPOSE_ENV is set to "prod", use the production compose file
ifeq ($(COMPOSE_ENV),prod)
    COMPOSE_FILE = $(COMPOSE_FILE_PROD)
endif

.PHONY: build up down logs restart status clean build-ui release lint test

# Up: Start the containers
up:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d

# Down: Stop and remove the containers
down:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down

# Build: Build the containers
build:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) build

# Logs: View logs for all services
logs:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f

# Restart: Restart the containers
restart:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart

# Status: Display the status of the containers
status:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) ps

# Clean: Stop containers and remove volumes
clean:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down -v

# Watch: Watch containers
watch:
	docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up --watch

build-ui:
	./scripts/build-ui.sh

# Lint: Run golangci-lint
lint:
	golangci-lint run ./...

# Test: Run Go tests
test:
	go test -v ./...

# Release: Build the UI and create a release with GoReleaser
release: build-ui
	goreleaser release