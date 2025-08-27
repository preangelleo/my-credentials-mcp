# Project Structure - Production Ready MCP Server

## 📁 Directory Layout

```
my-credentials-mcp/                    # Main project directory (production)
├── 📂 src/                              # TypeScript source code
│   ├── 🔧 index.ts                     # Main MCP server (HTTP API)
│   ├── 🎯 index_sentry.ts             # Sentry-enabled MCP server
│   ├── 🧮 simple-math.ts              # Basic MCP example (no auth)
│   ├── 🔐 auth/                       # Authentication modules
│   │   └── github-handler.ts          # GitHub OAuth flow
│   ├── 🗄️ database/                   # Database connection modules
│   │   ├── connection.ts              # PostgreSQL connection (legacy)
│   │   ├── security.ts                # SQL injection protection
│   │   └── utils.ts                   # Database utilities (legacy)
│   ├── 🛠️ tools/                      # MCP tools implementation
│   │   ├── database-tools.ts          # Direct DB tools (legacy)
│   │   ├── http-api-tools.ts          # HTTP API tools (ACTIVE)
│   │   └── register-tools.ts          # Tool registration system
│   ├── 🔗 types.ts                    # TypeScript type definitions
│   ├── ⚙️ utils.ts                    # OAuth helper functions
│   └── 🍪 workers-oauth-utils.ts      # Cookie-based approval system
├── 📂 mcp-api-wrapper/                # HTTP API Wrapper (Express.js)
│   ├── 🚀 server.js                   # Main API server
│   ├── 🧪 test-api.js                 # API testing script
│   ├── ⚙️ .env                        # Environment configuration
│   ├── 📋 .env.example                # Environment template
│   ├── 🔧 mcp-api-wrapper.service     # Systemd service file
│   ├── 📄 package.json                # Node.js dependencies
│   └── 📖 README.md                   # API wrapper documentation
├── 📂 deployment/                     # Deployment scripts and configs
│   ├── 🐧 configure-postgresql.sh     # PostgreSQL setup script
│   ├── 🌐 setup-nginx-postgresql.sh   # Nginx proxy setup
│   ├── 🔧 fix-nginx-postgresql.sh     # Nginx troubleshooting
│   ├── 📊 setup-rds-database.sql      # AWS RDS setup SQL
│   ├── ⚙️ nginx-postgresql.conf       # Nginx configuration
│   └── 🔧 mcp-api-wrapper-fixed.service # Fixed systemd service
├── 📂 PRPs/                           # Product Requirement Prompts
│   ├── 📖 README.md                   # PRP documentation
│   └── templates/prp_base.md          # PRP template
├── 📂 tests/                          # Unit and integration tests
├── ⚙️ claude_desktop_config_animagent.json # Claude Desktop config
├── 🔧 wrangler.jsonc                  # Main Cloudflare Workers config
├── 🧮 wrangler-simple.jsonc           # Simple example config
├── 📄 package.json                    # Project dependencies
├── 🎯 tsconfig.json                   # TypeScript configuration
├── 🏗️ worker-configuration.d.ts       # Generated Cloudflare types
├── 📚 CLAUDE.md                       # Implementation guide
├── 📖 README.md                       # Project overview
└── 📋 PROJECT_STRUCTURE.md            # This file
```

## 🎯 Production Architecture

### **Active Components:**

1. **🚀 MCP Server (Cloudflare Workers)**
   - URL: `https://animagent-mcp-server.preangelleo.workers.dev`
   - Main file: `src/index.ts` (uses HTTP API tools)
   - Authentication: GitHub OAuth with signed cookies
   - Version: 1.1.0 (HTTP API Integration)

2. **🌐 HTTP API Wrapper (animagent.ai:3001)**
   - Service: `mcp-api-wrapper.service` (systemd)
   - Main file: `mcp-api-wrapper/server.js`
   - Proxy: `https://animagent.ai/mcp-api/`
   - Database: Direct connection to PostgreSQL

3. **🗄️ PostgreSQL Database (animagent.ai:5432)**
   - Database: `my-credentials_db`
   - User: `mcp_user` / `[password configured in .env]`
   - Table: `my-credentials`

### **Legacy Components (Not Active):**

- `src/tools/database-tools.ts` - Direct database tools (replaced by HTTP API)
- `src/database/` - Direct database connections (replaced by HTTP API)
- AWS RDS instance - Created but not used in production

## 🔄 Data Flow

```
Claude Desktop 
    ↓ (MCP Protocol)
Cloudflare Workers MCP Server 
    ↓ (HTTPS API calls)
Express.js HTTP API Wrapper 
    ↓ (PostgreSQL connection)
PostgreSQL Database
```

## 📋 Key Files for Development

### **Primary Development Files:**
- `src/tools/http-api-tools.ts` - **MAIN MCP TOOLS** (HTTP API integration)
- `mcp-api-wrapper/server.js` - **HTTP API SERVER** (Express.js)
- `src/index.ts` - **MCP SERVER ENTRY POINT**

### **Configuration Files:**
- `wrangler.jsonc` - Cloudflare Workers configuration
- `mcp-api-wrapper/.env` - API wrapper environment variables
- `claude_desktop_config_animagent.json` - Claude Desktop integration

### **Deployment Files:**
- `deployment/` - All deployment scripts and configurations
- `mcp-api-wrapper/mcp-api-wrapper.service` - Systemd service configuration

## 🚀 Getting Started

1. **Local Development:**
   ```bash
   npm install
   wrangler dev  # Start MCP server
   ```

2. **Deploy to Production:**
   ```bash
   wrangler deploy  # Deploy MCP server
   # API wrapper is already running on animagent.ai
   ```

3. **Test Integration:**
   ```bash
   cd mcp-api-wrapper && node test-api.js
   ```

## 📚 Documentation

- `CLAUDE.md` - Complete implementation guide
- `README.md` - Project overview and usage
- `mcp-api-wrapper/README.md` - HTTP API documentation
- `PRPs/README.md` - Product requirements