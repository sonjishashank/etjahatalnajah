import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import SignatureCanvas from 'react-signature-canvas'
import { translations, getTranslation } from '../lib/translations'
import Head from 'next/head'

export default function VehicleHandoverForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const handoverSigRef = useRef()
  const takeoverSigRef = useRef()
  const [activeSection, setActiveSection] = useState('submit')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    role: session?.user?.role || '',
    designation: session?.user?.designation || '',
    language: 'en'
  })

  const [formData, setFormData] = useState({
    handoverDate: '',
    plateNo: '',
    vehicleType: '',
    vehicleTypeOther: '',
    handoverBy: '',
    takeoverBy: '',
    idNo: '',
    odoMeterReading: '',
    registrationCard: '',
    vehicleAuthorization: '',
    remarks: '',
    notes: '',
    contactNo: ''
  })

  // Separate state for plate number components
  const [plateNumbers, setPlateNumbers] = useState({
    num1: '',
    num2: '',
    num3: '',
    num4: '',
    letter1: '',
    letter2: '',
    letter3: ''
  })

  // State for custom plate number
  const [useCustomPlate, setUseCustomPlate] = useState(false)

  const [vehiclePictures, setVehiclePictures] = useState([])
  const [accessoriesPictures, setAccessoriesPictures] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for responsive canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 120 })

  const vehicleTypes = [
    'Backhoe Loader', 'Boom Truck', 'Bus', 'Coaster', 'Diesel Tanker',
    'Dyna IPV', 'Dyna Truck', 'Flat Bed Trailer', 'Food Truck', 'Forklift',
    'Minibus', 'Potable WT', 'Skid Steer Loader', 'SUV', 'Tow Truck',
    'Water Tanker', 'Sedan', 'Mobile Crane', 'Chain Excavator',
    'Wheel Excavator', 'Wheel Loader', 'Telehandler', 'Low Bed Trailer',
    'Pickup', 'Roller Compactor', 'Other'
  ]

  // Load preferred language on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage')
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage)
      setProfileData(prev => ({
        ...prev,
        language: savedLanguage
      }))
    }
  }, [])

  // Update profile data when session changes
  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || '',
        designation: session.user.designation || ''
      }))
    }
  }, [session])

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight

        if (screenWidth < 768) { // Mobile and tablet portrait
          // Calculate available width considering padding and margins
          const availableWidth = Math.min(screenWidth - 80, 320)
          const canvasHeight = screenWidth < 480 ? 120 : 140 // Taller on very small screens

          setCanvasSize({
            width: availableWidth,
            height: canvasHeight
          })
        } else { // Desktop
          setCanvasSize({ width: 350, height: 150 })
        }
      }
    }

    updateCanvasSize()

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateCanvasSize)
      window.addEventListener('orientationchange', () => {
        // Add a small delay to ensure orientation change is complete
        setTimeout(updateCanvasSize, 100)
      })

      return () => {
        window.removeEventListener('resize', updateCanvasSize)
        window.removeEventListener('orientationchange', updateCanvasSize)
      }
    }
  }, [])

  if (status === 'loading') return <div>Loading...</div>
  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle plate number dropdown changes
  const handlePlateNumberChange = (field, value) => {
    setPlateNumbers(prev => {
      const updated = { ...prev, [field]: value }
      // Combine all plate number components into plateNo
      const plateNo = `${updated.num1}${updated.num2}${updated.num3}${updated.num4}-${updated.letter1}${updated.letter2}${updated.letter3}`
      setFormData(prevForm => ({
        ...prevForm,
        plateNo: plateNo
      }))
      return updated
    })
  }

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files)
    const maxFiles = type === 'vehicle' ? 10 : 5

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed for ${type} pictures`)
      return
    }

    if (type === 'vehicle') {
      // Append new files to existing ones instead of replacing
      setVehiclePictures(prevFiles => {
        const combinedFiles = [...prevFiles, ...files]
        if (combinedFiles.length > maxFiles) {
          alert(`Maximum ${maxFiles} files allowed for vehicle pictures. Only first ${maxFiles} files will be kept.`)
          return combinedFiles.slice(0, maxFiles)
        }
        return combinedFiles
      })
    } else {
      // Append new files to existing ones instead of replacing
      setAccessoriesPictures(prevFiles => {
        const combinedFiles = [...prevFiles, ...files]
        if (combinedFiles.length > maxFiles) {
          alert(`Maximum ${maxFiles} files allowed for accessories pictures. Only first ${maxFiles} files will be kept.`)
          return combinedFiles.slice(0, maxFiles)
        }
        return combinedFiles
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()

      // Add form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })

      // Add signatures
      if (handoverSigRef.current && !handoverSigRef.current.isEmpty()) {
        formDataToSend.append('handoverSignature', handoverSigRef.current.toDataURL())
      }
      if (takeoverSigRef.current && !takeoverSigRef.current.isEmpty()) {
        formDataToSend.append('takeoverSignature', takeoverSigRef.current.toDataURL())
      }

      // Add files
      vehiclePictures.forEach((file, index) => {
        formDataToSend.append(`vehiclePicture${index}`, file)
      })
      accessoriesPictures.forEach((file, index) => {
        formDataToSend.append(`accessoryPicture${index}`, file)
      })

      const response = await fetch('/api/submit-form', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        alert(getTranslation('formSubmittedSuccess', currentLanguage))
        // Reset form
        setFormData({
          handoverDate: '', plateNo: '', vehicleType: '', vehicleTypeOther: '',
          handoverBy: '', takeoverBy: '', idNo: '', odoMeterReading: '',
          registrationCard: '', vehicleAuthorization: '', remarks: '',
          notes: '', contactNo: ''
        })
        setPlateNumbers({
          num1: '', num2: '', num3: '', num4: '',
          letter1: '', letter2: '', letter3: ''
        })
        setUseCustomPlate(false)
        setVehiclePictures([])
        setAccessoriesPictures([])
        handoverSigRef.current?.clear()
        takeoverSigRef.current?.clear()
      } else {
        alert(getTranslation('errorSubmittingForm', currentLanguage))
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert(getTranslation('errorSubmittingForm', currentLanguage))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language)
    setProfileData(prev => ({
      ...prev,
      language: language
    }))
    // Save to localStorage for persistence
    localStorage.setItem('preferredLanguage', language)
  }

  const handleProfileSave = async () => {
    try {
      // Here you would typically save to your backend
      // For now, we'll just update the local state
      alert(getTranslation('saveChanges', currentLanguage) + ' - ' + getTranslation('formSubmittedSuccess', currentLanguage))
    } catch (error) {
      console.error('Profile save error:', error)
      alert(getTranslation('errorSubmittingForm', currentLanguage))
    }
  }

  return (
    <>
      <Head>
        <style jsx>{`
          .signature-canvas {
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            background: white;
            display: block;
            margin: 0 auto;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
          }
          
          @media (max-width: 768px) {
            .signature-canvas {
              width: 100% !important;
              max-width: 320px !important;
              height: 120px !important;
            }
          }
          
          @media (max-width: 480px) {
            .signature-canvas {
              width: 100% !important;
              max-width: 280px !important;
              height: 140px !important;
            }
          }
          
          .signature-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            overflow: hidden;
          }
          
          /* Prevent scrolling when signing */
          .signature-container:active {
            overflow: hidden;
          }
          
          /* Improve touch responsiveness */
          .signature-canvas:active,
          .signature-canvas:focus {
            outline: none;
            border-color: #dc2626;
          }
        `}</style>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-0 w-64 h-full bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}>
          {/* Company Logo and Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center p-2">
                <img src="/images/Logo.png" alt="Company Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white">ETJAHAT AL NAJAH</h1>
                <p className="text-xs text-slate-300">Vehicle Handover System</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-4 h-full overflow-y-auto pb-20">
            <div className="px-4 space-y-2">
              <button
                onClick={() => {
                  setActiveSection('submit')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === 'submit'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-r-2 border-amber-400'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">{getTranslation('submitForm', currentLanguage)}</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('forms')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === 'forms'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-r-2 border-amber-400'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm">{getTranslation('myForms', currentLanguage)}</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('profile')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === 'profile'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-r-2 border-amber-400'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">{getTranslation('profile', currentLanguage)}</span>
              </button>

              <button
                onClick={() => {
                  if (session.user.role === 'admin') {
                    setActiveSection('admin')
                    setIsMobileMenuOpen(false)
                  } else {
                    alert('Access Denied: Only administrators can access the admin dashboard.')
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === 'admin'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border-r-2 border-amber-400'
                  : session.user.role === 'admin'
                    ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    : 'text-slate-500 cursor-not-allowed'
                  }`}
                disabled={session.user.role !== 'admin'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{getTranslation('adminDashboard', currentLanguage)}</span>
              </button>
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="absolute bottom-0 w-64 border-t border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            {/* Developer Credit */}
            <div className="px-4 py-2 border-b border-slate-700/50">
              <p className="text-xs text-slate-400 text-center">
                Developed by{' '}
                <a
                  href="https://starsetconsultancyservices.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 font-medium hover:text-amber-300 transition-colors cursor-pointer underline decoration-transparent hover:decoration-amber-300"
                >
                  Starset Consultancy Services
                </a>
              </p>
            </div>

            {/* User Profile */}
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-900">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-slate-300 capitalize">{session.user.role}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Sign Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div >

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Top Header - Sticky */}
          <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 backdrop-blur-sm shadow-lg border-b border-amber-500/20 px-4 lg:px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-amber-300 hover:text-amber-100 hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl from-amber-400 to-amber-600 p-2 flex items-center justify-center shadow-lg">
                    <img src="/images/Logo.png" alt="Company Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-sm lg:text-xl font-bold text-white bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent">شركة اتجاهات النجاح للمقاولات</h1>
                    <p className="text-xs lg:text-sm text-slate-300 font-medium">ETJAHAT AL NAJAH CONTRACTING CO.</p>
                  </div>
                  <div className="sm:hidden">
                    <h1 className="text-sm font-bold text-amber-300">Vehicle Handover System</h1>
                  </div>
                </div>
              </div>
              <div className="text-right bg-slate-700/50 rounded-lg px-3 py-2 backdrop-blur-sm">
                <p className="text-xs lg:text-sm text-amber-200 font-medium">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div >

          {/* Content Area */}
          <div className="flex-1 p-6">
            {activeSection === 'submit' && (
              <div className="max-w-4xl">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200">
                  <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-xl">
                    <h2 className="text-xl font-bold text-center text-white">{getTranslation('formTitle', currentLanguage)}</h2>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Basic Information Section */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center">
                          <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
                          Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Handover Date *
                            </label>
                            <input
                              type="date"
                              name="handoverDate"
                              value={formData.handoverDate}
                              onChange={handleInputChange}
                              required
                              placeholder="dd-mm-yyyy"
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vehicle Type *
                          </label>
                          <select
                            name="vehicleType"
                            value={formData.vehicleType}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                          >
                            <option value="">Select vehicle type</option>
                            {vehicleTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>

                          {/* Other Vehicle Type Text Box */}
                          {formData.vehicleType === 'Other' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Please specify vehicle type *
                              </label>
                              <input
                                type="text"
                                name="vehicleTypeOther"
                                value={formData.vehicleTypeOther}
                                onChange={handleInputChange}
                                required={formData.vehicleType === 'Other'}
                                placeholder="Enter vehicle type details..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Handover By *
                            </label>
                            <input
                              type="text"
                              name="handoverBy"
                              value={formData.handoverBy}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Takeover By *
                            </label>
                            <input
                              type="text"
                              name="takeoverBy"
                              value={formData.takeoverBy}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Details Section */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center">
                          <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
                          Vehicle Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Plate No *
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={useCustomPlate}
                                  onChange={(e) => {
                                    setUseCustomPlate(e.target.checked)
                                    if (e.target.checked) {
                                      // Clear dropdown values when switching to custom
                                      setPlateNumbers({
                                        num1: '', num2: '', num3: '', num4: '',
                                        letter1: '', letter2: '', letter3: ''
                                      })
                                      setFormData(prev => ({ ...prev, plateNo: '' }))
                                    } else {
                                      // Clear custom input when switching to dropdown
                                      setFormData(prev => ({ ...prev, plateNo: '' }))
                                    }
                                  }}
                                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 mr-2"
                                />
                                <span className="text-sm text-gray-600">Use custom plate number</span>
                              </label>
                            </div>

                            {useCustomPlate ? (
                              /* Custom Plate Number Input */
                              <input
                                type="text"
                                name="plateNo"
                                value={formData.plateNo}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter custom plate number"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                              />
                            ) : (
                              <>
                                {/* Mobile Layout */}
                                <div className="block sm:hidden">
                                  <div className="space-y-3">
                                    {/* Numbers Row */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">Numbers</label>
                                      <div className="flex justify-center space-x-2">
                                        {['num1', 'num2', 'num3', 'num4'].map((field, index) => (
                                          <select
                                            key={field}
                                            value={plateNumbers[field]}
                                            onChange={(e) => handlePlateNumberChange(field, e.target.value)}
                                            required
                                            className="w-14 h-12 px-1 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-center text-lg font-bold"
                                          >
                                            <option value="">-</option>
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                              <option key={num} value={num}>{num}</option>
                                            ))}
                                          </select>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Letters Row */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">Letters</label>
                                      <div className="flex justify-center space-x-2">
                                        {['letter1', 'letter2', 'letter3'].map((field, index) => (
                                          <select
                                            key={field}
                                            value={plateNumbers[field]}
                                            onChange={(e) => handlePlateNumberChange(field, e.target.value)}
                                            required
                                            className="w-14 h-12 px-1 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-center text-lg font-bold"
                                          >
                                            <option value="">-</option>
                                            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                                              <option key={letter} value={letter}>{letter}</option>
                                            ))}
                                          </select>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden sm:flex items-center space-x-2">
                                  {/* Numbers Section */}
                                  <div className="flex space-x-1">
                                    {['num1', 'num2', 'num3', 'num4'].map((field, index) => (
                                      <select
                                        key={field}
                                        value={plateNumbers[field]}
                                        onChange={(e) => handlePlateNumberChange(field, e.target.value)}
                                        required={!useCustomPlate}
                                        className="w-12 px-2 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-center"
                                      >
                                        <option value="">-</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                          <option key={num} value={num}>{num}</option>
                                        ))}
                                      </select>
                                    ))}
                                  </div>

                                  {/* Dash Separator */}
                                  <span className="text-gray-500 font-bold text-lg">-</span>

                                  {/* Letters Section */}
                                  <div className="flex space-x-1">
                                    {['letter1', 'letter2', 'letter3'].map((field, index) => (
                                      <select
                                        key={field}
                                        value={plateNumbers[field]}
                                        onChange={(e) => handlePlateNumberChange(field, e.target.value)}
                                        required={!useCustomPlate}
                                        className="w-12 px-2 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-center"
                                      >
                                        <option value="">-</option>
                                        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                                          <option key={letter} value={letter}>{letter}</option>
                                        ))}
                                      </select>
                                    ))}
                                  </div>
                                </div>

                                {/* Display the combined plate number */}
                                {formData.plateNo && !useCustomPlate && (
                                  <div className="mt-3 p-2 bg-gray-50 rounded-lg text-center">
                                    <span className="text-xs text-gray-500">Preview:</span>
                                    <div className="font-mono font-bold text-lg text-gray-900 mt-1">{formData.plateNo}</div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Assignee ID
                            </label>
                            <input
                              type="text"
                              name="idNo"
                              value={formData.idNo}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ODO Meter Reading
                            </label>
                            <input
                              type="number"
                              name="odoMeterReading"
                              value={formData.odoMeterReading}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Registration Card
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="registrationCard"
                                  value="yes"
                                  checked={formData.registrationCard === 'yes'}
                                  onChange={handleInputChange}
                                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Yes</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="registrationCard"
                                  value="no"
                                  checked={formData.registrationCard === 'no'}
                                  onChange={handleInputChange}
                                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">No</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Vehicle Authorization
                            </label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="vehicleAuthorization"
                                  value="complete"
                                  checked={formData.vehicleAuthorization === 'complete'}
                                  onChange={handleInputChange}
                                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Complete</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="vehicleAuthorization"
                                  value="incomplete"
                                  checked={formData.vehicleAuthorization === 'incomplete'}
                                  onChange={handleInputChange}
                                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Incomplete</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Conditional Remarks Field */}
                        {formData.vehicleAuthorization === 'incomplete' && (
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Remarks for Incomplete *
                            </label>
                            <textarea
                              name="remarks"
                              value={formData.remarks}
                              onChange={handleInputChange}
                              required={formData.vehicleAuthorization === 'incomplete'}
                              rows={4}
                              placeholder="Please specify the reason for incomplete authorization..."
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white resize-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact No.
                          </label>
                          <input
                            type="tel"
                            name="contactNo"
                            value={formData.contactNo}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                          />
                        </div>

                        {/* Notes Section */}
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Add any additional notes or comments..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white resize-none"
                          />
                        </div>
                      </div>

                      {/* Images Section */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center">
                          <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
                          Images
                        </h3>

                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <label className="text-sm font-medium text-gray-700">
                                Vehicle Pictures ({vehiclePictures.length}/10)
                              </label>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('vehicle-upload-camera').click()}
                                  className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                  title="Take Photo"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('vehicle-upload-file').click()}
                                  className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                  title="Upload Files"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <input
                              type="file"
                              multiple
                              accept="image/*,image/jpeg,image/png,image/gif"
                              capture="environment"
                              onChange={(e) => handleFileChange(e, 'vehicle')}
                              className="hidden"
                              id="vehicle-upload-camera"
                            />
                            <input
                              type="file"
                              multiple
                              accept="image/*,image/jpeg,image/png,image/gif"
                              onChange={(e) => handleFileChange(e, 'vehicle')}
                              className="hidden"
                              id="vehicle-upload-file"
                            />

                            {vehiclePictures.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Array.from(vehiclePictures).map((file, index) => (
                                  <div key={index} className="relative group">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Vehicle ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFiles = Array.from(vehiclePictures).filter((_, i) => i !== index)
                                        setVehiclePictures(newFiles)
                                      }}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center bg-gray-50">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-500 mb-2">No photos uploaded yet</p>
                                <p className="text-sm text-gray-400">Click "Add Photos" to upload images</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <label className="text-sm font-medium text-gray-700">
                                Accessories Pictures ({accessoriesPictures.length}/5)
                              </label>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('accessories-upload-camera').click()}
                                  className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                  title="Take Photo"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('accessories-upload-file').click()}
                                  className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                  title="Upload Files"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <input
                              type="file"
                              multiple
                              accept="image/*,image/jpeg,image/png,image/gif"
                              capture="environment"
                              onChange={(e) => handleFileChange(e, 'accessories')}
                              className="hidden"
                              id="accessories-upload-camera"
                            />
                            <input
                              type="file"
                              multiple
                              accept="image/*,image/jpeg,image/png,image/gif"
                              onChange={(e) => handleFileChange(e, 'accessories')}
                              className="hidden"
                              id="accessories-upload-file"
                            />

                            {accessoriesPictures.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Array.from(accessoriesPictures).map((file, index) => (
                                  <div key={index} className="relative group">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Accessory ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFiles = Array.from(accessoriesPictures).filter((_, i) => i !== index)
                                        setAccessoriesPictures(newFiles)
                                      }}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center bg-gray-50">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-500 mb-2">No photos uploaded yet</p>
                                <p className="text-sm text-gray-400">Click "Add Photos" to upload images</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Signatures Section */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center">
                          <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
                          Signatures
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Hand Over By Signature
                            </label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 sm:p-6 bg-gray-50">
                              <div className="signature-container">
                                <SignatureCanvas
                                  ref={handoverSigRef}
                                  canvasProps={{
                                    width: canvasSize.width,
                                    height: canvasSize.height,
                                    className: 'signature-canvas border border-gray-300 rounded bg-white',
                                    style: {
                                      touchAction: 'none',
                                      userSelect: 'none',
                                      WebkitUserSelect: 'none',
                                      MozUserSelect: 'none',
                                      msUserSelect: 'none',
                                      WebkitTouchCallout: 'none',
                                      WebkitTapHighlightColor: 'transparent'
                                    }
                                  }}
                                  backgroundColor="white"
                                  penColor="black"
                                  dotSize={1}
                                  minWidth={0.5}
                                  maxWidth={2.5}
                                  velocityFilterWeight={0.7}
                                />
                              </div>
                              <div className="text-center mt-3">
                                <svg className="w-5 h-5 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <p className="text-xs sm:text-sm text-gray-500">Sign Here</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handoverSigRef.current?.clear()}
                              className="mt-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                              Clear Signature
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Take Over By Signature
                            </label>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 sm:p-6 bg-gray-50">
                              <div className="signature-container">
                                <SignatureCanvas
                                  ref={takeoverSigRef}
                                  canvasProps={{
                                    width: canvasSize.width,
                                    height: canvasSize.height,
                                    className: 'signature-canvas border border-gray-300 rounded bg-white',
                                    style: {
                                      touchAction: 'none',
                                      userSelect: 'none',
                                      WebkitUserSelect: 'none',
                                      MozUserSelect: 'none',
                                      msUserSelect: 'none',
                                      WebkitTouchCallout: 'none',
                                      WebkitTapHighlightColor: 'transparent'
                                    }
                                  }}
                                  backgroundColor="white"
                                  penColor="black"
                                  dotSize={1}
                                  minWidth={0.5}
                                  maxWidth={2.5}
                                  velocityFilterWeight={0.7}
                                />
                              </div>
                              <div className="text-center mt-3">
                                <svg className="w-5 h-5 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <p className="text-xs sm:text-sm text-gray-500">Sign Here</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => takeoverSigRef.current?.clear()}
                              className="mt-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                              Clear Signature
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white py-4 px-6 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center shadow-lg transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isSubmitting ? 'Submitting...' : 'Submit Handover Form'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
            }

            {
              activeSection === 'forms' && (
                <div className="max-w-6xl">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
                    <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <div className="w-3 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-4"></div>
                        My Forms
                      </h2>
                    </div>
                    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                      <MyFormsSection userId={session.user.id} />
                    </div>
                  </div>
                </div>
              )
            }

            {
              activeSection === 'profile' && (
                <div className="max-w-2xl">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
                    <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <div className="w-3 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-4"></div>
                        {getTranslation('profileSettings', currentLanguage)}
                      </h2>
                    </div>
                    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                      <div className="space-y-8">
                        {/* Personal Information Section */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
                          <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center">
                            <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
                            {getTranslation('personalInformation', currentLanguage)}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {getTranslation('name', currentLanguage)}
                              </label>
                              <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {getTranslation('email', currentLanguage)}
                              </label>
                              <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {getTranslation('role', currentLanguage)}
                              </label>
                              <input
                                type="text"
                                value={profileData.role}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 capitalize"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {getTranslation('designation', currentLanguage)}
                              </label>
                              <input
                                type="text"
                                value={profileData.designation}
                                disabled
                                className={`w-full px-4 py-3 border border-gray-200 rounded-lg ${session?.user?.role !== 'admin'
                                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                                    : 'bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500'
                                  }`}
                                placeholder={session?.user?.role === 'admin' ? 'Enter designation...' : ''}
                              />
                              {session?.user?.role !== 'admin' && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Only administrators can edit designation
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Language Settings Section */}
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {getTranslation('language', currentLanguage)}
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {getTranslation('selectLanguage', currentLanguage)}
                              </label>
                              <div className="flex space-x-4">
                                <button
                                  onClick={() => handleLanguageChange('en')}
                                  className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${currentLanguage === 'en'
                                    ? 'border-red-500 bg-red-50 text-red-600'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                  <span className="mr-2">🇺🇸</span>
                                  {getTranslation('english', currentLanguage)}
                                </button>
                                <button
                                  onClick={() => handleLanguageChange('ar')}
                                  className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${currentLanguage === 'ar'
                                    ? 'border-red-500 bg-red-50 text-red-600'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                  <span className="mr-2">🇸🇦</span>
                                  {getTranslation('arabic', currentLanguage)}
                                </button>
                              </div>
                            </div>

                            {/* Language Preview */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-2">
                                {currentLanguage === 'en' ? 'Preview:' : 'معاينة:'}
                              </p>
                              <div className="space-y-1">
                                <p className="font-medium">{getTranslation('vehicleHandoverSystem', currentLanguage)}</p>
                                <p className="text-sm text-gray-600">{getTranslation('formTitle', currentLanguage)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="border-t pt-6">
                          <button
                            onClick={handleProfileSave}
                            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:frus-slate-700 hover:to-slate-800 text-white rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-lg transition-all duration-200"
                          >
                            {getTranslation('saveChanges', currentLanguage)}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {
              activeSection === 'admin' && (
                <div className="max-w-7xl w-full">
                  {session.user.role === 'admin' ? (
                    <AdminDashboardSection />
                  ) : (
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
                      <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                          <div className="w-3 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-4"></div>
                          Access Denied
                        </h2>
                      </div>
                      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                        <div className="text-center py-8">
                          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <h3 className="mt-4 text-lg font-medium text-slate-800">Access Restricted</h3>
                          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                            Only administrators can access the admin dashboard. Please contact your administrator if you need access.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </>
  )
}

// My Forms Section Component
function MyFormsSection({ userId }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest, oldest

  useEffect(() => {
    fetchMySubmissions()
  }, [])

  const fetchMySubmissions = async () => {
    try {
      const response = await fetch(`/api/user/submissions/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalForms = submissions.length
  const pendingForms = submissions.filter(sub =>
    (sub.approval_status || 'pending') === 'pending'
  ).length
  const approvedForms = submissions.filter(sub =>
    (sub.approval_status || 'pending') === 'approved'
  ).length
  const thisMonthForms = submissions.filter(sub => {
    const subDate = new Date(sub.handover_date)
    const now = new Date()
    return subDate.getMonth() === now.getMonth() &&
      subDate.getFullYear() === now.getFullYear()
  }).length

  // Filter and sort submissions
  const filteredSubmissions = submissions
    .filter(submission =>
      submission.plate_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.handover_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.takeover_by?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.handover_date || a.created_at)
      const dateB = new Date(b.handover_date || b.created_at)
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

  if (loading) {
    return <div className="text-center py-8">Loading your forms...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Forms</h2>
          <p className="text-gray-600 mt-1">View your submitted vehicle handover forms</p>
        </div>
        {/* <button
          onClick={() => setActiveSection('submit')}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit New Form
        </button> */}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Forms</p>
              <p className="text-3xl font-bold text-gray-900">{totalForms}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingForms}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{approvedForms}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-purple-600">{thisMonthForms}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by plate number, vehicle type, or names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Submitted Forms</h3>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No forms found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Submit your first vehicle handover form'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handover By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Takeover By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(submission.handover_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.plate_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.vehicle_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.handover_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.takeover_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${(submission.approval_status || 'pending') === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {(submission.approval_status || 'pending') === 'approved'
                          ? 'APPROVED'
                          : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(submission.created_at || submission.handover_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {/* <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/admin/view/${submission.id}`, '_blank')}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="text-gray-600 hover:text-gray-900"
                          title="Print"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      </div> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Profile Section Component
function ProfileSection({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xl">
            {user.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-sm text-gray-500 capitalize">Role: {user.role}</p>
        </div>
      </div>

      <div className="border-t pt-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Designation</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.designation || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Role</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">User ID</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
          </div>
        </dl>
      </div>

      {/* <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Account Actions</h4>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Change Password</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
          <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Update Profile</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div> */}
    </div>
  )
}

// Admin Dashboard Section Component
function AdminDashboardSection() {
  const [activeTab, setActiveTab] = useState('submissions')
  const [submissions, setSubmissions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [viewingSubmission, setViewingSubmission] = useState(null)
  const [editingSubmission, setEditingSubmission] = useState(null)
  const [sortBy, setSortBy] = useState('newest') // newest, oldest

  const vehicleTypes = [
    'Backhoe Loader', 'Boom Truck', 'Bus', 'Coaster', 'Diesel Tanker',
    'Dyna IPV', 'Dyna Truck', 'Flat Bed Trailer', 'Food Truck', 'Forklift',
    'Minibus', 'Potable WT', 'Skid Steer Loader', 'SUV', 'Tow Truck',
    'Water Tanker', 'Sedan', 'Mobile Crane', 'Chain Excavator',
    'Wheel Excavator', 'Wheel Loader', 'Telehandler', 'Low Bed Trailer',
    'Pickup', 'Roller Compactor', 'Other'
  ]

  // Fetch data when component mounts
  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [submissionsRes, usersRes] = await Promise.all([
        fetch('/api/admin/submissions'),
        fetch('/api/admin/users')
      ])

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/delete/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSubmissions(submissions.filter(sub => sub.id !== id))
      } else {
        alert('Failed to delete submission')
      }
    } catch (error) {
      console.error('Error deleting submission:', error)
      alert('Error deleting submission')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ))
        alert('User role updated successfully')
      } else {
        alert('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error updating user role')
    } finally {
      setLoading(false)
    }
  }

  const handleDesignationChange = (userId, newDesignation) => {
    // Update local state immediately for responsive UI
    setUsers(users.map(user =>
      user.id === userId ? { ...user, designation: newDesignation } : user
    ))
  }

  const handleDesignationBlur = async (userId, newDesignation) => {
    // Save to database when user finishes editing (on blur)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ designation: newDesignation }),
      })

      if (!response.ok) {
        alert('Failed to update user designation')
        // Revert the change if it failed
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error updating user designation:', error)
      alert('Error updating user designation')
      // Revert the change if it failed
      fetchAdminData()
    }
  }

  const handleApproval = async (submissionId, status) => {
    if (!confirm(`Are you sure you want to ${status} this submission?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/approve/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        // Update the submission in the local state
        setSubmissions(submissions.map(sub =>
          sub.id === submissionId ? { ...sub, approval_status: status } : sub
        ))
        alert(`Submission ${status} successfully`)
      } else {
        alert(`Failed to ${status} submission`)
      }
    } catch (error) {
      console.error('Error updating approval status:', error)
      alert(`Error ${status}ing submission`)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = (submission) => {
    // Create a new window with the print content
    const printWindow = window.open('', '_blank')

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicle Handover Form - ${submission.plate_no}</title>
          <style>
            * {margin: 0; padding: 0; box-sizing: border-box; }
            body {font-family: Arial, sans-serif; padding: 20px; background: white; line-height: 1.4; }
            .header {text-align: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 15px; }
            .company-info {display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
            .logo {width: 60px; height: 60px; margin-right: 15px; flex-shrink: 0; }
            .logo img {width: 100%; height: 100%; object-fit: contain; }
            .company-text {text-align: right; }
            .company-text h2 {font-size: 18px; font-weight: bold; }
            .company-text p {font-size: 14px; }
            .form-title {font-size: 24px; font-weight: bold; text-decoration: underline; margin-top: 15px; }
            .date-info {text-align: right; margin-top: 10px; font-weight: bold; }
            table {width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            td, th {border: 1px solid black; padding: 8px; text-align: left; }
            .label {background-color: #f3f4f6; font-weight: bold; width: 33%; }
            .notes-section {margin: 20px 0; }
            .notes-title {font-weight: bold; margin-bottom: 15px; }
            .notes-lines {margin-bottom: 10px; }
            .line {border-bottom: 2px solid #000; height: 25px; margin-bottom: 15px; width: 100%; display: block; }
            .images-section {margin: 20px 0; }
            .images-grid {display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .image-container {border: 1px solid black; padding: 8px; text-align: center; }
            .image-container img {max-width: 100%; max-height: 200px; object-fit: contain; }
            .image-label {font-size: 12px; margin-top: 5px; }
            .signatures {display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; justify-content: space-between; }
            .signature-box {text-align: center; }
            .signature-line {border-bottom: 1px solid black; height: 80px; margin-bottom: 10px; display: flex; align-items: end; justify-content: center; }
            .signature-line img {max-height: 60px; max-width: 100%; }
            .signature-title {font-weight: bold; }
            .signature-name {font-size: 14px; }
            @media print {
              body {margin: 0; padding: 15px; }
            .page-break {page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="logo"><img src="/images/Logo.png" alt="Company Logo" /></div>
              <div class="company-text">
                <h2>شركة اتجاهات النجاح للمقاولات</h2>
                <p>ETJAHAT AL NAJAH CONTRACTING CO.</p>
              </div>
            </div>
            <h1 class="form-title">VEHICLE HAND OVER TAKE OVER FORM</h1>
            <div class="date-info">Date: ${new Date(submission.handover_date).toLocaleDateString()}</div>
          </div>

          <table>
            <tr>
              <td class="label">Vehicle Number</td>
              <td>${submission.plate_no}</td>
            </tr>
            <tr>
              <td class="label">Vehicle Type</td>
              <td>${submission.vehicle_type}</td>
            </tr>
            <tr>
              <td class="label">Hand Over by (Name)</td>
              <td>${submission.handover_by}</td>
            </tr>
            <tr>
              <td class="label">Take Over by (Name)</td>
              <td>${submission.takeover_by}</td>
            </tr>
            <tr>
              <td class="label">Registration Card</td>
              <td>${submission.registration_card === 'yes' ? 'Available' : 'Not Available'}</td>
            </tr>
            <tr>
              <td class="label">Assignee ID</td>
              <td>${submission.id_no}</td>
            </tr>
            <tr>
              <td class="label">ODO Meter Reading</td>
              <td>${submission.odo_meter_reading?.toLocaleString()} km</td>
            </tr>
            <tr>
              <td class="label">Contact Number</td>
              <td>${submission.contact_no}</td>
            </tr>
            <tr>
              <td class="label">TAMM Registration</td>
              <td>${submission.vehicle_authorization === 'complete' ? 'Complete' : 'Incomplete'}</td>
            </tr>
          </table>

          <div class="notes-section">
            
            ${submission.remarks ? `<div class="notes-lines"><p><strong>Remarks:</strong> ${submission.remarks}</p></div>` : ''}
            ${submission.notes ? `<div class="notes-lines"><p><strong>Additional Notes:</strong> ${submission.notes}</p></div>` : ''}
          </div>

          ${submission.vehicle_pictures && JSON.parse(submission.vehicle_pictures).length > 0 ? `
            <div class="images-section">
              <div class="notes-title">Vehicle Pictures:</div>
              <div class="images-grid">
                ${JSON.parse(submission.vehicle_pictures).slice(0, 6).map((picture, index) => `
                  <div class="image-container">
                    <img src="${picture}" alt="Vehicle ${index + 1}" />
                    <div class="image-label">Vehicle Image ${index + 1}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${submission.accessories_pictures && JSON.parse(submission.accessories_pictures).length > 0 ? `
            <div class="images-section">
              <div class="notes-title">Accessories Pictures:</div>
              <div class="images-grid">
                ${JSON.parse(submission.accessories_pictures).slice(0, 6).map((picture, index) => `
                  <div class="image-container">
                    <img src="${picture}" alt="Accessory ${index + 1}" />
                    <div class="image-label">Accessory Image ${index + 1}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">
                ${submission.handover_signature ? `<img src="${submission.handover_signature}" alt="Handover Signature" />` : ''}
              </div>
              <div class="signature-title">HAND OVER BY</div>
              <div class="signature-name">${submission.handover_by}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                ${submission.takeover_signature ? `<img src="${submission.takeover_signature}" alt="Takeover Signature" />` : ''}
              </div>
              <div class="signature-title">TAKE OVER BY</div>
              <div class="signature-name">${submission.takeover_by}</div>
            </div>
          </div>
        </body>
      </html>
      `

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for images to load then print
    printWindow.onload = function () {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
        alert('User deleted successfully')
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions
    .filter(submission => {
      const matchesSearch =
        submission.plate_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.handover_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.takeover_by?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = !filterType || submission.vehicle_type === filterType

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      const dateA = new Date(a.handover_date || a.created_at)
      const dateB = new Date(b.handover_date || b.created_at)
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200">
      <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-2xl">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <div className="w-3 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-4"></div>
          Admin Dashboard
        </h2>
      </div>

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'submissions'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Vehicle Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <svg className="w-5 h-5 flex-shrink-0 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="hidden sm:inline">User Management ({users.length})</span>
              <span className="sm:hidden">Users ({users.length})</span>
            </button>
          </nav>
        </div>

        {/* Search and Filter */}
        {activeTab === 'submissions' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search Submissions</label>
                <input
                  type="text"
                  placeholder="Search by plate number, handover by, or takeover by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Vehicle Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  <option value="">All Vehicle Types</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort by Date</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search Users</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Total Users: {users.length} | Admins: {users.filter(u => u.role === 'admin').length} | Regular Users: {users.filter(u => u.role === 'user').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Total Submissions</h3>
            <p className="text-2xl font-bold">{submissions.length}</p>
          </div>
          <div className="bg-green-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">This Month</h3>
            <p className="text-2xl font-bold">
              {submissions.filter(sub => {
                const subDate = new Date(sub.handover_date)
                const now = new Date()
                return subDate.getMonth() === now.getMonth() &&
                  subDate.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
          <div className="bg-green-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Approved</h3>
            <p className="text-2xl font-bold">
              {submissions.filter(sub =>
                (sub.approval_status || 'pending') === 'approved'
              ).length}
            </p>
          </div>
          <div className="bg-yellow-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Pending</h3>
            <p className="text-2xl font-bold">
              {submissions.filter(sub =>
                (sub.approval_status || 'pending') === 'pending'
              ).length}
            </p>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'submissions' && (
          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plate Number
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle Type
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Handover By
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Takeover By
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="md:hidden text-xs text-gray-500 mb-1">Date</div>
                        {formatDate(submission.handover_date)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="md:hidden text-xs text-gray-500 mb-1">Plate</div>
                        {submission.plate_no}
                        <div className="md:hidden text-xs text-gray-500 mt-1">
                          {submission.vehicle_type}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.vehicle_type}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.handover_by}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.takeover_by}
                      </td>
                      <td className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.submitted_by || submission.user_name || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const status = submission.approval_status || 'pending'
                          const statusConfig = {
                            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
                            approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' }
                          }
                          const config = statusConfig[status] || statusConfig.pending

                          return (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                              {config.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-1 sm:space-y-0">
                            <button
                              onClick={() => setViewingSubmission(submission)}
                              className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setEditingSubmission(submission)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(submission.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 text-xs sm:text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          {/* Status Dropdown */}
                          <div className="mt-2">
                            <select
                              value={submission.approval_status || 'pending'}
                              onChange={(e) => handleApproval(submission.id, e.target.value)}
                              disabled={loading}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No submissions found.</p>
              </div>
            )}
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="overflow-hidden rounded-lg border">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600 mt-1">Manage user roles and permissions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={user.designation || ''}
                          onChange={(e) => handleDesignationChange(user.id, e.target.value)}
                          onBlur={(e) => handleDesignationBlur(user.id, e.target.value)}
                          placeholder="Enter designation"
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-32 focus:ring-red-500 focus:border-red-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}>
                          {user.role === 'admin' ? 'Administrator' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submissions.filter(sub => sub.user_id === user.id).length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={loading}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-red-500 focus:border-red-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 px-2 py-1 rounded hover:bg-red-50"
                            title="Delete User"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found.</p>
              </div>
            )}
          </div>
        )}

        {/* View Submission Modal/Section */}
        {viewingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">View Submission - {viewingSubmission.plate_no}</h3>
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <SubmissionViewComponent submission={viewingSubmission} />
              </div>
            </div>
          </div>
        )}

        {/* Edit Submission Modal/Section */}
        {editingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Edit Submission - {editingSubmission.plate_no}</h3>
                <button
                  onClick={() => setEditingSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <SubmissionEditComponent
                  submission={editingSubmission}
                  onSave={(updatedSubmission) => {
                    setSubmissions(submissions.map(sub =>
                      sub.id === updatedSubmission.id ? updatedSubmission : sub
                    ))
                    setEditingSubmission(null)
                  }}
                  onCancel={() => setEditingSubmission(null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Submission View Component
function SubmissionViewComponent({ submission }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handlePrint = (submission) => {
    // Create a new window with the print content
    const printWindow = window.open('', '_blank')

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicle Handover Form - ${submission.plate_no}</title>
          <style>
            * {margin: 0; padding: 0; box-sizing: border-box; }
            body {font-family: Arial, sans-serif; padding: 20px; background: white; }
            .header {text-align: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 15px; }
            .company-info {display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
            .logo {width: 60px; height: 60px; margin-right: 15px; }
            .logo img {width: 100%; height: 100%; object-fit: contain; }
            .company-text {text-align: right; }
            .company-text h2 {font-size: 18px; font-weight: bold; }
            .company-text p {font-size: 14px; }
            .form-title {font-size: 24px; font-weight: bold; text-decoration: underline; margin-top: 15px; }
            .date-info {text-align: right; margin-top: 10px; font-weight: bold; }
            table {width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            td, th {border: 1px solid black; padding: 8px; text-align: left; }
            .label {background-color: #f3f4f6; font-weight: bold; width: 33%; }
            .notes-section {margin: 20px 0; }
            .notes-title {font-weight: bold; margin-bottom: 15px; }
            .notes-lines {margin-bottom: 10px; }
            .line {border-bottom: 2px solid #000; height: 25px; margin-bottom: 15px; width: 100%; display: block; }
            .images-section {margin: 20px 0; }
            .images-grid {display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .image-container {border: 1px solid black; padding: 8px; text-align: center; }
            .image-container img {max-width: 100%; max-height: 200px; object-fit: contain; }
            .image-label {font-size: 12px; margin-top: 5px; }
            .signatures {display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; justify-content: space-between; }
            .signature-box {text-align: center; }
            .signature-line {border-bottom: 1px solid black; height: 80px; margin-bottom: 10px; display: flex; align-items: end; justify-content: center; }
            .signature-line img {max-height: 60px; max-width: 100%; }
            .signature-title {font-weight: bold; }
            .signature-name {font-size: 14px; }
            @media print {
              body {margin: 0; padding: 15px; }
            .page-break {page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="logo"><img src="/images/Logo.png" alt="Company Logo" /></div>
              <div class="company-text">
                <h2>شركة اتجاهات النجاح للمقاولات</h2>
                <p>ETJAHAT AL NAJAH CONTRACTING CO.</p>
              </div>
            </div>
            <h1 class="form-title">VEHICLE HAND OVER TAKE OVER FORM</h1>
            <div class="date-info">Date: ${new Date(submission.handover_date).toLocaleDateString()}</div>
          </div>

          <table>
            <tr>
              <td class="label">Vehicle Number</td>
              <td>${submission.plate_no}</td>
            </tr>
            <tr>
              <td class="label">Vehicle Type</td>
              <td>${submission.vehicle_type === 'Other' && submission.vehicle_type_other ? submission.vehicle_type_other : submission.vehicle_type}</td>
            </tr>
            <tr>
              <td class="label">Hand Over by (Name)</td>
              <td>${submission.handover_by}</td>
            </tr>
            <tr>
              <td class="label">Take Over by (Name)</td>
              <td>${submission.takeover_by}</td>
            </tr>
            <tr>
              <td class="label">Registration Card</td>
              <td>${submission.registration_card === 'yes' ? 'Available' : 'Not Available'}</td>
            </tr>
            <tr>
              <td class="label">Assignee ID</td>
              <td>${submission.id_no}</td>
            </tr>
            <tr>
              <td class="label">ODO Meter Reading</td>
              <td>${submission.odo_meter_reading?.toLocaleString()} km</td>
            </tr>
            <tr>
              <td class="label">Contact Number</td>
              <td>${submission.contact_no}</td>
            </tr>
            <tr>
              <td class="label">TAMM Registration</td>
              <td>${submission.vehicle_authorization === 'complete' ? 'Complete' : 'Incomplete'}</td>
            </tr>
            <tr>
              <td class="label">Remarks</td>
              <td>${submission.remarks ? `<div class="notes-lines"><p>${submission.remarks}</p></div>` : ''}</td>
            </tr>
          </table>

          <div class="notes-section">
            
            ${submission.remarks ? `<div class="notes-lines"><p><strong>Remarks:</strong> ${submission.remarks}</p></div>` : ''}
            ${submission.notes ? `<div class="notes-lines"><p><strong>Additional Notes:</strong> ${submission.notes}</p></div>` : ''}
          </div>

          ${submission.vehicle_pictures && JSON.parse(submission.vehicle_pictures).length > 0 ? `
            <div class="images-section">
              <div class="notes-title">Vehicle Pictures:</div>
              <div class="images-grid">
                ${JSON.parse(submission.vehicle_pictures).slice(0, 6).map((picture, index) => `
                  <div class="image-container">
                    <img src="${picture}" alt="Vehicle ${index + 1}" />
                    <div class="image-label">Vehicle Image ${index + 1}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${submission.accessories_pictures && JSON.parse(submission.accessories_pictures).length > 0 ? `
            <div class="images-section">
              <div class="notes-title">Accessories Pictures:</div>
              <div class="images-grid">
                ${JSON.parse(submission.accessories_pictures).slice(0, 6).map((picture, index) => `
                  <div class="image-container">
                    <img src="${picture}" alt="Accessory ${index + 1}" />
                    <div class="image-label">Accessory Image ${index + 1}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">
                ${submission.handover_signature ? `<img src="${submission.handover_signature}" alt="Handover Signature" />` : ''}
              </div>
              <div class="signature-title">HAND OVER BY</div>
              <div class="signature-name">${submission.handover_by}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                ${submission.takeover_signature ? `<img src="${submission.takeover_signature}" alt="Takeover Signature" />` : ''}
              </div>
              <div class="signature-title">TAKE OVER BY</div>
              <div class="signature-name">${submission.takeover_by}</div>
            </div>
          </div>
        </body>
      </html>
      `

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait for images to load then print
    printWindow.onload = function () {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  const getStatusBadge = (regCard, vehicleAuth) => {
    const isComplete = regCard === 'yes' && vehicleAuth === 'complete'
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${isComplete
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
        }`}>
        {isComplete ? 'Complete' : 'Incomplete'}
      </span>
    )
  }

  const getApprovalStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    }
    const config = statusConfig[status] || statusConfig.pending

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vehicle Information */}
        <div className="space-y-4 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold border-b border-amber-200 pb-2 text-slate-800 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
            Vehicle Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600">Handover Date</label>
              <p className="text-lg text-slate-800">{formatDate(submission.handover_date)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Plate Number</label>
              <p className="text-lg font-semibold text-amber-700">{submission.plate_no}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Vehicle Type</label>
              <p className="text-lg text-slate-800">
                {submission.vehicle_type === 'Other' && submission.vehicle_type_other
                  ? submission.vehicle_type_other
                  : submission.vehicle_type}
              </p>
              {submission.vehicle_type === 'Other' && submission.vehicle_type_other && (
                <p className="text-sm text-slate-500 mt-1">
                  (Custom: {submission.vehicle_type_other})
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Odometer Reading</label>
              <p className="text-lg text-slate-800">{submission.odo_meter_reading?.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        {/* Personnel Information */}
        <div className="space-y-4 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold border-b border-amber-200 pb-2 text-slate-800 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
            Personnel Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600">Handover By</label>
              <p className="text-lg text-slate-800">{submission.handover_by}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Takeover By</label>
              <p className="text-lg text-slate-800">{submission.takeover_by}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Assignee ID</label>
              <p className="text-lg text-slate-800">{submission.id_no}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Contact Number</label>
              <p className="text-lg text-slate-800">{submission.contact_no}</p>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-4 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold border-b border-amber-200 pb-2 text-slate-800 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
            Status Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600">Approval Status</label>
              <div className="mt-1">
                {getApprovalStatusBadge(submission.approval_status || 'pending')}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Document Status</label>
              <div className="mt-1">
                {getStatusBadge(submission.registration_card, submission.vehicle_authorization)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Registration Card</label>
              <p className={`text-lg font-medium ${submission.registration_card === 'yes'
                ? 'text-emerald-600'
                : 'text-red-600'
                }`}>
                {submission.registration_card === 'yes' ? 'Available' : 'Not Available'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Vehicle Authorization</label>
              <p className={`text-lg font-medium ${submission.vehicle_authorization === 'complete'
                ? 'text-emerald-600'
                : 'text-amber-600'
                }`}>
                {submission.vehicle_authorization === 'complete' ? 'Complete' : 'Incomplete'}
              </p>
            </div>
          </div>
        </div>

        {/* Remarks and Notes */}
        <div className="space-y-4 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold border-b border-amber-200 pb-2 text-slate-800 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
            Additional Information
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-600">Remarks</label>
            <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-800">
                {submission.remarks || 'No remarks provided'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Additional Notes</label>
            <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-800">
                {submission.notes || 'No additional notes provided'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Submission ID</label>
            <p className="text-sm text-slate-500 font-mono">{submission.id}</p>
          </div>
          {submission.created_at && (
            <div>
              <label className="block text-sm font-medium text-slate-600">Created At</label>
              <p className="text-sm text-slate-500">
                {new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Images and Signatures Section */}
      <div className="space-y-8">
        {/* Vehicle Pictures */}
        {submission.vehicle_pictures && JSON.parse(submission.vehicle_pictures).length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold border-b border-amber-200 pb-2 text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
              Vehicle Pictures
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {JSON.parse(submission.vehicle_pictures).map((picture, index) => (
                <img
                  key={index}
                  src={picture}
                  alt={`Vehicle ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                />
              ))}
            </div>
          </div>
        )}

        {/* Accessory Pictures */}
        {submission.accessories_pictures && JSON.parse(submission.accessories_pictures).length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold border-b border-amber-200 pb-2 text-slate-800 mb-4 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
              Accessory Pictures
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {JSON.parse(submission.accessories_pictures).map((picture, index) => (
                <img
                  key={index}
                  src={picture}
                  alt={`Accessory ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                />
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold border-b border-amber-200 pb-2 text-slate-800 mb-4 flex items-center">
            <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mr-3"></div>
            Digital Signatures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Handover By Signature</label>
              {submission.handover_signature ? (
                <img
                  src={submission.handover_signature}
                  alt="Handover Signature"
                  className="border border-slate-200 rounded-lg p-2 bg-white max-h-32 shadow-sm"
                />
              ) : (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-center text-slate-500">
                  No signature provided
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Takeover By Signature</label>
              {submission.takeover_signature ? (
                <img
                  src={submission.takeover_signature}
                  alt="Takeover Signature"
                  className="border border-slate-200 rounded-lg p-2 bg-white max-h-32 shadow-sm"
                />
              ) : (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-center text-slate-500">
                  No signature provided
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-amber-200">
        <button
          onClick={() => handlePrint(submission)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print</span>
        </button>
      </div>
    </div>
  )
}

// Submission Edit Component
function SubmissionEditComponent({ submission, onSave, onCancel }) {
  const [editData, setEditData] = useState({
    handover_date: submission.handover_date || '',
    plate_no: submission.plate_no || '',
    vehicle_type: submission.vehicle_type || '',
    vehicle_type_other: submission.vehicle_type_other || '',
    handover_by: submission.handover_by || '',
    takeover_by: submission.takeover_by || '',
    id_no: submission.id_no || '',
    contact_no: submission.contact_no || '',
    odo_meter_reading: submission.odo_meter_reading || '',
    registration_card: submission.registration_card || '',
    vehicle_authorization: submission.vehicle_authorization || '',
    remarks: submission.remarks || '',
    notes: submission.notes || ''
  })
  const [loading, setLoading] = useState(false)

  const vehicleTypes = [
    'Backhoe Loader', 'Boom Truck', 'Bus', 'Coaster', 'Diesel Tanker',
    'Dyna IPV', 'Dyna Truck', 'Flat Bed Trailer', 'Food Truck', 'Forklift',
    'Minibus', 'Potable WT', 'Skid Steer Loader', 'SUV', 'Tow Truck',
    'Water Tanker', 'Sedan', 'Mobile Crane', 'Chain Excavator',
    'Wheel Excavator', 'Wheel Loader', 'Telehandler', 'Low Bed Trailer',
    'Pickup', 'Roller Compactor', 'Other'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/edit/${submission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const updatedSubmission = await response.json()
        onSave({ ...submission, ...editData })
        alert('Submission updated successfully')
      } else {
        alert('Failed to update submission')
      }
    } catch (error) {
      console.error('Error updating submission:', error)
      alert('Error updating submission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Handover Date
          </label>
          <input
            type="date"
            name="handover_date"
            value={editData.handover_date}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Plate Number
          </label>
          <input
            type="text"
            name="plate_no"
            value={editData.plate_no}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vehicle Type
          </label>
          <select
            name="vehicle_type"
            value={editData.vehicle_type}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          >
            <option value="">Select vehicle type</option>
            {vehicleTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Other Vehicle Type Text Box */}
          {editData.vehicle_type === 'Other' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Please specify vehicle type
              </label>
              <input
                type="text"
                name="vehicle_type_other"
                value={editData.vehicle_type_other}
                onChange={handleInputChange}
                placeholder="Enter vehicle type details..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Handover By
          </label>
          <input
            type="text"
            name="handover_by"
            value={editData.handover_by}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Takeover By
          </label>
          <input
            type="text"
            name="takeover_by"
            value={editData.takeover_by}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Assignee ID
          </label>
          <input
            type="text"
            name="id_no"
            value={editData.id_no}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Contact Number
          </label>
          <input
            type="text"
            name="contact_no"
            value={editData.contact_no}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Odometer Reading
          </label>
          <input
            type="number"
            name="odo_meter_reading"
            value={editData.odo_meter_reading}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Remarks
          </label>
          <textarea
            name="remarks"
            value={editData.remarks}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={editData.notes}
            onChange={handleInputChange}
            rows={4}
            placeholder="Add any additional notes or comments..."
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-amber-200">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  )
}
