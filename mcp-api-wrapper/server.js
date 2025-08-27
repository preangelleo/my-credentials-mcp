const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'my_credentials_db',
  user: process.env.DB_USER || 'mcp_user',
  password: process.env.DB_PASSWORD,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Parse privileged users from environment
const PRIVILEGED_USERS = new Set(
  (process.env.PRIVILEGED_USERS || 'preangelleo,coleam00').split(',').map(u => u.trim())
);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Security validation helpers
function validateSqlQuery(sql) {
  const dangerousPatterns = [
    /;.*drop\s+/i,
    /;.*delete.*where\s+1\s*=\s*1/i,
    /;.*truncate\s+/i,
    /;.*alter\s+/i,
    /\/\*.*\*\//,
    /--.*$/m,
    /union.*select/i,
    /exec\s*\(/i,
    /sp_/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      return { isValid: false, error: `Potentially dangerous SQL pattern detected: ${pattern}` };
    }
  }
  
  return { isValid: true };
}

function isWriteOperation(sql) {
  const writeKeywords = ['insert', 'update', 'delete', 'create', 'drop', 'alter', 'truncate'];
  const trimmedSql = sql.trim().toLowerCase();
  return writeKeywords.some(keyword => trimmedSql.startsWith(keyword));
}

function formatDatabaseError(error) {
  if (error.message.includes('password')) {
    return 'Database authentication failed. Please check credentials.';
  }
  if (error.message.includes('timeout')) {
    return 'Database connection timed out. Please try again.';
  }
  if (error.message.includes('does not exist')) {
    return 'Database table or column does not exist.';
  }
  return `Database error: ${error.message}`;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    service: 'mcp-api-wrapper'
  });
});

// List tables endpoint
app.get('/api/tables', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Get table information
      const tablesQuery = `
        SELECT 
          table_name,
          table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      
      const tables = await client.query(tablesQuery);
      
      // Get column information for each table
      const tableInfo = [];
      for (const table of tables.rows) {
        const columnsQuery = `
          SELECT 
            column_name as name,
            data_type as type,
            is_nullable::boolean as nullable,
            column_default as default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `;
        
        const columns = await client.query(columnsQuery, [table.table_name]);
        
        tableInfo.push({
          name: table.table_name,
          schema: table.table_schema,
          columns: columns.rows.map(col => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            default: col.default
          }))
        });
      }
      
      res.json({
        success: true,
        data: tableInfo,
        count: tableInfo.length,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in /api/tables:', error);
    res.status(500).json({
      success: false,
      error: formatDatabaseError(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Query endpoint (read-only)
app.post('/api/query', async (req, res) => {
  try {
    const { sql, username } = req.body;
    
    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }
    
    // Validate SQL
    const validation = validateSqlQuery(sql);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Invalid SQL query: ${validation.error}`
      });
    }
    
    // Check if it's a write operation
    if (isWriteOperation(sql)) {
      return res.status(403).json({
        success: false,
        error: 'Write operations not allowed. Use /api/execute endpoint.'
      });
    }
    
    const client = await pool.connect();
    
    try {
      const startTime = Date.now();
      const result = await client.query(sql);
      const duration = Date.now() - startTime;
      
      console.log(`Query executed by ${username || 'unknown'} in ${duration}ms`);
      
      res.json({
        success: true,
        data: result.rows,
        rowCount: result.rowCount,
        duration: `${duration}ms`,
        executedBy: username || 'unknown',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in /api/query:', error);
    res.status(500).json({
      success: false,
      error: formatDatabaseError(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Execute endpoint (read/write operations for privileged users)
app.post('/api/execute', async (req, res) => {
  try {
    const { sql, username } = req.body;
    
    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'SQL statement is required'
      });
    }
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required for execute operations'
      });
    }
    
    // Check if user has write permissions
    if (!PRIVILEGED_USERS.has(username)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. User '${username}' does not have execute privileges.`,
        requiredRole: 'privileged',
        allowedUsers: Array.from(PRIVILEGED_USERS)
      });
    }
    
    // Validate SQL
    const validation = validateSqlQuery(sql);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Invalid SQL statement: ${validation.error}`
      });
    }
    
    const client = await pool.connect();
    
    try {
      const startTime = Date.now();
      const result = await client.query(sql);
      const duration = Date.now() - startTime;
      const isWrite = isWriteOperation(sql);
      
      console.log(`${isWrite ? 'Write' : 'Read'} operation executed by ${username} in ${duration}ms`);
      
      res.json({
        success: true,
        data: result.rows,
        rowCount: result.rowCount,
        operation: isWrite ? 'write' : 'read',
        duration: `${duration}ms`,
        executedBy: username,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in /api/execute:', error);
    res.status(500).json({
      success: false,
      error: formatDatabaseError(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/tables',
      'POST /api/query',
      'POST /api/execute'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP API Wrapper server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`👥 Privileged users: ${Array.from(PRIVILEGED_USERS).join(', ')}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connection established');
    client.query('SELECT NOW() as server_time', (err, result) => {
      release();
      if (err) {
        console.error('❌ Database query test failed:', err);
      } else {
        console.log(`🕐 Database server time: ${result.rows[0].server_time}`);
      }
    });
  }
});