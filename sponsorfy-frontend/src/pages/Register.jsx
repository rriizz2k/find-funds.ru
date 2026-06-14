// Register.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("startup");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agree) {
      setError("You must agree to the Privacy Policy");
      return;
    }
    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Sign up successful! Please check your email.");
        setTimeout(() => navigate("/login"), 5000);
      } else {
        setError(data.message || "Sign up failed");
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
          <h2 className="text-3xl font-bold mb-8">Create Your Account</h2>
          {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3.5 border border-gray-600 rounded-full mb-4 focus:outline-none focus:ring-2 focus:ring-white bg-gray-800 placeholder-gray-400"
            required
          />
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

          {/* Role Selector */}
          <div className="w-full relative mb-6">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3.5 border border-gray-600 rounded-full appearance-none bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white pr-10 cursor-pointer"
            >
              <option value="startup">Startup</option>
              <option value="investor">Investor</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-center mb-8 w-full">
          <input
  type="checkbox"
  id="privacy"
  checked={agree}
  onChange={() => setAgree(!agree)}
  className="h-4 w-4 border border-gray-500 rounded-sm bg-gray-800 checked:bg-black checked:border-black focus:ring-0 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCA2IDkgMTdsLTUtNSIvPjwvc3ZnPg==')] checked:bg-center checked:bg-no-repeat checked:bg-contain"
/>
            <label htmlFor="privacy" className="ml-3 text-sm">
              I agree to the{" "}
              <span
                className="text-blue-400 hover:text-blue-300 cursor-pointer"
                onClick={() => setShowPrivacy(true)}
              >
                Privacy Policy
              </span>
            </label>
          </div>

          <button
            onClick={handleRegister}
            disabled={!agree}
            className={`w-full p-3.5 rounded-full font-medium transition-colors ${
              agree ? "bg-white text-black hover:bg-gray-200" : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Right Side (CTA) */}
        <div className="w-1/2 bg-gray-100 flex flex-col justify-center items-center p-10">
          <h3 className="text-2xl font-semibold mb-4 text-black">Already Registered?</h3>
          <p className="text-gray-600 text-center mb-8 max-w-xs">
            Sign in and continue your journey with FindFunds!
          </p>
          <button 
          onClick={() => navigate("/login")}
          className="bg-black text-white px-6 py-3.5 rounded-full font-normal hover:bg-gray-800 transition-colors"
        >
          Sign In
        </button>
        </div>

        {/* Privacy Modal */}
        {showPrivacy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
              <h2 className="text-2xl font-bold mb-6">Privacy Policy</h2>
              <div className="prose text-gray-600 text-sm">
                <p><strong>Effective Date:</strong> February 14, 2025</p>
                {/* ... остальной текст политики ... */}
              </div>
              <button
                onClick={() => setShowPrivacy(false)}
                className="mt-6 bg-black text-white px-6 py-3 rounded-xl w-full hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}