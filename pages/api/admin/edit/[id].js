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

    const { id } = req.query

    if (req.method === 'PUT') {
      const { 
        handover_date, plate_no, vehicle_type, vehicle_type_other, 
        handover_by, takeover_by, id_no, contact_no, odo_meter_reading, 
        registration_card, vehicle_authorization, remarks, notes 
      } = req.body

      // Update submission
      const updateResult = await query(
        `UPDATE vehicle_submissions SET 
         handover_date = ?, plate_no = ?, vehicle_type = ?, vehicle_type_other = ?,
         handover_by = ?, takeover_by = ?, id_no = ?, contact_no = ?, 
         odo_meter_reading = ?, registration_card = ?, vehicle_authorization = ?,
         remarks = ?, notes = ?, updated_at = NOW() 
         WHERE id = ?`,
        [
          handover_date, plate_no, vehicle_type, vehicle_type_other,
          handover_by, takeover_by, id_no, contact_no, odo_meter_reading,
          registration_card, vehicle_authorization, remarks, notes, id
        ]
      )

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Submission not found.' })
      }

      // Get updated submission data
      const updatedSubmission = await query(
        'SELECT * FROM vehicle_submissions WHERE id = ?',
        [id]
      )

      res.status(200).json({ 
        message: 'Submission updated successfully',
        submission: updatedSubmission[0]
      })

    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Edit submission API error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}