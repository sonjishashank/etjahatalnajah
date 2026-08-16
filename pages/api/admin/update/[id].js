import { db } from '../../../../lib/db'

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const { id } = req.query

    try {
        const updatedSubmission = await db.updateById(id, req.body)
        
        if (!updatedSubmission) {
            return res.status(404).json({ message: 'Submission not found' })
        }

        res.status(200).json({ 
            message: 'Submission updated successfully',
            submission: updatedSubmission 
        })
    } catch (error) {
        console.error('Error updating submission:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}