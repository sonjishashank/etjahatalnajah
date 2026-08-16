import { useState } from 'react'

export default function ImageModal({ src, alt, isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold"
        >
          ✕
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

export function ImageGallery({ images, title, type = 'image' }) {
  const [selectedImage, setSelectedImage] = useState(null)

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {title.toLowerCase()} available
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imagePath, index) => (
          <div key={index} className="image-item">
            <img
              src={imagePath}
              alt={`${type} ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedImage({ src: imagePath, alt: `${type} ${index + 1}` })}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
              <span className="text-white opacity-0 hover:opacity-100 text-sm font-medium">
                Click to enlarge
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <ImageModal
        src={selectedImage?.src}
        alt={selectedImage?.alt}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  )
}

export function SignatureDisplay({ signature, label }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        {label}
      </label>
      {signature ? (
        <div className="signature-container">
          <img
            src={signature}
            alt={label}
            className="signature-image cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowModal(true)}
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Click to view full size
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-100 text-center text-gray-500">
          No signature provided
        </div>
      )}
      
      <ImageModal
        src={signature}
        alt={label}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}