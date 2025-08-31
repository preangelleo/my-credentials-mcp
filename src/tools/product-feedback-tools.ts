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
	limit: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().min(1).max(100)).default(10)
});

const UpdateSuggestionStatusSchema = z.object({
	id: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().min(1)),
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
		`📝 PRODUCT IMPROVEMENT SUGGESTIONS
		
Submit bug reports, feature requests, and improvement suggestions for MCP server products. Available to all authenticated users.

📊 REQUIRED PARAMETERS:
• product_name: MCP server name (e.g., "My Credentials MCP Server", "Ghost Blog Management MCP Server")  
• title: Clear, concise issue/feature title (e.g., "Fix HTTP 500 error in API", "Add batch delete functionality")

🔧 OPTIONAL PARAMETERS:
• brief: Short summary (1-2 sentences)
• detailed_suggestion: Technical details, steps to reproduce, proposed solutions
• priority: low | medium | high | critical (default: medium)
• suggester_signature: Your identifier (auto-generated if not provided)

💡 USAGE EXAMPLES:
• Bug Report: {product_name: "Ghost Blog API", title: "404 error on post delete", priority: "high", detailed_suggestion: "DELETE /posts/{id} returns 404 even for valid IDs"}
• Feature Request: {product_name: "Credentials MCP", title: "Add SSH key generation", brief: "Support for ED25519 SSH key pairs"}
• Enhancement: {product_name: "Database Tools", title: "Improve error messages", priority: "medium"}

📋 WORKFLOW:
submitted → under_review → accepted/rejected → in_progress → completed

🎯 TIP: Be specific with product names and provide technical details for faster resolution.

📚 Documentation: https://github.com/preangelleo/my-credentials-mcp`,
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
		`🔍 BROWSE PRODUCT SUGGESTIONS
		
Retrieve and filter product improvement suggestions. Perfect for checking status of your submissions or browsing existing requests.

🎛️ FILTER OPTIONS (all optional):
• product_name: Partial match (e.g., "Ghost", "Credentials", "MCP")
• status: submitted | under_review | accepted | in_progress | completed | rejected  
• priority: low | medium | high | critical
• limit: Number of results (1-100, default: 10)

🔍 SEARCH EXAMPLES:
• Recent critical issues: {priority: "critical", limit: 5}
• All Ghost Blog suggestions: {product_name: "Ghost Blog", limit: 20}
• Completed features: {status: "completed"}
• Your submissions: {suggester_signature: "your-username"}
• All recent: {} (no filters = latest 10)

📊 RESPONSE INCLUDES:
• Suggestion ID, title, product name
• Current status and priority level  
• Suggester info and creation date
• Brief description preview
• Developer notes (if any)

💡 USAGE TIPS:
- Use partial product names for broader search
- Check status regularly for updates on your submissions
- Filter by priority to see urgent issues
- Use higher limits (50-100) for comprehensive views

📚 Documentation: https://github.com/preangelleo/my-credentials-mcp`,
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
			`⚠️ DEVELOPER STATUS UPDATES (RESTRICTED ACCESS)
			
Update suggestion status and add developer notes. **RESTRICTED to authorized developers only (preangelleo).**

📊 REQUIRED PARAMETERS:
• id: Suggestion ID (number from getProductSuggestions)
• status: submitted | under_review | accepted | in_progress | completed | rejected

🔧 OPTIONAL PARAMETERS:  
• developer_notes: Technical notes, implementation details, resolution info
• priority: Change priority level (low | medium | high | critical)

💡 STATUS WORKFLOW:
submitted → under_review → accepted → in_progress → completed
                      ↘ rejected

🔥 USAGE EXAMPLES:
• Accept suggestion: {id: 5, status: "accepted", developer_notes: "Good idea, will implement in v2.1", priority: "high"}
• Mark completed: {id: 8, status: "completed", developer_notes: "Fixed in commit abc123 - deployed to production"}  
• Reject with reason: {id: 12, status: "rejected", developer_notes: "Conflicts with security policy - cannot implement"}
• Update progress: {id: 15, status: "in_progress", developer_notes: "50% complete - API changes done, testing UI"}

📋 DEVELOPER RESPONSIBILITIES:
- Provide clear, technical developer_notes for transparency
- Update priority if reassessing importance  
- Move through workflow stages systematically
- Document implementation details and commit references

🎯 BEST PRACTICES:
1. Always add meaningful developer_notes when changing status
2. Reference specific commits, PRs, or version numbers
3. Explain rejection reasons clearly for future reference
4. Update priority based on technical assessment

📚 Documentation: https://github.com/preangelleo/my-credentials-mcp`,
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