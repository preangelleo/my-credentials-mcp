# MCP API Wrapper

Express.js HTTP API wrapper for MCP server database operations. This solves the Cloudflare Workers "Too many subrequests" limitation when connecting directly to PostgreSQL.

## Architecture

```
Claude Desktop → MCP Server (Cloudflare) → HTTP API (EC2) → PostgreSQL (EC2)
```

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start server:**
```bash
npm start          # Production
npm run dev        # Development with auto-reload
```

4. **Test API:**
```bash
npm test          # Run API tests
```

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "database": "connected",
  "service": "mcp-api-wrapper"
}
```

### GET /api/tables
List all database tables with schema information.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "local_credentials",
      "schema": "public",
      "columns": [
        {"name": "id", "type": "integer", "nullable": false, "default": "nextval(...)"},
        {"name": "name", "type": "varchar", "nullable": false, "default": null}
      ]
    }
  ],
  "count": 1
}
```

### POST /api/query
Execute read-only SQL queries.

**Request:**
```json
{
  "sql": "SELECT * FROM local_credentials LIMIT 10;",
  "username": "github_username"
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "rowCount": 10,
  "duration": "45ms",
  "executedBy": "github_username"
}
```

### POST /api/execute
Execute any SQL statement (privileged users only).

**Request:**
```json
{
  "sql": "INSERT INTO local_credentials (name, value) VALUES ($1, $2);",
  "username": "preangelleo"
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "rowCount": 1,
  "operation": "write",
  "duration": "23ms",
  "executedBy": "preangelleo"
}
```

## Security Features

1. **SQL Injection Protection**: Pattern-based validation blocks dangerous SQL
2. **Role-Based Access Control**: Only privileged users can execute write operations
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **CORS Configuration**: Restricts access to specified origins
5. **Input Validation**: All SQL queries are validated before execution

## Privileged Users

Users with write access (defined in `.env`):
- `preangelleo`
- `coleam00`

## Database Configuration

**EC2 PostgreSQL:**
- Host: animagent.ai
- Port: 5432
- Database: local_credentials_db
- User: mcp_user
- Table: local_credentials

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## Deployment

1. **Copy files to EC2 server:**
```bash
scp -i "animagent.pem" -r . ubuntu@animagent.ai:/home/ubuntu/mcp-api-wrapper/
```

2. **Install Node.js and dependencies on server:**
```bash
ssh -i "animagent.pem" ubuntu@animagent.ai
cd /home/ubuntu/mcp-api-wrapper
npm install
```

3. **Configure systemd service:**
```bash
sudo cp mcp-api-wrapper.service /etc/systemd/system/
sudo systemctl enable mcp-api-wrapper
sudo systemctl start mcp-api-wrapper
```

4. **Check status:**
```bash
sudo systemctl status mcp-api-wrapper
curl http://localhost:3001/health
```

## Integration with MCP Server

The MCP server tools will call these HTTP endpoints instead of connecting directly to PostgreSQL:

```typescript
// Instead of: await db.query(sql)
// Use: await fetch('http://localhost:3001/api/query', { ... })
```

## Monitoring

- Logs: `journalctl -u mcp-api-wrapper -f`
- Health: `curl http://localhost:3001/health`
- Process: `pm2 status mcp-api-wrapper` (if using PM2)