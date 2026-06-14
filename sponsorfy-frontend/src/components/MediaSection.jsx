import { useState } from "react";
import axios from "axios";
import { FaPaperclip, FaTrash, FaTimes, FaFigma } from "react-icons/fa";
import { FaFileWord, FaFileExcel, FaLink} from "react-icons/fa";

const API_URL = "http://localhost:3000";

const MediaSection = ({ media, userId, isCurrentUser }) => {
    const [showMediaPopup, setShowMediaPopup] = useState(false);
    const [newMedia, setNewMedia] = useState({ title: "", type: "docs", url: "" });
    const [mediaList, setMediaList] = useState(media);
    const [error, setError] = useState(""); // Состояние для ошибки

    // Функция для получения цвета в зависимости от типа медиа
    const getTypeColor = (type) => {
        switch (type) {
            case "sheets":
                return "text-green-600";
            case "figma":
                return "text-pink-500";
            default:
                return "text-blue-600";
        }
    };

    // Функция для добавления медиа
    const handleAddMedia = async () => {
        setError(""); // Сброс ошибки перед каждой попыткой

        // Проверка на пустые поля
        if (!newMedia.title || !newMedia.url) {
            setError("Please fill in all fields");
            return;
        }

        // Проверка валидности URL
        try {
            new URL(newMedia.url); // Проверяем, что URL валиден
        } catch (error) {
            setError("Please enter a valid URL");
            return;
        }

        // Дополнительная проверка для Figma Design
        if (newMedia.type === "figma" && !newMedia.url.startsWith("https://www.figma.com/")) {
            setError("Figma Design URL must start with 'https://www.figma.com/'");
            return;
        }

        try {
            // Отправка данных на сервер
            const response = await axios.post(
                `${API_URL}/users/${userId}/media`,
                newMedia,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            // Обновление списка медиа
            setMediaList([...mediaList, { id: response.data.mediaId, ...newMedia }]);
            setShowMediaPopup(false);
            setNewMedia({ title: "", type: "docs", url: "" }); // Сброс формы
        } catch (error) {
            console.error("Error adding media:", error.response?.data || error.message);
            setError("Failed to add media. Please check your input and try again.");
        }
    };

    // Функция для удаления медиа
    const handleDeleteMedia = async (id) => {
        try {
            await axios.delete(`${API_URL}/users/${userId}/media/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setMediaList(mediaList.filter((item) => item.id !== id)); // Обновление списка
        } catch (error) {
            console.error("Error deleting media:", error.response?.data || error.message);
            setError("Failed to delete media. Please try again.");
        }
    };

    return (
        <div className="px-4">
            {/* Кнопка добавления медиа */}
            {isCurrentUser && (
                <button
                    className="bg-black text-white px-6 py-3 rounded-full mb-6 hover:bg-gray-800 transition-colors shadow-md focus:outline-none"
                    onClick={() => setShowMediaPopup(true)}
                >
                    + Add Media
                </button>
            )}

            {/* Попап для добавления медиа */}
            {showMediaPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in-up">
                        {/* Кнопка закрытия попапа */}
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                            onClick={() => setShowMediaPopup(false)}
                        >
                            <FaTimes className="text-xl" />
                        </button>

                        {/* Заголовок попапа */}
                        <h3 className="text-2xl font-bold mb-6 text-gray-800">Add New Media</h3>

                        {/* Форма добавления медиа */}
                        <div className="space-y-5">
                            {/* Поле для названия */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    placeholder="Enter title"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black"
                                    value={newMedia.title}
                                    onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                                />
                            </div>

                            {/* Выбор типа медиа */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-select-arrow text-black"
                                    value={newMedia.type}
                                    onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                                >
                                    <option value="docs">Document</option>
                                    <option value="sheets">Spreadsheet</option>
                                    <option value="figma">Figma Design</option>
                                </select>
                            </div>

                            {/* Поле для URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                                <input
                                    type="url"
                                    placeholder={
                                        newMedia.type === "figma"
                                            ? "https://www.figma.com/..."
                                            : "https://example.com"
                                    }
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-black"
                                    value={newMedia.url}
                                    onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Отображение ошибки */}
                        {error && (
                            <div className="mt-4 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Кнопка подтверждения */}
                        <button
                            onClick={handleAddMedia}
                            className="w-full mt-6 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-md focus:outline-none"
                        >
                            Add Media
                        </button>
                    </div>
                </div>
            )}

            {/* Список медиа */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediaList.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                        {/* Иконка и название медиа */}
                        <div className="flex items-center gap-3">
                        {item.type === "docs" ? (
                            <FaFileWord className="text-blue-600 text-xl" /> // Иконка Google Docs
                        ) : item.type === "sheets" ? (
                            <FaFileExcel className="text-green-600 text-xl" /> // Иконка Google Sheets
                        ) : item.type === "figma" ? (
                            <FaFigma className="text-pink-500 text-xl" /> // Иконка Figma
                        ) : (
                            <FaLink className="text-black text-xl" /> // Иконка по умолчанию
                        )}
                            <span className="font-medium text-black">{item.title}</span>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex items-center gap-3">
                            {/* Ссылка на медиа */}
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`hover:opacity-75 transition-opacity ${getTypeColor(item.type)} focus:outline-none`}
                            >
                                <FaPaperclip className="text-lg" />
                            </a>

                            {/* Кнопка удаления (только для текущего пользователя) */}
                            {isCurrentUser && (
                                <button
                                    onClick={() => handleDeleteMedia(item.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors focus:outline-none"
                                >
                                    <FaTrash className="text-lg" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MediaSection;