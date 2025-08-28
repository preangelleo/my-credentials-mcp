#!/bin/bash

# PostgreSQL Configuration Script for External Access
# Continues from where the previous installation left off

set -e  # Exit on any error

echo "=== PostgreSQL Configuration for External Access ==="

# Use the correct configuration directory
PG_CONFIG_DIR="/etc/postgresql/16/main"

echo "Configuration directory: $PG_CONFIG_DIR"

# Backup original configuration files if not already done
if [ ! -f "$PG_CONFIG_DIR/postgresql.conf.backup" ]; then
    echo "Backing up original configuration files..."
    sudo cp "$PG_CONFIG_DIR/postgresql.conf" "$PG_CONFIG_DIR/postgresql.conf.backup"
    sudo cp "$PG_CONFIG_DIR/pg_hba.conf" "$PG_CONFIG_DIR/pg_hba.conf.backup"
fi

# Configure postgresql.conf for external connections
echo "Updating postgresql.conf..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONFIG_DIR/postgresql.conf"
sudo sed -i "s/#port = 5432/port = 5432/" "$PG_CONFIG_DIR/postgresql.conf"

# Verify changes
echo "Verifying postgresql.conf changes..."
grep "listen_addresses" "$PG_CONFIG_DIR/postgresql.conf"
grep "port = 5432" "$PG_CONFIG_DIR/postgresql.conf"

# Configure pg_hba.conf for authentication
echo "Updating pg_hba.conf..."
# Check if the entry already exists
if ! grep -q "host.*local_credentials_db.*mcp_user.*0.0.0.0/0.*md5" "$PG_CONFIG_DIR/pg_hba.conf"; then
    echo "host    local_credentials_db    mcp_user    0.0.0.0/0    md5" | sudo tee -a "$PG_CONFIG_DIR/pg_hba.conf"
    echo "Added external access entry to pg_hba.conf"
else
    echo "External access entry already exists in pg_hba.conf"
fi

# Show the relevant lines from pg_hba.conf
echo "Relevant pg_hba.conf entries:"
tail -5 "$PG_CONFIG_DIR/pg_hba.conf"

# Restart PostgreSQL to apply changes
echo "Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Wait a moment for PostgreSQL to restart
sleep 3

# Check PostgreSQL status
echo "PostgreSQL status:"
sudo systemctl status postgresql --no-pager -l

# Test database connection locally
echo "Testing local database connection..."
sudo -u postgres psql -d local_credentials_db -c "SELECT 'Local database connection successful!' AS status;"

# Test table access
echo "Testing table access..."
sudo -u postgres psql -d local_credentials_db -c "SELECT COUNT(*) as row_count FROM local_credentials;"

# Show listening ports
echo "PostgreSQL listening ports:"
sudo netstat -tlnp | grep 5432 || echo "No PostgreSQL ports found (netstat might not be available)"
sudo ss -tlnp | grep 5432 || echo "Using fallback port check..."

echo ""
echo "=== Database Connection Information ==="
echo "Database: local_credentials_db"
echo "Username: mcp_user"
echo "Password: [SECURE_PASSWORD_CONFIGURED]"
echo "Host: animagent.ai (external) or localhost (local)"
echo "Port: 5432"
echo "Connection URL: postgresql://mcp_user:[SECURE_PASSWORD_ENCODED]@animagent.ai:5432/local_credentials_db"
echo ""
echo "=== Configuration Complete ==="
echo "PostgreSQL has been configured for external access on port 5432."
echo "The local_credentials table is ready for use."