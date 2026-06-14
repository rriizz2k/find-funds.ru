// VideoCard_carousel.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function VideoCardCarousel({ video, isNew }) {
  return (
    <div className="relative w-[400px] min-w-[360px] max-w-[440px]">
      {/* Значок NEW */}
      {isNew && (
        <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
          NEW
        </div>
      )}

      <Link to={`/video/${video.id}`} className="video-card w-full flex flex-col">
        <div className="video-preview w-full">
          <img 
            src={video.preview_url} 
            alt="Video Preview" 
            className="video-img object-cover w-full h-64 rounded-lg"
          />
        </div>
        <div className="video-info mt-2 text-center">
          <h3 className="video-title text-lg font-medium">{video.title}</h3>
        </div>
      </Link>
    </div>
  );
}