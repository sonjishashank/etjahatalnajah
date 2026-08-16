import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { db } from '../../lib/db'

export default function AdminDashboard({ submissions: initialSubmissions, users: initialUsers }) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [activeTab, setActiveTab] = useState('submissions')
    const [submissions, setSubmissions] = useState(initialSubmissions || [])
    const [users, setUsers] = useState(initialUsers || [])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [userSearchTerm, setUserSearchTerm] = useState('')

    const vehicleTypes = [
        'BACKHOE LOADER', 'BOOM TRUCK', 'BUS', 'COASTER', 'DIESEL TANKER',
        'DYNA IPV', 'DYNA TRUCK', 'FLAT BED TRAILER', 'FOOD TRUCK', 'FORKLIFT',
        'MINIBUS', 'POTABLE WT', 'SKID STEER LOADER', 'SUV', 'TOW TRUCK',
        'WATER TANKER', 'SEDAN', 'MOBILE CRANE', 'CHAIN EXCAVATOR',
        'WHEEL EXCAVATOR', 'WHEEL LOADER', 'TELEHANDLER', 'LOW BED TRAILER',
        'PICKUP', 'ROLLER COMPACTOR', 'OTHER'
    ]

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

    const handleDesignationChange = async (userId, newDesignation) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ designation: newDesignation }),
            })

            if (response.ok) {
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, designation: newDesignation } : user
                ))
            } else {
                alert('Failed to update user designation')
            }
        } catch (error) {
            console.error('Error updating user designation:', error)
            alert('Error updating user designation')
        } finally {
            setLoading(false)
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

    const filteredSubmissions = submissions.filter(submission => {
        const matchesSearch =
            submission.plate_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.handover_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.takeover_by?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter = !filterType || submission.vehicle_type === filterType

        return matchesSearch && matchesFilter
    })

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString()
    }

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    )

    // Handle loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Handle unauthenticated users
    if (!session) {
        router.push('/auth/signin')
        return null
    }

    // Handle non-admin users
    if (session.user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            You don't have permission to access the admin dashboard. Only administrators can view this page.
                        </p>
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Go to Main Dashboard
                            </button>
                            <p className="text-xs text-gray-400">
                                Contact your administrator if you believe this is an error.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full min-w-0 px-3 sm:px-6 py-4 sm:py-6 max-w-full sm:max-w-7xl mx-auto overflow-x-hidden">
                {/* Header - Mobile Optimized */}
                <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center sm:text-left">Admin Dashboard</h1>
                    <Link
                        href="/"
                        className="bg-green-500 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-green-600 transition-colors text-center font-medium"
                    >
                        <span className="hidden sm:inline">New Submission</span>
                        <span className="sm:hidden">+ New Submission</span>
                    </Link>
                </div>

                {/* Tab Navigation - Mobile Responsive */}
                <div className="mb-4 sm:mb-6">
                    <nav className="flex flex-col xs:flex-row xs:space-x-4 space-y-2 xs:space-y-0" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={`flex items-center justify-center xs:justify-start py-3 px-4 border-b-2 font-medium text-sm rounded-lg xs:rounded-none transition-colors min-h-[48px] ${activeTab === 'submissions'
                                    ? 'border-red-500 text-red-600 bg-red-50 xs:bg-transparent'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 xs:hover:bg-transparent'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden xs:inline">Vehicle Submissions ({submissions.length})</span>
                            <span className="xs:hidden">Submissions ({submissions.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center justify-center xs:justify-start py-3 px-4 border-b-2 font-medium text-sm rounded-lg xs:rounded-none transition-colors min-h-[48px] ${activeTab === 'users'
                                    ? 'border-red-500 text-red-600 bg-red-50 xs:bg-transparent'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 xs:hover:bg-transparent'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span className="hidden xs:inline">User Management ({users.length})</span>
                            <span className="xs:hidden">Users ({users.length})</span>
                        </button>
                    </nav>
                </div>

                {/* Search and Filter - Mobile Responsive */}
                {activeTab === 'submissions' && (
                    <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Search Submissions</label>
                                <input
                                    type="text"
                                    placeholder="Search by plate, handover, takeover..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Filter by Vehicle Type</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                                >
                                    <option value="">All Vehicle Types</option>
                                    {vehicleTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Search Users</label>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                                />
                            </div>
                            <div className="flex items-end">
                                <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg w-full">
                                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                                        <span className="font-medium">Total: {users.length}</span>
                                        <span>Admins: {users.filter(u => u.role === 'admin').length}</span>
                                        <span>Users: {users.filter(u => u.role === 'user').length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics - Mobile Responsive Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-blue-500 text-white p-3 sm:p-4 rounded-lg shadow-lg">
                        <h3 className="text-xs sm:text-sm font-semibold leading-tight">Total Submissions</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">{submissions.length}</p>
                    </div>
                    <div className="bg-green-500 text-white p-3 sm:p-4 rounded-lg shadow-lg">
                        <h3 className="text-xs sm:text-sm font-semibold leading-tight">This Month</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">
                            {submissions.filter(sub => {
                                const subDate = new Date(sub.handover_date)
                                const now = new Date()
                                return subDate.getMonth() === now.getMonth() &&
                                    subDate.getFullYear() === now.getFullYear()
                            }).length}
                        </p>
                    </div>
                    <div className="bg-yellow-500 text-white p-3 sm:p-4 rounded-lg shadow-lg">
                        <h3 className="text-xs sm:text-sm font-semibold leading-tight">Complete Docs</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">
                            {submissions.filter(sub =>
                                sub.registration_card === 'yes' &&
                                sub.vehicle_authorization === 'complete'
                            ).length}
                        </p>
                    </div>
                    <div className="bg-red-500 text-white p-3 sm:p-4 rounded-lg shadow-lg">
                        <h3 className="text-xs sm:text-sm font-semibold leading-tight">Incomplete Docs</h3>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">
                            {submissions.filter(sub =>
                                sub.registration_card === 'no' ||
                                sub.vehicle_authorization === 'incomplete'
                            ).length}
                        </p>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'submissions' && (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Plate Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vehicle Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Handover By
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Takeover By
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSubmissions.map((submission) => (
                                            <tr key={submission.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(submission.handover_date)}
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
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${submission.registration_card === 'yes' &&
                                                            submission.vehicle_authorization === 'complete'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {submission.registration_card === 'yes' &&
                                                            submission.vehicle_authorization === 'complete'
                                                            ? 'Complete'
                                                            : 'Incomplete'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <Link
                                                        href={`/admin/view/${submission.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={`/admin/edit/${submission.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(submission.id)}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-4">
                            {filteredSubmissions.map((submission) => (
                                <div key={submission.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{submission.plate_no}</h3>
                                            <p className="text-sm text-gray-600">{submission.vehicle_type}</p>
                                        </div>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${submission.registration_card === 'yes' &&
                                                submission.vehicle_authorization === 'complete'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {submission.registration_card === 'yes' &&
                                                submission.vehicle_authorization === 'complete'
                                                ? 'Complete'
                                                : 'Incomplete'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                        <div>
                                            <span className="text-gray-500">Date:</span>
                                            <p className="font-medium">{formatDate(submission.handover_date)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Handover By:</span>
                                            <p className="font-medium truncate">{submission.handover_by}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Takeover By:</span>
                                            <p className="font-medium truncate">{submission.takeover_by}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                        <Link
                                            href={`/admin/view/${submission.id}`}
                                            className="flex-1 bg-blue-500 text-white text-center py-2 px-3 rounded-md text-sm hover:bg-blue-600 transition-colors"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={`/admin/edit/${submission.id}`}
                                            className="flex-1 bg-indigo-500 text-white text-center py-2 px-3 rounded-md text-sm hover:bg-indigo-600 transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(submission.id)}
                                            disabled={loading}
                                            className="flex-1 bg-red-500 text-white py-2 px-3 rounded-md text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredSubmissions.length === 0 && (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="mt-4 text-gray-500">No submissions found.</p>
                                <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
                            </div>
                        )}
                    </>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
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
                                                        placeholder="Enter designation"
                                                        disabled={loading}
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
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden">
                            <div className="bg-white rounded-lg shadow mb-4 p-4">
                                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                                <p className="text-sm text-gray-600 mt-1">Manage user roles and permissions</p>
                            </div>

                            <div className="space-y-4">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium text-lg">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <h4 className="text-lg font-semibold text-gray-900">{user.name}</h4>
                                                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role === 'admin' ? 'Admin' : 'User'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div>
                                                <span className="text-gray-500">Joined:</span>
                                                <p className="font-medium">{formatDate(user.created_at)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Submissions:</span>
                                                <p className="font-medium">{submissions.filter(sub => sub.user_id === user.id).length}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                                            <input
                                                type="text"
                                                value={user.designation || ''}
                                                onChange={(e) => handleDesignationChange(user.id, e.target.value)}
                                                placeholder="Enter designation"
                                                disabled={loading}
                                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    disabled={loading}
                                                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={loading}
                                                    className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center"
                                                    title="Delete User"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete User
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {filteredUsers.length === 0 && (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                <p className="mt-4 text-gray-500">No users found.</p>
                                <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export async function getServerSideProps(context) {
    try {
        const { getServerSession } = await import('next-auth/next')
        const { authOptions } = await import('../api/auth/[...nextauth]')

        // Get the session on the server side
        const session = await getServerSession(context.req, context.res, authOptions)

        // Check if user is authenticated
        if (!session) {
            return {
                redirect: {
                    destination: '/auth/signin',
                    permanent: false,
                },
            }
        }

        // Check if user is admin
        if (session.user.role !== 'admin') {
            return {
                redirect: {
                    destination: '/',
                    permanent: false,
                },
            }
        }

        // If user is authenticated and is admin, fetch the data
        const [submissions, users] = await Promise.all([
            db.getAll(),
            db.getUsers()
        ])

        return {
            props: {
                submissions: submissions ? JSON.parse(JSON.stringify(submissions)) : [],
                users: users ? JSON.parse(JSON.stringify(users)) : []
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error)
        return {
            props: {
                submissions: [],
                users: []
            }
        }
    }
}