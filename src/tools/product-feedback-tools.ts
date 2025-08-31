import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { 
	Props, 
	createErrorResponse,
	createSuccessResponse
} from "../types";
import { z } from "zod";

// Schema definitions for product feedback tools
const SubmitSuggestionSchema = z.object({
	product_name: z.string().min(1, "Product name is required"),
	title: z.string().min(1, "Title is required"),
	brief: z.string().optional(),
	detailed_suggestion: z.string().optional(),
	priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
	suggester_signature: z.string().optional()
});

const GetSuggestionsSchema = z.object({
	product_name: z.string().optional(),
	status: z.enum(['submitted', 'under_review', 'accepted', 'in_progress', 'completed', 'rejected']).optional(),
	priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
	limit: z.number().min(1).max(100).default(10)
});

const UpdateSuggestionStatusSchema = z.object({
	id: z.number().min(1),
	status: z.enum(['submitted', 'under_review', 'accepted', 'in_progress', 'completed', 'rejected']),
	developer_notes: z.string().optional(),
	priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

// Use the shared HTTP API utility from http-api-tools 
// This eliminates the duplicate implementation and API conflicts
import { callHttpApi } from "./http-api-tools";

const PRIVILEGED_USERS = new Set<string>([
	'preangelleo'   // Only authorized user for status updates
]);

export function registerProductFeedbackTools(server: McpServer, env: Env, props: Props) {
	
	// Tool 1: Submit Product Suggestion - Available to all authenticated users
	server.tool(
		"submitProductSuggestion",
		"Submit a product improvement suggestion or bug report. Provide detailed feedback about MCP server products to help developers prioritize improvements. All authenticated users can submit suggestions. 📚 Documentation: https://github.com/preangelleo/my-credentials-mcp",
		SubmitSuggestionSchema.shape,
		async ({ product_name, title, brief, detailed_suggestion, priority = 'medium', suggester_signature }) => {
			try {
				// Use direct SQL values instead of parameterized queries to work with the HTTP API wrapper
				const finalSuggesterSignature = suggester_signature || `${props.login}-suggestion-${Date.now()}`;
				const sql = `
					INSERT INTO product_improvement_suggestions 
					(product_name, title, brief, detailed_suggestion, priority, suggester_signature, created_at, updated_at)
					VALUES ('${product_name.replace(/'/g, "''")}', '${title.replace(/'/g, "''")}', ${brief ? `'${brief.replace(/'/g, "''")}'` : 'NULL'}, ${detailed_suggestion ? `'${detailed_suggestion.replace(/'/g, "''")}'` : 'NULL'}, '${priority}', '${finalSuggesterSignature.replace(/'/g, "''")}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
					RETURNING *
				`;
				
				const result = await callHttpApi('/api/execute', 'POST', {
					sql,
					username: props.login
				});

				if (!result.success) {
					return createErrorResponse(`Failed to submit suggestion: ${result.error}`);
				}

				return {
					content: [
						{
							type: "text",
							text: `**✅ Product Suggestion Submitted Successfully**

**Product:** ${product_name}
**Title:** ${title}
**Priority:** ${priority}
**Status:** submitted
**Suggestion ID:** ${result.data?.[0]?.id || 'Generated'}

${brief ? `**Brief:** ${brief}` : ''}

**Submitted by:** ${props.login} (${props.name})
**Timestamp:** ${result.timestamp}

🎯 **What happens next:**
1. Developer will review your suggestion
2. Status will be updated to: under_review → accepted/rejected
3. If accepted: in_progress → completed
4. You can check status using \`getProductSuggestions\` tool

💡 **Tip:** Use specific product names like "Ghost Blog Management MCP Server", "My Credentials MCP Server", etc. for better tracking.

📚 **Documentation:** https://github.com/preangelleo/my-credentials-mcp`
						}
					]
				};
			} catch (error) {
				console.error('submitProductSuggestion error:', error);
				return createErrorResponse(`Failed to submit suggestion: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	);

	// Tool 2: Get Product Suggestions - Available to all authenticated users  
	server.tool(
		"getProductSuggestions",
		"Retrieve product improvement suggestions with optional filters. Search by product name, status, priority, or get recent submissions. All authenticated users can view suggestions. 📚 Documentation: https://github.com/preangelleo/my-credentials-mcp",
		GetSuggestionsSchema.shape,
		async ({ product_name, status, priority, limit = 10 }) => {
			try {
				let sql = `
					SELECT id, product_name, title, brief, status, priority, suggester_signature, created_at, updated_at, developer_notes
					FROM product_improvement_suggestions
				`;
				const conditions: string[] = [];

				if (product_name) {
					conditions.push(`product_name ILIKE '%${product_name.replace(/'/g, "''")}%'`);
				}

				if (status) {
					conditions.push(`status = '${status}'`);
				}

				if (priority) {
					conditions.push(`priority = '${priority}'`);
				}

				if (conditions.length > 0) {
					sql += ` WHERE ` + conditions.join(' AND ');
				}

				sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

				const result = await callHttpApi('/api/query', 'POST', {
					sql,
					username: props.login
				});

				if (!result.success) {
					return createErrorResponse(`Failed to get suggestions: ${result.error}`);
				}

				const suggestions = result.data || [];
				const filterText = [
					product_name ? `Product: ${product_name}` : '',
					status ? `Status: ${status}` : '',
					priority ? `Priority: ${priority}` : ''
				].filter(Boolean).join(', ') || 'None';

				return {
					content: [
						{
							type: "text",
							text: `**📋 Product Improvement Suggestions**

**Filters Applied:** ${filterText}
**Results Found:** ${suggestions.length}
**Query Time:** ${result.duration}

${suggestions.length === 0 ? '📝 **No suggestions found with current filters.**' : 
suggestions.map((s: any, i: number) => `
**${i + 1}. [ID: ${s.id}] ${s.title}**
📦 **Product:** ${s.product_name}
📊 **Status:** ${s.status} | **Priority:** ${s.priority}
👤 **Suggester:** ${s.suggester_signature}
📅 **Created:** ${new Date(s.created_at).toLocaleDateString()}
${s.brief ? `💭 **Brief:** ${s.brief.substring(0, 150)}${s.brief.length > 150 ? '...' : ''}` : ''}
${s.developer_notes ? `🔧 **Developer Notes:** ${s.developer_notes.substring(0, 100)}${s.developer_notes.length > 100 ? '...' : ''}` : ''}
---`).join('\n')}

💡 **Available Tools:**
- \`submitProductSuggestion\` - Submit new suggestions
- \`updateSuggestionStatus\` - Update status (developers only)

🔍 **Filter Options:** product_name, status (submitted/under_review/accepted/in_progress/completed/rejected), priority (low/medium/high/critical)

📚 **Documentation:** https://github.com/preangelleo/my-credentials-mcp`
						}
					]
				};
			} catch (error) {
				console.error('getProductSuggestions error:', error);
				return createErrorResponse(`Failed to get suggestions: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	);

	// Tool 3: Update Suggestion Status - Only available to privileged users
	if (PRIVILEGED_USERS.has(props.login)) {
		server.tool(
			"updateSuggestionStatus",
			"Update the status of a product improvement suggestion. Only authorized developers can update suggestion status, add notes, and change priority. Restricted to specific GitHub users. 📚 Documentation: https://github.com/preangelleo/my-credentials-mcp",
			UpdateSuggestionStatusSchema.shape,
			async ({ id, status, developer_notes, priority }) => {
				try {
					let sql = `
						UPDATE product_improvement_suggestions 
						SET status = '${status}', updated_at = CURRENT_TIMESTAMP
					`;

					if (developer_notes) {
						sql += `, developer_notes = '${developer_notes.replace(/'/g, "''")}'`;
					}

					if (priority) {
						sql += `, priority = '${priority}'`;
					}

					sql += ` WHERE id = ${id} RETURNING *`;

					const result = await callHttpApi('/api/execute', 'POST', {
						sql,
						username: props.login
					});

					if (!result.success) {
						return createErrorResponse(`Failed to update suggestion: ${result.error}`);
					}

					const updated = result.data?.[0];
					if (!updated) {
						return createErrorResponse(`No suggestion found with ID: ${id}`);
					}

					return {
						content: [
							{
								type: "text",
								text: `**✅ Suggestion Status Updated Successfully**

**[ID: ${id}] ${updated.title}**
📦 **Product:** ${updated.product_name}
📊 **Status:** ${status} (updated)
${priority ? `🎯 **Priority:** ${priority} (updated)` : `🎯 **Priority:** ${updated.priority}`}
📅 **Updated:** ${new Date(updated.updated_at).toLocaleString()}

${developer_notes ? `🔧 **Developer Notes Added:**
${developer_notes}` : ''}

**Updated by:** ${props.login} (${props.name})
**Operation time:** ${result.duration}

📈 **Status Workflow:**
submitted → under_review → accepted/rejected → in_progress → completed

📚 **Documentation:** https://github.com/preangelleo/my-credentials-mcp`
							}
						]
					};
				} catch (error) {
					console.error('updateSuggestionStatus error:', error);
					return createErrorResponse(`Failed to update suggestion: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		);
	}

	console.log(`Product feedback tools registered for user: ${props.login} (${props.name})`);
	console.log(`Suggestion submission: Available`);
	console.log(`Status updates: ${PRIVILEGED_USERS.has(props.login) ? 'Available (privileged user)' : 'Not available'}`);
}