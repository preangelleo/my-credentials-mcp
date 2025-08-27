import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { Props } from "./types";
import { GitHubHandler } from "./auth/github-handler";
import { registerAllTools } from "./tools/register-tools";

export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
	server = new McpServer({
		name: "PostgreSQL Database MCP Server (HTTP API)",
		version: "1.1.0",
	});

	async init() {
		// Register all HTTP API tools based on user permissions
		registerAllTools(this.server, this.env, this.props);
		
		console.log(`MCP Server initialized for user: ${this.props.login} (${this.props.name})`);
		console.log('Using HTTP API wrapper to connect to PostgreSQL database');
	}
}

export default new OAuthProvider({
	apiHandlers: {
		'/sse': MyMCP.serveSSE('/sse') as any,
		'/mcp': MyMCP.serve('/mcp') as any,
	},
	authorizeEndpoint: "/authorize",
	clientRegistrationEndpoint: "/register",
	defaultHandler: GitHubHandler as any,
	tokenEndpoint: "/token",
});