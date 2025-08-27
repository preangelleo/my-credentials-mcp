import postgres from "postgres";

let dbInstance: postgres.Sql | null = null;

/**
 * Get database connection singleton
 * Following the pattern from BASIC-DB-MCP.md but adapted for PostgreSQL with connection pooling
 */
export function getDb(databaseUrl: string): postgres.Sql {
	if (!dbInstance) {
		dbInstance = postgres(databaseUrl, {
			// Minimal configuration to avoid Cloudflare Workers subrequest limits
			max: 1, // Only 1 connection to avoid subrequest issues
			idle_timeout: 30,
			connect_timeout: 5,
			// Disable prepared statements to reduce complexity
			prepare: false,
			// Disable connection retries
			connection: {
				application_name: 'mcp-server'
			}
		});
	}
	return dbInstance;
}

/**
 * Close database connection pool
 * Call this when the Durable Object is shutting down
 */
export async function closeDb(): Promise<void> {
	if (dbInstance) {
		try {
			await dbInstance.end();
		} catch (error) {
			console.error('Error closing database connection:', error);
		} finally {
			dbInstance = null;
		}
	}
}