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

async function callHttpApi(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<ApiResponse> {
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
		"Get a list of all tables in the database along with their column information. Use this first to understand the database structure before querying.",
		ListTablesSchema,
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
							text: `**MCP Server Status**\n\n✅ **Authentication**: GitHub OAuth working\n✅ **HTTP API**: Connected to animagent.ai:3001\n✅ **Database**: PostgreSQL via HTTP API wrapper\n✅ **Connection**: Using HTTP API (resolves Cloudflare Workers limitations)\n\n**Table Schema:**\n\`\`\`json\n${JSON.stringify(tableInfo, null, 2)}\n\`\`\`\n\n**Tables found:** ${tableInfo.length}\n**API Response time:** ${result.duration || 'N/A'}\n**Retrieved at:** ${result.timestamp}`
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
		"Execute a read-only SQL query against the PostgreSQL database via HTTP API. This tool only allows SELECT statements and other read operations. All authenticated users can use this tool.",
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
			"Execute any SQL statement against the PostgreSQL database via HTTP API, including INSERT, UPDATE, DELETE, and DDL operations. This tool is restricted to specific GitHub users and can perform write transactions. **USE WITH CAUTION** - this can modify or delete data.",
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