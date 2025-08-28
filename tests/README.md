# Tests Archive Directory

This directory contains archived files that are no longer used in the current my-credentials-mcp implementation but are preserved for reference.

## Archive Organization

### 📁 `archive/` - Original Test Suite
Contains the complete test suite that was originally created for direct database connections:
- **fixtures/** - Test data fixtures for auth, database, and MCP operations
- **mocks/** - Mock implementations for crypto, database, GitHub, and OAuth
- **unit/** - Unit tests for database security, utils, and MCP tools
- **setup.ts** - Test environment setup configuration

**Note**: These tests are incompatible with the current HTTP API wrapper architecture but preserved for future reference or potential adaptation.

### 📁 `old-configs/` - Outdated Configuration Files
Configuration files that are no longer relevant to the current implementation:
- **wrangler-simple.jsonc** - Configuration for simple math MCP server example
- **vitest.config.js** - Vitest testing framework configuration
- **docker-compose.yml** - Docker PostgreSQL test environment
- **setup-database.sh** - Docker database initialization script
- **claude-desktop-config.example.json** - Example Claude Desktop configuration

### 📁 `old-src/` - Deprecated Source Files
Source code files that have been replaced or are no longer needed:
- **oauth-utils.ts** - OAuth utilities (functionality moved to main implementation)
- **security.ts** - Database security functions (integrated into HTTP API tools)
- **utils.ts** - Database utilities (replaced with HTTP API wrapper)

### 📁 `old-deployment/` - Deprecated Deployment Scripts
Deployment scripts for infrastructure that is no longer used:
- **setup-rds-database.sql** - AWS RDS database setup (switched to EC2 PostgreSQL)
- **configure-postgresql.sh** - PostgreSQL configuration script (outdated)

## Current Architecture vs Archived Files

### Current Implementation (Active)
- **HTTP API Wrapper**: Express.js service for database operations
- **Cloudflare Workers MCP Server**: Main MCP server with GitHub OAuth
- **Environment Variable Auth**: `AUTHORIZED_USER` configuration
- **Nginx Proxy**: Database API accessible via `https://animagent.ai/mcp-api/`

### Archived Implementation (Preserved)
- **Direct Database Connection**: PostgreSQL connections from Cloudflare Workers
- **Hardcoded User Lists**: Static authorization configurations
- **Docker Test Environment**: Local PostgreSQL for testing
- **Complex Test Suite**: Unit tests for direct database operations

## Why Files Were Archived

1. **Architecture Change**: Moved from direct database connections to HTTP API wrapper
2. **Security Enhancement**: Switched from hardcoded users to environment variables
3. **Infrastructure Simplification**: Eliminated AWS RDS in favor of EC2 PostgreSQL
4. **Maintenance Reduction**: Removed unused configuration files and test setups

## Recovery Instructions

If you need to restore any archived files:

1. **Configuration Files**: Copy from `old-configs/` to project root
2. **Source Files**: Copy from `old-src/` to appropriate `src/` subdirectories
3. **Tests**: Copy from `archive/` to project root `tests/` directory
4. **Update Dependencies**: May need to reinstall testing frameworks

## .gitignore Status

This entire `tests/` directory is ignored by git to prevent accidental commits of archived files.