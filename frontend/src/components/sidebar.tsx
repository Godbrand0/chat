"use client";

import React from "react";
import Image from "next/image";
import { User } from "../types/user";
import { getIPFSUrl } from "../utils/ipfs";
import { GlobalChat } from "./GlobalChat";

interface UserSidebarProps {
  users: User[];
  currentUser: User | null;
  selectedUser: User | null; // null means global chat
  onUserSelect: (user: User | null) => void;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  users,
  currentUser,
  selectedUser,
  onUserSelect,
}) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Current User */}
        {currentUser && (
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-10 h-10 relative">
              <Image
                src={getIPFSUrl(currentUser.profilePicHash)}
                alt={currentUser.username}
                fill
                className="object-cover rounded-full"
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">{currentUser.username}</p>
              <p className="text-sm text-gray-500">You</p>
            </div>
          </div>
        )}

        {/* Global Chat */}
        <GlobalChat
          onSelect={() => onUserSelect(null)}
          isSelected={selectedUser === null}
        />
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          Online Users ({users.length})
        </h3>

        {users.map((user) => (
          <div
            key={user.address}
            onClick={() => onUserSelect(user)}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedUser?.address === user.address
                ? "bg-blue-100 border border-blue-200"
                : "hover:bg-gray-50"
            } ${currentUser?.address === user.address ? "opacity-50" : ""}`}
          >
            <div className="w-10 h-10 relative">
              <Image
                src={getIPFSUrl(user.profilePicHash)}
                alt={user.username}
                fill
                className="object-cover rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.username}</p>
              <p className="text-sm text-gray-500 truncate">
                {user.address.slice(0, 10)}...
              </p>
            </div>
            {currentUser?.address === user.address && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                You
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
