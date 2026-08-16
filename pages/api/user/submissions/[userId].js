import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    // Check if user is authenticated
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { userId } = req.query

    // Check if user is requesting their own submissions or is an admin
    if (session.user.id !== parseInt(userId) && session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only view your own submissions.' })
    }

    if (req.method === 'GET') {
      // Get user's submissions with approval status
      const submissions = await query(
        `SELECT vs.*, u.name as user_name, u.email as user_email 
         FROM vehicle_submissions vs 
         LEFT JOIN users u ON vs.user_id = u.id 
         WHERE vs.user_id = ? 
         ORDER BY vs.created_at DESC`,
        [userId]
      )

      res.status(200).json(submissions || [])
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }

  } catch (error) {
    console.error('User submissions API error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}