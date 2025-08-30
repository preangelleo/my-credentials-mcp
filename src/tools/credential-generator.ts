/**
 * Comprehensive Credential Generation System for MCP Server
 * 
 * This module provides a complete suite of credential generation functions
 * for software development, including UUIDs, random strings, passwords,
 * tokens, and cryptographic elements.
 * 
 * All functions use cryptographically secure random number generation
 * and follow OWASP security best practices.
 */

import { z } from "zod";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BaseOptions {
  length?: number;
  format?: string;
  prefix?: string;
  suffix?: string;
  case?: 'upper' | 'lower' | 'mixed';
}

export interface StringOptions extends BaseOptions {
  include_uppercase?: boolean;
  include_lowercase?: boolean;
  include_numbers?: boolean;
  include_special_chars?: boolean;
  exclude_chars?: string;
  custom_charset?: string;
  special_char_set?: string;
  min_length?: number;
  max_length?: number;
}

export interface PasswordOptions extends BaseOptions {
  include_uppercase?: boolean;
  include_lowercase?: boolean;
  include_numbers?: boolean;
  include_special_chars?: boolean;
  exclude_ambiguous?: boolean;
  min_uppercase?: number;
  min_lowercase?: number;
  min_numbers?: number;
  min_special?: number;
  special_char_set?: string;
  strength?: 'low' | 'medium' | 'high' | 'maximum';
}

export interface CryptoOptions extends BaseOptions {
  algorithm?: string;
  key_size?: number;
  encoding?: 'hex' | 'base64' | 'binary';
  secure_random?: boolean;
}

export interface GenerationResult {
  value: string;
  name: string;
  description: string;
  metadata: {
    type: string;
    length: number;
    algorithm?: string;
    entropy_bits?: number;
    charset?: string;
    generated_at: string;
    [key: string]: any;
  };
}

// ============================================================================
// Core Utility Functions
// ============================================================================

/**
 * Generate cryptographically secure random bytes
 */
function getSecureRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert bytes to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert bytes to base64url (URL-safe) string
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Apply case transformation
 */
function applyCase(str: string, caseOption: 'upper' | 'lower' | 'mixed' = 'mixed'): string {
  switch (caseOption) {
    case 'upper': return str.toUpperCase();
    case 'lower': return str.toLowerCase();
    default: return str;
  }
}

/**
 * Add prefix and suffix to a value
 */
function addAffixes(value: string, prefix?: string, suffix?: string): string {
  return (prefix || '') + value + (suffix || '');
}

/**
 * Calculate entropy bits for a charset and length
 */
function calculateEntropy(charsetSize: number, length: number): number {
  return Math.floor(Math.log2(Math.pow(charsetSize, length)));
}

// ============================================================================
// Character Sets
// ============================================================================

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  special_safe: '!@#$%^&*_+-=',
  hex: '0123456789ABCDEF',
  hex_lower: '0123456789abcdef',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  url_safe: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  ambiguous: 'il1Lo0O',
  base58: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
};

// ============================================================================
// UUID Generation Functions
// ============================================================================

/**
 * Generate UUID v4 (Random)
 */
export function generateUuid4(): GenerationResult {
  const bytes = getSecureRandomBytes(16);
  
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  
  const hex = bytesToHex(bytes);
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  
  return {
    value: uuid,
    name: 'uuid4',
    description: 'Generated UUID4 for unique identification',
    metadata: {
      type: 'uuid4',
      length: 36,
      algorithm: 'secure_random',
      entropy_bits: 122,
      charset: 'hex-with-dashes',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate ULID (Universally Unique Lexicographically Sortable Identifier)
 */
export function generateUlid(): GenerationResult {
  const timestamp = Date.now();
  const timestampChars = 10;
  const randomChars = 16;
  
  // Crockford's Base32 encoding
  const base32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  
  // Encode timestamp (48 bits)
  let ulid = '';
  let temp = timestamp;
  for (let i = timestampChars - 1; i >= 0; i--) {
    ulid = base32[temp % 32] + ulid;
    temp = Math.floor(temp / 32);
  }
  
  // Add random part (80 bits)
  const randomBytes = getSecureRandomBytes(10);
  for (let i = 0; i < randomChars; i++) {
    ulid += base32[randomBytes[Math.floor(i * 10 / 16)] % 32];
  }
  
  return {
    value: ulid,
    name: 'ulid',
    description: 'Generated ULID for time-sortable unique identification',
    metadata: {
      type: 'ulid',
      length: 26,
      algorithm: 'timestamp+secure_random',
      entropy_bits: 80,
      charset: 'crockford_base32',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate Nano ID
 */
export function generateNanoId(length: number = 21): GenerationResult {
  const alphabet = CHARSETS.url_safe;
  const bytes = getSecureRandomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  
  return {
    value: result,
    name: 'nano_id',
    description: 'Generated Nano ID for URL-safe unique identification',
    metadata: {
      type: 'nano_id',
      length,
      algorithm: 'secure_random',
      entropy_bits: calculateEntropy(alphabet.length, length),
      charset: 'url_safe',
      generated_at: new Date().toISOString()
    }
  };
}

// ============================================================================
// Random String Generation Functions
// ============================================================================

/**
 * Generate random string with custom options
 */
export function generateRandomString(length: number = 32, options: StringOptions = {}): GenerationResult {
  let charset = '';
  
  if (options.custom_charset) {
    charset = options.custom_charset;
  } else {
    if (options.include_uppercase !== false) charset += CHARSETS.uppercase;
    if (options.include_lowercase !== false) charset += CHARSETS.lowercase;
    if (options.include_numbers !== false) charset += CHARSETS.numbers;
    if (options.include_special_chars) charset += options.special_char_set || CHARSETS.special_safe;
  }
  
  if (!charset) {
    charset = CHARSETS.alphanumeric; // Default
  }
  
  // Remove excluded characters
  if (options.exclude_chars) {
    for (const char of options.exclude_chars) {
      charset = charset.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    }
  }
  
  const bytes = getSecureRandomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  
  result = applyCase(result, options.case);
  result = addAffixes(result, options.prefix, options.suffix);
  
  return {
    value: result,
    name: 'random_string',
    description: 'Generated random string with custom character set',
    metadata: {
      type: 'random_string',
      length: result.length,
      algorithm: 'secure_random',
      entropy_bits: calculateEntropy(charset.length, length),
      charset: charset.slice(0, 20) + (charset.length > 20 ? '...' : ''),
      charset_size: charset.length,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate hexadecimal string
 */
export function generateHexString(length: number = 32): GenerationResult {
  const bytes = getSecureRandomBytes(Math.ceil(length / 2));
  const hex = bytesToHex(bytes).slice(0, length);
  
  return {
    value: hex,
    name: 'hex_string',
    description: 'Generated hexadecimal string',
    metadata: {
      type: 'hex_string',
      length,
      algorithm: 'secure_random',
      entropy_bits: length * 4,
      charset: 'hexadecimal',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate alphanumeric string
 */
export function generateAlphanumeric(length: number = 16): GenerationResult {
  return generateRandomString(length, {
    include_uppercase: true,
    include_lowercase: true,
    include_numbers: true,
    include_special_chars: false
  });
}

/**
 * Generate numeric string
 */
export function generateNumericString(length: number = 10): GenerationResult {
  return generateRandomString(length, {
    custom_charset: CHARSETS.numbers
  });
}

/**
 * Generate base64 string
 */
export function generateBase64String(length: number = 32): GenerationResult {
  const byteLength = Math.ceil(length * 3 / 4);
  const bytes = getSecureRandomBytes(byteLength);
  const base64 = bytesToBase64(bytes).slice(0, length);
  
  return {
    value: base64,
    name: 'base64_string',
    description: 'Generated Base64 encoded string',
    metadata: {
      type: 'base64_string',
      length,
      algorithm: 'secure_random',
      entropy_bits: calculateEntropy(64, length),
      charset: 'base64',
      generated_at: new Date().toISOString()
    }
  };
}

// ============================================================================
// Password Generation Functions
// ============================================================================

/**
 * Generate strong password with customizable requirements
 */
export function generatePassword(length: number = 16, options: PasswordOptions = {}): GenerationResult {
  const {
    include_uppercase = true,
    include_lowercase = true,
    include_numbers = true,
    include_special_chars = true,
    exclude_ambiguous = false,
    min_uppercase = 1,
    min_lowercase = 1,
    min_numbers = 1,
    min_special = 1,
    special_char_set = CHARSETS.special_safe,
    strength = 'high'
  } = options;
  
  // Build character sets
  let charset = '';
  const sets: { chars: string; min: number }[] = [];
  
  if (include_uppercase) {
    let upper = CHARSETS.uppercase;
    if (exclude_ambiguous) upper = upper.replace(/[IL]/g, '');
    sets.push({ chars: upper, min: min_uppercase });
    charset += upper;
  }
  
  if (include_lowercase) {
    let lower = CHARSETS.lowercase;
    if (exclude_ambiguous) lower = lower.replace(/[il]/g, '');
    sets.push({ chars: lower, min: min_lowercase });
    charset += lower;
  }
  
  if (include_numbers) {
    let nums = CHARSETS.numbers;
    if (exclude_ambiguous) nums = nums.replace(/[01]/g, '');
    sets.push({ chars: nums, min: min_numbers });
    charset += nums;
  }
  
  if (include_special_chars) {
    sets.push({ chars: special_char_set, min: min_special });
    charset += special_char_set;
  }
  
  // Generate password ensuring minimum requirements
  const password: string[] = [];
  
  // First, meet minimum requirements
  for (const set of sets) {
    for (let i = 0; i < set.min; i++) {
      const bytes = getSecureRandomBytes(1);
      password.push(set.chars[bytes[0] % set.chars.length]);
    }
  }
  
  // Fill remaining length with random characters
  const remaining = length - password.length;
  for (let i = 0; i < remaining; i++) {
    const bytes = getSecureRandomBytes(1);
    password.push(charset[bytes[0] % charset.length]);
  }
  
  // Shuffle the password array
  for (let i = password.length - 1; i > 0; i--) {
    const bytes = getSecureRandomBytes(1);
    const j = bytes[0] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  const result = password.join('');
  
  return {
    value: result,
    name: 'secure_password',
    description: 'Generated secure password with customizable requirements',
    metadata: {
      type: 'secure_password',
      length,
      algorithm: 'secure_random_with_requirements',
      entropy_bits: calculateEntropy(charset.length, length),
      charset_size: charset.length,
      strength,
      requirements: {
        uppercase: include_uppercase ? min_uppercase : 0,
        lowercase: include_lowercase ? min_lowercase : 0,
        numbers: include_numbers ? min_numbers : 0,
        special: include_special_chars ? min_special : 0,
        exclude_ambiguous
      },
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate passphrase from dictionary words
 */
export function generatePassphrase(words: number = 4, separator: string = '-'): GenerationResult {
  // Common word list for passphrases
  const wordList = [
    'correct', 'horse', 'battery', 'staple', 'apple', 'banana', 'cherry', 'dragon',
    'elephant', 'forest', 'guitar', 'hammer', 'island', 'jungle', 'knight', 'lemon',
    'mountain', 'network', 'ocean', 'piano', 'queen', 'rainbow', 'sunset', 'thunder',
    'umbrella', 'valley', 'winter', 'x-ray', 'yellow', 'zebra', 'bridge', 'castle',
    'diamond', 'eagle', 'flower', 'golden', 'harbor', 'iceberg', 'jacket', 'kitten'
  ];
  
  const selectedWords: string[] = [];
  for (let i = 0; i < words; i++) {
    const bytes = getSecureRandomBytes(1);
    selectedWords.push(wordList[bytes[0] % wordList.length]);
  }
  
  const result = selectedWords.join(separator);
  
  return {
    value: result,
    name: 'passphrase',
    description: 'Generated passphrase using dictionary words',
    metadata: {
      type: 'passphrase',
      length: result.length,
      word_count: words,
      separator,
      algorithm: 'dictionary_words',
      entropy_bits: Math.floor(Math.log2(Math.pow(wordList.length, words))),
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate PIN code
 */
export function generatePin(length: number = 6): GenerationResult {
  return generateRandomString(length, {
    custom_charset: CHARSETS.numbers
  });
}

// ============================================================================
// Token and API Key Generation Functions
// ============================================================================

/**
 * Generate API key in various formats
 */
export function generateApiKey(format: 'hex' | 'base64' | 'base64url' = 'hex', length: number = 64): GenerationResult {
  const bytes = getSecureRandomBytes(Math.ceil(length * 3 / 4));
  let result: string;
  
  switch (format) {
    case 'base64':
      result = bytesToBase64(bytes).slice(0, length);
      break;
    case 'base64url':
      result = bytesToBase64Url(bytes).slice(0, length);
      break;
    default:
      result = bytesToHex(bytes).slice(0, length);
  }
  
  return {
    value: result,
    name: `api_key_${format}${length}`,
    description: `Generated API key in ${format} format`,
    metadata: {
      type: 'api_key',
      format,
      length,
      algorithm: 'secure_random',
      entropy_bits: calculateEntropy(format === 'hex' ? 16 : 64, length),
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate bearer token
 */
export function generateBearerToken(length: number = 128): GenerationResult {
  const result = generateApiKey('base64url', length);
  return {
    ...result,
    name: 'bearer_token',
    description: 'Generated bearer token for API authentication'
  };
}

/**
 * Generate JWT secret
 */
export function generateJwtSecret(length: number = 64): GenerationResult {
  const bytes = getSecureRandomBytes(length);
  const result = bytesToBase64Url(bytes);
  
  return {
    value: result,
    name: 'jwt_secret',
    description: 'Generated JWT signing secret',
    metadata: {
      type: 'jwt_secret',
      length: result.length,
      algorithm: 'secure_random',
      entropy_bits: length * 8,
      use_case: 'jwt_signing',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate session token
 */
export function generateSessionToken(length: number = 32): GenerationResult {
  const result = generateApiKey('base64url', length);
  return {
    ...result,
    name: 'session_token',
    description: 'Generated session token for web session management'
  };
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(length: number = 32): GenerationResult {
  const result = generateApiKey('base64url', length);
  return {
    ...result,
    name: 'csrf_token',
    description: 'Generated CSRF token for cross-site request forgery protection'
  };
}

// ============================================================================
// Cryptographic Element Generation Functions
// ============================================================================

/**
 * Generate salt for password hashing
 */
export function generateSalt(length: number = 32): GenerationResult {
  const bytes = getSecureRandomBytes(length);
  const result = bytesToBase64(bytes);
  
  return {
    value: result,
    name: 'password_salt',
    description: 'Generated salt for secure password hashing',
    metadata: {
      type: 'password_salt',
      length: result.length,
      algorithm: 'secure_random',
      entropy_bits: length * 8,
      use_case: 'password_hashing',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate initialization vector (IV)
 */
export function generateIv(algorithm: string = 'aes256'): GenerationResult {
  // Common IV sizes for different algorithms
  const ivSizes: Record<string, number> = {
    'aes128': 16,
    'aes192': 16,
    'aes256': 16,
    'des': 8,
    'blowfish': 8,
    'chacha20': 12
  };
  
  const size = ivSizes[algorithm.toLowerCase()] || 16;
  const bytes = getSecureRandomBytes(size);
  const result = bytesToHex(bytes);
  
  return {
    value: result,
    name: 'initialization_vector',
    description: `Generated initialization vector for ${algorithm} encryption`,
    metadata: {
      type: 'initialization_vector',
      length: result.length,
      algorithm,
      byte_size: size,
      entropy_bits: size * 8,
      use_case: 'encryption',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate HMAC key
 */
export function generateHmacKey(length: number = 64): GenerationResult {
  const bytes = getSecureRandomBytes(length);
  const result = bytesToBase64(bytes);
  
  return {
    value: result,
    name: 'hmac_key',
    description: 'Generated HMAC key for message authentication',
    metadata: {
      type: 'hmac_key',
      length: result.length,
      algorithm: 'secure_random',
      entropy_bits: length * 8,
      use_case: 'message_authentication',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate encryption key
 */
export function generateEncryptionKey(algorithm: string = 'aes256'): GenerationResult {
  // Common key sizes for different algorithms
  const keySizes: Record<string, number> = {
    'aes128': 16,
    'aes192': 24,
    'aes256': 32,
    'des': 8,
    'blowfish': 16,
    'chacha20': 32
  };
  
  const size = keySizes[algorithm.toLowerCase()] || 32;
  const bytes = getSecureRandomBytes(size);
  const result = bytesToBase64(bytes);
  
  return {
    value: result,
    name: 'encryption_key',
    description: `Generated encryption key for ${algorithm}`,
    metadata: {
      type: 'encryption_key',
      length: result.length,
      algorithm,
      byte_size: size,
      entropy_bits: size * 8,
      use_case: 'encryption',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate nonce (number used once)
 */
export function generateNonce(length: number = 32): GenerationResult {
  const bytes = getSecureRandomBytes(length);
  const result = bytesToBase64Url(bytes);
  
  return {
    value: result,
    name: 'nonce',
    description: 'Generated nonce for cryptographic operations',
    metadata: {
      type: 'nonce',
      length: result.length,
      algorithm: 'secure_random',
      entropy_bits: length * 8,
      use_case: 'cryptographic_operations',
      generated_at: new Date().toISOString()
    }
  };
}

// ============================================================================
// Service-Specific Generation Functions
// ============================================================================

/**
 * Generate AWS-style credentials
 */
export function generateAwsCredentials(): GenerationResult {
  const accessKey = 'AKIA' + generateAlphanumeric(16).value;
  const secretKey = generateApiKey('base64', 40).value;
  
  const result = {
    access_key: accessKey,
    secret_key: secretKey
  };
  
  return {
    value: JSON.stringify(result, null, 2),
    name: 'aws_credentials',
    description: 'Generated AWS-style access credentials',
    metadata: {
      type: 'aws_credentials',
      length: JSON.stringify(result).length,
      algorithm: 'aws_format',
      components: ['access_key', 'secret_key'],
      access_key_format: 'AKIA + 16 alphanumeric',
      secret_key_format: 'base64 40 chars',
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate GitHub token format
 */
export function generateGithubToken(): GenerationResult {
  const prefix = 'ghp_';
  const token = generateAlphanumeric(36).value;
  const result = prefix + token;
  
  return {
    value: result,
    name: 'github_token',
    description: 'Generated GitHub personal access token format',
    metadata: {
      type: 'github_token',
      length: result.length,
      algorithm: 'github_format',
      prefix: 'ghp_',
      token_length: 36,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Generate database password
 */
export function generateDatabasePassword(length: number = 20): GenerationResult {
  return generatePassword(length, {
    include_uppercase: true,
    include_lowercase: true,
    include_numbers: true,
    include_special_chars: true,
    exclude_ambiguous: true,
    special_char_set: '@#$%^&*_+-=',
    strength: 'maximum'
  });
}

// ============================================================================
// Batch Generation Function
// ============================================================================

export interface BatchRequest {
  type: string;
  count: number;
  options?: any;
}

/**
 * Generate multiple credentials in batch
 */
export function generateBatch(requests: BatchRequest[]): GenerationResult {
  const results: Record<string, GenerationResult[]> = {};
  
  for (const request of requests) {
    const { type, count, options = {} } = request;
    results[type] = [];
    
    for (let i = 0; i < count; i++) {
      let result: GenerationResult;
      
      switch (type) {
        case 'uuid4':
          result = generateUuid4();
          break;
        case 'ulid':
          result = generateUlid();
          break;
        case 'nano_id':
          result = generateNanoId(options.length);
          break;
        case 'password':
          result = generatePassword(options.length || 16, options);
          break;
        case 'api_key':
          result = generateApiKey(options.format, options.length);
          break;
        case 'random_string':
          result = generateRandomString(options.length || 32, options);
          break;
        default:
          throw new Error(`Unknown credential type: ${type}`);
      }
      
      results[type].push(result);
    }
  }
  
  return {
    value: JSON.stringify(results, null, 2),
    name: 'batch_generation',
    description: 'Generated multiple credentials in batch',
    metadata: {
      type: 'batch_generation',
      length: JSON.stringify(results).length,
      algorithm: 'batch_secure_random',
      total_items: requests.reduce((sum, req) => sum + req.count, 0),
      types_generated: Object.keys(results),
      generated_at: new Date().toISOString()
    }
  };
}