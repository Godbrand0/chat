"use client";

import { Message } from './massage';
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { User } from '../types/user';
import { useChatContract } from '../hooks/useChatContract';
import { uploadJSONToIPFS } from '../utils/ipfs';
import { useUserHistory } from '../hooks/useUserHistory';

interface ChatInterfaceProps {
  currentUser: User;
  selectedUser?: User | null; // null = global chat
}

interface MessageType {
  ipfsHash: string;
  from: string;
  timestamp: number;
  to?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  selectedUser,
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { sendGlobalMessage, sendPrivateMessage, isPending } = useChatContract();
  const history = useUserHistory();

  const isGlobalChat = !selectedUser;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages from history
  useEffect(() => {
    const loadMessages = async () => {
      const relevantMessages: MessageType[] = [];

      for (const msg of history) {
        if (msg.type !== 'message' || !msg.ipfsHash || !msg.from) continue;

        if (isGlobalChat) {
          if (msg.to !== 'global' && msg.to !== undefined) continue;
        } else {
          const participantA = currentUser.address.toLowerCase();
          const participantB = (selectedUser?.address || '').toLowerCase();
          const fromLower = msg.from.toLowerCase();
          const toLower = (msg.to || '').toLowerCase();
          const pair = [fromLower, toLower];
          if (!(pair.includes(participantA) && pair.includes(participantB))) continue;
        }

        relevantMessages.push({
          ipfsHash: msg.ipfsHash,
          from: msg.from,
          timestamp: msg.timestamp || Date.now(),
          to: msg.to,
        });
      }

      // Sort by timestamp ascending
      relevantMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(relevantMessages);
    };

    loadMessages();
  }, [history, selectedUser, currentUser, isGlobalChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);

    const messageData = {
      content: message.trim(),
      timestamp: Date.now(),
      from: currentUser.address,
      to: selectedUser?.address || 'global',
    };

    try {
      const ipfsHash = await uploadJSONToIPFS(messageData);

      if (selectedUser) {
        await sendPrivateMessage(selectedUser.address as `0x${string}`, ipfsHash);
      } else {
        await sendGlobalMessage(ipfsHash);
      }

      // Add to local state
      setMessages((prev) => [...prev, { ipfsHash, from: currentUser.address, timestamp: messageData.timestamp, to: messageData.to }]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isGlobalChat ? 'Global Chat' : `Chat with ${selectedUser?.username}`}
        </h1>
        <p className="text-gray-600">
          {isGlobalChat
            ? 'Welcome to the decentralized chat!'
            : `Private conversation with ${selectedUser?.username}`}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500">
            <p>Messages will appear here...</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <Message
            key={idx}
            ipfsHash={msg.ipfsHash}
            from={msg.from}
            currentUserAddress={currentUser.address}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Type a message${isGlobalChat ? ' to global chat' : ` to ${selectedUser?.username}`}...`}
            className="flex-1 px-4 py-3 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={isSending || isPending}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending || isPending}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending || isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
