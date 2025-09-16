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
      className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? "bg-blue-100 border border-blue-200" : "hover:bg-gray-50"
      }`}
    >
      <Users className="w-6 h-6 text-blue-600" />
      <span className="font-medium text-gray-900">Global Chat</span>
    </div>
  );
};
