import React, { useState, useEffect } from 'react';
import Post from './Post';

export default function PostsList({ userId, isProfilePage = false }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            console.log('Fetching posts for userId:', userId);

            if (!userId) {
                console.log('No userId provided, using current user');
                const token = localStorage.getItem('token');
                const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
                
                if (!currentUserId) {
                    console.log('No current user found');
                    setLoading(false);
                    return;
                }
                
                // Используем ID текущего пользователя
                userId = currentUserId;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3000/users/${userId}/posts`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Received data:', data);

                setPosts(data);
            } catch (error) {
                console.error('Error in fetchPosts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [userId]);

    console.log('Current state - loading:', loading, 'posts:', posts);

    if (loading) {
        return <div className="text-gray-500 text-center mt-4">Loading posts...</div>;
    }

    if (!posts || posts.length === 0) {
        return <div className="text-gray-500 text-center mt-4">No posts yet</div>;
    }

    return (
        <div className={isProfilePage ? "" : "max-w-2xl mx-auto pt-20 px-4"}>
            {posts.map(post => (
                <Post 
                    key={post.id} 
                    post={post}
                    onDelete={(postId) => {
                        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
                    }}
                />
            ))}
        </div>
    );
} 