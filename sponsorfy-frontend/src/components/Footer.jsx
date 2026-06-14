// Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-white text-center py-4 mt-auto">
      <p className="text-sm">
        © {new Date().getFullYear()} FindFunds. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;

