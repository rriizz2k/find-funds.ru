// OffersTable.jsx
import React, { useState, useEffect } from "react";



const OffersTable = ({ offers, description }) => {
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [offersWithInvestors, setOffersWithInvestors] = useState([]);


  
  return (
    <div className="mt-6">
      <h2 className="font-bold text-lg">Offers</h2>
      {offers && offers.length > 0 ? (
        <>
          <table className="w-full mt-2 border border-gray-300 shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Investor</th>
                <th className="p-2">Share %</th>
                <th className="p-2">Amount (₽)</th>
              </tr>
            </thead>
            <tbody>
            {offers.map((offer, idx) => (
                <tr key={idx} className="border-t border-gray-300 text-center">
                <td className="p-2 flex items-center space-x-2">
                    <a href={`/profile/${offer.user_id}`} className="flex items-center space-x-2">
                        <img src={offer.avatar} alt={offer.investor_name} className="w-8 h-8 rounded-full" />
                        <span className="text-black-500 hover:text-black-700 hover:underline">
                            {offer.investor_name}
                        </span>
                    </a>
                </td>
                <td className="p-2">{offer.share_percentage}%</td>
                <td className="p-2">{offer.offer_amount.toLocaleString()}</td>
                </tr>
            ))}
            </tbody>
          </table>
          {offers.length > 5 && (
            <button
              className="mt-2 px-4 py-2 bg-[#121212] text-white rounded-full focus:outline-none"
              onClick={() => setShowAllOffers(true)}
            >
              Show More
            </button>
          )}
        </>
      ) : (
        <p className="mt-4 text-gray-500">No offers available</p>
      )}
      <button
        className="mt-2 px-4 py-2 bg-[#121212] text-white rounded-full focus:outline-none"
        onClick={() => setShowDescription(true)}
      >
        Description
      </button>

      {showAllOffers && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-10 backdrop-blur-md z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-2xl relative">
            <h2 className="text-lg font-bold">All Offers</h2>
            <table className="w-full mt-2 border border-gray-300 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Investor</th>
                  <th className="p-2">Share %</th>
                  <th className="p-2">Amount (₽)</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer, idx) => (
                  <tr key={idx} className="border-t border-gray-300 text-center">
                    <td className="p-2">{offer.investor_name}</td>
                    <td className="p-2">{offer.share_percentage}%</td>
                    <td className="p-2">{offer.offer_amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="absolute top-2 right-2 px-3 py-1 bg-gray-500 text-white rounded-full focus:outline-none"
              onClick={() => setShowAllOffers(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showDescription && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-10 backdrop-blur-md z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-2xl relative">
            <h2 className="text-lg font-bold">Video Description</h2>
            <p className="mt-2 text-gray-700">{description}</p>
            <button
              className="absolute top-2 right-2 px-3 py-1 bg-gray-500 text-white rounded-full focus:outline-none"
              onClick={() => setShowDescription(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersTable;
