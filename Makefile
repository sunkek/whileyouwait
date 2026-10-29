SHELL := /bin/bash

USER_ID := $(shell id -u)
GROUP_ID := $(shell id -g)

ENVIRONMENT ?= dev
ENV_DIR := ./env
APP ?= whileyouwait

# Base compose + per-environment override, merged in order. ENVIRONMENT drives
# which override (and which env/<env>/ dir + volume/container name suffix).
COMPOSE_FILES := -f infra/docker-compose.yml -f infra/docker-compose.$(ENVIRONMENT).yml
# Shared external bridge created once via `docker network create dev`.
NETWORK := dev
# Postgres container for this environment (psql / dump targets).
PG_CONTAINER := whileyouwait_postgresql_$(ENVIRONMENT)

POSTGRES_ENV := $(ENV_DIR)/$(ENVIRONMENT)/postgresql.env
PORTS_ENV := $(ENV_DIR)/$(ENVIRONMENT)/ports.env
BACKUP_DIR := ./infra/postgresql/backup

# Host-side port mappings live in $(PORTS_ENV). Source it before every docker
# compose invocation so the file's variables drive port interpolation, and
# export ENVIRONMENT so the compose files resolve their env/<env>/ paths and
# container/volume name suffixes. $(POSTGRES_ENV) is sourced too: Umami's
# DATABASE_URL is interpolated from its APP_* credentials.
COMPOSE_WITH_PORTS = set -a; ENVIRONMENT=$(ENVIRONMENT); [ -f "$(PORTS_ENV)" ] && . "$(PORTS_ENV)"; [ -f "$(POSTGRES_ENV)" ] && . "$(POSTGRES_ENV)"; set +a; docker compose $(COMPOSE_FILES)

.PHONY: help gen-env gen-key-hex gen-key-b64 env-add env-sync \
	secrets-init secrets-encrypt secrets-decrypt secrets-check secrets-add-recipient secrets-remove-recipient \
	up down down-v restart restart-v \
	run stop logs ps pull
.PHONY: psql psql-admin pg-dump pg-restore

help:
	@echo "Targets:"
	@echo "  make gen-env APP=<name>       - Materialize env/<env>/*.env with fresh secrets"
	@echo "  make env-add FILE=<f>.env NAME=X [VALUE=y] [SECRET=1] [ENVS=\"dev prod\"]"
	@echo "                                - Add one variable to the template and every environment"
	@echo "  make env-sync [ENVS=\"dev\"]     - Add variables new to env/example/, keep existing values"
	@echo "  make secrets-init NAME=<you> KEY=age1... - Create .sops.yaml"
	@echo "  make secrets-encrypt [ENVIRONMENT=prod] [FILES=\"a.env\"] - env/<env>/ -> env/sops/<env>/"
	@echo "  make secrets-decrypt [ENVIRONMENT=prod] [FILES=...] [FORCE=1] - the other way"
	@echo "  make secrets-check            - Fail if anything under env/sops/ is plaintext"
	@echo "  make secrets-add-recipient NAME=<them> KEY=age1... - Grant an operator access"
	@echo "  make secrets-remove-recipient NAME=<them> - Revoke it: re-key and rotate data keys"
	@echo "  make gen-key-hex              - Print a random 32-byte hex secret"
	@echo "  make gen-key-b64              - Print a random 32-byte base64 secret"
	@echo "  make up                       - Build and start the full dev stack (site, Umami, Postgres)"
	@echo "  make down                     - Stop and remove all containers"
	@echo "  make down-v                   - Stop and remove all containers and volumes"
	@echo "  make restart                  - down then up"
	@echo "  make restart-v                - down-v then up"
	@echo "  make run                      - Start infra only (docker compose up -d)"
	@echo "  make stop                     - Stop and remove containers"
	@echo "  make logs                     - Follow compose logs"
	@echo "  make ps                       - List compose containers"
	@echo "  make pull                     - Pull compose images"
	@echo "  make psql                     - Open psql as APP_USER"
	@echo "  make psql-admin               - Open psql as POSTGRES_USER"
	@echo "  make pg-dump [DUMP_FILE=...]  - Dump APP_DB (Umami's data) to SQL file"
	@echo "  make pg-restore DUMP_FILE=... - Restore APP_DB from SQL file"

# Generators

# Environments materialized in one gen-env run. They SHARE a single secret
# pool. Generate other environments in SEPARATE invocations so each gets
# distinct secrets (never share a prod secret with dev):
#   make gen-env GEN_ENVS=prod APP=whileyouwait
GEN_ENVS ?= dev

# gen-env materializes env/<env>/*.env from env/example/*.env, replacing the
# "password" placeholders with random secrets and "app" with $(APP). The recipe
# is ONE backslash-continued shell line, so feature markers cannot go inside it
# (the shell would join the marker comment onto the previous line and comment
# out the rest). The unused secrets in the pool are harmless: secret_for() only
# reaches a branch when the matching env file is present.
#
# Each logical credential is mapped by variable name + file, so a secret that
# lives in two files gets the same value in both.
gen-env:
	@set -e; \
	src_dir="$(ENV_DIR)/example"; \
	gen() { openssl rand -hex 32; }; \
	pg_app="$$(gen)"; pg_super="$$(gen)"; \
	mq_app="$$(gen)"; mq_admin="$$(gen)"; \
	redis_app="$$(gen)"; redis_admin="$$(gen)"; \
	jwt="$$(gen)"; \
	for env in $(GEN_ENVS); do \
		dst_dir="$(ENV_DIR)/$$env"; \
		mkdir -p "$$dst_dir"; \
		for src in "$$src_dir"/*.env; do \
			[ -e "$$src" ] || { echo "No .env files found in $$src_dir"; exit 1; }; \
			base="$$(basename "$$src")"; \
			dst="$$dst_dir/$$base"; \
			echo "Creating $$dst"; \
			awk -v app="$(APP)" -v file="$$base" \
				-v pg_app="$$pg_app" -v pg_super="$$pg_super" \
				-v mq_app="$$mq_app" -v mq_admin="$$mq_admin" \
				-v redis_app="$$redis_app" -v redis_admin="$$redis_admin" \
				-v jwt="$$jwt" '\
			function gen_secret() { \
				cmd = "openssl rand -hex 32"; cmd | getline r; close(cmd); return r; \
			} \
			function secret_for(name) { \
				if (name ~ /_API_POSTGRESQL_PASS$$/) return pg_app; \
				if (name ~ /_API_RABBITMQ_PASS$$/)   return mq_app; \
				if (name ~ /_API_REDIS_PASS$$/)      return redis_app; \
				if (name ~ /_API_JWT_SECRET$$/)      return jwt; \
				if (file == "postgresql.env") return (name ~ /APP/) ? pg_app : pg_super; \
				if (file == "rabbitmq.env")   return (name ~ /APP/) ? mq_app : mq_admin; \
				if (file == "redis.env")      return (name ~ /APP/) ? redis_app : redis_admin; \
				return gen_secret(); \
			} \
			{ \
				if ($$0 ~ /=("password"|password)$$/) { \
					name = $$0; \
					sub(/^[ \t]*export[ \t]+/, "", name); \
					sub(/=.*/, "", name); \
					sub(/=("password"|password)$$/, "=\"" secret_for(name) "\""); \
				} \
				if (app != "" && $$0 ~ /=("app"|app)$$/) { \
					sub(/=("app"|app)$$/, "=\"" app "\""); \
				} \
				print \
			}' "$$src" > "$$dst"; \
		done; \
	done

gen-key-hex:
	openssl rand --hex 32

gen-key-b64:
	openssl rand --base64 32

# Adding a variable by hand is four steps -- the template, every environment,
# and a re-encrypt of whichever of them are committed as ciphertext -- and it is
# easy to do three of them. env.sh does all four.
#
#   make env-add FILE=ports.env NAME=WHILEYOUWAIT_PREVIEW_PORT VALUE=4173
#   touch env/example/deploy.env     # env-add extends an existing file
#   make env-add FILE=deploy.env NAME=WHILEYOUWAIT_DEPLOY_TOKEN SECRET=1 ENVS=prod
#
# SECRET=1 puts the `password` placeholder in env/example/ (which is what
# gen-env recognises) and mints a DIFFERENT value per environment: a prod
# credential shared with dev is not a prod credential.
env-add:
	@test -n "$(FILE)" || { echo "FILE=<name>.env is required" >&2; exit 1; }
	@test -n "$(NAME)" || { echo "NAME=<VARIABLE> is required" >&2; exit 1; }
	scripts/env.sh add "$(FILE)" "$(NAME)" $(if $(VALUE),"$(VALUE)",) \
		$(if $(SECRET),--secret,) $(if $(ENVS),--envs "$(ENVS)",) \
		$(if $(COMMENT),--comment "$(COMMENT)",)

# Adds variables that env/example/ has and an environment does not, leaving
# every existing value alone. Run it after pulling someone else's new variable.
# `gen-env` is not the tool for that: it materializes a whole environment with
# fresh secrets and will not fill a gap in an existing one.
env-sync:
	scripts/env.sh sync $(ENVS)

# Which environment the secrets targets act on. ENVIRONMENT defaults to dev for
# the runtime targets, and dev is the wrong default here: the environment worth
# encrypting is prod. So these follow ENVIRONMENT only when it is given on the
# command line, and fall back to prod otherwise.
SECRETS_ENV := $(if $(filter command line,$(origin ENVIRONMENT)),$(ENVIRONMENT),prod)

# Secrets. See docs/SECRETS.md for what belongs here and what does not --
# encrypting a dev password for a container on a laptop costs every developer
# an age key and protects nothing.
secrets-init:
	@test -n "$(NAME)" && test -n "$(KEY)" || { echo "usage: make secrets-init NAME=<you> KEY=age1..." >&2; exit 1; }
	scripts/secrets.sh init "$(NAME)" "$(KEY)"

# FILES restricts either target to part of an environment:
#   make secrets-encrypt ENVIRONMENT=dev FILES="smtp.env"
# Encrypting part of a scope is normal -- a dev stack whose Postgres password is
# a container on a laptop but whose SMTP gateway is a real account wants exactly
# one of its files in git. Whatever is not listed stays generated by gen-env.
secrets-encrypt:
	FILES="$(FILES)" scripts/secrets.sh encrypt "$(SECRETS_ENV)"

# FORCE=1 allows overwriting existing plaintext -- needed when gen-env has
# already materialized the file this decrypt is meant to replace.
secrets-decrypt:
	FILES="$(FILES)" FORCE="$(FORCE)" scripts/secrets.sh decrypt "$(SECRETS_ENV)"

secrets-check:
	@scripts/secrets.sh check

secrets-add-recipient:
	@test -n "$(NAME)" && test -n "$(KEY)" || { echo "usage: make secrets-add-recipient NAME=<them> KEY=age1..." >&2; exit 1; }
	scripts/secrets.sh add-recipient "$(NAME)" "$(KEY)"

secrets-remove-recipient:
	@test -n "$(NAME)" || { echo "usage: make secrets-remove-recipient NAME=<them>" >&2; exit 1; }
	scripts/secrets.sh remove-recipient "$(NAME)"


# Runtime

# Full stack in Docker. Production does not run from here: it is
# deploy/docker-compose.prod.yml on the host (see deploy/README.md). --build
# rebuilds the web image, which is how page edits reach it.
# Env files must exist: `make gen-env GEN_ENVS="$(ENVIRONMENT)" APP=...`.
up:
	$(COMPOSE_WITH_PORTS) --profile app up -d --build

down: stop

down-v:
	$(COMPOSE_WITH_PORTS) --profile app down -v

restart:
	$(MAKE) down up

restart-v:
	$(MAKE) down-v up

run:
	$(COMPOSE_WITH_PORTS) up -d

stop:
	$(COMPOSE_WITH_PORTS) --profile app down

logs:
	$(COMPOSE_WITH_PORTS) logs -f

ps:
	$(COMPOSE_WITH_PORTS) ps

pull:
	$(COMPOSE_WITH_PORTS) pull

# PostgreSQL

psql:
	@set -a; source "$(POSTGRES_ENV)"; set +a; \
	PGPASSWORD="$$APP_PASSWORD" docker exec -it $(PG_CONTAINER) \
		psql -U "$$APP_USER" -d "$$APP_DB"

psql-admin:
	@set -a; source "$(POSTGRES_ENV)"; set +a; \
	PGPASSWORD="$$POSTGRES_PASSWORD" docker exec -it $(PG_CONTAINER) \
		psql -U "$$POSTGRES_USER" -d postgres


pg-dump:
	@set -euo pipefail; \
	set -a; source "$(POSTGRES_ENV)"; set +a; \
	mkdir -p "$(BACKUP_DIR)"; \
	dump_file="$(if $(DUMP_FILE),$(DUMP_FILE),$(BACKUP_DIR)/postgres_$$(date +%Y-%m-%d_%H%M%S).sql)"; \
	echo "Dumping $$APP_DB to $$dump_file"; \
	PGPASSWORD="$$POSTGRES_PASSWORD" docker exec -i $(PG_CONTAINER) \
		pg_dump -U "$$POSTGRES_USER" "$$APP_DB" --no-owner --no-privileges > "$$dump_file"; \
	echo "Done: $$dump_file"

pg-restore:
	@set -euo pipefail; \
	[ -n "$(DUMP_FILE)" ] || { echo "Usage: make pg-restore DUMP_FILE=<path/to/dump.sql>"; exit 1; }; \
	[ -f "$(DUMP_FILE)" ] || { echo "Dump file not found: $(DUMP_FILE)"; exit 1; }; \
	set -a; source "$(POSTGRES_ENV)"; set +a; \
	if [ "$(FORCE)" != "1" ]; then \
		read -r -p "Restore $$APP_DB from $(DUMP_FILE)? This will overwrite DB data [y/N] " confirm; \
		[[ "$$confirm" =~ ^[Yy]$$ ]] || { echo "Cancelled"; exit 0; }; \
	fi; \
	echo "Restoring $$APP_DB from $(DUMP_FILE)"; \
	PGPASSWORD="$$POSTGRES_PASSWORD" docker exec -i $(PG_CONTAINER) \
		psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d postgres \
		-c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$$APP_DB' AND pid <> pg_backend_pid();" \
		-c "DROP DATABASE IF EXISTS \"$$APP_DB\";" \
		-c "CREATE DATABASE \"$$APP_DB\";"; \
	PGPASSWORD="$$POSTGRES_PASSWORD" docker exec -i $(PG_CONTAINER) \
		psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$APP_DB" < "$(DUMP_FILE)"; \
	echo "Restore complete"
