import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import VideoGrid from "../components/VideoGrid";
import Navbar from "../components/Navbar";
import axios from "axios";

axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:3000/videos", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(async (data) => {
        const videosWithAuthors = await Promise.all(
          data.map(async (video) => {
            try {
              const userRes = await fetch(`http://localhost:3000/users/${video.user_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const userData = userRes.ok ? await userRes.json() : { name: "Unknown Author", avatar: null };
              return {
                ...video,
                author: userData.name,
                avatar: userData.avatar ? `http://localhost:3000${userData.avatar}` : null
              };
            } catch {
              return { ...video, author: "Unknown Author", avatar: null };
            }
          })
        );
        setVideos(videosWithAuthors);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching videos:", error);
        setLoading(false);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col ">


      <div className="fixed top-0 w-full z-50 h-16 border-b border-gray-300">
        <Navbar />
      </div>
        
      
      <div className="flex">
        {/* Сайдбар с отступом под навбар */}
        <div className="fixed w-[200px] h-[calc(100vh-4rem)] mt-16 bg-white border-r border-gray-200 z-40">
                    <Sidebar />
                </div>
        {/* Основной контент */}
        
        <div 
          className="flex-1 ml-[200px] pt-16"
          style={{ 
            width: "calc(100% - 200px)",
            minHeight: "calc(100vh - 64px)"
          }}
        >
          {loading ? (
            <p className="text-battleship-gray text-center">Loading videos...</p>
          ) : (
            <VideoGrid videos={videos} />
          )}
        </div>
      </div>
    </div>
  );
}