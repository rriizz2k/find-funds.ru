// CarouselUser.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VideoCardCarousel from "./VideoCard_carousel";

const CarouselUser = ({ userId, watchedVideos }) => {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await fetch(`http://localhost:3000/users/${userId}`);
        const userData = await userRes.json();
        setUser(userData);

        const videosRes = await fetch(`http://localhost:3000/users/${userId}/videos`);
        const videosData = await videosRes.json();
        setVideos(videosData);
      } catch (error) {
        console.error(`Ошибка загрузки данных пользователя ${userId}:`, error);
      }
    };

    fetchUserData();
  }, [userId]);

  if (!user) return null;

  return (
    <div className="flex flex-col bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto mb-10">
      {/* Контейнер для видео-карусели с горизонтальным скроллом */}
      <div className="overflow-x-auto flex space-x-6 p-4 w-full px-6" style={{ scrollPaddingLeft: "20px" }}>
        {videos.length > 0 ? (
          videos.map((video) => (
            <VideoCardCarousel key={video.id} video={video} isNew={!watchedVideos.includes(video.id)} />
          ))
        ) : (
          <p className="text-gray-500">No videos</p>
        )}
      </div>

      {/* Разделитель */}
      <div className="border-t border-gray-300 w-full my-3"></div>

      {/* Информация о канале */}
      <div className="flex items-center w-full px-4 py-2">
        <Link to={`/profile/${user.id}`} className="flex items-center space-x-3">
          <img
            src={`http://localhost:3000${user.avatar}`}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
          />
          <span className="text-lg font-medium text-black">{user.name}</span>
        </Link>
      </div>
    </div>
  );
};

export default CarouselUser;