const { Pool } = require('pg');
require('dotenv').config();

// Database configuration using your settings
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'localfix'
};

// Connection pool configuration
const pool = new Pool({
    user: dbConfig.user,
    password: dbConfig.password,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    min: 0,                      // No minimum - connections created on demand
    max: 10,                     // maximum pool size
    idleTimeoutMillis: 600000,   // 10 minutes - keep connections longer with keepalive
    connectionTimeoutMillis: 10000, // 10 seconds to wait for a free connection
    // Connection keepalive settings to prevent timeouts
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, // 10 seconds before first keepalive probe
    // Allow the pool to remove broken connections
    allowExitOnIdle: false
});

// Handle pool errors to prevent crashes
pool.on('error', (err, client) => {
    console.error('⚠️ Unexpected database pool error:', err.message);
    // Pool will automatically try to reconnect
});

pool.on('connect', () => {
    console.log('🔗 New database connection established');
});

pool.on('remove', () => {
    console.log('🔌 Database connection removed from pool');
});

async function initializeDatabase() {
    try {
        // Test connection
        const client = await pool.connect();
        const result = await client.query(`SELECT 'Database Connected!' as message`);
        console.log('✅ PostgreSQL connection pool created successfully');
        console.log('✅', result.rows[0].message);
        client.release();
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
}

async function closeDatabase() {
    try {
        await pool.end();
        console.log('Database connection pool closed');
    } catch (error) {
        console.error('Error closing database:', error);
    }
}

async function executeQuery(sql, params = []) {
    try {
        // Convert named parameters (:param) to positional parameters ($1, $2, etc.)
        let paramIndex = 1;
        const paramMap = {};
        
        // Handle both array and object params
        let queryParams = params;
        let convertedSql = sql;
        
        if (!Array.isArray(params) && typeof params === 'object') {
            // Convert named parameters to positional
            queryParams = [];
            convertedSql = sql.replace(/:(\w+)/g, (match, paramName) => {
                if (!paramMap[paramName]) {
                    paramMap[paramName] = paramIndex++;
                    queryParams.push(params[paramName]);
                }
                return `$${paramMap[paramName]}`;
            });
        }

        const result = await pool.query(convertedSql, queryParams);

        return {
            success: true,
            rows: result.rows,
            rowsAffected: result.rowCount,
            rowCount: result.rowCount
        };
    } catch (error) {
        // Log a safe preview for troubleshooting
        const sqlPreview = (typeof sql === 'string') ? sql.slice(0, 200) : '[non-string-sql]';
        console.error("Database query error:", error, { sqlPreview, params: sanitizeBindsForLogging(params) });
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// For complex transactions with multiple operations
async function executeMultipleQueries(queries) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        
        for (const { sql, binds = [] } of queries) {
            // Convert named parameters
            let paramIndex = 1;
            const paramMap = {};
            let queryParams = binds;
            let convertedSql = sql;
            
            if (!Array.isArray(binds) && typeof binds === 'object') {
                queryParams = [];
                convertedSql = sql.replace(/:(\w+)/g, (match, paramName) => {
                    if (!paramMap[paramName]) {
                        paramMap[paramName] = paramIndex++;
                        queryParams.push(binds[paramName]);
                    }
                    return `$${paramMap[paramName]}`;
                });
            }
            
            const result = await client.query(convertedSql, queryParams);
            results.push({
                success: true,
                rows: result.rows,
                rowsAffected: result.rowCount,
                rowCount: result.rowCount
            });
        }
        
        await client.query('COMMIT');
        
        return {
            success: true,
            results
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database transaction error:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    } finally {
        client.release();
    }
}

// Helper function to get connection for custom operations
async function getConnection() {
    return await pool.connect();
}

// Helper function to format bind parameters for logging (removes sensitive data)
function sanitizeBindsForLogging(binds) {
    if (Array.isArray(binds)) return binds.map(bind => typeof bind === 'string' && bind.length > 50 ? '[LONG_STRING]' : bind);
    if (typeof binds === 'object' && binds !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(binds)) {
            if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
                sanitized[key] = '[HIDDEN]';
            } else if (typeof value === 'string' && value.length > 50) {
                sanitized[key] = '[LONG_STRING]';
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    return binds;
}

module.exports = {
    initializeDatabase,
    closeDatabase,
    executeQuery,        // For all operations
    executeMultipleQueries, // For complex transactions
    getConnection,       // For custom operations that need manual connection handling
    dbConfig,
    pool                // Export pool for direct access if needed
};