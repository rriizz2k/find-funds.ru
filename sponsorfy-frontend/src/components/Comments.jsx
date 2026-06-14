import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HiX, HiPaperAirplane } from 'react-icons/hi';

export default function Comments({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const response = await fetch(`http://localhost:3000/posts/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch comments');
            const data = await response.json();
            console.log('Fetched comments:', data);
            setComments(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await fetch(`http://localhost:3000/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content: newComment.trim() })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to post comment');
            }

            setComments(prev => [data, ...prev]);
            setNewComment('');
            toast.success('Comment posted!');
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error(error.message);
        }
    };

    const handleDelete = async (commentId) => {
        try {
            const response = await fetch(`http://localhost:3000/posts/${postId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }

            setComments(prev => prev.filter(comment => comment.id !== commentId));
            toast.success('Comment deleted!');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    return (
        <div className="mt-4">
            <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-4 py-2 rounded-full border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                    <button
                        type="submit"
                        className="p-2 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                        disabled={!newComment.trim()}
                    >
                        <HiPaperAirplane className="w-5 h-5 transform rotate-90" />
                    </button>
                </div>
            </form>

            {loading ? (
                <div className="text-black">Loading comments...</div>
            ) : (
                <div className="space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-3 border-b border-gray-200 pb-3">
                            <img
                                src={`http://localhost:3000${comment.author_avatar}`}
                                alt={comment.author_name}
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold text-black">{comment.author_name}</span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {comment.user_id === JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id && (
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <HiX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-black mt-1">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 