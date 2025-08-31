import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { 
	Props, 
	ListTablesSchema, 
	QueryDatabaseSchema, 
	ExecuteDatabaseSchema,
	createErrorResponse,
	createSuccessResponse
} from "../types";

const ALLOWED_USERNAMES = new Set<string>([
	'preangelleo'   // Only authorized user - project owner
]);

// HTTP API base URL - HTTPS through Nginx proxy
const API_BASE_URL = 'https://animagent.ai/mcp-api';

interface ApiResponse {
	success: boolean;
	data?: any;
	error?: string;
	timestamp?: string;
	rowCount?: number;
	duration?: string;
	executedBy?: string;
	operation?: string;
}

export async function callHttpApi(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<ApiResponse> {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method,
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'MCP-Server/1.0'
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`HTTP API call failed (${method} ${endpoint}):`, error);
		return {
			success: false,
			error: `API call failed: ${error instanceof Error ? error.message : String(error)}`,
			timestamp: new Date().toISOString()
		};
	}
}

export function registerHttpApiTools(server: McpServer, env: Env, props: Props) {
	// Tool 1: List Tables - Available to all authenticated users
	server.tool(
		"listTables",
		`🗄️ DATABASE SCHEMA DISCOVERY
		
Get complete database structure with table names, columns, and types. CRITICAL: Always call this first before any database operations!

📊 MAIN TABLES:
• local_credentials (id, name, value, description, notes, created_at, updated_at) - 50+ stored credentials
• complaints (id, complaint_text, language, signature, created_at, model_name) - AI feedback system  
• product_improvement_suggestions (id, product_name, title, brief, detailed_suggestion, status, priority, suggester_signature, developer_notes, created_at, updated_at) - Feature requests & bug reports

⚠️ IMPORTANT TABLE NAMES:
- Use 'local_credentials' NOT 'credentials' 
- Use exact column names from schema
- All timestamps are PostgreSQL format

💡 USAGE: Call this tool first, then use queryDatabase with exact table/column names from the response.

📚 Documentation: https://github.com/preangelleo/my-credentials-mcp`,
		{},
		async () => {
			try {
				const result = await callHttpApi('/api/tables');
				
				if (!result.success) {
					return createErrorResponse(`Failed to retrieve tables: ${result.error}`);
				}

				const tableInfo = result.data || [];
				return {
					content: [
						{
							type: "text",
							text: `**MCP Server Status**\n\n✅ **Authentication**: GitHub OAuth working\n✅ **HTTP API**: Connected to ${API_BASE_URL}\n✅ **Database**: PostgreSQL via HTTP API wrapper\n✅ **Connection**: Using HTTP API (resolves Cloudflare Workers limitations)\n\n🔑 **MAIN TABLE**: \`local_credentials\` - Use this for credentials queries (NOT just 'credentials')\n\n**Table Schema:**\n\`\`\`json\n${JSON.stringify(tableInfo, null, 2)}\n\`\`\`\n\n**Tables found:** ${tableInfo.length}\n**API Response time:** ${result.duration || 'N/A'}\n**Retrieved at:** ${result.timestamp}`
						}
					]
				};
			} catch (error) {
				console.error('listTables error:', error);
				return createErrorResponse(
					`Error retrieving database schema: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}
	);

	// Tool 2: Query Database - Available to all authenticated users (read-only)
	server.tool(
		"queryDatabase",
		`📊 READ-ONLY DATABASE QUERIES
		
Execute SELECT queries against PostgreSQL database. Safe for all authenticated users - cannot modify data.

🔍 QUERY EXAMPLES:
• SELECT * FROM local_credentials WHERE name ILIKE '%github%' 
• SELECT COUNT(*) FROM complaints WHERE created_at > '2025-08-01'
• SELECT product_name, status, priority FROM product_improvement_suggestions ORDER BY created_at DESC LIMIT 10
• SELECT name, description FROM local_credentials WHERE description IS NOT NULL

📋 TABLE REFERENCE:
• local_credentials: name, value, description, notes, created_at, updated_at
• complaints: complaint_text, language, signature, model_name, created_at  
• product_improvement_suggestions: product_name, title, brief, status, priority, developer_notes

⚠️ RESTRICTIONS:
- Only SELECT, WITH, and read-only operations allowed
- No INSERT, UPDATE, DELETE, or DDL operations
- Use exact table names from listTables response
- PostgreSQL syntax required (ILIKE for case-insensitive search)

🎯 TIP: Call listTables first to get exact schema, then craft your SELECT queries.

📚 Documentation: https://github.com/preangelleo/my-credentials-mcp`,
		QueryDatabaseSchema,
		async ({ sql }) => {
			try {
				const result = await callHttpApi('/api/query', 'POST', {
					sql,
					username: props.login
				});

				if (!result.success) {
					return createErrorResponse(`Query failed: ${result.error}`);
				}

				return {
					content: [
						{
							type: "text",
							text: `**Query Results**\n\`\`\`sql\n${sql}\n\`\`\`\n\n**Results:**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n\n**Rows returned:** ${result.rowCount || 0}\n**Execution time:** ${result.duration}\n**Executed by:** ${result.executedBy}\n**Timestamp:** ${result.timestamp}`
						}
					]
				};
			} catch (error) {
				console.error('queryDatabase error:', error);
				return createErrorResponse(`Database query error: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	);

	// Tool 3: Execute Database - Only available to privileged users (write operations)
	if (ALLOWED_USERNAMES.has(props.login)) {
		server.tool(
			"executeDatabase",
			`⚠️ PRIVILEGED DATABASE OPERATIONS (WRITE ACCESS)
			
Execute ANY SQL operation including INSERT, UPDATE, DELETE, DDL. **RESTRICTED to authorized GitHub users only.**

🔥 WRITE EXAMPLES:
• INSERT INTO local_credentials (name, value, description) VALUES ('api_key_name', 'secret_value', 'My API key')
• UPDATE product_improvement_suggestions SET status = 'completed', developer_notes = 'Fixed in v1.2' WHERE id = 5
• DELETE FROM complaints WHERE created_at < '2025-01-01'
• ALTER TABLE local_credentials ADD COLUMN category TEXT DEFAULT 'general'

📊 FULL TABLE SCHEMAS:
• local_credentials (id SERIAL PRIMARY KEY, name VARCHAR UNIQUE NOT NULL, value TEXT NOT NULL, description TEXT, notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())
• complaints (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), complaint_text TEXT NOT NULL, language VARCHAR NOT NULL, signature VARCHAR NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), model_name VARCHAR)
• product_improvement_suggestions (id SERIAL PRIMARY KEY, product_name TEXT NOT NULL, title TEXT NOT NULL, brief TEXT, detailed_suggestion TEXT, status TEXT DEFAULT 'submitted', priority TEXT DEFAULT 'medium', suggester_signature TEXT, developer_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())

⚠️ CRITICAL WARNINGS:
- **CAN PERMANENTLY DELETE/MODIFY DATA**
- Only available to user: preangelleo
- All operations are logged with username
- Use transactions for complex operations
- Test queries with queryDatabase first when possible

🎯 BEST PRACTICES:
1. Always use WHERE clauses in UPDATE/DELETE
2. Use RETURNING * to see affected rows
3. Backup important data before major changes
4. Test with SELECT before running modification queries

📚 Documentation: https://github.com/preangelleo/my-credentials-mcp`,
			ExecuteDatabaseSchema,
			async ({ sql }) => {
				try {
					const result = await callHttpApi('/api/execute', 'POST', {
						sql,
						username: props.login
					});

					if (!result.success) {
						return createErrorResponse(`Execute failed: ${result.error}`);
					}

					const operationType = result.operation === 'write' ? 'Write Operation' : 'Read Operation';
					const operationIcon = result.operation === 'write' ? '⚠️ Database was modified' : `**Rows returned:** ${result.rowCount || 0}`;

					return {
						content: [
							{
								type: "text",
								text: `**${operationType} Executed Successfully**\n\`\`\`sql\n${sql}\n\`\`\`\n\n**Results:**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n\n${operationIcon}\n**Execution time:** ${result.duration}\n**Executed by:** ${result.executedBy} (${props.name})\n**Operation:** ${result.operation}\n**Timestamp:** ${result.timestamp}`
							}
						]
					};
				} catch (error) {
					console.error('executeDatabase error:', error);
					return createErrorResponse(`Database execution error: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		);
	}

	console.log(`HTTP API tools registered for user: ${props.login} (${props.name})`);
	console.log(`Write access: ${ALLOWED_USERNAMES.has(props.login) ? 'Yes' : 'No'}`);
	console.log(`API endpoint: ${API_BASE_URL}`);
}