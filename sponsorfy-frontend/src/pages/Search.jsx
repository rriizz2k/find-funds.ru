import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VideoCard from '../components/VideoCard';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState({ videos: [], users: [] });

    useEffect(() => {
        fetch(`http://localhost:3000/api/search?q=${query}`)
            .then(res => res.json())
            .then(data => setResults(data))
            .catch(error => console.error("Ошибка загрузки данных:", error));
    }, [query]);

    return (
        <div className="bg-white min-h-screen">
            {/* Фиксированный Navbar */}
            <div className="fixed top-0 w-full z-50">
                <Navbar />
            </div>

            {/* Основной контент с отступом */}
            <div className="container mx-auto p-6 pt-24"> {/* pt-24 = 6rem (96px) */}
                <h1 className="text-black text-2xl mb-4">Search results for: "{query}"</h1>

                {/* Видео */}
                <h2 className="text-white text-xl mt-6">Видео</h2>
                <div className="grid grid-cols-3 gap-4">
                    {results.videos.length === 0 && <p className="text-gray-400">No videos found</p>}
                    {results.videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>

                {/* Пользователи */}
                <h2 className="text-black text-xl mt-6">Пользователи</h2>
                {results.users.length === 0 && <p className="text-gray-400">No users found</p>}
                <ul className="grid grid-cols-3 gap-4">
                    {results.users.map(user => (
                        <li key={user.id} className="flex items-center p-4 rounded-lg">
                            <Link to={`/profile/${user.id}`} className="flex items-center">
                                <img 
                                    src={user.avatar} 
                                    alt={user.name} 
                                    className="w-12 h-12 rounded-full mr-4 hover:opacity-80 transition duration-200"
                                />
                            </Link>
                            <div>
                                <Link to={`/profile/${user.id}`} className="text-black font-bold hover:underline">
                                    {user.name}
                                </Link>
                                <p className="text-gray-400">{user.subscribers_count} Subscribers</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}