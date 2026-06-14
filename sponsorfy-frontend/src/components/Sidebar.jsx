import React from "react";
import { Link } from "react-router-dom";
import { HiLightningBolt, HiDatabase, HiCollection, HiThumbUp, HiArchive, HiCash } from "react-icons/hi";

export default function Sidebar() {
  return (
    <aside className="p-6 h-full overflow-y-auto bg-silver">
      <ul className="space-y-6">
        <li className="flex items-center space-x-3 font-bold text-black hover:text-melon cursor-pointer">
          <HiLightningBolt className="w-6 h-6" />
          <Link to="/trending">Trending</Link>
        </li>
        <li className="flex items-center space-x-3 font-bold text-black hover:text-melon cursor-pointer">
          <HiDatabase className="w-6 h-6" />
          <Link to="/relevant">Relevant</Link>
        </li>
        <li className="flex items-center space-x-3 font-bold text-black hover:text-melon cursor-pointer">
          <HiCollection className="w-6 h-6" />
          <Link to="/subscribed">Subscribed</Link>
        </li>
        <li className="flex items-center space-x-3 font-bold text-black hover:text-melon cursor-pointer">
          <HiThumbUp className="w-6 h-6" />
          <Link to="/liked">Liked</Link>
        </li>
        <li className="flex items-center space-x-3 font-bold text-black hover:text-melon cursor-pointer">
          <HiArchive className="w-6 h-6" />
          <Link to="/my-videos">My Videos</Link>
        </li>
        <li className="flex items-center space-x-3 font-bold text-black hover:text-melon cursor-pointer">
          <HiCash className="w-6 h-6" />
          <Link to="/my-offers">My Offers</Link>
        </li>
      </ul>
    </aside>
  );
}