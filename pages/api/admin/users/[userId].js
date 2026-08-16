import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' })
    }

    const { userId } = req.query

    if (req.method === 'PUT') {
      // Update user role or designation
      const { role, designation } = req.body

      if (role) {
        if (!['user', 'admin'].includes(role)) {
          return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin".' })
        }

        // Prevent admin from changing their own role to user (to avoid lockout)
        if (session.user.id === parseInt(userId) && role === 'user') {
          return res.status(400).json({ message: 'You cannot change your own role from admin to user.' })
        }

        const updateResult = await query(
          'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
          [role, userId]
        )

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found.' })
        }

        // Get updated user data
        const updatedUser = await query(
          'SELECT id, email, name, role, designation, created_at, updated_at FROM users WHERE id = ?',
          [userId]
        )

        res.status(200).json({ 
          message: 'User role updated successfully',
          user: updatedUser[0]
        })
      } else if (designation !== undefined) {
        // Update designation
        const updateResult = await query(
          'UPDATE users SET designation = ?, updated_at = NOW() WHERE id = ?',
          [designation, userId]
        )

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found.' })
        }

        // Get updated user data
        const updatedUser = await query(
          'SELECT id, email, name, role, designation, created_at, updated_at FROM users WHERE id = ?',
          [userId]
        )

        res.status(200).json({ 
          message: 'User designation updated successfully',
          user: updatedUser[0]
        })
      } else {
        return res.status(400).json({ message: 'Either role or designation must be provided.' })
      }

    } else if (req.method === 'DELETE') {
      // Delete user
      
      // Prevent admin from deleting themselves
      if (session.user.id === parseInt(userId)) {
        return res.status(400).json({ message: 'You cannot delete your own account.' })
      }

      // Check if user exists
      const userToDelete = await query(
        'SELECT id, role FROM users WHERE id = ?',
        [userId]
      )

      if (userToDelete.length === 0) {
        return res.status(404).json({ message: 'User not found.' })
      }

      // Delete user (this will cascade delete their submissions due to foreign key constraint)
      const deleteResult = await query(
        'DELETE FROM users WHERE id = ?',
        [userId]
      )

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found.' })
      }

      res.status(200).json({ 
        message: 'User deleted successfully',
        deletedUserId: userId
      })

    } else if (req.method === 'GET') {
      // Get user details
      const user = await query(
        'SELECT id, email, name, role, designation, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      )

      if (user.length === 0) {
        return res.status(404).json({ message: 'User not found.' })
      }

      // Get user's submission count
      const submissionCount = await query(
        'SELECT COUNT(*) as count FROM vehicle_submissions WHERE user_id = ?',
        [userId]
      )

      res.status(200).json({
        user: user[0],
        submissionCount: submissionCount[0].count
      })

    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }

  } catch (error) {
    console.error('User management API error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}