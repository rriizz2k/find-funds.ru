import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { HiHeart, HiOutlineHeart, HiOutlineChat, HiOutlineShare, HiX } from 'react-icons/hi';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Comments from './Comments';

const API_URL = "http://localhost:3000";

export default function Post({ post, onDelete }) {
  const [showOptions, setShowOptions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const currentUserId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;

  useEffect(() => {
    // Проверяем статус лайка при загрузке
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/posts/${post.id}/like`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then(res => res.json())
        .then(data => setIsLiked(data.liked))
        .catch(console.error);
  }, [post.id]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Just now';
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/posts/${post.id}/like`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
    } catch (error) {
        console.error('Error handling like:', error);
        toast.error('Failed to like post');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3000/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete post');
      
      toast.success('Post deleted successfully');
      if (onDelete) onDelete(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    
    toast.success('Link copied to clipboard!', {
      position: "top-right",
      autoClose: 3000
    });
  };

  return (
    <div className="mb-4 border-b border-gray-200 pb-4">
      <div className="flex items-start space-x-4">
        <Link to={`/profile/${post.user_id}`}>
          <img
            src={`http://localhost:3000${post.author_avatar}`}
            alt={post.author_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${post.user_id}`}>
                <h3 className="font-semibold text-black">{post.author_name}</h3>
              </Link>
              <span className="text-gray-500 text-sm">
                {formatDate(post.created_at)} {/* Updated to show time ago */}
              </span>
            </div>
            {post.user_id === currentUserId && (
              <button
                onClick={handleDelete}
                className="text-gray-500 hover:text-red-600"
              >
                <HiX className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="mt-2 text-black">{post.content}</p>

          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-2">
                <div className="relative rounded-2xl overflow-hidden max-w-[50%]">
                    <div className={`grid gap-0.5 ${
                        post.media_urls.length === 1 ? 'grid-cols-1' : 
                        post.media_urls.length === 2 ? 'grid-cols-2' :
                        post.media_urls.length === 3 ? 'grid-cols-2' :
                        'grid-cols-2'
                    }`}>
                        {post.media_urls.map((url, index) => (
                            <div key={index} className={`relative ${
                                post.media_urls.length === 1 ? 'aspect-auto max-h-[500px]' :
                                post.media_urls.length === 2 ? 'aspect-square' :
                                post.media_urls.length === 3 && index === 0 ? 'aspect-square row-span-2' :
                                'aspect-square'
                            }`}>
                                <img 
                                    src={url.startsWith('http') ? url : `http://localhost:3000${url}`}
                                    alt={`Media ${index + 1}`}
                                    className={`w-full ${
                                        post.media_urls.length === 1 ? 'h-auto max-h-[500px] object-contain' :
                                        'h-full object-cover'
                                    } bg-[#1e1e1e]`}
                                    onClick={() => {/* Можно добавить просмотр в полном размере */}}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          <div className="mt-3 flex items-center space-x-6">
            <button 
              onClick={handleLike}
              className="flex items-center space-x-2 text-gray-500 hover:text-red-600 group"
            >
              {isLiked ? (
                <HiHeart className="w-5 h-5 text-red-600" />
              ) : (
                <HiOutlineHeart className="w-5 h-5 group-hover:text-red-600" />
              )}
              <span className="text-black">{likesCount}</span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 group"
            >
              <HiOutlineChat className="w-5 h-5" />
              <span className="text-black">{post.comments_count || 0}</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-500 hover:text-green-600 group"
            >
              <HiOutlineShare className="w-5 h-5" />
            </button>
          </div>

          {showComments && <Comments postId={post.id} />}
        </div>
      </div>
    </div>
  );
}