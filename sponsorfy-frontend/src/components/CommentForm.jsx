import React, { useState } from "react";
import { HiPaperAirplane } from "react-icons/hi2";

const CommentForm = ({ token, videoId, currentUser, setComments }) => {
  const [newComment, setNewComment] = useState("");

  const handleCommentSubmit = () => {
    if (newComment.trim() === "") return;

    fetch(`http://localhost:3000/comments/${videoId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: newComment, parent_id: null }),
    })
      .then((res) => res.json())
      .then((comment) => {
        setComments((prev) => [...prev, comment]);
      });

    setNewComment("");
  };

  return (
    <div className="flex items-center space-x-3">
      <input type="text" placeholder="Add the comment..." className="border border-gray-300 p-2 rounded-full flex-1 text-sm" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
      <button className="p-3 bg-black text-white rounded-full" onClick={handleCommentSubmit}>
        <HiPaperAirplane size={18} />
      </button>
    </div>
  );
};

export default CommentForm;