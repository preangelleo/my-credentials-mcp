import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";
import { registerHttpApiTools } from "./http-api-tools";

/**
 * Register all MCP tools based on user permissions
 * Using HTTP API wrapper to avoid Cloudflare Workers database connection limitations
 */
export function registerAllTools(server: McpServer, env: Env, props: Props) {
	// Register HTTP API tools (replaces direct database tools)
	registerHttpApiTools(server, env, props);
	
	// Future tools can be registered here
	// registerOtherTools(server, env, props);
}