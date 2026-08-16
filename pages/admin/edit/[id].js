import { useState } from 'react'
import { useRouter } from 'next/router'
import { db } from '../../../lib/db'

export default function EditSubmission({ submission }) {
    const router = useRouter()
    const [formData, setFormData] = useState(submission || {})
    const [loading, setLoading] = useState(false)

    const vehicleTypes = [
        'BACKHOE LOADER', 'BOOM TRUCK', 'BUS', 'COASTER', 'DIESEL TANKER',
        'DYNA IPV', 'DYNA TRUCK', 'FLAT BED TRAILER', 'FOOD TRUCK', 'FORKLIFT',
        'MINIBUS', 'POTABLE WT', 'SKID STEER LOADER', 'SUV', 'TOW TRUCK',
        'WATER TANKER', 'SEDAN', 'MOBILE CRANE', 'CHAIN EXCAVATOR',
        'WHEEL EXCAVATOR', 'WHEEL LOADER', 'TELEHANDLER', 'LOW BED TRAILER',
        'PICKUP', 'ROLLER COMPACTOR', 'OTHER'
    ]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`/api/admin/update/${router.query.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                router.push('/admin')
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    if (!submission) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Submission Not Found</h1>
                <button
                    onClick={() => router.push('/admin')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Header - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Vehicle Handover</h1>
                    <button
                        onClick={() => router.push('/admin')}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-center"
                    >
                        <span className="hidden sm:inline">Back to Dashboard</span>
                        <span className="sm:hidden">← Back</span>
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Vehicle Information */}
                            <div className="space-y-4">
                                <h2 className="text-lg sm:text-xl font-semibold border-b pb-2 text-blue-600">Vehicle Information</h2>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Handover Date</label>
                                    <input
                                        type="date"
                                        name="handover_date"
                                        value={formData.handover_date ? formData.handover_date.split('T')[0] : ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Plate Number</label>
                                    <input
                                        type="text"
                                        name="plate_no"
                                        value={formData.plate_no || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter plate number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Vehicle Type</label>
                                    <select
                                        name="vehicle_type"
                                        value={formData.vehicle_type || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        required
                                    >
                                        <option value="">Select Vehicle Type</option>
                                        {vehicleTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Odometer Reading (km)</label>
                                    <input
                                        type="number"
                                        name="odo_meter_reading"
                                        value={formData.odo_meter_reading || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter odometer reading"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Personnel Information */}
                            <div className="space-y-4">
                                <h2 className="text-lg sm:text-xl font-semibold border-b pb-2 text-green-600">Personnel Information</h2>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Handover By</label>
                                    <input
                                        type="text"
                                        name="handover_by"
                                        value={formData.handover_by || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter handover person name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Takeover By</label>
                                    <input
                                        type="text"
                                        name="takeover_by"
                                        value={formData.takeover_by || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter takeover person name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Assignee ID</label>
                                    <input
                                        type="text"
                                        name="id_no"
                                        value={formData.id_no || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter assignee ID"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Contact Number</label>
                                    <input
                                        type="tel"
                                        name="contact_no"
                                        value={formData.contact_no || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="Enter contact number"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Documentation Status */}
                            <div className="space-y-4">
                                <h2 className="text-lg sm:text-xl font-semibold border-b pb-2 text-purple-600">Documentation</h2>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Registration Card</label>
                                    <select
                                        name="registration_card"
                                        value={formData.registration_card || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        required
                                    >
                                        <option value="">Select Status</option>
                                        <option value="yes">Available</option>
                                        <option value="no">Not Available</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Vehicle Authorization</label>
                                    <select
                                        name="vehicle_authorization"
                                        value={formData.vehicle_authorization || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        required
                                    >
                                        <option value="">Select Status</option>
                                        <option value="complete">Complete</option>
                                        <option value="incomplete">Incomplete</option>
                                    </select>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-4 lg:col-span-2">
                                <h2 className="text-lg sm:text-xl font-semibold border-b pb-2 text-orange-600">Additional Information</h2>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Remarks</label>
                                    <textarea
                                        name="remarks"
                                        value={formData.remarks || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                                        rows="4"
                                        placeholder="Any additional notes or remarks..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Mobile Responsive */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 sm:flex-none bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </span>
                                ) : 'Update Submission'}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => router.push('/admin')}
                                className="flex-1 sm:flex-none bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export async function getServerSideProps({ params }) {
    try {
        const submission = await db.getById(params.id)

        return {
            props: {
                submission: submission ? JSON.parse(JSON.stringify(submission)) : null
            }
        }
    } catch (error) {
        console.error('Error fetching submission:', error)
        return {
            props: {
                submission: null
            }
        }
    }
}