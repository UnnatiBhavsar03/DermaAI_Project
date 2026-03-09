import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    RefreshCw,
    Mail,
    Eye,
    Edit2,
    Trash2,
    CheckSquare,
    Square,
    Trash,
    AlertTriangle,
    X,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Modal States
    const [viewUser, setViewUser] = useState(null);
    const [editUser, setEditUser] = useState(null);

    // Custom Confirm State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: '', // 'single' or 'batch'
        title: '',
        message: '',
        userId: null // for single delete
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:5001/api/admin/users');
            const data = await response.json();
            if (data.status === 'success') {
                setUsers(data.users);
            } else {
                console.error("Failed to fetch users:", data.message);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
            setSelectedUsers([]);
        }
    };

    // Open Glassy Confirm for Single Delete
    const initiateDelete = (userId) => {
        setConfirmModal({
            isOpen: true,
            type: 'single',
            title: 'Delete User?',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            userId: userId
        });
    };

    // Open Glassy Confirm for Batch Delete
    const initiateBatchDelete = () => {
        if (selectedUsers.length === 0) return;
        setConfirmModal({
            isOpen: true,
            type: 'batch',
            title: `Delete ${selectedUsers.length} Users?`,
            message: `You are about to delete ${selectedUsers.length} selected users. This action cannot be undone.`,
            userId: null
        });
    };

    // Execute Delete Logic
    const confirmDeleteAction = async () => {
        if (confirmModal.type === 'single') {
            try {
                const response = await fetch(`http://127.0.0.1:5001/api/admin/user/${confirmModal.userId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setUsers(users.filter(u => u.user_id !== confirmModal.userId));
                } else {
                    alert("Failed to delete user: " + data.message);
                }
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        } else if (confirmModal.type === 'batch') {
            try {
                const response = await fetch('http://127.0.0.1:5001/api/admin/users/delete-batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_ids: selectedUsers })
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setUsers(users.filter(u => !selectedUsers.includes(u.user_id)));
                    setSelectedUsers([]);
                } else {
                    alert("Failed to delete users: " + data.message);
                }
            } catch (error) {
                console.error("Error deleting users:", error);
            }
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editUser) return;

        try {
            const response = await fetch(`http://127.0.0.1:5001/api/admin/user/${editUser.user_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editUser.name,
                    email: editUser.email,
                    skin_type: editUser.skin_type,
                    birth_date: editUser.birth_date,
                    gender: editUser.gender,
                    allergies: editUser.allergies
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setUsers(users.map(u => u.user_id === editUser.user_id ? { ...u, ...editUser } : u));
                setEditUser(null);
                // In a real app, show a glassy toast here
                alert("User updated successfully");
            } else {
                alert("Failed to update user: " + data.message);
            }
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.user_id));
        }
    };

    const toggleSelectUser = (id) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(userId => userId !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'All' || user.skin_type === filterType;
        return matchesSearch && matchesFilter;
    });

    const uniqueSkinTypes = ['All', ...new Set(users.map(u => u.skin_type).filter(Boolean))];

    return (
        <div className="space-y-6 relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-500 text-sm mt-1">View, manage, and organize registered users.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedUsers.length > 0 && (
                        <button
                            onClick={initiateBatchDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium animate-fade-in"
                        >
                            <Trash size={18} />
                            <span>Delete ({selectedUsers.length})</span>
                        </button>
                    )}
                    <button
                        onClick={fetchUsers}
                        className="p-2 text-slate-400 hover:text-mint-600 hover:bg-white rounded-lg border border-transparent hover:border-mint-200 transition-all"
                        title="Refresh List"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-mint-100 flex items-center">
                        <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Total:</span>
                        <span className="px-3 py-1 bg-mint-50 text-mint-700 rounded-lg text-sm font-bold">{users.length}</span>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-gray-700 placeholder-gray-400 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Filter size={18} className="text-gray-400 flex-shrink-0" />
                    {uniqueSkinTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterType === type
                                ? 'bg-mint-500 text-white shadow-md shadow-mint-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {type || "Unknown"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-mint-100 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-slate-500">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">No users found matching your criteria.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-mint-100 text-slate-400 text-xs uppercase tracking-wider bg-mint-50/50">
                                    <th className="p-4 w-12 text-center">
                                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-mint-600 transition-colors">
                                            {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? (
                                                <div className="bg-mint-500 text-white rounded flex items-center justify-center w-5 h-5"><Check size={14} strokeWidth={3} /></div>
                                            ) : (
                                                <div className="border-2 border-slate-300 rounded w-5 h-5"></div>
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 font-semibold w-16 text-center">#</th>
                                    <th className="p-4 font-semibold">User Details</th>
                                    <th className="p-4 font-semibold">Skin Profile</th>
                                    <th className="p-4 font-semibold">Contact Info</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-mint-50">
                                {filteredUsers.map((user, index) => (
                                    <tr key={user.user_id} className={`group transition-colors ${selectedUsers.includes(user.user_id) ? 'bg-mint-50/60' : 'hover:bg-mint-50/30'}`}>
                                        <td className="p-4 text-center">
                                            <button onClick={() => toggleSelectUser(user.user_id)} className="transition-transform active:scale-95">
                                                {selectedUsers.includes(user.user_id) ? (
                                                    <div className="bg-mint-500 text-white rounded flex items-center justify-center w-5 h-5"><Check size={14} strokeWidth={3} /></div>
                                                ) : (
                                                    <div className="border-2 border-slate-300 rounded w-5 h-5 hover:border-mint-400"></div>
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4 text-center text-slate-400 font-medium text-sm">
                                            {index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mint-50 to-mint-100 text-mint-600 flex items-center justify-center font-bold text-lg border border-mint-200">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 text-sm">{user.name}</div>
                                                    <div className="text-xs text-gray-400">Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.skin_type
                                                ? 'bg-teal-100 text-teal-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.skin_type || "Pending Analysis"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                                <Mail size={14} className="text-gray-400" />
                                                <span className="truncate max-w-[150px]" title={user.email}>{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="View Full Profile & Scans"
                                                    onClick={() => navigate(`/dashboard/user/${user.user_id}`)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Edit User"
                                                    onClick={() => setEditUser(user)}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
                                                    onClick={() => initiateDelete(user.user_id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-xs text-gray-400 px-4">
                <span>Showing {filteredUsers.length} of {users.length} users</span>
                <span>Page 1 of 1</span>
            </div>

            {/* View User Modal */}
            {viewUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">User Details</h3>
                            <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-indigo-600">
                                    {viewUser.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Name</label>
                                    <p className="font-semibold text-gray-800">{viewUser.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skin Type</label>
                                    <span className="inline-block px-2 py-1 bg-teal-100 text-teal-800 rounded-lg text-xs font-bold">
                                        {viewUser.skin_type || "N/A"}
                                    </span>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                                    <p className="font-medium text-gray-600">{viewUser.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gender</label>
                                    <p className="font-medium text-gray-600">{viewUser.gender || "Not specified"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Birth Date</label>
                                    <p className="font-medium text-gray-600">{viewUser.birth_date ? new Date(viewUser.birth_date).toLocaleDateString() : "Not specified"}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Allergies</label>
                                    <p className="font-medium text-gray-600">{viewUser.allergies || "None reported"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">User ID</label>
                                    <p className="font-mono text-gray-500 text-sm">#{viewUser.user_id}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setViewUser(null)}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
                            <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={editUser.name}
                                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    value={editUser.email}
                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Birth Date</label>
                                    <input
                                        type="date"
                                        value={editUser.birth_date ? editUser.birth_date.split('T')[0] : ''}
                                        onChange={(e) => setEditUser({ ...editUser, birth_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Gender</label>
                                    <select
                                        value={editUser.gender || ''}
                                        onChange={(e) => setEditUser({ ...editUser, gender: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    >
                                        <option value="">Unknown</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Skin Type</label>
                                <select
                                    value={editUser.skin_type || ''}
                                    onChange={(e) => setEditUser({ ...editUser, skin_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                >
                                    <option value="">Unknown</option>
                                    <option value="Oily">Oily</option>
                                    <option value="Dry">Dry</option>
                                    <option value="Combination">Combination</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Sensitive">Sensitive</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Allergies</label>
                                <input
                                    type="text"
                                    value={editUser.allergies || ''}
                                    onChange={(e) => setEditUser({ ...editUser, allergies: e.target.value })}
                                    placeholder="e.g., Peanuts, Aloe Vera..."
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditUser(null)}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Glassy Delete Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in text-center">
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full border border-white/50 overflow-hidden transform transition-all scale-100 p-8">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-2">{confirmModal.title}</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            {confirmModal.message}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAction}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all hover:scale-[1.02]"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ManageUsers;
