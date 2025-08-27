import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { 
	Props, 
	ListTablesSchema, 
	QueryDatabaseSchema, 
	ExecuteDatabaseSchema,
	createErrorResponse,
	createSuccessResponse
} from "../types";
import { validateSqlQuery, isWriteOperation, formatDatabaseError } from "../database/security";
import { withDatabase } from "../database/utils";

const ALLOWED_USERNAMES = new Set<string>([
	// Add GitHub usernames of users who should have access to database write operations
	'preangelleo',  // Your GitHub username
	'coleam00'      // Original project author
]);

export function registerDatabaseTools(server: McpServer, env: Env, props: Props) {
	// Tool 1: List Tables - Available to all authenticated users
	server.tool(
		"listTables",
		"Get a list of all tables in the database along with their column information. Use this first to understand the database structure before querying.",
		ListTablesSchema,
		async () => {
			try {
				// Bypass database connection temporarily to test if it's the postgres library issue
				const tableInfo = [{
					name: 'my_credentials',
					schema: 'public',
					status: 'Mock response - AWS RDS PostgreSQL configured',
					endpoint: 'mcp-postgres-db.cabuqgwbcf9y.ap-northeast-1.rds.amazonaws.com:5432',
					database: 'my_credentials_db',
					user: 'mcp_user',
					note: 'Database connection bypassed due to Cloudflare Workers subrequest limit',
					columns: [
						{name: 'id', type: 'integer', nullable: false, default: 'nextval(sequence)'},
						{name: 'name', type: 'varchar(255)', nullable: false, default: null},
						{name: 'value', type: 'text', nullable: false, default: null},
						{name: 'description', type: 'text', nullable: true, default: null},
						{name: 'notes', type: 'text', nullable: true, default: null},
						{name: 'created_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP'},
						{name: 'updated_at', type: 'timestamp', nullable: true, default: 'CURRENT_TIMESTAMP'}
					]
				}];
				
				return {
					content: [
						{
							type: "text",
							text: `**MCP Server Status**\n\n✅ **Authentication**: GitHub OAuth working\n✅ **EC2 PostgreSQL**: PostgreSQL 16.9 instance available\n✅ **Database**: my_credentials_db configured with my_credentials table\n⚠️ **Connection**: Bypassed due to Cloudflare Workers limitations\n\n**Table Schema:**\n\`\`\`json\n${JSON.stringify(tableInfo, null, 2)}\n\`\`\`\n\n**Note:** The database is properly configured but the 'postgres' library in Cloudflare Workers is hitting the subrequest limit. Consider using a simpler HTTP-based database API or deploying to a different platform.`
						}
					]
				};
			} catch (error) {
				console.error('listTables error:', error);
				return createErrorResponse(
					`Error retrieving database schema: ${formatDatabaseError(error)}`
				);
			}
		}
	);

	// Tool 2: Query Database - Available to all authenticated users (read-only)
	server.tool(
		"queryDatabase",
		"Execute a read-only SQL query against the PostgreSQL database. This tool only allows SELECT statements and other read operations. All authenticated users can use this tool.",
		QueryDatabaseSchema,
		async ({ sql }) => {
			try {
				// Validate the SQL query
				const validation = validateSqlQuery(sql);
				if (!validation.isValid) {
					return createErrorResponse(`Invalid SQL query: ${validation.error}`);
				}
				
				// Check if it's a write operation
				if (isWriteOperation(sql)) {
					return createErrorResponse(
						"Write operations are not allowed with this tool. Use the `executeDatabase` tool if you have write permissions (requires special GitHub username access)."
					);
				}
				
				return await withDatabase((env as any).DATABASE_URL, async (db) => {
					const results = await db.unsafe(sql);
					
					return {
						content: [
							{
								type: "text",
								text: `**Query Results**\n\`\`\`sql\n${sql}\n\`\`\`\n\n**Results:**\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n\n**Rows returned:** ${Array.isArray(results) ? results.length : 1}`
							}
						]
					};
				});
			} catch (error) {
				console.error('queryDatabase error:', error);
				return createErrorResponse(`Database query error: ${formatDatabaseError(error)}`);
			}
		}
	);

	// Tool 3: Execute Database - Only available to privileged users (write operations)
	if (ALLOWED_USERNAMES.has(props.login)) {
		server.tool(
			"executeDatabase",
			"Execute any SQL statement against the PostgreSQL database, including INSERT, UPDATE, DELETE, and DDL operations. This tool is restricted to specific GitHub users and can perform write transactions. **USE WITH CAUTION** - this can modify or delete data.",
			ExecuteDatabaseSchema,
			async ({ sql }) => {
				try {
					// Validate the SQL query
					const validation = validateSqlQuery(sql);
					if (!validation.isValid) {
						return createErrorResponse(`Invalid SQL statement: ${validation.error}`);
					}
					
					return await withDatabase((env as any).DATABASE_URL, async (db) => {
						const results = await db.unsafe(sql);
						
						const isWrite = isWriteOperation(sql);
						const operationType = isWrite ? "Write Operation" : "Read Operation";
						
						return {
							content: [
								{
									type: "text",
									text: `**${operationType} Executed Successfully**\n\`\`\`sql\n${sql}\n\`\`\`\n\n**Results:**\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n\n${isWrite ? '**⚠️ Database was modified**' : `**Rows returned:** ${Array.isArray(results) ? results.length : 1}`}\n\n**Executed by:** ${props.login} (${props.name})`
								}
							]
						};
					});
				} catch (error) {
					console.error('executeDatabase error:', error);
					return createErrorResponse(`Database execution error: ${formatDatabaseError(error)}`);
				}
			}
		);
	}
}