// Login.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        setError(data.message || "Sign in failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-black">
      <div className="w-full h-screen flex">
        {/* Left Side (Form) */}
        <div className="w-1/2 p-10 flex flex-col justify-center items-center bg-black text-white">
        <h2 className="text-3xl font-bold mb-8">FindFunds.ru</h2>
          <h2 className="text-3xl font-bold mb-8">Sign In to Your Account</h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 border border-gray-600 rounded-full mb-4 focus:outline-none focus:ring-2 focus:ring-white bg-gray-800 placeholder-gray-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3.5 border border-gray-600 rounded-full mb-6 focus:outline-none focus:ring-2 focus:ring-white bg-gray-800 placeholder-gray-400"
            required
          />
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black p-3.5 rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Sign In
          </button>
        </div>

        {/* Right Side (CTA) */}
        <div className="w-1/2 bg-gray-100 flex flex-col justify-center items-center p-10">
          <h3 className="text-2xl font-semibold mb-4 text-black">New Here?</h3>
          <p className="text-gray-600 text-center mb-8 max-w-xs">
            Sign up and discover a great amount of new opportunities!
          </p>
          <button 
            onClick={() => navigate("/register")}
            className="bg-black text-white px-6 py-3.5 rounded-full font-normal hover:bg-gray-800 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}