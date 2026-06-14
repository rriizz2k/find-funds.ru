import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import EditProfile from "./pages/EditProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UploadPage from "./pages/UploadPage";
import MyVideos from "./pages/MyVideos";
import VideoPage from "./pages/VideoPage";
import Search from "./pages/Search";  // <-- Импортируем страницу поиска
import Subscribed from "./pages/Subscribed";
import Trending from "./pages/Trending";
import Relevant from "./pages/Relevant";
import PostPage from "./pages/PostPage";
import { Toaster } from 'react-hot-toast';
import MyOffers from './pages/MyOffers';
import LikedVideos from "./pages/LikedVideos";

export default function App() {
  return (
    <>
      <Toaster />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/my-videos" element={<MyVideos />} />
          <Route path="/video/:videoId" element={<VideoPage />} />
          <Route path="/search" element={<Search />} />  {/* <-- Добавили роут для поиска */}
          <Route path="/subscribed" element={<Subscribed />} />  {/* <-- Добавили роут для поиска */}
          <Route path="/trending" element={<Trending />} />  {/* <-- Добавили роут для поиска */}
          <Route path="/relevant" element={<Relevant />} />  {/* <-- Добавили роут для поиска */}
          <Route path="/post/:postId" element={<PostPage />} />
          <Route path="/my-offers" element={<MyOffers />} />
          <Route path="/liked" element={<LikedVideos />} />
        </Routes>
      </Router>
    </>
  );
}