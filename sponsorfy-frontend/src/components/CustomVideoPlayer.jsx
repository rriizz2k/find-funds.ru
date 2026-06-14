import React, { useRef, useState, useEffect } from 'react';
import { HiPause, HiPlay } from 'react-icons/hi2';
import { HiVolumeOff, HiVolumeUp } from "react-icons/hi";

const CustomVideoPlayer = ({ src, qualityOptions }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    volume: 1,
    isMuted: false,
    progress: 0,
    isFullscreen: false,
    currentTime: 0,
    duration: 0,
    quality: qualityOptions?.[0] || 'auto',
    showQualityMenu: false
  });

  // Форматирование времени
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Обработчики
  const handlePlayPause = () => {
    setPlayerState(prev => ({ 
      ...prev, 
      isPlaying: !prev.isPlaying 
    }));
    playerState.isPlaying ? videoRef.current.pause() : videoRef.current.play();
  };

  const handleSeek = (seconds) => {
    videoRef.current.currentTime += seconds;
  };

  const handleQualityChange = (quality) => {
    setPlayerState(prev => ({
      ...prev,
      quality,
      showQualityMenu: false
    }));
    console.log('Quality changed to:', quality);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'ArrowRight':
          handleSeek(10);
          break;
        case 'ArrowLeft':
          handleSeek(-10);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleSeek]);

  useEffect(() => {
    const video = videoRef.current;
    
    const updateTime = () => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: video.currentTime,
        duration: video.duration,
        progress: (video.currentTime / video.duration) * 100
      }));
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateTime);
    
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateTime);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden group"
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        src={src}
        onClick={handlePlayPause}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 px-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="px-4">
          <div 
            className="h-2 bg-white/20 rounded-full mb-3 cursor-pointer"
            onClick={(e) => {
              const rect = e.target.getBoundingClientRect();
              const percentage = (e.clientX - rect.left) / rect.width;
              videoRef.current.currentTime = percentage * videoRef.current.duration;
            }}
          >
            <div 
              className="h-full bg-white rounded-full transition-all" 
              style={{ width: `${playerState.progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center space-x-4 text-white">
            <button
              onClick={() => handleSeek(-10)}
              className="hover:text-gray-300"
            >
              {/* Rewind Icon */}
            </button>

            <button
              onClick={handlePlayPause}
              className="hover:text-gray-300"
            >
              {playerState.isPlaying ? <HiPause size={24} /> : <HiPlay size={24} />}
            </button>

            <button
              onClick={() => handleSeek(10)}
              className="hover:text-gray-300"
            >
              {/* Forward Icon */}
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newVolume = playerState.volume === 0 ? 1 : 0;
                  videoRef.current.volume = newVolume;
                  setPlayerState(prev => ({
                    ...prev,
                    volume: newVolume,
                    isMuted: newVolume === 0
                  }));
                }}
              >
                {playerState.volume === 0 ? (
                  <HiVolumeOff size={24} />
                ) : (
                  <HiVolumeUp size={24} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={playerState.volume}
                onChange={(e) => {
                  const volume = parseFloat(e.target.value);
                  videoRef.current.volume = volume;
                  setPlayerState(prev => ({
                    ...prev,
                    volume,
                    isMuted: volume === 0
                  }));
                }}
                className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="text-sm font-mono">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-white">
            <div className="relative">
              <button
                onClick={() => setPlayerState(prev => ({
                  ...prev,
                  showQualityMenu: !prev.showQualityMenu
                }))}
                className="px-3 py-1 bg-black/50 rounded hover:bg-black/70"
              >
                {playerState.quality}
              </button>
              
              {playerState.showQualityMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-black/80 rounded-lg p-2 min-w-[120px]">
                  {qualityOptions?.map(option => (
                    <button
                      key={option}
                      onClick={() => handleQualityChange(option)}
                      className="block w-full text-left px-4 py-2 hover:bg-white/10 rounded"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="hover:text-gray-300"
            >
              {/* Fullscreen Icon */}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;