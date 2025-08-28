/**
 * MCP Tools for Credential Generation
 * 
 * This module provides MCP tools for generating various types of credentials,
 * keys, tokens, and identifiers used in software development.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Props } from "../types";
import {
	generateUuid4,
	generateUlid,
	generateNanoId,
	generateRandomString,
	generateHexString,
	generateAlphanumeric,
	generateNumericString,
	generateBase64String,
	generatePassword,
	generatePassphrase,
	generatePin,
	generateApiKey,
	generateBearerToken,
	generateJwtSecret,
	generateSessionToken,
	generateCsrfToken,
	generateSalt,
	generateIv,
	generateHmacKey,
	generateEncryptionKey,
	generateNonce,
	generateAwsCredentials,
	generateGithubToken,
	generateDatabasePassword,
	generateBatch,
	type StringOptions,
	type PasswordOptions,
	type BatchRequest,
	type GenerationResult
} from "./credential-generator";

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

// UUID Generation Schemas
export const GenerateUuidSchema = {
	type: z.enum(['uuid4', 'ulid']).optional().default('uuid4').describe("UUID type to generate")
};

export const GenerateNanoIdSchema = {
	length: z.number().int().min(1).max(100).optional().default(21).describe("Length of the Nano ID")
};

// String Generation Schemas  
export const GenerateStringSchema = {
	length: z.number().int().min(1).max(1000).optional().default(32).describe("Length of the string to generate"),
	include_uppercase: z.boolean().optional().default(true).describe("Include uppercase letters"),
	include_lowercase: z.boolean().optional().default(true).describe("Include lowercase letters"),
	include_numbers: z.boolean().optional().default(true).describe("Include numbers"),
	include_special_chars: z.boolean().optional().default(false).describe("Include special characters"),
	exclude_chars: z.string().optional().describe("Characters to exclude from generation"),
	custom_charset: z.string().optional().describe("Custom character set to use"),
	prefix: z.string().optional().describe("Prefix to add to the generated string"),
	suffix: z.string().optional().describe("Suffix to add to the generated string"),
	case: z.enum(['upper', 'lower', 'mixed']).optional().default('mixed').describe("Case transformation")
};

export const GenerateHexSchema = {
	length: z.number().int().min(1).max(1000).optional().default(32).describe("Length of hex string to generate")
};

export const GenerateBase64Schema = {
	length: z.number().int().min(1).max(1000).optional().default(32).describe("Length of base64 string to generate")
};

// Password Generation Schemas
export const GeneratePasswordSchema = {
	length: z.number().int().min(4).max(200).optional().default(16).describe("Length of the password"),
	include_uppercase: z.boolean().optional().default(true).describe("Include uppercase letters"),
	include_lowercase: z.boolean().optional().default(true).describe("Include lowercase letters"),
	include_numbers: z.boolean().optional().default(true).describe("Include numbers"),
	include_special_chars: z.boolean().optional().default(true).describe("Include special characters"),
	exclude_ambiguous: z.boolean().optional().default(false).describe("Exclude ambiguous characters (0,O,l,1,etc)"),
	min_uppercase: z.number().int().min(0).optional().default(1).describe("Minimum uppercase letters"),
	min_lowercase: z.number().int().min(0).optional().default(1).describe("Minimum lowercase letters"),
	min_numbers: z.number().int().min(0).optional().default(1).describe("Minimum numbers"),
	min_special: z.number().int().min(0).optional().default(1).describe("Minimum special characters"),
	special_char_set: z.string().optional().describe("Custom special character set"),
	strength: z.enum(['low', 'medium', 'high', 'maximum']).optional().default('high').describe("Password strength level")
};

export const GeneratePassphraseSchema = {
	words: z.number().int().min(2).max(10).optional().default(4).describe("Number of words in passphrase"),
	separator: z.string().optional().default('-').describe("Separator between words")
};

export const GeneratePinSchema = {
	length: z.number().int().min(3).max(20).optional().default(6).describe("Length of the PIN")
};

// Token Generation Schemas
export const GenerateApiKeySchema = {
	format: z.enum(['hex', 'base64', 'base64url']).optional().default('hex').describe("Format of the API key"),
	length: z.number().int().min(8).max(200).optional().default(64).describe("Length of the API key")
};

export const GenerateTokenSchema = {
	type: z.enum(['bearer', 'jwt_secret', 'session', 'csrf']).describe("Type of token to generate"),
	length: z.number().int().min(8).max(200).optional().default(128).describe("Length of the token")
};

// Cryptographic Generation Schemas
export const GenerateCryptoSchema = {
	type: z.enum(['salt', 'iv', 'hmac_key', 'encryption_key', 'nonce']).describe("Type of cryptographic element"),
	algorithm: z.string().optional().default('aes256').describe("Algorithm for key/IV generation"),
	length: z.number().int().min(8).max(200).optional().default(32).describe("Length in bytes")
};

// Service-Specific Generation Schemas
export const GenerateServiceCredentialSchema = {
	service: z.enum(['aws', 'github', 'database']).describe("Service type for credential generation"),
	password_length: z.number().int().min(8).max(50).optional().default(20).describe("Password length for database credentials")
};

// Batch Generation Schema
export const GenerateBatchSchema = {
	requests: z.array(z.object({
		type: z.string().describe("Type of credential to generate"),
		count: z.number().int().min(1).max(50).describe("Number of items to generate"),
		options: z.record(z.any()).optional().describe("Options for generation")
	})).min(1).max(10).describe("Array of generation requests")
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatGenerationResult(result: GenerationResult, saveToDb: boolean = false) {
	return {
		content: [
			{
				type: "text" as const,
				text: `**${result.description}**

**Generated Value:**
\`\`\`
${result.value}
\`\`\`

**Metadata:**
\`\`\`json
${JSON.stringify(result.metadata, null, 2)}
\`\`\`

${saveToDb ? `**💾 Storage:** Use the \`executeDatabase\` tool to save this credential to your database with:
\`\`\`sql
INSERT INTO local_credentials (name, value, description, notes) 
VALUES ('${result.name.toUpperCase()}', '${result.value}', '${result.description}', '${JSON.stringify(result.metadata).replace(/'/g, "''")}');
\`\`\`` : ''}

**🔒 Security Note:** This credential was generated using cryptographically secure random functions. Store it securely and never share it in plain text.`
			} as any
		]
	} as any;
}

// ============================================================================
// MCP Tool Registration Functions
// ============================================================================

export function registerCredentialGenerationTools(server: McpServer, env: Env, props: Props) {
	console.log('Registering credential generation tools...');

	// Tool 1: Generate UUID/ULID
	server.tool(
		"generateUuid",
		"Generate universally unique identifiers (UUID4, ULID) for unique identification in applications.",
		GenerateUuidSchema,
		async ({ type = 'uuid4' }) => {
			try {
				let result: GenerationResult;
				
				switch (type) {
					case 'uuid4':
						result = generateUuid4();
						break;
					case 'ulid':
						result = generateUlid();
						break;
					default:
						throw new Error(`Unsupported UUID type: ${type}`);
				}
				
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateUuid error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**UUID Generation Error**\n\nFailed to generate UUID: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 2: Generate Nano ID
	server.tool(
		"generateNanoId",
		"Generate URL-safe unique string identifiers (Nano ID) with customizable length.",
		GenerateNanoIdSchema,
		async ({ length = 21 }) => {
			try {
				const result = generateNanoId(length);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateNanoId error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Nano ID Generation Error**\n\nFailed to generate Nano ID: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 3: Generate Random String
	server.tool(
		"generateString",
		"Generate random strings with customizable character sets, length, and formatting options.",
		GenerateStringSchema,
		async (options) => {
			try {
				const { length = 32, ...stringOptions } = options;
				const result = generateRandomString(length, stringOptions as StringOptions);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateString error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**String Generation Error**\n\nFailed to generate string: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 4: Generate Hexadecimal String
	server.tool(
		"generateHex",
		"Generate hexadecimal strings for low-level programming, checksums, and binary data representation.",
		GenerateHexSchema,
		async ({ length = 32 }) => {
			try {
				const result = generateHexString(length);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateHex error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Hex Generation Error**\n\nFailed to generate hex string: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 5: Generate Base64 String
	server.tool(
		"generateBase64",
		"Generate Base64 encoded strings for data encoding and API tokens.",
		GenerateBase64Schema,
		async ({ length = 32 }) => {
			try {
				const result = generateBase64String(length);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateBase64 error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Base64 Generation Error**\n\nFailed to generate base64 string: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 6: Generate Secure Password
	server.tool(
		"generatePassword",
		"Generate secure passwords with customizable requirements including character types, length, and complexity rules.",
		GeneratePasswordSchema,
		async (options) => {
			try {
				const { length = 16, ...passwordOptions } = options;
				const result = generatePassword(length, passwordOptions as PasswordOptions);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generatePassword error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Password Generation Error**\n\nFailed to generate password: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 7: Generate Passphrase
	server.tool(
		"generatePassphrase",
		"Generate memorable passphrases using dictionary words with customizable word count and separators.",
		GeneratePassphraseSchema,
		async ({ words = 4, separator = '-' }) => {
			try {
				const result = generatePassphrase(words, separator);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generatePassphrase error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Passphrase Generation Error**\n\nFailed to generate passphrase: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 8: Generate PIN
	server.tool(
		"generatePin",
		"Generate numeric PIN codes for authentication and verification systems.",
		GeneratePinSchema,
		async ({ length = 6 }) => {
			try {
				const result = generatePin(length);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generatePin error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**PIN Generation Error**\n\nFailed to generate PIN: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 9: Generate API Key
	server.tool(
		"generateApiKey",
		"Generate API keys in various formats (hex, base64, base64url) for service authentication.",
		GenerateApiKeySchema,
		async ({ format = 'hex', length = 64 }) => {
			try {
				const result = generateApiKey(format as 'hex' | 'base64' | 'base64url', length);
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateApiKey error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**API Key Generation Error**\n\nFailed to generate API key: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 10: Generate Token
	server.tool(
		"generateToken",
		"Generate various types of tokens (bearer, JWT secret, session, CSRF) for web applications and APIs.",
		GenerateTokenSchema,
		async ({ type, length = 128 }) => {
			try {
				let result: GenerationResult;
				
				switch (type) {
					case 'bearer':
						result = generateBearerToken(length);
						break;
					case 'jwt_secret':
						result = generateJwtSecret(length);
						break;
					case 'session':
						result = generateSessionToken(length);
						break;
					case 'csrf':
						result = generateCsrfToken(length);
						break;
					default:
						throw new Error(`Unsupported token type: ${type}`);
				}
				
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateToken error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Token Generation Error**\n\nFailed to generate token: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 11: Generate Cryptographic Elements
	server.tool(
		"generateCrypto",
		"Generate cryptographic elements (salts, IVs, HMAC keys, encryption keys, nonces) for security implementations.",
		GenerateCryptoSchema,
		async ({ type, algorithm = 'aes256', length = 32 }) => {
			try {
				let result: GenerationResult;
				
				switch (type) {
					case 'salt':
						result = generateSalt(length);
						break;
					case 'iv':
						result = generateIv(algorithm);
						break;
					case 'hmac_key':
						result = generateHmacKey(length);
						break;
					case 'encryption_key':
						result = generateEncryptionKey(algorithm);
						break;
					case 'nonce':
						result = generateNonce(length);
						break;
					default:
						throw new Error(`Unsupported crypto type: ${type}`);
				}
				
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateCrypto error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Crypto Generation Error**\n\nFailed to generate cryptographic element: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 12: Generate Service-Specific Credentials
	server.tool(
		"generateServiceCredential",
		"Generate service-specific credentials (AWS, GitHub tokens, database passwords) following platform conventions.",
		GenerateServiceCredentialSchema,
		async ({ service, password_length = 20 }) => {
			try {
				let result: GenerationResult;
				
				switch (service) {
					case 'aws':
						result = generateAwsCredentials();
						break;
					case 'github':
						result = generateGithubToken();
						break;
					case 'database':
						result = generateDatabasePassword(password_length);
						break;
					default:
						throw new Error(`Unsupported service type: ${service}`);
				}
				
				return formatGenerationResult(result, true);
			} catch (error) {
				console.error('generateServiceCredential error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Service Credential Generation Error**\n\nFailed to generate service credentials: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 13: Generate Multiple Credentials (Batch)
	server.tool(
		"generateBatch",
		"Generate multiple credentials of different types in a single operation for efficient bulk generation.",
		GenerateBatchSchema,
		async ({ requests }) => {
			try {
				const batchRequests: BatchRequest[] = requests.map(req => ({
					type: req.type,
					count: req.count,
					options: req.options || {}
				}));
				
				const result = generateBatch(batchRequests);
				
				return {
					content: [
						{
							type: "text",
							text: `**${result.description}**

**Generated Credentials:**
\`\`\`json
${result.value}
\`\`\`

**Generation Summary:**
- **Total Items:** ${result.metadata.total_items}
- **Types Generated:** ${result.metadata.types_generated.join(', ')}
- **Generated At:** ${result.metadata.generated_at}

**💾 Storage:** Use the \`executeDatabase\` tool to save individual credentials to your database.

**🔒 Security Note:** All credentials were generated using cryptographically secure random functions.`
						}
					]
				};
			} catch (error) {
				console.error('generateBatch error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**Batch Generation Error**\n\nFailed to generate batch: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	// Tool 14: List Available Generation Types
	server.tool(
		"listGenerationTypes",
		"List all available credential generation types with descriptions and common use cases.",
		{},
		async () => {
			try {
				const generationTypes = {
					"Unique Identifiers": {
						"uuid4": "Random UUID for unique identification",
						"ulid": "Time-sortable unique identifier", 
						"nano_id": "URL-safe unique string identifier"
					},
					"Random Strings": {
						"random_string": "Customizable random string with character sets",
						"hex_string": "Hexadecimal string for binary data",
						"alphanumeric": "Letters and numbers only",
						"numeric_string": "Numbers only",
						"base64_string": "Base64 encoded string"
					},
					"Passwords & Authentication": {
						"secure_password": "Strong password with complexity rules",
						"passphrase": "Dictionary word-based passphrase",
						"pin": "Numeric PIN code",
						"database_password": "Database-optimized secure password"
					},
					"API Keys & Tokens": {
						"api_key": "API authentication key (hex/base64/base64url)",
						"bearer_token": "Bearer token for HTTP authentication",
						"jwt_secret": "JWT signing secret",
						"session_token": "Web session token",
						"csrf_token": "Cross-site request forgery protection token"
					},
					"Cryptographic Elements": {
						"salt": "Password hashing salt",
						"iv": "Initialization vector for encryption",
						"hmac_key": "Message authentication key",
						"encryption_key": "Symmetric encryption key",
						"nonce": "Number used once for crypto operations"
					},
					"Service-Specific": {
						"aws_credentials": "AWS access key and secret key pair",
						"github_token": "GitHub personal access token format"
					},
					"Batch Operations": {
						"batch_generation": "Generate multiple credentials in one operation"
					}
				};
				
				return {
					content: [
						{
							type: "text",
							text: `**Available Credential Generation Types**

${Object.entries(generationTypes).map(([category, types]) => `
**${category}:**
${Object.entries(types).map(([type, description]) => `  • **${type}**: ${description}`).join('\n')}
`).join('\n')}

**Usage Examples:**
\`\`\`
generateUuid type="uuid4"
generatePassword length=20 exclude_ambiguous=true
generateApiKey format="base64" length=64
generateToken type="bearer" length=128
generateCrypto type="encryption_key" algorithm="aes256"
generateServiceCredential service="aws"
\`\`\`

**🔒 Security Features:**
• All generation uses cryptographically secure random functions
• Entropy calculations provided for each credential type
• Support for custom character sets and exclusion patterns
• OWASP-compliant password generation
• Platform-specific formatting (AWS, GitHub, etc.)

**💾 Integration:**
• Compatible with existing \`executeDatabase\` tool for storage
• Metadata includes algorithm details and entropy calculations
• JSON-formatted output for easy parsing and integration`
						}
					]
				};
			} catch (error) {
				console.error('listGenerationTypes error:', error);
				return {
					content: [
						{
							type: "text",
							text: `**List Generation Types Error**\n\nFailed to list generation types: ${error instanceof Error ? error.message : String(error)}`,
							isError: true
						}
					]
				};
			}
		}
	);

	console.log(`Credential generation tools registered successfully for user: ${props.login}`);
	console.log('Available tools: generateUuid, generateNanoId, generateString, generateHex, generateBase64, generatePassword, generatePassphrase, generatePin, generateApiKey, generateToken, generateCrypto, generateServiceCredential, generateBatch, listGenerationTypes');
}