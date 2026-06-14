import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CarouselUser from "../components/CarouselUser";
import Footer from "../components/Footer";

const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    return decoded.id;
  } catch (error) {
    console.error("Ошибка декодирования токена:", error);
    return null;
  }
};

const Subscribed = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [watchedVideos, setWatchedVideos] = useState([]);
  const userId = getUserIdFromToken();

  useEffect(() => {
    if (!userId) return;

    const fetchSubscriptions = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${userId}`);
        const userData = await response.json();

        if (userData.subscriptions) {
          const subscriptionsArray = JSON.parse(userData.subscriptions);
          setSubscriptions(subscriptionsArray);
        }

        if (userData.watched_videos) {
          setWatchedVideos(JSON.parse(userData.watched_videos));
        }
      } catch (error) {
        console.error("Ошибка загрузки подписок:", error);
      }
    };

    fetchSubscriptions();
  }, [userId]);

  return (
    <div className="min-h-screen bg-white">
      {/* Фиксированный Navbar */}
      <div className="fixed top-0 w-full z-50 h-16 border-b border-gray-300 bg-white">
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
          <div className="pt-16 max-w-7xl mx-auto">
            {subscriptions.length > 0 ? (
              subscriptions.map((subId) => (
                <CarouselUser key={subId} userId={subId} watchedVideos={watchedVideos} />
              ))
            ) : (
              <p className="text-gray-600 text-center">You are not subscribed to any channels.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribed;