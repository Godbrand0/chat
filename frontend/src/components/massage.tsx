"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Clock, RefreshCw } from "lucide-react";

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
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
  ];

  const fetchFromIPFS = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    for (const gateway of gateways) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch(gateway + ipfsHash, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${gateway}`);
        
        const data: MessageData = await res.json();
        
        if (data && typeof data === 'object' && 'content' in data) {
          setMessage(data);
          setLoading(false);
          return;
        } else {
          throw new Error('Invalid message format');
        }
      } catch (err) {
        console.warn(`IPFS fetch failed from ${gateway}:`, err);
        continue;
      }
    }
    
    setError("Failed to fetch message from all IPFS gateways");
    setLoading(false);
  }, [ipfsHash]);

  useEffect(() => {
    if (ipfsHash && ipfsHash.trim()) {
      fetchFromIPFS();
    } else {
      setError("Invalid IPFS hash");
      setLoading(false);
    }
  }, [fetchFromIPFS, ipfsHash]);

  const isMine = from && currentUserAddress && from.toLowerCase() === currentUserAddress.toLowerCase();

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}>
        <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${
          isMine ? "bg-primary-100 border border-primary-200" : "bg-gray-100 border border-gray-200"
        } rounded-2xl px-4 py-3 shadow-sm`}>
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary-500 rounded-full"></div>
            <span className="text-sm">Loading message...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}>
        <div className="max-w-xs sm:max-w-md lg:max-w-lg bg-red-50 border border-red-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex flex-col space-y-2">
            <p className="text-red-700 text-sm font-medium">Failed to load message</p>
            <p className="text-red-600 text-xs">{error}</p>
            <button
              onClick={fetchFromIPFS}
              className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 transition-colors self-start"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3 animate-slide-in`}>
      <div className="max-w-xs sm:max-w-md lg:max-w-lg">
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
            isMine 
              ? "bg-primary-500 text-white rounded-br-md" 
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-relaxed break-words text-gray-800 whitespace-pre-wrap">
            {message?.content}
          </p>
        </div>
        
        {/* Timestamp */}
        <div className={`flex items-center mt-1 space-x-1 ${
          isMine ? "justify-end" : "justify-start"
        }`}>
          <Clock className="w-3 h-3 text-gray-400" />
          <span className={`text-xs ${
            isMine ? "text-gray-600" : "text-gray-700"
          }`}>
            {message?.timestamp ? formatTimestamp(message.timestamp) : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
