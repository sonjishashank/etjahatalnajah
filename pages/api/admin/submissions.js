import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { db } from '../../../lib/db'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' })
    }

    if (req.method === 'GET') {
      // Get all submissions
      const submissions = await db.getAll()
      res.status(200).json(submissions || [])
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Admin submissions API error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}