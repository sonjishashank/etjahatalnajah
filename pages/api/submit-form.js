import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { query } from '../../lib/db'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Getting session...')
    const session = await getServerSession(req, res, authOptions)
    console.log('Session:', session)
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!session.user || !session.user.id) {
      console.error('Session user or user ID missing:', session.user)
      return res.status(401).json({ message: 'User ID not found in session' })
    }

    // Create uploads and signatures directories if they don't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const signaturesDir = path.join(process.cwd(), 'public', 'signatures')
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    if (!fs.existsSync(signaturesDir)) {
      fs.mkdirSync(signaturesDir, { recursive: true })
    }

    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true
    })

    console.log('Parsing form data...')
    const [fields, files] = await form.parse(req)
    console.log('Fields received:', Object.keys(fields))
    console.log('Files received:', Object.keys(files))

    // Process form data
    const formData = {}
    Object.keys(fields).forEach(key => {
      formData[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key]
    })
    
    console.log('Processed form data:', formData)

    // Process uploaded files
    const vehiclePictures = []
    const accessoriesPictures = []

    Object.keys(files).forEach(key => {
      const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]]
      
      fileArray.forEach(file => {
        if (file && file.filepath) {
          const filename = `${Date.now()}-${file.originalFilename}`
          const newPath = path.join(uploadsDir, filename)
          
          try {
            fs.renameSync(file.filepath, newPath)
            const relativePath = `/uploads/${filename}`
            
            if (key.startsWith('vehiclePicture')) {
              vehiclePictures.push(relativePath)
            } else if (key.startsWith('accessoryPicture')) {
              accessoriesPictures.push(relativePath)
            }
          } catch (error) {
            console.error('File move error:', error)
          }
        }
      })
    })

    // Process signatures - save as image files
    let handoverSignaturePath = null
    let takeoverSignaturePath = null

    if (formData.handoverSignature && formData.handoverSignature.startsWith('data:image/')) {
      try {
        const base64Data = formData.handoverSignature.replace(/^data:image\/png;base64,/, '')
        const signatureFilename = `handover-signature-${Date.now()}.png`
        const signaturePath = path.join(signaturesDir, signatureFilename)
        
        fs.writeFileSync(signaturePath, base64Data, 'base64')
        handoverSignaturePath = `/signatures/${signatureFilename}`
        console.log('Handover signature saved:', handoverSignaturePath)
      } catch (error) {
        console.error('Error saving handover signature:', error)
      }
    }

    if (formData.takeoverSignature && formData.takeoverSignature.startsWith('data:image/')) {
      try {
        const base64Data = formData.takeoverSignature.replace(/^data:image\/png;base64,/, '')
        const signatureFilename = `takeover-signature-${Date.now()}.png`
        const signaturePath = path.join(signaturesDir, signatureFilename)
        
        fs.writeFileSync(signaturePath, base64Data, 'base64')
        takeoverSignaturePath = `/signatures/${signatureFilename}`
        console.log('Takeover signature saved:', takeoverSignaturePath)
      } catch (error) {
        console.error('Error saving takeover signature:', error)
      }
    }

    // Insert into database with pending approval status
    const insertQuery = `
      INSERT INTO vehicle_submissions (
        user_id, handover_date, plate_no, vehicle_type, vehicle_type_other, handover_by, takeover_by,
        id_no, odo_meter_reading, registration_card, vehicle_authorization,
        remarks, notes, contact_no, vehicle_pictures, accessories_pictures,
        handover_signature, takeover_signature, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const values = [
      session.user.id,
      formData.handoverDate || null,
      formData.plateNo || null,
      formData.vehicleType || null,
      formData.vehicleTypeOther || null, // New field for "OTHER" vehicle type
      formData.handoverBy || null,
      formData.takeoverBy || null,
      formData.idNo || null,
      formData.odoMeterReading ? parseInt(formData.odoMeterReading) : null,
      formData.registrationCard || null,
      formData.vehicleAuthorization || null,
      formData.remarks || null,
      formData.notes || null, // New field for additional notes
      formData.contactNo || null,
      JSON.stringify(vehiclePictures),
      JSON.stringify(accessoriesPictures),
      handoverSignaturePath,
      takeoverSignaturePath,
      'pending' // Default approval status
    ]

    console.log('Executing database query...')
    console.log('Query:', insertQuery)
    console.log('Values:', values)
    
    const result = await query(insertQuery, values)
    console.log('Database result:', result)

    res.status(200).json({ message: 'Form submitted successfully' })
  } catch (error) {
    console.error('Submit form error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}