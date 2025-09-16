"use client";

import Image from "next/image";
import { useState } from "react";
import { getIPFSUrl } from "../utils/ipfs";
import { User } from "../types/user";

export default function UserAvater({
  user,
  size = "w-10 h-10",
}: {
  user: User;
  size?: string;
}) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (address: string) => {
    setImageErrors((prev) => new Set([...prev, address]));
  };

  const hasError = imageErrors.has(user.address);

  return (
    <div className={`${size} relative flex-shrink-0`}>
      {hasError ? (
        <div
          className={`${size} bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200`}
        >
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
}
