import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineUpload, HiOutlineSearch, HiOutlinePencil } from "react-icons/hi";
import CreatePostModal from "./CreatePostModal";
import axios from "axios";

export default function Navbar() {
  const [avatar, setAvatar] = useState("/default-avatar.png");
  const [query, setQuery] = useState("");
  const [showPostModal, setShowPostModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/users/me", {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.avatar) setAvatar(data.avatar);
      })
      .catch(() => setAvatar("/default-avatar.png"));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${query}`);
  };

  const handleCreatePost = async (postData) => {
    try {
      await axios.post("http://localhost:3000/posts", postData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setShowPostModal(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <nav className="w-full bg-white py-2 px-6 flex justify-between items-center fixed top-0 z-50 border-b border-battleship-gray">
      <Link to="/" className="text-2xl font-bold text-black">
        FindFunds
      </Link>
      <div className="flex-1 flex justify-center">
        <form onSubmit={handleSearch} className="w-[40rem] flex">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-6 py-2 w-full rounded-l-full bg-white text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:border-gray-400"
          />
          <button type="submit" className="px-4 bg-white text-black rounded-r-full border border-gray-300 flex items-center justify-center">
            <HiOutlineSearch size={20} />
          </button>
        </form>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setShowPostModal(true)} 
          className="bg-white text-black p-3 rounded-full hover:opacity-80 transition flex items-center justify-center"
        >
          <HiOutlinePencil size={22} />
        </button>
        <Link to="/upload" className="bg-white text-black p-3 rounded-full hover:opacity-80 transition flex items-center justify-center">
          <HiOutlineUpload size={22} />
        </Link>
        <Link to="/profile">
          <img src={avatar} alt="Profile" className="w-10 h-10 rounded-full" />
        </Link>
      </div>

      {showPostModal && (
        <CreatePostModal 
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </nav>
  );
}