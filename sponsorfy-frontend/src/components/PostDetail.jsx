import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function PostDetail() {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [author, setAuthor] = useState(null);
    const [postLoading, setPostLoading] = useState(true);
    const [authorLoading, setAuthorLoading] = useState(false);
    const [postError, setPostError] = useState(null);
    const [authorError, setAuthorError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/posts/${postId}`);
                setPost(response.data);
                setPostError(null);
                // Загрузка данных автора после получения user_id из поста
                const userId = response.data.user_id;
                fetchAuthor(userId);
            } catch (err) {
                setPostError(err.message);
            } finally {
                setPostLoading(false);
            }
        };

        const fetchAuthor = async (userId) => {
            setAuthorLoading(true);
            try {
                const response = await axios.get(`http://localhost:3000/users/${userId}`);
                setAuthor(response.data);
                setAuthorError(null);
            } catch (err) {
                setAuthorError(err.message);
            } finally {
                setAuthorLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (postLoading) {
        return <div className="text-gray-500 text-center mt-4">Loading post...</div>;
    }

    if (postError) {
        return <div className="text-red-500 text-center mt-4">Error loading post: {postError}</div>;
    }

    if (!post) {
        return <div className="text-gray-500 text-center mt-4">Post not found</div>;
    }

    return (
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-20">
            <div className="bg-white shadow-md rounded-lg p-6 mx-auto max-w-screen-md">
                {/* Блок автора */}
                <div className="flex items-center mb-4">
                    {authorLoading ? (
                        <div className="text-gray-500">Loading author info...</div>
                    ) : authorError ? (
                        <div className="text-red-500">Error loading author: {authorError}</div>
                    ) : author ? (
                        <>
                            <img 
                                src={author.avatar} 
                                alt={author.name} 
                                className="w-10 h-10 rounded-full mr-3"
                            />
                            <span className="text-gray-700">
                                {author.name || "Unknown Author"}
                            </span>
                        </>
                    ) : (
                        <div className="text-gray-500">Author information not available</div>
                    )}
                </div>

                {/* Содержимое поста */}
                <p className="text-gray-700 mb-4">
                    {post.content || "No content available."}
                </p>

                {/* Медиафайлы */}
                {post.media_urls && post.media_urls.length > 0 && (
                    <div className="grid gap-4">
                        {post.media_urls.map((url, index) => (
                            <img 
                                key={index} 
                                src={url} 
                                alt={`Media ${index}`} 
                                className="rounded-lg w-full"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}