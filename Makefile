COMPOSE_FILE = deploy/docker-compose.yml
ENV_FILE = .env
.PHONY: build

# Up: Start the containers
up:
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d

# Down: Stop and remove the containers
down:
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down

# Build: Build the containers
build:
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) build

# Logs: View logs for all services
logs:
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f

# Restart: Restart the containers
restart:
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart

# Status: Display the status of the containers
status:
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) ps

# Clean: Stop containers and remove volumes
clean:
	docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down -v
