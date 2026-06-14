import React, { useState } from 'react';
import { HiX, HiPhotograph } from 'react-icons/hi';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function CreatePostModal({ isOpen, onClose }) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaUrls.length > 4) { // Максимум 4 изображения как в Twitter
        toast.error('Maximum 4 images allowed');
        return;
    }
    
    // Создаем превью для файлов
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMediaUrls(prev => [...prev, ...newPreviews]);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
        // Создаем FormData для поста
        const formData = new FormData();
        formData.append('content', content.trim());
        
        // Добавляем файлы, если они есть
        selectedFiles.forEach(file => formData.append('media', file));

        // Отправляем пост с медиа в одном запросе
        const response = await axios.post('http://localhost:3000/posts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Очищаем состояние
        mediaUrls.forEach(url => URL.revokeObjectURL(url));
        setContent('');
        setMediaUrls([]);
        setSelectedFiles([]);
        onClose();
        window.location.reload();
    } catch (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
    } finally {
        setIsLoading(false);
    }
  };

  const removeMedia = (index) => {
    URL.revokeObjectURL(mediaUrls[index]);
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-[10px] flex items-center justify-center z-50">
      <div className="w-full max-w-3xl mx-4">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-black">Create Post</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#1e1e1e] rounded-full text-gray-300"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[95%] mx-auto h-24 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                maxLength={280}
              />

              {mediaUrls.length > 0 && (
                <div className="mt-4">
                  <div className="relative rounded-2xl overflow-hidden max-w-[50%]">
                    <div className={`grid gap-0.5 ${
                      mediaUrls.length === 1 ? 'grid-cols-1' : 
                      mediaUrls.length === 2 ? 'grid-cols-2' :
                      mediaUrls.length === 3 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {mediaUrls.map((url, index) => (
                        <div key={index} className={`relative ${
                          mediaUrls.length === 1 ? 'aspect-auto max-h-[500px]' :
                          mediaUrls.length === 2 ? 'aspect-square' :
                          mediaUrls.length === 3 && index === 0 ? 'aspect-square row-span-2' :
                          'aspect-square'
                        }`}>
                          <img 
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className={`w-full ${
                              mediaUrls.length === 1 ? 'h-auto max-h-[500px] object-contain' :
                              'h-full object-cover'
                            } bg-[#1e1e1e]`}
                          />
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-opacity"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-300 flex items-center justify-between">
              <label className={`cursor-pointer ${mediaUrls.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaUpload}
                  multiple
                  disabled={mediaUrls.length >= 4}
                  className="hidden"
                />
                <div className="p-2 hover:bg-[#1e1e1e] rounded-full">
                  <HiPhotograph className="w-6 h-6 text-blue-500" />
                </div>
              </label>

              <div className="flex items-center gap-4">
                <span className="text-gray-300">
                  {content.length}/280
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || isLoading}
                  className={`px-4 py-2 rounded-full font-semibold ${
                    !content.trim() || isLoading
                      ? 'bg-blue-500/50 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {isLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 