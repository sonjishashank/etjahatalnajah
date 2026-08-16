import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { query } from '../../../../lib/db'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session || session.user.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const submissions = await query(`
        SELECT vs.*, u.name as user_name, u.email as user_email
        FROM vehicle_submissions vs
        JOIN users u ON vs.user_id = u.id
        WHERE vs.id = ?
      `, [id])

      if (submissions.length === 0) {
        return res.status(404).json({ message: 'Submission not found' })
      }

      res.status(200).json(submissions[0])
    } catch (error) {
      console.error('Error fetching submission:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session || session.user.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const {
        handoverDate, plateNo, vehicleType, handoverBy, takeoverBy,
        idNo, odoMeterReading, registrationCard, vehicleAuthorization,
        remarks, contactNo
      } = req.body

      await query(`
        UPDATE vehicle_submissions SET
          handover_date = ?, plate_no = ?, vehicle_type = ?, handover_by = ?,
          takeover_by = ?, id_no = ?, odo_meter_reading = ?, registration_card = ?,
          vehicle_authorization = ?, remarks = ?, contact_no = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        handoverDate, plateNo, vehicleType, handoverBy, takeoverBy,
        idNo, parseInt(odoMeterReading), registrationCard, vehicleAuthorization,
        remarks || null, contactNo, id
      ])

      res.status(200).json({ message: 'Submission updated successfully' })
    } catch (error) {
      console.error('Error updating submission:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}