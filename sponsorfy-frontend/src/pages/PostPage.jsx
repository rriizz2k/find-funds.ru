import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostDetail from '../components/PostDetail'; // Импортируйте новый компонент

export default function PostPage() {
    const { postId } = useParams();

    return (
        <div className="min-h-screen">
            <div className="fixed top-0 w-full z-50 h-16 border-b border-gray-300">
                <Navbar />
            </div>
            <PostDetail postId={postId} /> {/* Используйте PostDetail */}
        </div>
    );
}