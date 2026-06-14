import React from "react";

export default function CategoryButtons() {
  const categories = [
    "Real estate",
    "Websites",
    "Products",
    "Gaming",
    "Hustle",
    "Education",
    "Other",
  ];

  const buttonStyle = {
    backgroundColor: "#040404",
    color: "#FFFFFF",
    fontWeight: "bold",
    padding: "6px 16px",
    borderRadius: "6px",
    boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
    fontSize: "14px",
  };

  return (
    <div style={{ 
      display: "flex", 
      gap: "6px", 
      paddingLeft: "12px",
      paddingRight: "12px",
      paddingBottom: "12px", 
      marginBottom: "16px" 
    }}>
      {categories.map((category, index) => (
        <button key={index} style={buttonStyle}>
          {category}
        </button>
      ))}
    </div>
  );
}
