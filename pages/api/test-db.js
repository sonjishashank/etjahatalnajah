import { query } from '../../lib/db'

export default async function handler(req, res) {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const result = await query('SELECT 1 as test')
    console.log('Database connection test result:', result)
    
    // Test users table
    const users = await query('SELECT COUNT(*) as count FROM users')
    console.log('Users count:', users)
    
    // Test vehicle_submissions table
    const submissions = await query('SELECT COUNT(*) as count FROM vehicle_submissions')
    console.log('Submissions count:', submissions)
    
    res.status(200).json({ 
      message: 'Database connection successful',
      usersCount: users[0].count,
      submissionsCount: submissions[0].count
    })
  } catch (error) {
    console.error('Database test error:', error)
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message 
    })
  }
}