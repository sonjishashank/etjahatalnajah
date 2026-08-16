import { query, closePool } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Test basic connection
      const result = await query('SELECT 1 as test')
      
      res.status(200).json({ 
        status: 'connected',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Database connection test failed:', error)
      
      res.status(500).json({ 
        status: 'error',
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      })
    }
  } else if (req.method === 'POST' && req.body.action === 'reset') {
    try {
      await closePool()
      res.status(200).json({ 
        status: 'reset',
        message: 'Connection pool reset successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error resetting connection pool:', error)
      res.status(500).json({ 
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}