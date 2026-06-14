import React from "react";
import { Link } from "react-router-dom";

// ====================
// STYLE VARIABLES
// ====================
const CARD_STYLES = {
  backgroundColor: "white", // Background color of the card
  hoverBackgroundColor: "gray-50", // Background color on hover
  padding: "p-1", // Padding inside the card
  borderRadius: "rounded-xl", // Border radius of the card
  transition: "transition-colors", // Transition effect
};

const IMAGE_STYLES = {
  aspectRatio: "aspect-video", // Aspect ratio of the video preview
  borderRadius: "rounded-xl", // Border radius of the image
  overflow: "overflow-hidden", // Hide overflow for the image
};

const DURATION_BADGE_STYLES = {
  backgroundColor: "black/80", // Background color of the duration badge
  textColor: "white", // Text color of the duration badge
  fontSize: "text-xs", // Font size of the duration badge
  padding: "px-2 py-1", // Padding of the duration badge
  borderRadius: "rounded-md", // Border radius of the duration badge
  position: "absolute bottom-2 right-2", // Position of the duration badge
};

const AVATAR_STYLES = {
  size: "w-9 h-9", // Size of the avatar
  borderRadius: "rounded-full", // Border radius of the avatar
  overflow: "overflow-hidden", // Hide overflow for the avatar
  backgroundColor: "gray-200", // Fallback background color for the avatar
};

const TEXT_STYLES = {
  title: {
    fontSize: "text-[15px]", // Font size of the title
    fontWeight: "font-medium", // Font weight of the title
    color: "text-gray-900", // Text color of the title
    lineClamp: "line-clamp-2", // Number of lines to show for the title
    marginBottom: "mb-1", // Margin bottom of the title
  },
  author: {
    fontSize: "text-[13px]", // Font size of the author text
    color: "text-gray-600", // Text color of the author text
    lineClamp: "line-clamp-1", // Number of lines to show for the author text
  },
  metadata: {
    fontSize: "text-[12px]", // Font size of the metadata (views and time ago)
    color: "text-gray-600", // Text color of the metadata
  },
};

// ====================
// COMPONENT
// ====================
export default function VideoCard({ video }) {
  if (!video) return null;

  // Форматирование длительности видео (пример: 12:34)
  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Форматирование просмотров (пример: 1.2M)
  const formatViews = (views) => {
    if (!views) return "0 views";
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
    return `${views} views`;
  };

  // Форматирование времени (пример: "2 недели назад")
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    
    if (weeks > 0) return rtf.format(-weeks, "week");
    if (days > 0) return rtf.format(-days, "day");
    if (hours > 0) return rtf.format(-hours, "hour");
    if (minutes > 0) return rtf.format(-minutes, "minute");
    return "Just now";
  };

  return (
    <Link 
      to={`/video/${video.id}`} 
      className={`w-full flex flex-col gap-2 hover:bg-${CARD_STYLES.hoverBackgroundColor} ${CARD_STYLES.backgroundColor} ${CARD_STYLES.padding} ${CARD_STYLES.borderRadius} ${CARD_STYLES.transition}`}
    >
      {/* Превью видео */}
      <div className={`relative w-full ${IMAGE_STYLES.aspectRatio} ${IMAGE_STYLES.borderRadius} ${IMAGE_STYLES.overflow}`}>
        <img
          src={video.preview_url || "/placeholder.jpg"}
          alt="Video preview"
          className="w-full h-full object-cover"
        />
        
        {/* Бейдж с длительностью */}
        {video.duration && (
          <span className={`bg-${DURATION_BADGE_STYLES.backgroundColor} text-${DURATION_BADGE_STYLES.textColor} ${DURATION_BADGE_STYLES.fontSize} ${DURATION_BADGE_STYLES.padding} ${DURATION_BADGE_STYLES.borderRadius} ${DURATION_BADGE_STYLES.position}`}>
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Информация о видео */}
      <div className="flex gap-3">
        {/* Аватарка (скрыта на мобильных) */}
        <div className="hidden sm:block flex-shrink-0">
          <div className={`${AVATAR_STYLES.size} ${AVATAR_STYLES.borderRadius} ${AVATAR_STYLES.overflow}`}>
            {video.avatar ? (
              <img 
                src={video.avatar} 
                alt="Author" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-${AVATAR_STYLES.backgroundColor}`} />
            )}
          </div>
        </div>

        {/* Текстовая информация */}
        <div className="flex-1 min-w-0">
          <h3 className={`${TEXT_STYLES.title.fontSize} ${TEXT_STYLES.title.fontWeight} ${TEXT_STYLES.title.color} ${TEXT_STYLES.title.lineClamp} ${TEXT_STYLES.title.marginBottom}`}>
            {video.title || "Untitled Video"}
          </h3>
          <div className={`${TEXT_STYLES.author.fontSize} ${TEXT_STYLES.author.color}`}>
            <p className={`${TEXT_STYLES.author.lineClamp}`}>{video.author || "Unknown Author"}</p>
            <div className={`flex items-center gap-1.5 ${TEXT_STYLES.metadata.fontSize} ${TEXT_STYLES.metadata.color}`}>
              <span>{formatViews(video.views)}</span>
              {video.created_at && (
                <>
                  <span>•</span>
                  <span>{formatTimeAgo(video.created_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}