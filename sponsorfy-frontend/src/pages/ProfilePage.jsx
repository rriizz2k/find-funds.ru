import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import VideoGrid from "../components/VideoGrid";
import PostsList from "../components/PostsList";
import OffersTable from "../components/OffersTable_profile";
import { 
  FaPaperclip, FaPlus, FaTrash, FaDoorOpen, 
  FaTimes, FaTwitter, FaInstagram, FaTelegram, FaEnvelope 
} from "react-icons/fa";
import MediaSection from "../components/MediaSection";
import CreatePostModal from "../components/CreatePostModal";

axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
const API_URL = "http://localhost:3000";
const DEFAULT_BANNER = "/default-banner.jpg";
const DEFAULT_AVATAR = "/default-avatar.png";

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [videos, setVideos] = useState([]);
    const [media, setMedia] = useState([]);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [activeTab, setActiveTab] = useState("Posts");
    const [showPostModal, setShowPostModal] = useState(false);
    const [showMediaPopup, setShowMediaPopup] = useState(false);
    const [newMedia, setNewMedia] = useState({ title: "", type: "docs", url: "" });
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);
    const [showContactsPopup, setShowContactsPopup] = useState(false);

    const isCurrentUser = !userId;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await axios.get(userId ? `${API_URL}/users/${userId}` : `${API_URL}/users/me`);
                setUser(userRes.data);
    
                const videosRes = await axios.get(`${API_URL}/users/${userRes.data.id}/videos`);
                const videosWithAuthors = await Promise.all(
                    videosRes.data.map(async (video) => {
                        try {
                            const authorRes = await axios.get(`${API_URL}/users/${video.user_id}`);
                            return { 
                                ...video, 
                                author: authorRes.data.name,
                                avatar: authorRes.data.avatar
                            };
                        } catch {
                            return { 
                                ...video, 
                                author: "Unknown Author", 
                                avatar: DEFAULT_AVATAR 
                            };
                        }
                    })
                );
                setVideos(videosWithAuthors);
    
                const mediaRes = await axios.get(`${API_URL}/users/${userRes.data.id}/media`);
                setMedia(mediaRes.data);
    
                const offersRes = await axios.get(`${API_URL}/startups/${userRes.data.id}/offers`);
                setOffers(offersRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchData();
    }, [userId]);

    useEffect(() => {
        let isMounted = true;

        const fetchPosts = async () => {
            if (!userId) return;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/users/${userId}/posts`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                const data = await response.json();
                
                if (isMounted) {
                    setPosts(data);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
                if (isMounted) {
                    setError(error.message);
                    setLoading(false);
                }
            }
        };

        fetchPosts();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleSubscription = () => {
        setIsSubscribed(!isSubscribed);
    };

    const handleCreatePost = async (postData) => {
        try {
            await axios.post(`${API_URL}/posts`, postData);
            setShowPostModal(false);
            setActiveTab("Posts");
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    const handleAddMedia = async () => {
        if (!newMedia.title || !newMedia.url) return;
        try {
            const response = await axios.post(`${API_URL}/users/${user.id}/media`, newMedia);
            setMedia([...media, { id: response.data.mediaId, ...newMedia }]);
            setShowMediaPopup(false);
            setNewMedia({ title: "", type: "docs", url: "" });
        } catch (error) {
            console.error("Error adding media:", error);
        }
    };

    const handleDeleteMedia = async (id) => {
        try {
            await axios.delete(`${API_URL}/users/${user.id}/media/${id}`);
            setMedia(media.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting media:", error);
        }
    };

    const handlePostDelete = (deletedPostId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (!user) return <div className="flex items-center justify-center min-h-screen">User not found</div>;

    return (
        <div className="min-h-screen flex flex-col w-full">
            <div className="fixed top-0 w-full z-50 h-16 bg-white">
                <Navbar />
            </div>
            
            <div className="mt-16">
                <div className="relative w-full h-64" style={{ 
                    backgroundImage: `url(${user.banner || DEFAULT_BANNER})`, 
                    backgroundSize: "cover", 
                    backgroundPosition: "center" 
                }}>
                    <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                        <img 
                            className="w-32 h-32 rounded-full border-4 border-white" 
                            src={user.avatar || DEFAULT_AVATAR} 
                            alt="Avatar" 
                        />
                    </div>
                </div>

                <div className="px-6 mt-16 flex flex-col">
                    <h2 className="text-3xl font-bold text-black">{user.name || "Unknown User"}</h2>
                    <p className="text-gray-500 text-lg">{user.bio || "No bio available"}</p>
                    
                    {/* Блок с количеством подписчиков */}
                    <div className="mt-2 flex items-center gap-2 text-gray-600">
                        <span className="font-medium">{user.subscribers_count || 0}</span>
                        <span>Subscribers</span>
                    </div>

                    <div className="mt-4 flex gap-4">
                        {isCurrentUser ? (
                            <>
                                <button 
                                    className="bg-black text-white px-4 py-2 rounded-full" 
                                    onClick={() => navigate("/profile/edit")}
                                >
                                    Edit Profile
                                </button>
                                <button 
                                    onClick={handleLogout} 
                                    className="bg-red-600 text-white p-2 rounded-full"
                                >
                                    <FaDoorOpen className="text-xl" />
                                </button>
                            </>
                        ) : (
                            <button 
                                className="text-black border border-black px-4 py-2 rounded-full hover:bg-gray-100"
                                onClick={() => setShowContactsPopup(true)}
                            >
                                Contacts
                            </button>
                        )}
                    </div>
                </div>

                <div className="border-b border-gray-300 mt-6 flex justify-center">
                    {["Videos", "Posts", "Media", "Offers"].map(tab => (
                        <button 
                            key={tab} 
                            className={`py-3 px-6 text-lg font-semibold ${
                                activeTab === tab 
                                ? "border-b-4 border-black text-black" 
                                : "text-gray-500"
                            }`} 
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === "Posts" && (
                        <PostsList 
                            userId={user.id}
                            posts={posts} 
                            onPostDelete={handlePostDelete}
                            isProfilePage={true}
                        />
                    )}
                    {activeTab === "Videos" && <VideoGrid videos={videos} />}
                    {activeTab === "Media" && (
                        <MediaSection 
                            media={media} 
                            userId={user.id} 
                            isCurrentUser={isCurrentUser} 
                        />
                    )}
                    {activeTab === "Offers" && <OffersTable offers={offers} showDescription={false} />}
                </div>

                {showPostModal && (
                    <CreatePostModal 
                        isOpen={showPostModal}
                        onClose={() => setShowPostModal(false)}
                        onSubmit={handleCreatePost}
                    />
                )}

                {showContactsPopup && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
                        <div className="bg-white/95 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold text-black">Contacts</h3>
                                <button 
                                    onClick={() => setShowContactsPopup(false)}
                                    className="text-black hover:text-gray-600"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {user.email && (
                                    <div className="flex items-center gap-3 text-black">
                                        <FaEnvelope className="text-xl min-w-[24px]" />
                                        <a 
                                            href={`mailto:${user.email}`} 
                                            className="hover:text-gray-600 break-all"
                                        >
                                            {user.email}
                                        </a>
                                    </div>
                                )}
                                
                                {user.twitter && (
                                    <div className="flex items-center gap-3 text-black">
                                        <FaTwitter className="text-xl min-w-[24px]" />
                                        <a 
                                            href={user.twitter} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:text-gray-600"
                                        >
                                            Twitter
                                        </a>
                                    </div>
                                )}
                                
                                {user.instagram && (
                                    <div className="flex items-center gap-3 text-black">
                                        <FaInstagram className="text-xl min-w-[24px]" />
                                        <a 
                                            href={user.instagram} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:text-gray-600"
                                        >
                                            Instagram
                                        </a>
                                    </div>
                                )}
                                
                                {user.telegram && (
                                    <div className="flex items-center gap-3 text-black">
                                        <FaTelegram className="text-xl min-w-[24px]" />
                                        <a 
                                            href={user.telegram} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:text-gray-600"
                                        >
                                            Telegram
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;