import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Импортируем Navbar

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!video || !preview) {
      setMessage("Please upload both video and preview!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("video", video);
    formData.append("preview", preview);

    try {
      const response = await fetch("http://localhost:3000/videos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        setMessage("Video uploaded successfully!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setMessage("Error uploading video.");
      }
    } catch (error) {
      setMessage("Server unavailable.");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Navbar (растянут на всю ширину) */}
      <div className="fixed top-0 w-full z-50 h-16 border-b border-gray-300">
        <Navbar />
      </div>

      {/* Основной контент с отступом под Navbar */}
      <div className="pt-16 pb-16 flex-grow"> {/* pt-16 добавляет отступ сверху */}
        {/* Логотип Sponsorfy с отступами */}
        <div className="w-full text-center mt-12 mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-black">FindFunds</h1>
        </div>

        {/* Контент страницы */}
        <div className="flex-grow flex justify-center items-center">
          <div className="p-8 w-full max-w-3xl shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-black text-center">Upload Video</h2>

            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <label className="text-black font-semibold">Title</label>
              <input
  type="text"
  placeholder="Enter video title"
  className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[95%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  required
/>

              <label className="text-black font-semibold">Description</label>
              <textarea
              placeholder="Enter video description"
              className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[95%] mx-auto h-24 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

              <label className="text-black font-semibold">Preview Image</label>
              <input
                type="file"
                accept="image/*"
                className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[95%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                onChange={(e) => setPreview(e.target.files[0])}
                required
              />

              <label className="text-black font-semibold">Video File (MP4)</label>
              <input
                type="file"
                accept="video/mp4"
                className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[95%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                onChange={(e) => setVideo(e.target.files[0])}
                required
              />

              {/* Кнопка загрузки */}
              <button type="submit" className="p-3 bg-black text-white rounded-full hover:opacity-80 transition w-[95%] mx-auto">
                Upload
              </button>

              {message && <p className="text-red-500 text-center">{message}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}