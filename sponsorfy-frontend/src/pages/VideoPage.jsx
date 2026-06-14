import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import CustomVideoPlayer from '../components/CustomVideoPlayer';// Импортируем наш компонент VideoPlayer
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";
import CommentSection from "../components/CommentSection";
import OffersTable from "../components/OffersTable";

const VideoPage = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [author, setAuthor] = useState(null);
  const [offers, setOffers] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [recommended, setRecommended] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [offerData, setOfferData] = useState({ sharePercentage: "", offerAmount: "" });
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const token = localStorage.getItem("token");

  const hasViewed = useRef(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (author) {
      fetch(`http://localhost:3000/startups/${author.id}/is-subscribed`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setIsSubscribed(data.isSubscribed))
        .catch(error => console.error("Error checking subscription:", error));
    }
  }, [author, token]);

  const handleSubscription = () => {
    const url = `http://localhost:3000/startups/${author.id}/${isSubscribed ? "unsubscribe" : "subscribe"}`;
    fetch(url, {
      method: isSubscribed ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setIsSubscribed(!isSubscribed);
        } else if (data.error) {
          console.error("Subscription error:", data.error);
        }
      })
      .catch(error => console.error("Error subscribing/unsubscribing:", error));
  };

  useEffect(() => {
    if (!hasViewed.current) {
      hasViewed.current = true;
      fetch(`http://localhost:3000/videos/${videoId}/view`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }, [videoId]);

  useEffect(() => {
    fetch(`http://localhost:3000/videos/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setVideo(data);
        return fetch(`http://localhost:3000/users/${data.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(setAuthor);

    fetch(`http://localhost:3000/videos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(videos => {
        setRecommended(videos);

        const uniqueUserIds = [...new Set(videos.map(video => video.user_id))];
        const userRequests = uniqueUserIds.map(id =>
          fetch(`http://localhost:3000/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.json())
        );

        Promise.all(userRequests).then(userData => {
          const userMap = userData.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});
          setUsers(userMap);
        });
      });
  }, [videoId]);

  useEffect(() => {
    fetch(`http://localhost:3000/comments/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setComments);
  }, [videoId]);

  useEffect(() => {
    if (author) {
      fetch(`http://localhost:3000/startups/${author.id}/offers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(offersData => {
          const investorNames = offersData.map(offer => offer.investor_name);

          Promise.all(
            investorNames.map(name =>
              fetch(`http://localhost:3000/users?name=${encodeURIComponent(name)}`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(res => res.ok ? res.json() : null)
            )
          ).then(investorsData => {
            const investorMap = investorsData.reduce((acc, investor) => {
              if (investor) acc[investor.name] = investor;
              return acc;
            }, {});

            const updatedOffers = offersData.map(offer => ({
              ...offer,
              investor_id: investorMap[offer.investor_name]?.id || null,
              investor_avatar: investorMap[offer.investor_name]?.avatar || ""
            }));

            setOffers(updatedOffers);
          });
        })
        .catch(error => console.error("Error fetching offers:", error));
    }
  }, [author, token]);

  const handleLike = () => {
    fetch(`http://localhost:3000/videos/${videoId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setVideo(prev => ({ ...prev, likes: prev.likes + 1 }));
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowSharePopup(true);
    setTimeout(() => setShowSharePopup(false), 2000);
  };

  const handleOfferSubmit = () => {
    fetch(`http://localhost:3000/startups/${author.id}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(offerData)
    })
      .then(res => res.json())
      .then(() => {
        setOfferData({ sharePercentage: "", offerAmount: "" });
        setShowOfferPopup(false);
      })
      .catch(error => console.error("Error submitting offer:", error));
  };

  if (!video || !author) return <p>Loading...</p>;

  return (
    <div className="bg-white min-h-screen">
      {/* Fixed Navbar */}
      <div className="fixed top-0 w-full z-50 h-16 border-b border-gray-300">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="pt-16 text-black">
        <div className="flex mt-4 px-8">
          <div className="w-3/4">
            {/* Используем VideoPlayer вместо стандартного video */}
            <div className="player-wrapper rounded-lg overflow-hidden shadow-xl">
              <CustomVideoPlayer src={video.url} 
              qualityOptions={['1080p', '720p', '480p']}/>
            </div>

            <p className="text-lg font-bold mt-4">{video.title}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <a href={`/profile/${author.id}`} className="flex items-center space-x-3">
                  <img src={author.avatar} alt={author.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-bold">{author.name}</p>
                    <p className="text-gray-600">{author.subscribers_count} subscribers • {video.views} views</p>
                  </div>
                </a>
                <button
                  className={`ml-4 px-4 py-2 rounded-full text-base focus:outline-none transition ${
                    isSubscribed ? "bg-gray-400 text-gray-700" : "bg-[#121212] text-white"
                  }`}
                  onClick={handleSubscription}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              </div>
              <div className="flex space-x-1">
                <button className="bg-[#121212] px-4 py-2 rounded-full text-base text-white focus:outline-none" onClick={handleLike}>{video.likes} Likes</button>
                <button className="bg-[#121212] px-4 py-2.2 rounded-full text-base text-white focus:outline-none" onClick={handleShare}>Share</button>
                <button
                  className={author.offers_enabled === 1
                    ? "bg-[#121212] px-4 py-2.2 rounded-full text-base text-white focus:outline-none"
                    : "bg-gray-500 px-4 py-2.2 rounded-full text-base text-gray-700 focus:outline-none cursor-not-allowed"
                  }
                  onClick={author.offers_enabled === 1 ? () => setShowOfferPopup(true) : null}
                  disabled={author.offers_enabled !== 1}
                >
                  Offer
                </button>
              </div>
            </div>

            {showOfferPopup && (
              <div className="fixed inset-0 flex items-center justify-center bg-opacity-10 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-300 w-[90%] max-w-md">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Make an Offer</h2>
                  <div className="space-y-4">
                    <input
                      type="number"
                      placeholder="Share %"
                      className="p-3 border border-gray-400 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-600 w-full"
                      value={offerData.sharePercentage}
                      onChange={(e) => setOfferData({ ...offerData, sharePercentage: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Amount (₽)"
                      className="p-3 border border-gray-400 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-600 w-full"
                      value={offerData.offerAmount}
                      onChange={(e) => setOfferData({ ...offerData, offerAmount: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between space-x-4 mt-6">
                    <button
                      className="w-1/2 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                      onClick={() => setShowOfferPopup(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="w-1/2 p-3 bg-[#121212] text-white rounded-lg hover:bg-black transition"
                      onClick={handleOfferSubmit}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            <OffersTable offers={offers} description={video.description} />
            <CommentSection videoId={videoId} token={token} />
          </div>

          <div className="w-1/4 pl-8 space-y-4">
            {recommended.map(video => (
              <div className="w-full" key={video.id}>
                <VideoCard
                  video={{
                    id: video.id,
                    title: video.title,
                    preview_url: video.preview_url,
                    views: video.views,
                    created_at: video.created_at,
                    author: users[video.user_id]?.name || "Unknown",
                    avatar: users[video.user_id]?.avatar || ""
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;