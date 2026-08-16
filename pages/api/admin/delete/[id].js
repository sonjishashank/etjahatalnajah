import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { db } from '../../../../lib/db'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' })
    }

    const { id } = req.query

    if (req.method === 'DELETE') {
      // Delete submission
      const success = await db.deleteById(id)

      if (success) {
        res.status(200).json({ message: 'Submission deleted successfully' })
      } else {
        res.status(404).json({ message: 'Submission not found' })
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Delete submission API error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}