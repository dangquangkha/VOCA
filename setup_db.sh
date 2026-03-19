#!/bin/bash
set -e

# Ask for sudo password upfront
sudo -v

echo "Installing PostgreSQL..."
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

echo "Starting PostgreSQL Service..."
sudo service postgresql start

echo "Configuring Database User and DB..."
# Create user if not exists (handling "already exists" error gracefully via || true is risky but okay here)
# Using DO block is better for idempotency if version supports, but straightforward create | true is simpler.
sudo -u postgres psql -c "CREATE USER khai WITH PASSWORD 'KHAi2692004';" || echo "User 'khai' may already exist"

sudo -u postgres psql -c "CREATE DATABASE careerpath_db OWNER khai;" || echo "Database 'careerpath_db' may already exist"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE careerpath_db TO khai;"

echo "PostgreSQL setup complete!"
