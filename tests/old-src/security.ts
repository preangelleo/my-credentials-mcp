/**
 * Database security utilities for SQL validation and error handling
 */

export interface SqlValidationResult {
	isValid: boolean;
	error?: string;
}

/**
 * Validate SQL query for security (prevent dangerous operations)
 */
export function validateSqlQuery(sql: string): SqlValidationResult {
	if (!sql || typeof sql !== 'string') {
		return { isValid: false, error: 'SQL query must be a non-empty string' };
	}

	const trimmedSql = sql.trim().toLowerCase();
	
	// Dangerous patterns that should be blocked
	const dangerousPatterns = [
		/;\s*drop\s+/i,
		/;\s*delete\s+.*\s+where\s+1\s*=\s*1/i,
		/;\s*truncate\s+/i,
		/;\s*alter\s+/i,
		/;\s*grant\s+/i,
		/;\s*revoke\s+/i,
		/union.*select/i,
		/\bexec\b/i,
		/\bexecute\b/i,
		/\bsp_/i,
		/\bxp_/i,
		/\bmsdb\b/i,
		/information_schema/i,
		/pg_catalog/i,
		/--.*drop/i,
		/\/\*.*drop.*\*\//i
	];

	for (const pattern of dangerousPatterns) {
		if (pattern.test(sql)) {
			return { 
				isValid: false, 
				error: 'SQL query contains potentially dangerous patterns' 
			};
		}
	}

	return { isValid: true };
}

/**
 * Check if a SQL statement is a write operation
 */
export function isWriteOperation(sql: string): boolean {
	const trimmedSql = sql.trim().toLowerCase();
	const writeKeywords = [
		'insert',
		'update', 
		'delete',
		'create',
		'drop',
		'alter',
		'truncate',
		'grant',
		'revoke'
	];
	
	return writeKeywords.some(keyword => 
		trimmedSql.startsWith(keyword)
	);
}

/**
 * Format database errors for safe display to users
 */
export function formatDatabaseError(error: unknown): string {
	if (error instanceof Error) {
		// Sanitize error messages to prevent information leakage
		if (error.message.includes('password')) {
			return 'Database authentication failed. Please check credentials.';
		}
		if (error.message.includes('timeout')) {
			return 'Database connection timed out. Please try again.';
		}
		if (error.message.includes('connection')) {
			return 'Database connection error. Please check network connectivity.';
		}
		if (error.message.includes('permission')) {
			return 'Insufficient database permissions for this operation.';
		}
		
		// Return sanitized generic error message
		return `Database error: ${error.message.substring(0, 200)}`;
	}
	
	return 'Unknown database error occurred.';
}