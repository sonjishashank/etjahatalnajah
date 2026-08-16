import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 2, // Reduced from 10 to 2
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 30000, // Close idle connections after 30 seconds
  maxIdle: 1, // Maximum idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

let pool;

export async function getConnection() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function query(sql, params = []) {
  let connection;
  try {
    const pool = await getConnection();
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release(); // Always release the connection back to the pool
    }
  }
}

// Function to close all connections (useful for cleanup)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Vehicle submissions functions
export const db = {
  // Get all vehicle submissions
  async getAll() {
    const sql = `
      SELECT vs.*, u.name as user_name, u.email as user_email 
      FROM vehicle_submissions vs 
      LEFT JOIN users u ON vs.user_id = u.id 
      ORDER BY vs.created_at DESC
    `;
    return await query(sql);
  },

  // Get vehicle submission by ID
  async getById(id) {
    const sql = `
      SELECT vs.*, u.name as user_name, u.email as user_email 
      FROM vehicle_submissions vs 
      LEFT JOIN users u ON vs.user_id = u.id 
      WHERE vs.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  },

  // Update vehicle submission
  async update(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const sql = `UPDATE vehicle_submissions SET ${fields}, updated_at = NOW() WHERE id = ?`;
    const result = await query(sql, [...values, id]);
    return result.affectedRows > 0 ? await this.getById(id) : null;
  },

  // Update vehicle submission (alias for compatibility)
  async updateById(id, data) {
    return await this.update(id, data);
  },

  // Delete vehicle submission
  async delete(id) {
    const sql = 'DELETE FROM vehicle_submissions WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },

  // Delete vehicle submission (alias for compatibility)
  async deleteById(id) {
    return await this.delete(id);
  },

  // Get users
  async getUsers() {
    const sql = 'SELECT id, email, name, role, designation, created_at FROM users ORDER BY created_at DESC';
    return await query(sql);
  },

  // Get user by ID
  async getUserById(id) {
    const sql = 'SELECT id, email, name, role, designation, created_at FROM users WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  },

  // Update user
  async updateUser(id, data) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const sql = `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = ?`;
    return await query(sql, [...values, id]);
  },

  // Delete user
  async deleteUser(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    return await query(sql, [id]);
  }
};