import React, { useState, useEffect } from "react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

const CommentSection = ({ videoId, token }) => {
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCurrentUser)
      .catch((err) => console.error("Ошибка загрузки пользователя:", err));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3000/comments/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setComments(data);
      });
  }, [videoId]);

  useEffect(() => {
    const fetchUsers = async () => {
      const uniqueUserIds = [...new Set(comments.map((comment) => comment.author_id))];
      const userRequests = uniqueUserIds.map((id) =>
        fetch(`http://localhost:3000/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json())
      );

      const userData = await Promise.all(userRequests);
      const userMap = userData.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});
      setUsers(userMap);
    };

    if (comments.length > 0) fetchUsers();
  }, [comments]);

  return (
    <div className="mt-6">
      <h2 className="font-bold text-lg mb-4">Comments</h2>

      <CommentForm token={token} videoId={videoId} currentUser={currentUser} setComments={setComments} />

      <div className="mt-4">
        {comments
          .filter((comment) => comment.parent_id === null) // Основные комментарии
          .map((comment) => (
            <CommentItem key={comment.id} comment={comment} users={users} token={token} setComments={setComments} replies={comments.filter((c) => c.parent_id === comment.id)} />
          ))}
      </div>
    </div>
  );
};

export default CommentSection;