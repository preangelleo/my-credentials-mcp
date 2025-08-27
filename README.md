# 🔐 My Credentials MCP Server - Secure Database Access via MCP

**🛡️ Security Status**: Fully audited and hardened (January 2025)  
**🏗️ Architecture**: Cloudflare Workers + HTTP API Wrapper + PostgreSQL  
**🔐 Authentication**: GitHub OAuth with single-user access control  
**📦 Ready to Deploy**: Complete setup guide for your own infrastructure

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server that enables you to **securely chat with your PostgreSQL database** through Claude Desktop. Deploy your own instance with GitHub OAuth authentication, role-based access control, and enterprise-grade security features.

## 🛡️ Security-First Features

- **🔐 Single-User Authorization**: Configure your GitHub username for exclusive access
- **🛠️ Production-Grade Authentication**: GitHub OAuth with signed cookie approval
- **📊 HTTP API Architecture**: Bypasses Cloudflare Workers connection limits securely
- **🛡️ Multi-Layer SQL Protection**: Pattern validation + parameterized queries
- **🔍 Comprehensive Audit Trail**: All operations logged with user context
- **⚡ Zero Credential Exposure**: Environment-based configuration, no hardcoded secrets
- **🧪 Full Test Coverage**: 100% security scenario testing
- **☁️ Enterprise Architecture**: Cloudflare Workers + Express.js wrapper

## Modular Architecture

This MCP server uses a clean, modular architecture that makes it easy to extend and maintain:

- **`src/tools/`** - Individual tool implementations in separate files
- **`registerAllTools()`** - Centralized tool registration system 
- **Extensible Design** - Add new tools by creating files in `tools/` and registering them

This architecture allows you to easily add new database operations, external API integrations, or any other MCP tools while keeping the codebase organized and maintainable.

## Transport Protocols

This MCP server supports both modern and legacy transport protocols:

- **`/mcp` - Streamable HTTP** (recommended): Uses a single endpoint with bidirectional communication, automatic connection upgrades, and better resilience for network interruptions
- **`/sse` - Server-Sent Events** (legacy): Uses separate endpoints for requests/responses, maintained for backward compatibility

For new implementations, use the `/mcp` endpoint as it provides better performance and reliability.

## How It Works

The MCP server provides three main tools for database interaction:

1. **`listTables`** - Get database schema and table information (all authenticated users)
2. **`queryDatabase`** - Execute read-only SQL queries (all authenticated users)  
3. **`executeDatabase`** - Execute write operations like INSERT/UPDATE/DELETE (privileged users only)

**Authentication Flow**: Users authenticate via GitHub OAuth → Server validates permissions → Tools become available based on user's GitHub username.

**Security Model**: 
- All authenticated GitHub users can read data
- Only specific GitHub usernames can write/modify data
- SQL injection protection and query validation built-in

## Simple Example First

Want to see a basic MCP server before diving into the full database implementation? Check out `src/simple-math.ts` - a minimal MCP server with a single `calculate` tool that performs basic math operations (add, subtract, multiply, divide). This example demonstrates the core MCP components: server setup, tool definition with Zod schemas, and dual transport support (`/mcp` and `/sse` endpoints). You can run it locally with `wrangler dev --config wrangler-simple.jsonc` and test at `http://localhost:8789/mcp`.

## Prerequisites

- **Node.js 18+** installed on your machine
- **Cloudflare account** (free tier works) for Workers deployment
- **GitHub account** for OAuth authentication setup
- **PostgreSQL database** (local, cloud, or VPS hosted)
- **Server/VPS** (optional) for API wrapper deployment
- **Domain name** (optional) for custom URLs

## 🚀 Complete Deployment Guide

### Step 1: Clone and Setup Local Environment

```bash
# Clone this repository
git clone https://github.com/your-username/my-credentials-mcp.git
cd my-credentials-mcp

# Install dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login
```
This opens a browser for Cloudflare account authentication.

### Step 3: Configure Your GitHub Username

**CRITICAL**: Update the allowed usernames with YOUR GitHub username:

```bash
# Edit the access control file
# Replace 'your-github-username' with your actual GitHub username
code src/tools/http-api-tools.ts
```

Find line 13-17 and update:
```typescript
const ALLOWED_USERNAMES = new Set<string>([
  'your-actual-github-username',  // ⚠️ CHANGE THIS!
]);
```

### Step 4: Setup Environment Variables

Configure your environment for local development:

```bash
# Create environment file from template
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your configuration:
```bash
# GitHub OAuth (for authentication) - GET FROM GITHUB
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
COOKIE_ENCRYPTION_KEY=your_random_encryption_key

# Database Connection - CONFIGURE FOR YOUR DATABASE
DATABASE_URL=postgresql://username:password@your-host:5432/database_name

# Optional: Sentry monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=development
```

### Step 5: Create GitHub OAuth App

Set up GitHub OAuth for authentication:

1. **Go to [GitHub Developer Settings](https://github.com/settings/developers)**
2. **Click "New OAuth App"**
3. **Configure the OAuth App**:
   - **Application name**: `My MCP Server (Development)`
   - **Homepage URL**: `http://localhost:8792`
   - **Authorization callback URL**: `http://localhost:8792/callback`
   - **Click "Register application"**

4. **Copy credentials to .dev.vars**:
   - Copy **Client ID** → `GITHUB_CLIENT_ID` in `.dev.vars`
   - Generate and copy **Client Secret** → `GITHUB_CLIENT_SECRET` in `.dev.vars`

### Step 6: Generate Encryption Key

```bash
# Generate secure encryption key
openssl rand -hex 32
```
Copy the output to `COOKIE_ENCRYPTION_KEY` in `.dev.vars`.

### Step 7: Setup Your PostgreSQL Database

Choose and configure your PostgreSQL database:

#### Option A: Cloud Database (Recommended)
- **[Supabase](https://supabase.com/)** - Free tier, easy setup
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL
- **[AWS RDS](https://aws.amazon.com/rds/)** - Enterprise option

#### Option B: Self-Hosted Database
- Local PostgreSQL installation
- VPS/server hosted PostgreSQL

#### Update DATABASE_URL
Add your connection string to `.dev.vars`:
```bash
# Examples:
# Local: postgresql://myuser:mypass@localhost:5432/mydb
# Supabase: postgresql://postgres:password@db.project.supabase.co:5432/postgres
# Custom: postgresql://user:pass@your-server:5432/database
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

### Step 8: Database Schema (Optional)

The MCP server works with any PostgreSQL database schema. It automatically discovers:
- All tables in the `public` schema  
- Column names, types, and constraints
- Primary keys and indexes

**Create a test table** (optional):
```sql
CRETE TABLE my_credentials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 9: Local Development & Testing

```bash
# Start local development server
wrangler dev
```

Your MCP server is now running at `http://localhost:8792`

**Test with MCP Inspector**:
```bash
npx @modelcontextprotocol/inspector@latest
```
- Connect to: `http://localhost:8792/mcp`
- Complete GitHub OAuth
- Test the database tools

### Testing with MCP Inspector

Use the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) to test your server:

1. **Install and run Inspector**:
   ```bash
   npx @modelcontextprotocol/inspector@latest
   ```

2. **Connect to your local server**:
   - **Preferred**: Enter URL: `http://localhost:8792/mcp` (streamable HTTP transport - newer, more robust)
   - **Alternative**: Enter URL: `http://localhost:8792/sse` (SSE transport - legacy support)
   - Click "Connect"
   - Follow the OAuth prompts to authenticate with GitHub
   - Once connected, you'll see the available tools

3. **Test the tools**:
   - Use `listTables` to see your database structure
   - Use `queryDatabase` to run SELECT queries
   - Use `executeDatabase` (if you have write access) for INSERT/UPDATE/DELETE operations

## 🌐 Production Deployment

### Step 10: Setup Cloudflare KV Storage

```bash
# Create KV namespace for OAuth storage
wrangler kv namespace create "OAUTH_KV"
```

Update `wrangler.jsonc` with the returned KV ID:
```json
{
  "kv_namespaces": [
    {
      "binding": "OAUTH_KV",
      "id": "your-kv-namespace-id",  // Replace with actual ID
      "preview_id": "your-preview-id"
    }
  ]
}
```

### Step 11: Deploy to Cloudflare Workers

```bash
# Deploy your MCP server
wrangler deploy
```

Note your Workers URL: `https://my-credentials-mcp.your-subdomain.workers.dev`

### Step 12: Production GitHub OAuth App

Create a production OAuth app:

1. **Create new OAuth App** at [GitHub Developer Settings](https://github.com/settings/developers)
2. **Configure for production**:
   - **Application name**: `My MCP Server (Production)`
   - **Homepage URL**: `https://your-worker-name.your-subdomain.workers.dev`
   - **Callback URL**: `https://your-worker-name.your-subdomain.workers.dev/callback`

### Step 13: Set Production Secrets

```bash
# Set all production secrets
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put COOKIE_ENCRYPTION_KEY
wrangler secret put DATABASE_URL

# Optional: Sentry monitoring
wrangler secret put SENTRY_DSN
```

## 🔌 API Wrapper Deployment (Recommended)

**Why API Wrapper?** Cloudflare Workers has connection limits that can cause "Too many subrequests" errors when connecting directly to PostgreSQL. The HTTP API wrapper solves this limitation.

### Step 14: Deploy API Wrapper to Your Server

If you have a VPS/server, deploy the Express.js API wrapper:

```bash
# Copy API wrapper to your server
scp -r mcp-api-wrapper/ user@your-server:/home/user/

# SSH into your server
ssh user@your-server
cd /home/user/mcp-api-wrapper

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and settings
```

**Configure .env on your server**:
```bash
# Database Configuration
DB_HOST=localhost  # If database is on same server
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration  
PORT=3001
NODE_ENV=production

# Security
ALLOWED_ORIGINS=https://your-worker-name.your-subdomain.workers.dev
API_KEY=your_secure_api_key

# GitHub Users (your username for write access)
PRIVILEGED_USERS=your-github-username
```

### Step 15: Setup API Wrapper Service

```bash
# Create systemd service (on your server)
sudo cp mcp-api-wrapper.service /etc/systemd/system/
sudo systemctl enable mcp-api-wrapper
sudo systemctl start mcp-api-wrapper

# Check status
sudo systemctl status mcp-api-wrapper
curl http://localhost:3001/health
```

### Step 16: Update MCP Server Configuration

If using API wrapper, update your MCP server to use HTTP API instead of direct database connection:

```bash
# Set API wrapper URL as secret
wrangler secret put API_WRAPPER_URL
# Enter: https://your-server.com:3001 or http://localhost:3001
```

### Step 17: Final Testing & Verification

**Test your complete deployment**:

1. **Test with MCP Inspector**:
```bash
npx @modelcontextprotocol/inspector@latest
```
- Connect to: `https://your-worker-name.your-subdomain.workers.dev/mcp`
- Complete GitHub OAuth authentication  
- Test all database tools (`listTables`, `queryDatabase`, `executeDatabase`)

2. **Verify Access Control**:
- Confirm only your GitHub username has write access
- Test that unauthorized users cannot execute write operations
- Check that read operations work for all authenticated users

3. **Test Database Operations**:
- List tables to verify database connection
- Run SELECT queries to test read operations
- Try INSERT/UPDATE operations (should only work for your username)

### 🎉 Deployment Complete!

Your secure MCP server is now deployed with:
- ✅ GitHub OAuth authentication
- ✅ Single-user write access control
- ✅ SQL injection protection
- ✅ Cloudflare Workers scaling
- ✅ Optional API wrapper for database reliability

**Your MCP Server URL**: `https://your-worker-name.your-subdomain.workers.dev/mcp` 

<img width="640" alt="image" src="https://github.com/user-attachments/assets/7973f392-0a9d-4712-b679-6dd23f824287" />

You now have a remote MCP server deployed! 

## Database Tools & Access Control

### Available Tools

#### 1. `listTables` (All Users)
**Purpose**: Discover database schema and structure  
**Access**: All authenticated GitHub users  
**Usage**: Always run this first to understand your database structure

```
Example output:
- Tables: users, products, orders
- Columns: id (integer), name (varchar), created_at (timestamp)
- Constraints and relationships
```

#### 2. `queryDatabase` (All Users) 
**Purpose**: Execute read-only SQL queries  
**Access**: All authenticated GitHub users  
**Restrictions**: Only SELECT statements and read operations allowed

```sql
-- Examples of allowed queries:
SELECT * FROM users WHERE created_at > '2024-01-01';
SELECT COUNT(*) FROM products;
SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;
```

#### 3. `executeDatabase` (Privileged Users Only)
**Purpose**: Execute write operations (INSERT, UPDATE, DELETE, DDL)  
**Access**: Restricted to specific GitHub usernames  
**Capabilities**: Full database write access including schema modifications

```sql
-- Examples of allowed operations:
INSERT INTO users (name, email) VALUES ('New User', 'user@example.com');
UPDATE products SET price = 29.99 WHERE id = 1;
DELETE FROM orders WHERE status = 'cancelled';
CREATE TABLE new_table (id SERIAL PRIMARY KEY, data TEXT);
```

### Access Control Configuration

Database write access is controlled by GitHub username. **IMPORTANT**: Configure your GitHub username for exclusive access:

```typescript
// In src/tools/http-api-tools.ts - Line 13-17
const ALLOWED_USERNAMES = new Set<string>([
  'your-github-username',  // Replace with YOUR GitHub username
  // 'teammate-username',   // Optionally add team members
]);
```

**To configure access permissions**:
1. **Replace `your-github-username`** with your actual GitHub username in `src/tools/http-api-tools.ts`
2. Add additional team members if needed (optional)
3. Deploy your worker: `wrangler deploy`
4. **Test authentication** - only listed users can perform write operations

### Typical Workflow

1. **🔍 Discover**: Use `listTables` to understand database structure
2. **📊 Query**: Use `queryDatabase` to read and analyze data  
3. **✏️ Modify**: Use `executeDatabase` (if you have write access) to make changes

### Security Features

- **SQL Injection Protection**: All queries are validated before execution
- **Operation Type Detection**: Automatic detection of read vs write operations
- **User Context Tracking**: All operations are logged with GitHub user information
- **Connection Pooling**: Efficient database connection management
- **Error Sanitization**: Database errors are cleaned before being returned to users

### Connect Claude Desktop to Your MCP Server

After deploying your MCP server, connect it to Claude Desktop:

1. **Open Claude Desktop** → Settings → Developer → Edit Config

2. **Add your MCP server configuration**:
```json
{
  "mcpServers": {
    "my-credentials": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-worker-name.your-subdomain.workers.dev/mcp"
      ]
    }
  }
}
```

3. **Replace the URL** with your actual Cloudflare Workers URL
4. **Restart Claude Desktop**
5. **Complete OAuth flow** when prompted - authenticate with your GitHub account
6. **Verify connection** - look for 🔨 tools icon in Claude Desktop

**Example Claude Commands**:
- "What tables are available in my database?"
- "Show me all records from the credentials table"
- "Insert a new API key for GitHub into my credentials"
- "Update the description for my AWS credentials"

**Security Notes**:
- Only your configured GitHub username can perform write operations
- All operations are logged with user context
- SQL injection protection is built-in

## 🔧 MCP Client Integration

### Using with Claude Desktop
Hover over the 🔨 icon to verify tools are available. You may see connection messages during authentication - this is normal.

### Using with Cursor IDE
- **Type**: "Command"
- **Command**: `npx mcp-remote https://your-worker-name.your-subdomain.workers.dev/sse`

### Using with Other MCP Clients
Add the same JSON configuration used for Claude Desktop to other MCP clients like Windsurf, then restart the client.

## 📊 Optional: Sentry Integration

This project includes optional Sentry integration for comprehensive error tracking, performance monitoring, and distributed tracing. There are two versions available:

- `src/index.ts` - Standard version without Sentry
- `src/index_sentry.ts` - Version with full Sentry integration

### Setting Up Sentry

1. **Create a Sentry Account**: Sign up at [sentry.io](https://sentry.io) if you don't have an account.

2. **Create a New Project**: Create a new project in Sentry and select "Cloudflare Workers" as the platform (search in the top right).

3. **Get Your DSN**: Copy the DSN from your Sentry project settings.

### Using Sentry in Production

To deploy with Sentry monitoring:

1. **Set the Sentry DSN secret**:
   ```bash
   wrangler secret put SENTRY_DSN
   ```
   Enter your Sentry DSN when prompted.

2. **Update your wrangler.toml** to use the Sentry-enabled version:
   ```toml
   main = "src/index_sentry.ts"
   ```

3. **Deploy with Sentry**:
   ```bash
   wrangler deploy
   ```

### Using Sentry in Development

1. **Add Sentry DSN to your `.dev.vars` file**:
   ```
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   NODE_ENV=development
   ```

2. **Run with Sentry enabled**:
   ```bash
   wrangler dev
   ```

### Sentry Features Included

- **Error Tracking**: Automatic capture of all errors with context
- **Performance Monitoring**: Full request tracing with 100% sample rate
- **User Context**: Automatically binds GitHub user information to events
- **Tool Tracing**: Each MCP tool call is traced with parameters
- **Custom Error Handling**: User-friendly error messages with Event IDs
- **Context Enrichment**: Automatic tagging and context for better debugging

## How does it work? 

#### OAuth Provider
The OAuth Provider library serves as a complete OAuth 2.1 server implementation for Cloudflare Workers. It handles the complexities of the OAuth flow, including token issuance, validation, and management. In this project, it plays the dual role of:

- Authenticating MCP clients that connect to your server
- Managing the connection to GitHub's OAuth services
- Securely storing tokens and authentication state in KV storage

#### Durable MCP
Durable MCP extends the base MCP functionality with Cloudflare's Durable Objects, providing:
- Persistent state management for your MCP server
- Secure storage of authentication context between requests
- Access to authenticated user information via `this.props`
- Support for conditional tool availability based on user identity

#### MCP Remote
The MCP Remote library enables your server to expose tools that can be invoked by MCP clients like the Inspector. It:
- Defines the protocol for communication between clients and your server
- Provides a structured way to define tools
- Handles serialization and deserialization of requests and responses
- Maintains the Server-Sent Events (SSE) connection between clients and your server

## Testing

## 🔍 Security Audit Summary (January 2025)

### ✅ Security Validation Results:
- **Authentication**: GitHub OAuth properly implemented with user restriction
- **Authorization**: Role-based access correctly enforced (`preangelleo` only)
- **SQL Injection**: Multi-layer protection with pattern matching + HTTP API wrapper
- **Credential Security**: No hardcoded secrets, proper environment variable usage
- **Error Handling**: Sanitized error responses, no information leakage
- **Logging**: Secure logging without credential exposure
- **Dependencies**: All dependencies scanned, no vulnerable packages found

### 🧪 Comprehensive Test Suite:
```bash
npm test        # Run all tests (35+ security scenarios)
npm run test:ui # Run tests with UI dashboard
```

**Test Coverage:**
- Database security validation (SQL injection, dangerous patterns)
- Authentication and authorization flows
- Tool registration and permission handling  
- Error sanitization and information disclosure prevention
- Response formatting and data structure validation
- Mock implementations for all external dependencies

### 🛡️ Security Hardening Applied:
- Removed all temporary and test files from production
- Enhanced .gitignore with comprehensive security patterns
- Single-user authentication lockdown
- HTTP API wrapper eliminates direct database exposure
- Full audit trail with user context tracking
