"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User } from "../types/user";
import { getIPFSUrl } from "../utils/ipfs";
import { GlobalChat } from "./GlobalChat";
import { Users, AlertCircle } from "lucide-react";

interface UserSidebarProps {
  users: User[];
  currentUser: User | null;
  selectedUser: User | null; // null means global chat
  onUserSelect: (user: User | null) => void;
  isLoading?: boolean;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  users,
  currentUser,
  selectedUser,
  onUserSelect,
  isLoading = false,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (address: string) => {
    setImageErrors(prev => new Set([...prev, address]));
  };

  const UserAvatar = ({ user, size = "w-10 h-10" }: { user: User; size?: string }) => {
    const hasError = imageErrors.has(user.address);
    
    return (
      <div className={`${size} relative flex-shrink-0`}>
        {hasError ? (
          <div className={`${size} bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200`}>
            <span className="text-primary-600 font-semibold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <Image
            src={getIPFSUrl(user.profilePicHash)}
            alt={user.username}
            fill
            className="object-cover rounded-full border-2 border-gray-100"
            onError={() => handleImageError(user.address)}
          />
        )}
      </div>
    );
  };

  const LoadingState = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <span>Loading users...</span>
      </h3>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-xl animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <div className="space-y-1">
          <p className="text-gray-600 font-medium">No users found</p>
          <p className="text-sm text-gray-500">Users will appear here as they join</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-80 md:w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200 space-y-4 bg-gradient-to-r from-primary-50 to-blue-50">
        {/* Current User */}
        {currentUser && (
          <div className="flex items-center space-x-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-primary-100">
            <UserAvatar user={currentUser} size="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{currentUser.username}</p>
              <p className="text-sm text-primary-600 font-medium">You</p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        )}

        {/* Global Chat */}
        <GlobalChat
          onSelect={() => onUserSelect(null)}
          isSelected={selectedUser === null}
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Online Users ({users.filter(u => u.address !== currentUser?.address).length})</span>
            </h3>

            <div className="space-y-2">
              {users
                .filter(user => user.address !== currentUser?.address)
                .map((user) => (
                <div
                  key={user.address}
                  onClick={() => onUserSelect(user)}
                  className={`group flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedUser?.address === user.address
                      ? "bg-primary-100 border-2 border-primary-200 shadow-sm"
                      : "hover:bg-gray-50 border-2 border-transparent hover:border-gray-100"
                  }`}
                >
                  <UserAvatar user={user} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate transition-colors ${
                      selectedUser?.address === user.address
                        ? "text-primary-900"
                        : "text-gray-900 group-hover:text-gray-700"
                    }`}>
                      {user.username}
                    </p>
                    <p className={`text-sm truncate transition-colors ${
                      selectedUser?.address === user.address
                        ? "text-primary-600"
                        : "text-gray-500 group-hover:text-gray-600"
                    }`}>
                      {user.address.slice(0, 10)}...{user.address.slice(-4)}
                    </p>
                  </div>
                  
                  {/* Online indicator */}
                  <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
