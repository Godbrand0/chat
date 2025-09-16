"use client";

import React, { useEffect, useState, useCallback } from "react";

interface MessageProps {
  ipfsHash: string;
  from: string;
  currentUserAddress: string;
}

interface MessageData {
  content: string;
  timestamp: number;
  from: string;
  to: string;
}

export const Message: React.FC<MessageProps> = ({
  ipfsHash,
  from,
  currentUserAddress,
}) => {
  const [message, setMessage] = useState<MessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gateways = [
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
  ];

  const fetchFromIPFS = useCallback(async () => {
    setLoading(true);
    setError(null);
    for (const gateway of gateways) {
      try {
        const res = await fetch(gateway + ipfsHash);
        if (!res.ok) throw new Error(`Failed from ${gateway}`);
        const data: MessageData = await res.json();
        setMessage(data);
        setLoading(false);
        return;
      } catch (err) {
        console.warn("IPFS fetch failed from", gateway, err);
      }
    }
    setError("Failed to fetch message from all IPFS gateways");
    setLoading(false);
  }, [ipfsHash, gateways]);

  useEffect(() => {
    fetchFromIPFS();
  }, [fetchFromIPFS]);

  const isMine = from && currentUserAddress && from.toLowerCase() === currentUserAddress.toLowerCase();

  if (loading)
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
        <div className="px-4 py-2 rounded-lg max-w-xs bg-gray-100 text-gray-400 text-sm">
          Loading message...
        </div>
      </div>
    );

  if (error)
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
        <div className="px-4 py-2 rounded-lg max-w-xs bg-red-100 text-red-600 text-sm">
          {error}{" "}
          <button
            onClick={fetchFromIPFS}
            className="underline ml-1 text-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-xs break-words ${
          isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        <p>{message?.content}</p>
      <span className="text-xs text-gray-500 mt-1 block text-right">
  {message?.timestamp
    ? new Date(message.timestamp).toLocaleTimeString()
    : ""}
</span>

      </div>
    </div>
  );
};
