// VideoGrid.jsx
import React, { useState } from "react";
import VideoCard from "./VideoCard";

export default function VideoGrid({ videos }) {
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 12; // Переменная для лимита карточек

  // Calculate indexes for current page
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = videos.slice(indexOfFirstVideo, indexOfLastVideo);

  // Calculate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(videos.length / videosPerPage); i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="relative min-h-screen">
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8 px-8 pb-20">
        {currentVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Pagination (fixed relative to VideoGrid) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white py-4 border-t border-gray-200 shadow-sm">
        <div className="flex justify-center space-x-2">
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                currentPage === number
                  ? "bg-black text-white" // Активная кнопка
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700" // Неактивные кнопки
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}