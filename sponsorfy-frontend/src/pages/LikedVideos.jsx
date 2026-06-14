import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiArrowLeft, HiEye, HiHeart } from 'react-icons/hi';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axios from "axios";

export default function LikedVideos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchLikedVideos = async () => {
            try {
                const response = await axios.get("http://localhost:3000/liked-videos", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const videosWithAuthors = await Promise.all(
                    response.data.map(async (video) => {
                        try {
                            const userRes = await axios.get(`http://localhost:3000/users/${video.user_id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            return {
                                ...video,
                                author: userRes.data.name,
                                avatar: userRes.data.avatar ? `http://localhost:3000${userRes.data.avatar}` : null
                            };
                        } catch {
                            return { ...video, author: "Unknown Author", avatar: null };
                        }
                    })
                );
                setVideos(videosWithAuthors);
            } catch (error) {
                console.error("Error fetching liked videos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLikedVideos();
    }, [navigate]);

    return (
        <div className="min-h-screen">
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
                    <div className="pt-5 max-w-4xl mx-auto">
                        {/* Заголовок */}
                        <div className="flex items-center gap-4 mb-8">
                            <h1 className="text-2xl font-bold text-black">Liked videos</h1>
                        </div>

                        {/* Лоадер или контент */}
                        {loading ? (
                            <div className="flex justify-center items-center h-[400px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        ) : videos.length > 0 ? (
                            <div className="space-y-6">
                                {videos.map((video) => (
                                    <Link 
                                        to={`/video/${video.id}`} 
                                        key={video.id} 
                                        className="block p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex gap-6">
                                            <img 
                                                src={video.preview_url?.startsWith('http') 
                                                    ? video.preview_url 
                                                    : `http://localhost:5173${video.preview_url}`
                                                } 
                                                alt="Preview" 
                                                className="w-64 h-36 object-cover rounded-md" 
                                                onError={(e) => e.target.src = "https://via.placeholder.com/150"} 
                                            />
                                            <div className="flex-1">
                                                <h2 className="text-lg font-bold text-black mb-2">{video.title}</h2>
                                                <p className="text-sm text-gray-600 mb-4">{video.description?.slice(0, 100)}...</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                    <div className="flex items-center gap-1">
                                                        <HiEye className="w-4 h-4" />
                                                        <span>{video.views}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <HiHeart className="w-4 h-4" />
                                                        <span>{video.likes}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    {video.avatar && (
                                                        <img 
                                                            src={video.avatar} 
                                                            alt="Author Avatar" 
                                                            className="w-6 h-6 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span>{video.author}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400 text-lg mb-4">You haven't liked any videos yet</p>
                                <Link 
                                    to="/" 
                                    className="inline-block px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                >
                                    Explore Videos
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}