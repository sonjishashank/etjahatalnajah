import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Create signatures directory if it doesn't exist
    const signaturesDir = path.join(process.cwd(), 'public', 'signatures')
    if (!fs.existsSync(signaturesDir)) {
      fs.mkdirSync(signaturesDir, { recursive: true })
    }

    // Test signature data (base64 encoded 1x1 pixel PNG)
    const testSignatureBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
    
    // Save test signature
    const signatureFilename = `test-signature-${Date.now()}.png`
    const signaturePath = path.join(signaturesDir, signatureFilename)
    
    fs.writeFileSync(signaturePath, testSignatureBase64, 'base64')
    
    const relativePath = `/signatures/${signatureFilename}`
    
    res.status(200).json({ 
      message: 'Test signature saved successfully',
      path: relativePath,
      fullPath: signaturePath
    })
  } catch (error) {
    console.error('Test signature error:', error)
    res.status(500).json({ 
      message: 'Error saving test signature',
      error: error.message 
    })
  }
}