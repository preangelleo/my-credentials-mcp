/**
 * Database utility functions for connection management
 * Note: This is a placeholder as the actual database operations are handled via HTTP API
 */

// Helper function to determine if SQL is a write operation
function isWriteOperation(sql: string): boolean {
	const writeKeywords = ['insert', 'update', 'delete', 'create', 'drop', 'alter', 'truncate'];
	const trimmedSql = sql.trim().toLowerCase();
	return writeKeywords.some(keyword => trimmedSql.startsWith(keyword));
}

/**
 * Database connection wrapper for HTTP API operations
 * This function simulates the database connection pattern but actually makes HTTP requests
 */
export async function withDatabase<T>(
	databaseUrl: string, 
	operation: (db: any) => Promise<T>,
	username?: string
): Promise<T> {
	// HTTP API wrapper implementation for Cloudflare Workers
	const httpDb = {
		unsafe: async (sql: string) => {
			console.log(`Executing SQL via HTTP API: ${sql.substring(0, 100)}...`);
			
			// Determine endpoint based on operation type
			const isWrite = isWriteOperation(sql);
			const endpoint = isWrite ? '/api/execute' : '/api/query';
			
			const response = await fetch(`${databaseUrl}${endpoint}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ sql, username })
			});
			
			if (!response.ok) {
				throw new Error(`HTTP API Error: ${response.status} ${response.statusText}`);
			}
			
			const response_data = await response.json();
			const data = response_data.success ? response_data.data : [];
			console.log(`SQL execution completed, returned ${Array.isArray(data) ? data.length : 1} results`);
			return data;
		}
	};
	
	try {
		return await operation(httpDb);
	} catch (error) {
		console.error('Database operation error:', error);
		throw error;
	}
}

/**
 * Format SQL results for display
 */
export function formatSqlResults(results: any[], sql: string): string {
	if (!Array.isArray(results)) {
		return JSON.stringify(results, null, 2);
	}
	
	if (results.length === 0) {
		return 'No results returned';
	}
	
	return JSON.stringify(results, null, 2);
}

/**
 * Validate database URL format
 */
export function validateDatabaseUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
	} catch {
		return false;
	}
}