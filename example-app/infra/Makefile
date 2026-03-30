.PHONY: db-up db-down db-seed db-reset mock-server

# Start the database (simulated with a file-based lock)
db-up:
	@echo "==> Starting database..."
	@mkdir -p .tmp
	@echo "$$(date)" > .tmp/db.lock
	@echo "  Database started (pid file: .tmp/db.lock)"

# Stop the database
db-down:
	@echo "==> Stopping database..."
	@rm -f .tmp/db.lock
	@echo "  Database stopped."

# Seed the database with sample data
db-seed: db-up
	@echo "==> Seeding database..."
	@mkdir -p .tmp
	@echo '{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}],"posts":[{"id":1,"title":"Hello World","authorId":1}]}' > .tmp/db-seed.json
	@echo "  Seed data written to .tmp/db-seed.json"

# Reset the database: stop, clean, restart and re-seed
db-reset: db-down
	@echo "==> Resetting database..."
	@rm -rf .tmp
	@$(MAKE) db-seed
	@echo "  Database reset complete."

# Start a mock API server (simulated)
mock-server: db-up
	@echo "==> Starting mock API server on http://localhost:3001..."
	@mkdir -p .tmp
	@echo '{"status":"running","port":3001,"started":"'"$$(date)"'"}' > .tmp/mock-server.json
	@echo "  Mock server config written to .tmp/mock-server.json"
