import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:3000";

export default function EditProfile() {
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [offersEnabled, setOffersEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserData(data);
        setOffersEnabled(data.offers_enabled);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    if (name.trim()) formData.append("name", name);
    if (bio.trim()) formData.append("bio", bio);
    if (twitter.trim()) formData.append("twitter", twitter);
    if (instagram.trim()) formData.append("instagram", instagram);
    if (telegram.trim()) formData.append("telegram", telegram);
    if (avatar) formData.append("avatar", avatar);
    if (banner) formData.append("banner", banner);

    const res = await fetch(`${API_URL}/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (res.ok) {
      navigate("/profile");
    } else {
      alert("Ошибка при обновлении профиля");
    }
  };

  const toggleOffers = async () => {
    const endpoint = offersEnabled ? `/startups/${userData.id}/disable-offers` : `/startups/${userData.id}/enable-offers`;
    try {
      await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOffersEnabled(!offersEnabled);
    } catch (error) {
      console.error("Error updating offers status:", error);
    }
  };

  return (
    <div className="bg-white min-h-screen text-white">
      {/* Фиксированный Navbar */}
      <div className="fixed top-0 w-full z-50 h-16 border-b border-gray-300">
        <Navbar />
      </div>

      {/* Основной контент с отступом сверху и снизу */}
      <div className="pt-16 pb-8"> {/* pt-16 для отступа под Navbar, pb-8 для отступа снизу */}
        <div className="w-full flex justify-center py-12">
          <h1 className="text-4xl font-bold text-black">FindFunds</h1>
        </div>

        <div className="flex items-center justify-center w-full">
          <div className="flex w-full max-w-6xl p-12 rounded-2xl shadow-lg">
            <form className="w-1/2 pr-12 space-y-6" onSubmit={handleSave}>
              <label className="text-black block mb-1">Upload Profile Banner</label>
              <input type="file" className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[100%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" onChange={(e) => setBanner(e.target.files[0])} />
              
              <label className="text-black block mb-1">Upload Avatar</label>
              <input type="file" className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[100%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" onChange={(e) => setAvatar(e.target.files[0])} />
              
              <label className="text-black block mb-1">Name</label>
              <input type="text" className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[100%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" value={name} onChange={(e) => setName(e.target.value)} placeholder={userData?.name} />

              <label className="text-black block mb-1">Bio</label>
              <textarea className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[100%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={userData?.bio}></textarea>

              <label className="text-black block mb-1">Twitter/X</label>
              <input type="text" className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[100%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder={userData?.twitter} />

              <label className="text-black block mb-1">Instagram</label>
              <input type="text" className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[100%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder={userData?.instagram} />

              <label className="text-black block mb-1">Telegram</label>
              <input type="text" className="p-3 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-500 w-[100%] mx-auto focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder={userData?.telegram} />

              <button className={`w-full text-white p-3 rounded-full ${offersEnabled ? "bg-red-600" : "bg-green-500"}`} type="button" onClick={toggleOffers}>
                {offersEnabled ? "Disable Offers" : "Enable Offers"}
              </button>          
              <button className="w-full bg-black text-white p-3 rounded-full" type="submit">
                Save Changes
              </button>
            </form>

            <div className="w-1/2 flex flex-col items-center justify-center text-center bg-black text-white p-8 rounded-2xl">
              <h3 className="text-lg font-bold mb-4">Profile Tips</h3>
              <p className="text-gray-300 text-sm mb-2">Use a clear and professional profile picture.</p>
              <p className="text-gray-300 text-sm mb-2">A short but compelling bio helps attract investors.</p>
              <p className="text-gray-300 text-sm mb-2">Keep your contact information up to date.</p>
              <p className="text-gray-300 text-sm mb-2">Make sure your social links work correctly.</p>
              <p className="text-gray-300 text-sm mb-2">Highlight key achievements or milestones in your bio.</p>
              <p className="text-gray-300 text-sm mb-2">Keep your profile updated with fresh content.</p>
              <p className="text-gray-300 text-sm mb-2">Use consistent branding for your startup across all platforms.</p>
              <p className="text-gray-300 text-sm mb-2">Respond to investor inquiries promptly.</p>
              <p className="text-gray-300 text-sm mb-2">Share your startup’s mission and vision clearly.</p>
              <p className="text-gray-300 text-sm mb-2">Link to your pitch deck or website for more details.</p>
              <p className="text-gray-300 text-sm">Be authentic and transparent in your profile details.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}