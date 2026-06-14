import React, { useState } from "react";
import { HiOutlineHeart, HiHeart, HiPaperAirplane } from "react-icons/hi2";
import { Link } from "react-router-dom";

const CommentItem = ({ comment, users, token, setComments, replies }) => {
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [likedComments, setLikedComments] = useState({}); // Храним лайки отдельно для каждого комментария

  const toggleLike = (commentId) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));

    fetch(`http://localhost:3000/comments/${commentId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleReplySubmit = () => {
    if (replyText.trim() === "") return;

    fetch(`http://localhost:3000/comments/${comment.video_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: replyText, parent_id: comment.id }),
    })
      .then((res) => res.json())
      .then((reply) => {
        setComments((prev) => [...prev, reply]);
      });

    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className="mt-4">
      {/* Основной комментарий */}
      <div className="flex items-start space-x-3">
        <img
          src={users[comment.author_id]?.avatar || "/default-avatar.png"}
          alt={users[comment.author_id]?.name || "Loading..."}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="font-semibold text-sm">{users[comment.author_id]?.name || "Loading..."}</p>
            <p className="text-sm text-gray-800">{comment.text}</p>
          </div>
          <div className="flex items-center space-x-4 mt-1">
            <button className="text-xs text-gray-500" onClick={() => setReplyingTo(comment.id)}>
              Reply
            </button>
            <button onClick={() => toggleLike(comment.id)} className="flex items-center space-x-1">
              {likedComments[comment.id] ? <HiHeart className="text-red-500" /> : <HiOutlineHeart className="text-gray-500" />}
              <span className="text-xs text-gray-600">{comment.likes || 0}</span>
            </button>
          </div>

          {replyingTo === comment.id && (
            <div className="flex items-center mt-2 space-x-2">
              <input type="text" placeholder="Ваш ответ..." className="border border-gray-300 p-2 rounded-full flex-1 text-sm" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <button className="p-2 bg-black text-white rounded-full" onClick={handleReplySubmit}>
                <HiPaperAirplane size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Вложенные комментарии */}
      <div className="ml-8">
        {replies.map((reply) => (
          <div key={reply.id} className="flex items-start space-x-3 mt-2">
            <img
              src={users[reply.author_id]?.avatar || "/default-avatar.png"}
              alt={users[reply.author_id]?.name || "Loading..."}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 bg-gray-200 p-2 rounded-lg">
              <p className="font-semibold text-xs text-gray-900">
                {users[reply.author_id]?.name || "Loading..."}{" "}
                <span className="text-gray-500">replied to</span>{" "}
                <Link to={`/profile/${reply.parent_id}`} className="text-black font-bold">
                  {users[comment.author_id]?.name || "Unknown"}
                </Link>
              </p>
              <p className="text-xs text-gray-500">{reply.text}</p>
              <div className="flex items-center space-x-4 mt-1">
                <button className="text-xs text-gray-500" onClick={() => setReplyingTo(reply.id)}>
                  Ответить
                </button>
                <button onClick={() => toggleLike(reply.id)} className="flex items-center space-x-1">
                  {likedComments[reply.id] ? <HiHeart className="text-red-500" /> : <HiOutlineHeart className="text-gray-500" />}
                  <span className="text-xs text-gray-600">{reply.likes || 0}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentItem;