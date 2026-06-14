import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";

export default function MyVideos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:3000/users/me", {
          withCredentials: true,
        });
        setUserId(res.data.id);
      } catch (error) {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const fetchVideos = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/users/${userId}/videos`, {
          withCredentials: true,
        });
        setVideos(res.data);
      } catch (error) {
        console.error("Ошибка загрузки видео", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [userId]);

  const handleDelete = (videoId) => {
    setPopup({
      type: "confirm",
      message: "Are you sure you want to delete this video?",
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:3000/videos/${videoId}`, {
            withCredentials: true,
          });
          setPopup({ type: "success", message: "Video successfully deleted!" });
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          setPopup({ type: "error", message: "Failed to delete video." });
        }
      },
    });
  };

  const closePopup = () => setPopup(null);

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
          <div className="pt-5 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-black">My videos</h1>
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
              ) : videos.length === 0 ? (
                <p className="text-gray-600">No uploaded videos.</p>
              ) : (
                videos.map((video) => (
                  <div 
                    key={video.id} 
                    className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-6"
                  >
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
                      <h2 className="text-lg font-bold text-black">{video.title}</h2>
                      <p className="text-sm text-gray-600">{video.description?.slice(0, 50)}...</p>
                      <p className="text-sm text-gray-600">Views: {video.views} | Likes: {video.likes}</p>
                      <div className="mt-2 flex gap-2">
                        <button className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                          Promote
                        </button>
                        <button
                          className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          onClick={() => handleDelete(video.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Попап */}
      {popup && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            <p className="text-black text-lg mb-4 text-center">{popup.message}</p>
            <div className="flex justify-center gap-4">
              {popup.type === "confirm" && (
                <button 
                  className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  onClick={popup.onConfirm}
                >
                  Delete
                </button>
              )}
              <button 
                className="px-4 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors"
                onClick={closePopup}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}