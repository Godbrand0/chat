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
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);
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
      setIsLoadingMessages(true);
      setMessageError(null);
      
      try {
        const relevantMessages: MessageType[] = [];

        console.log('Loading messages for:', isGlobalChat ? 'Global Chat' : selectedUser?.username);
        console.log('Total history items:', history.length);

      for (const msg of history) {
        // More detailed filtering and logging
        if (msg.type !== 'message') {
          console.log('Skipping non-message:', msg.type);
          continue;
        }
        if (!msg.ipfsHash) {
          console.log('Skipping message without IPFS hash:', msg);
          continue;
        }
        if (!msg.from) {
          console.log('Skipping message without sender:', msg);
          continue;
        }

        if (isGlobalChat) {
          // For global chat, include messages where 'to' is address(0) (0x0000000000000000000000000000000000000000)
          // The contract sends global messages with address(0) as recipient
          const isGlobalMessage = 
            msg.to === '0x0000000000000000000000000000000000000000' ||
            msg.to === null ||
            msg.to === undefined ||
            msg.to === '' ||
            msg.to?.toLowerCase() === '0x0000000000000000000000000000000000000000';
            
          if (!isGlobalMessage) {
            console.log('Skipping non-global message for global chat. To address:', msg.to);
            continue;
          }
          console.log('Including global message:', { from: msg.from, to: msg.to, hash: msg.ipfsHash });
        } else if (selectedUser) {
          // For private chat, check if message involves both participants
          const participantA = currentUser.address.toLowerCase();
          const participantB = selectedUser.address.toLowerCase();
          const fromLower = msg.from.toLowerCase();
          const toLower = (msg.to || '').toLowerCase();
          
          // For private chat, check if message involves both participants
          const isRelevantMessage = 
            (fromLower === participantA && toLower === participantB) ||
            (fromLower === participantB && toLower === participantA);
            
          if (!isRelevantMessage) {
            continue;
          }
          console.log('Found private message:', { from: msg.from, to: msg.to });
        } else {
          // No selected user and not global chat - skip
          continue;
        }

        relevantMessages.push({
          ipfsHash: msg.ipfsHash,
          from: msg.from,
          timestamp: msg.timestamp || Date.now(),
          to: msg.to,
        });
      }

        console.log('Relevant messages found:', relevantMessages.length);
        
        // Sort by timestamp ascending
        relevantMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(relevantMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessageError('Failed to load messages. Please try again.');
      } finally {
        setIsLoadingMessages(false);
      }
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
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Chat Header - Hidden on mobile since we have the mobile header */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isGlobalChat ? '🌍 Global Chat' : `💬 ${selectedUser?.username}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {isGlobalChat
              ? 'Welcome to the decentralized chat! Connect with everyone.'
              : `Private conversation with ${selectedUser?.username}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1">
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : messageError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="space-y-2">
                <p className="text-red-600 font-medium">Error loading messages</p>
                <p className="text-sm text-gray-500">{messageError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                {isGlobalChat ? (
                  <span className="text-3xl">🌍</span>
                ) : (
                  <span className="text-3xl">💬</span>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">
                  {isGlobalChat ? 'No messages in global chat yet' : 'No messages yet'}
                </p>
                <p className="text-sm text-gray-500">
                  {isGlobalChat 
                    ? 'Start the conversation! Your message will be visible to everyone.'
                    : 'Send a message to start your private conversation.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, idx) => (
              <Message
                key={`${msg.ipfsHash}-${idx}`}
                ipfsHash={msg.ipfsHash}
                from={msg.from}
                currentUserAddress={currentUser.address}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4 shadow-sm safe-area-bottom">
        <form onSubmit={handleSendMessage} className="flex space-x-2 md:space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Type a message${isGlobalChat ? ' to everyone' : ` to ${selectedUser?.username}`}...`}
              className="w-full px-4 py-3 pr-12 text-gray-800 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors outline-none text-base" /* text-base prevents zoom on iOS */
              disabled={isSending || isPending}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || isSending || isPending}
            className={`flex items-center justify-center w-12 h-12 md:w-12 md:h-12 rounded-2xl transition-all duration-200 shadow-sm ${
              !message.trim() || isSending || isPending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md active:scale-95'
            }`}
          >
            {isSending || isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
            ) : (
              <Send className="w-4 h-4 text-blue-800 md:w-5 md:h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
