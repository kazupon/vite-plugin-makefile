.PHONY: docker-up docker-down migrate

docker-up:
	docker compose up -d

docker-down:
	docker compose down

migrate: docker-up
	./run_migration.sh
