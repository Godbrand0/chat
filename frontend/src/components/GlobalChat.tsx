"use client";

import React from "react";
import { Users } from "lucide-react";

interface GlobalChatProps {
  onSelect: () => void;
  isSelected: boolean;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ onSelect, isSelected }) => {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
        isSelected 
          ? "bg-primary-100 border-primary-200 shadow-sm" 
          : "bg-white/60 border-transparent hover:bg-white hover:border-primary-100 hover:shadow-sm"
      }`}
    >
      <div className={`p-2 rounded-lg transition-colors ${
        isSelected ? "bg-primary-200" : "bg-primary-100 group-hover:bg-primary-200"
      }`}>
        <Users className={`w-5 h-5 transition-colors ${
          isSelected ? "text-primary-700" : "text-primary-600"
        }`} />
      </div>
      <div className="flex-1">
        <span className={`font-semibold transition-colors ${
          isSelected ? "text-primary-900" : "text-gray-900"
        }`}>
          Global Chat
        </span>
        <p className={`text-sm transition-colors ${
          isSelected ? "text-primary-600" : "text-gray-500"
        }`}>
          Chat with everyone
        </p>
      </div>
      {isSelected && (
        <div className="w-2 h-2 bg-primary-500 rounded-full shadow-sm"></div>
      )}
    </div>
  );
};
