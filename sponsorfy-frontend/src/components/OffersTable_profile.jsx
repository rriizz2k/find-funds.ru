import React, { useState } from "react";

const OffersTable = ({ offers }) => {
  const [showAllOffers, setShowAllOffers] = useState(false);

  return (
    <div className="mt-0"> {/* Reduced top padding to zero */}
      <h2 className="font-bold text-lg text-black">Offers</h2>
      {offers && offers.length > 0 ? (
        <>
          {/* Main Table */}
          <div className="mt-2 w-3/4 mx-auto"> {/* Reduced width to 60-70% of the page */}
            <table className="w-full border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-center text-sm font-semibold text-black">Investor</th> {/* Centered column label */}
                  <th className="p-3 text-center text-sm font-semibold text-black">Share %</th> {/* Centered column label */}
                  <th className="p-3 text-center text-sm font-semibold text-black">Amount (₽)</th> {/* Centered column label */}
                </tr>
              </thead>
              <tbody>
                {offers.slice(0, 5).map((offer, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <a
                        href={`/profile/${offer.user_id}`}
                        className="flex items-center justify-center space-x-3" /* Centered content */
                      >
                        <img
                          src={offer.avatar}
                          alt={offer.investor_name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-black"> {/* Removed blue text on hover */}
                          {offer.investor_name}
                        </span>
                      </a>
                    </td>
                    <td className="p-3 text-sm text-black text-center">{offer.share_percentage}%</td> {/* Centered content */}
                    <td className="p-3 text-sm text-black text-center"> {/* Centered content */}
                      {offer.offer_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Show More Button */}
            {offers.length > 5 && (
              <button
                className="mt-4 w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none"
                onClick={() => setShowAllOffers(true)}
              >
                Show More
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 text-gray-500">No offers available</p>
      )}

      {/* Modal for All Offers */}
      {showAllOffers && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-2xl relative">
            <h2 className="text-lg font-bold text-black mb-4">All Offers</h2>
            <button
              onClick={() => setShowAllOffers(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <table className="w-full border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-center text-sm font-semibold text-black">Investor</th> {/* Centered column label */}
                  <th className="p-3 text-center text-sm font-semibold text-black">Share %</th> {/* Centered column label */}
                  <th className="p-3 text-center text-sm font-semibold text-black">Amount (₽)</th> {/* Centered column label */}
                </tr>
              </thead>
              <tbody>
                {offers.map((offer, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <a
                        href={`/profile/${offer.user_id}`}
                        className="flex items-center justify-center space-x-3" /* Centered content */
                      >
                        <img
                          src={offer.avatar}
                          alt={offer.investor_name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-black"> {/* Removed blue text on hover */}
                          {offer.investor_name}
                        </span>
                      </a>
                    </td>
                    <td className="p-3 text-sm text-black text-center">{offer.share_percentage}%</td> {/* Centered content */}
                    <td className="p-3 text-sm text-black text-center"> {/* Centered content */}
                      {offer.offer_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersTable;