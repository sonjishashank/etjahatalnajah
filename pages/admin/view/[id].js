import { useRouter } from 'next/router'
import Link from 'next/link'
import { db } from '../../../lib/db'
import { ImageGallery, SignatureDisplay } from '../../../components/ImageModal'

export default function ViewSubmission({ submission }) {
    const router = useRouter()

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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString()
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

    return (
        <>
            {/* Screen Content */}
            <div className="min-h-screen bg-gray-50 no-print">
                <div className="container mx-auto px-4 py-6 max-w-6xl">
                    {/* Header - Mobile Responsive */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vehicle Handover Details</h1>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                                href={`/admin/edit/${submission.id}`}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center"
                            >
                                <span className="hidden sm:inline">Edit Submission</span>
                                <span className="sm:hidden">Edit</span>
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <span className="hidden sm:inline">Print Document</span>
                                <span className="sm:hidden">Print</span>
                            </button>
                            <button
                                onClick={() => router.push('/admin')}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <span className="hidden sm:inline">Back to Dashboard</span>
                                <span className="sm:hidden">← Back</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {/* Vehicle Information */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold border-b pb-2 text-blue-600">
                                Vehicle Information
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Handover Date</label>
                                    <p className="text-lg">{formatDate(submission.handover_date)}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Plate Number</label>
                                    <p className="text-lg font-semibold">{submission.plate_no}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Vehicle Type</label>
                                    <p className="text-lg">{submission.vehicle_type}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Odometer Reading</label>
                                    <p className="text-lg">{submission.odo_meter_reading?.toLocaleString()} km</p>
                                </div>
                            </div>
                        </div>

                        {/* Personnel Information */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold border-b pb-2 text-green-600">
                                Personnel Information
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Handover By</label>
                                    <p className="text-lg">{submission.handover_by}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Takeover By</label>
                                    <p className="text-lg">{submission.takeover_by}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Assignee ID</label>
                                    <p className="text-lg">{submission.id_no}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Contact Number</label>
                                    <p className="text-lg">{submission.contact_no}</p>
                                </div>
                            </div>
                        </div>

                        {/* Documentation Status */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold border-b pb-2 text-purple-600">
                                Documentation Status
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Overall Status</label>
                                    <div className="mt-1">
                                        {getStatusBadge(submission.registration_card, submission.vehicle_authorization)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Registration Card</label>
                                    <p className={`text-lg font-medium ${submission.registration_card === 'yes'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                        }`}>
                                        {submission.registration_card === 'yes' ? 'Available' : 'Not Available'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Vehicle Authorization</label>
                                    <p className={`text-lg font-medium ${submission.vehicle_authorization === 'complete'
                                        ? 'text-green-600'
                                        : 'text-yellow-600'
                                        }`}>
                                        {submission.vehicle_authorization === 'complete' ? 'Complete' : 'Incomplete'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold border-b pb-2 text-orange-600">
                                Additional Information
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-600">Remarks</label>
                                <div className="mt-1 p-3 bg-gray-50 rounded border">
                                    <p className="text-gray-800">
                                        {submission.remarks || 'No remarks provided'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600">Submission ID</label>
                                <p className="text-sm text-gray-500 font-mono">{submission.id}</p>
                            </div>

                            {submission.created_at && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">Created At</label>
                                    <p className="text-sm text-gray-500">
                                        {new Date(submission.created_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                        {/* Images and Signatures Section - Mobile Responsive */}
                        <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
                            {/* Vehicle Pictures */}
                            {submission.vehicle_pictures && JSON.parse(submission.vehicle_pictures).length > 0 && (
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold border-b pb-2 text-blue-600 mb-4">
                                        Vehicle Pictures
                                    </h2>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <ImageGallery
                                            images={JSON.parse(submission.vehicle_pictures)}
                                            title="Vehicle Images"
                                            type="Vehicle"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Accessory Pictures */}
                            {submission.accessories_pictures && JSON.parse(submission.accessories_pictures).length > 0 && (
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold border-b pb-2 text-green-600 mb-4">
                                        Accessory Pictures
                                    </h2>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <ImageGallery
                                            images={JSON.parse(submission.accessories_pictures)}
                                            title="Accessory Images"
                                            type="Accessory"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Signatures - Mobile Responsive */}
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold border-b pb-2 text-purple-600 mb-4">
                                    Digital Signatures
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <SignatureDisplay
                                            signature={submission.handover_signature}
                                            label="Handover By Signature"
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <SignatureDisplay
                                            signature={submission.takeover_signature}
                                            label="Takeover By Signature"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Mobile Responsive */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200 mt-6 sm:mt-8 no-print">
                            <Link
                                href={`/admin/edit/${submission.id}`}
                                className="flex-1 sm:flex-none bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-center font-medium"
                            >
                                <span className="hidden sm:inline">Edit Submission</span>
                                <span className="sm:hidden">Edit</span>
                            </Link>

                            <button
                                onClick={() => window.print()}
                                className="flex-1 sm:flex-none bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                            >
                                <span className="hidden sm:inline">Print Document</span>
                                <span className="sm:hidden">Print</span>
                            </button>

                            <button
                                onClick={() => router.push('/admin')}
                                className="flex-1 sm:flex-none bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                                <span className="hidden sm:inline">Back to Dashboard</span>
                                <span className="sm:hidden">← Back</span>
                            </button>
                        </div>
                </div>
            </div>

            {/* Print-Only Content - Completely separate from screen content */}
            <div className="print-only">
                <div className="min-h-screen bg-white p-8 print:p-0">
                    <div className="max-w-4xl mx-auto">
                        {/* Company Header */}
                        <div className="text-center mb-8 border-b-2 border-black pb-4">
                            <div className="flex items-center justify-center mb-4">
                                <div className="text-right mr-4">
                                    <h2 className="text-lg font-bold">شركة اتجاهات النجاح للمقاولات</h2>
                                    <p className="text-sm">ETJAHAT AL NAJAH CONTRACTING CO.</p>
                                </div>
                                <div className="w-16 h-16 bg-red-600 flex items-center justify-center text-white font-bold text-xl">
                                    ETC
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold underline">VEHICLE HAND OVER TAKE OVER FORM</h1>
                            <div className="text-right mt-2">
                                <span className="font-semibold">Date: {formatDate(submission.handover_date)}</span>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="space-y-6">
                            {/* Vehicle Information Table */}
                            <table className="w-full border-collapse border border-black text-sm">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100 w-1/3">Vehicle Number</td>
                                        <td className="border border-black p-2">{submission.plate_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">Vehicle Type</td>
                                        <td className="border border-black p-2">{submission.vehicle_type}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">Hand Over by (Name)</td>
                                        <td className="border border-black p-2">{submission.handover_by}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">Take Over by (Name)</td>
                                        <td className="border border-black p-2">{submission.takeover_by}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">Documents provided</td>
                                        <td className="border border-black p-2">{submission.registration_card === 'yes' ? 'Registration Card Available' : 'Registration Card Not Available'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">Assignee ID</td>
                                        <td className="border border-black p-2">{submission.id_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">ODO Meter Reading</td>
                                        <td className="border border-black p-2">{submission.odo_meter_reading?.toLocaleString()} km</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">Contact Number</td>
                                        <td className="border border-black p-2">{submission.contact_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-semibold bg-gray-100">TAMM Registration</td>
                                        <td className="border border-black p-2">{submission.vehicle_authorization === 'complete' ? 'Complete' : 'Incomplete'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Notes Section with Lines */}
                            <div>
                                <h3 className="font-semibold mb-4">Notes:</h3>
                                <div className="space-y-4">
                                    {/* Pre-filled remarks if any */}
                                    {submission.remarks && (
                                        <div className="mb-4">
                                            <p className="text-sm">{submission.remarks}</p>
                                        </div>
                                    )}
                                    {/* Lines for additional notes */}
                                    {[...Array(3)].map((_, index) => (
                                        <div key={index} className="border-b border-black h-6"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Vehicle Diagram Placeholder */}
                            {/* <div className="text-center my-8">
                                <div className="border border-black p-4 bg-gray-50">
                                    <p className="text-sm text-gray-600 mb-4">Vehicle Inspection Diagram</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border border-gray-400 h-32 flex items-center justify-center">
                                            <span className="text-xs">Front View</span>
                                        </div>
                                        <div className="border border-gray-400 h-32 flex items-center justify-center">
                                            <span className="text-xs">Rear View</span>
                                        </div>
                                        <div className="border border-gray-400 h-32 flex items-center justify-center">
                                            <span className="text-xs">Left Side</span>
                                        </div>
                                        <div className="border border-gray-400 h-32 flex items-center justify-center">
                                            <span className="text-xs">Right Side</span>
                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            {/* Vehicle Images */}
                            {submission.vehicle_pictures && JSON.parse(submission.vehicle_pictures).length > 0 && (
                                <div className="print:break-inside-avoid mb-6">
                                    <h3 className="font-semibold mb-4">Vehicle Pictures:</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {JSON.parse(submission.vehicle_pictures).slice(0, 6).map((picture, index) => (
                                            <div key={index} className="border border-black p-2">
                                                <img
                                                    src={picture}
                                                    alt={`Vehicle ${index + 1}`}
                                                    className="w-full h-auto object-contain max-h-48"
                                                />
                                                <p className="text-xs text-center mt-1">Vehicle Image {index + 1}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Accessories Images */}
                            {submission.accessories_pictures && JSON.parse(submission.accessories_pictures).length > 0 && (
                                <div className="print:break-inside-avoid mb-6">
                                    <h3 className="font-semibold mb-4">Accessories Pictures:</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {JSON.parse(submission.accessories_pictures).slice(0, 6).map((picture, index) => (
                                            <div key={index} className="border border-black p-2">
                                                <img
                                                    src={picture}
                                                    alt={`Accessory ${index + 1}`}
                                                    className="w-full h-auto object-contain max-h-48"
                                                />
                                                <p className="text-xs text-center mt-1">Accessory Image {index + 1}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="grid grid-cols-3 gap-8 mt-12 print:break-inside-avoid">
                                <div className="text-center">
                                    <div className="border-b border-black pb-2 mb-2 h-20 flex items-end justify-center">
                                        {submission.handover_signature && (
                                            <img
                                                src={submission.handover_signature}
                                                alt="Handover Signature"
                                                className="max-h-16 max-w-full"
                                            />
                                        )}
                                    </div>
                                    <p className="font-semibold">HAND OVER BY</p>
                                    <p className="text-sm">{submission.handover_by}</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-b border-black pb-2 mb-2 h-20 flex items-end justify-center">
                                        {submission.takeover_signature && (
                                            <img
                                                src={submission.takeover_signature}
                                                alt="Takeover Signature"
                                                className="max-h-16 max-w-full"
                                            />
                                        )}
                                    </div>
                                    <p className="font-semibold">TAKE OVER BY</p>
                                    <p className="text-sm">{submission.takeover_by}</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-b border-black pb-2 mb-2 h-20"></div>
                                    <p className="font-semibold">ADMINISTRATION</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            <style jsx>{`
                /* Screen styles - hide print content completely */
                .print-only {
                    display: none !important;
                    visibility: hidden !important;
                    position: absolute !important;
                    left: -9999px !important;
                    top: -9999px !important;
                    width: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
                
                .no-print {
                    display: block;
                }

                /* Print styles - show only print content */
                @media print {
                    /* Hide all screen content completely */
                    .no-print {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    
                    /* Show only print content */
                    .print-only {
                        display: block !important;
                        visibility: visible !important;
                        position: static !important;
                        left: auto !important;
                        top: auto !important;
                        width: auto !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    /* Reset page margins and styling for print */
                    body { 
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    .print\\:p-0 { 
                        padding: 0 !important; 
                    }
                    
                    .print\\:break-inside-avoid { 
                        break-inside: avoid !important; 
                    }

                    /* Ensure proper page layout */
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                }
            `}</style>
        </>
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