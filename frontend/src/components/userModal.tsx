"use client";

import React from "react";
import Image from "next/image";
import { User } from "../types/user";
import { getIPFSUrl } from "../utils/ipfs";
import { X } from "lucide-react";

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      {/* Modal box */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl w-80 p-6 relative animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 relative">
            <Image
              src={getIPFSUrl(user.profilePicHash)}
              alt={user.username}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 text-center">
            {user.username || "Unnamed User"}
          </h2>
          <p className="text-sm text-gray-500 break-all text-center">
            {user.address}
          </p>
        </div>
      </div>
    </div>
  );
};
