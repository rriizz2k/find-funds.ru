import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HiArrowLeft, HiPencil, HiTrash } from 'react-icons/hi';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

const MyOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editOffer, setEditOffer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState(null);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/my-offers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOffers(response.data);
        } catch (error) {
            console.error('Error fetching offers:', error);
            toast.error('Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (offer) => {
        setOfferToDelete(offer);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/startups/${offerToDelete.startup_id}/offers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOffers(offers.filter(offer => offer.startup_id !== offerToDelete.startup_id));
            toast.success('Offer deleted successfully');
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error deleting offer:', error);
            toast.error('Failed to delete offer');
        }
    };

    const handleEdit = (offer) => {
        setEditOffer(offer);
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3000/startups/${editOffer.startup_id}/offers`, {
                sharePercentage: editOffer.share_percentage,
                offerAmount: editOffer.offer_amount
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            await fetchOffers();
            setShowEditModal(false);
            toast.success('Offer updated successfully');
        } catch (error) {
            console.error('Error updating offer:', error);
            toast.error('Failed to update offer');
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'text-yellow-500 bg-yellow-500/10';
            case 'accepted':
                return 'text-green-500 bg-green-500/10';
            case 'rejected':
                return 'text-red-500 bg-red-500/10';
            default:
                return 'text-gray-500 bg-gray-500/10';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Фиксированный Navbar */}
            <div className="fixed top-0 w-full z-50 h-16 border-b border-gray-300">
                <Navbar />
            </div>

            <div className="flex">
                {/* Фиксированный Sidebar */}
                <div className="fixed left-0 w-[200px] h-[calc(100vh-4rem)] mt-16 bg-white border-r border-gray-200 z-40">
                    <Sidebar />
                </div>

                {/* Основной контент с отступом */}
                <div 
                    className="flex-1 p-8 ml-[200px] pt-16"
                    style={{ 
                        width: "calc(100% - 200px)",
                        minHeight: "calc(100vh - 64px)"
                    }}
                >
                    <div className="max-w-4xl mx-auto">
                        <div className="pt-5 flex items-center gap-4 mb-8">
                            <h1 className="text-2xl font-bold text-black">My offers</h1>
                        </div>

                        <div className="space-y-4">
                            {offers.map(offer => (
                                <div key={offer.id} 
                                     className="bg-white rounded-xl p-6 hover:bg-gray-50 transition-colors border border-gray-200">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-xl font-semibold text-black">{offer.startup_name}</h2>

                                            </div>
                                            <div className="flex items-center gap-6 text-gray-600 mb-3">
                                                <div>
                                                    <span className="font-medium text-black">
                                                        ${parseFloat(offer.offer_amount).toLocaleString()}
                                                    </span>
                                                    <span className="ml-1">investment</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-black">
                                                        {offer.share_percentage}%
                                                    </span>
                                                    <span className="ml-1">share</span>
                                                </div>
                                                <div className="text-sm">
                                                    {new Date(offer.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </div>
                                            {offer.message && (
                                                <div className="mt-3 p-3 bg-gray-100 rounded-lg text-gray-700">
                                                    {offer.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(offer)}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <HiPencil className="w-5 h-5 text-black" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(offer)}
                                                className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors"
                                            >
                                                <HiTrash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {offers.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 text-lg mb-4">You haven't made any offers yet</p>
                                    <Link 
                                        to="/" 
                                        className="inline-block px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                    >
                                        Explore Startups
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-black">Edit Offer</h2>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-black">Investment Amount ($)</label>
                                    <input
                                        type="number"
                                        value={editOffer.offer_amount}
                                        onChange={(e) => setEditOffer({...editOffer, offer_amount: e.target.value})}
                                        className="w-full p-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-black">Share Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={editOffer.share_percentage}
                                        onChange={(e) => setEditOffer({...editOffer, share_percentage: e.target.value})}
                                        className="w-full p-2 rounded bg-gray-100 border border-gray-300 focus:outline-none focus:border-blue-500 text-black"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 rounded-full hover:bg-gray-100 transition-colors text-black"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4 text-black">Delete Offer</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete your offer for <span className="font-semibold">{offerToDelete?.startup_name}</span>?
                            <br />
                            <span className="text-sm">
                                Investment: ${parseFloat(offerToDelete?.offer_amount).toLocaleString()} • 
                                Share: {offerToDelete?.share_percentage}%
                            </span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
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

export default MyOffers;