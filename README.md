# 🔐 My Credentials MCP Server

**Secure PostgreSQL Database Access & Credential Generation for Claude Desktop**

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server that provides secure database operations and credential generation tools through Claude Desktop. This server enables you to interact with your PostgreSQL database and generate various types of credentials using natural language.

![GitHub](https://img.shields.io/github/license/preangelleo/my-credentials-mcp)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D12-blue)

## ✨ Features

### 🗄️ Database Operations
- **Query Database**: Execute read-only SQL queries via natural language
- **Database Management**: Insert, update, delete operations (with role-based permissions)
- **Schema Discovery**: Automatically discover tables, columns, and relationships
- **Product Feedback System**: Built-in suggestion and bug reporting system

### 🔐 Credential Generation (14 Tools)
- **Unique Identifiers**: UUID4, ULID, Nano ID generation
- **Passwords**: Secure passwords with customizable complexity rules
- **API Keys**: Various formats (hex, base64, base64url)
- **Tokens**: Bearer tokens, JWT secrets, session tokens, CSRF tokens
- **Cryptographic Elements**: Salts, IVs, HMAC keys, encryption keys
- **Service-Specific**: AWS credentials, GitHub tokens, database passwords
- **Batch Operations**: Generate multiple credentials in one operation

### 🛡️ Security Features
- **GitHub OAuth Authentication**: Single-user access control
- **SQL Injection Protection**: Multi-layer validation and sanitization
- **Role-Based Permissions**: Separate read/write access levels
- **HTTP API Wrapper**: Bypasses Cloudflare Workers limitations
- **Audit Logging**: All operations tracked with user context

## 🏗️ Architecture

This MCP server uses a hybrid architecture optimized for production deployment:

```
Claude Desktop → MCP Server (Cloudflare Workers) → HTTP API Wrapper → PostgreSQL
```

- **MCP Server**: Deployed on Cloudflare Workers for global availability
- **HTTP API Wrapper**: Express.js server bypassing connection limitations
- **Database**: PostgreSQL with connection pooling and security validation

## 📋 Database Tables

### Core Tables
- `local_credentials` - Secure credential storage and management
- `complaints` - Anonymous feedback system for AI agents
- `product_improvement_suggestions` - User feedback and enhancement requests

## 🚀 Quick Start for Developers

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Cloudflare account (free tier works)
- GitHub account for OAuth

### 1. Clone Repository
```bash
git clone https://github.com/preangelleo/my-credentials-mcp.git
cd my-credentials-mcp
npm install
```

### 2. Database Setup
Set up your PostgreSQL database and note the connection details:
```bash
# Example connection string format:
postgresql://username:password@hostname:5432/database_name
```

### 3. Configure Environment Variables
Create `.dev.vars` file:
```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
COOKIE_ENCRYPTION_KEY=your_random_32_byte_key

# Database Configuration  
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 4. Setup GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App:
   - **Homepage URL**: `http://localhost:8792` (development)
   - **Callback URL**: `http://localhost:8792/callback`
3. Copy Client ID and Secret to `.dev.vars`

### 5. Configure User Access
Edit `src/tools/http-api-tools.ts` line 11:
```typescript
const ALLOWED_USERNAMES = new Set<string>([
  'your-github-username'  // Replace with your GitHub username
]);
```

### 6. Deploy HTTP API Wrapper (Recommended)
The HTTP API wrapper provides better reliability for database connections:

```bash
# Setup API wrapper on your server
cd mcp-api-wrapper
cp .env.example .env
# Configure .env with your database credentials
npm install
node server.js
```

### 7. Deploy to Cloudflare Workers
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace for OAuth
wrangler kv namespace create "OAUTH_KV"
# Update wrangler.jsonc with returned namespace ID

# Set production secrets
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put COOKIE_ENCRYPTION_KEY
wrangler secret put DATABASE_URL

# Deploy
wrangler deploy
```

### 8. Connect to Claude Desktop
Add to your Claude Desktop configuration:
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

## 🛠️ Available MCP Tools

### Database Tools
- `listTables` - Discover database schema and structure
- `queryDatabase` - Execute read-only SQL queries
- `executeDatabase` - Execute write operations (privileged users only)

### Product Feedback Tools  
- `submitProductSuggestion` - Submit improvement suggestions or bug reports
- `getProductSuggestions` - Browse and search feedback with filters
- `updateSuggestionStatus` - Update suggestion status (developers only)

### Credential Generation Tools
- `generateUuid` - UUID4 and ULID generation
- `generatePassword` - Secure passwords with complexity rules
- `generateApiKey` - API keys in various formats
- `generateToken` - Bearer, JWT, session, CSRF tokens
- `generateCrypto` - Cryptographic elements (salts, keys, IVs)
- `generateServiceCredential` - Service-specific credentials
- `generateBatch` - Multiple credentials in one operation
- [7 more generation tools...]

## 💡 Usage Examples

### Database Queries
```
"What tables are in my database?"
"Show me all credentials created this week"
"Insert a new API key for the GitHub service"
```

### Credential Generation
```
"Generate a secure password for production use"
"Create an API key for my web service" 
"Generate AWS credentials for deployment"
```

### Product Feedback
```
"Submit a bug report about the query timeout issue"
"Check the status of my feature requests"
"Browse suggestions for database improvements"
```

## 🔒 Security Considerations

- **Single User Access**: Configure your GitHub username for exclusive access
- **Environment Variables**: Never hardcode credentials in your code
- **SQL Validation**: Built-in protection against SQL injection
- **HTTPS Only**: All communication encrypted in transit
- **Audit Trail**: Complete logging of all operations

## 📚 Development

### File Structure
```
src/
├── auth/           # GitHub OAuth handling
├── database/       # Database connection and security
├── tools/          # MCP tool implementations
│   ├── database-tools.ts
│   ├── credential-generation-tools.ts
│   ├── http-api-tools.ts
│   └── register-tools.ts
└── types.ts        # TypeScript definitions

mcp-api-wrapper/    # HTTP API wrapper for database access
```

### Testing
```bash
# Run development server
wrangler dev

# Test with MCP Inspector
npx @modelcontextprotocol/inspector@latest
# Connect to: http://localhost:8792/mcp
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🔗 Links

- **GitHub Repository**: https://github.com/preangelleo/my-credentials-mcp
- **Model Context Protocol**: https://modelcontextprotocol.io/introduction
- **Cloudflare Workers**: https://workers.cloudflare.com/
- **Claude Desktop**: https://claude.ai/download

## ⚠️ Important Notes

- This server is designed for single-user access with your GitHub account
- Always use environment variables for sensitive configuration
- Test thoroughly in development before deploying to production
- Regular security audits recommended for production deployments

---

Built with ❤️ for the Claude Desktop community