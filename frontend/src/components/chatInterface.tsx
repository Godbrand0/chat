"use client";

import { Message } from './massage';
import React, { useState, useEffect, useRef } from 'react';
import { Send, TrendingUp, UserPlus, RefreshCw } from 'lucide-react';
import { User } from '../types/user';
import { useChatContract } from '../hooks/useChatContract';
import { uploadJSONToIPFS } from '../utils/ipfs';

interface ChatInterfaceProps {
  currentUser: User;
  selectedUser?: User | null; // null = global chat
}

// Display item interface for unified chat display
interface DisplayItem {
  type: "message" | "feed" | "registration";
  id: string;
  timestamp: number;
  // Message fields
  ipfsHash?: string;
  from?: string;
  to?: string;
  // Price feed fields
  price?: string;
  
  // Registration fields
  username?: string;
  profilePicHash?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  selectedUser,
}) => {
  const [message, setMessage] = useState('');
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Use the integrated contract hook with history
  const { 
    sendGlobalMessage, 
    sendPrivateMessage, 
    fetchPriceUpdate,
    
    isPending, 
    history 
  } = useChatContract();

  const isGlobalChat = !selectedUser;

  // Scroll to bottom whenever display items change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayItems]);

  // Load messages and other events from centralized history
  useEffect(() => {
    const loadDisplayItems = async () => {
      setIsLoadingMessages(true);
      setMessageError(null);
      
      try {
        const relevantItems: DisplayItem[] = [];

        console.log('Loading items for:', isGlobalChat ? 'Global Chat' : selectedUser?.username);
        console.log('Total history items:', history.length);

        for (const item of history) {
          // Handle different item types
          if (item.type === 'message') {
            if (!item.ipfsHash || !item.from) continue;

            if (isGlobalChat) {
              // For global chat, include global messages
              const isGlobalMessage = 
                item.to === '0x0000000000000000000000000000000000000000' ||
                item.to === null ||
                item.to === undefined ||
                item.to === '' ||
                item.to?.toLowerCase() === '0x0000000000000000000000000000000000000000';
                
              if (isGlobalMessage) {
                relevantItems.push({
                  type: 'message',
                  id: `msg-${item.txHash}`,
                  timestamp: item.timestamp,
                  ipfsHash: item.ipfsHash,
                  from: item.from,
                  to: item.to,
                });
              }
            } else if (selectedUser) {
              // For private chat, check if message involves both participants
              const participantA = currentUser.address.toLowerCase();
              const participantB = selectedUser.address.toLowerCase();
              const fromLower = item.from.toLowerCase();
              const toLower = (item.to || '').toLowerCase();
              
              const isRelevantMessage = 
                (fromLower === participantA && toLower === participantB) ||
                (fromLower === participantB && toLower === participantA);
                
              if (isRelevantMessage) {
                relevantItems.push({
                  type: 'message',
                  id: `msg-${item.txHash}`,
                  timestamp: item.timestamp,
                  ipfsHash: item.ipfsHash,
                  from: item.from,
                  to: item.to,
                });
              }
            }
          }
          
          // Only show price feeds and registrations in global chat
          if (isGlobalChat) {
            if (item.type === 'feed' && item.price) {
              relevantItems.push({
                type: 'feed',
                id: `feed-${item.txHash}`,
                timestamp: item.timestamp,
                price: item.price,
              });
            }
            
            if (item.type === 'registration' && item.username) {
              relevantItems.push({
                type: 'registration',
                id: `reg-${item.txHash}`,
                timestamp: item.timestamp,
                from: item.from,
                username: item.username,
                profilePicHash: item.profilePicHash,
              });
            }
          }
        }

        console.log('Relevant items found:', relevantItems.length);
        
        // Sort by timestamp ascending
        relevantItems.sort((a, b) => a.timestamp - b.timestamp);
        setDisplayItems(relevantItems);
      } catch (error) {
        console.error('Error loading items:', error);
        setMessageError('Failed to load messages. Please try again.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadDisplayItems();
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

      // Add to local state immediately for better UX
      setDisplayItems((prev) => [...prev, {
        type: 'message',
        id: `temp-${Date.now()}`,
        timestamp: messageData.timestamp,
        ipfsHash,
        from: currentUser.address,
        to: messageData.to
      }]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleManualPriceUpdate = () => {
    fetchPriceUpdate();
    
  };

  // Component to render different item types
  const renderDisplayItem = (item: DisplayItem) => {
    switch (item.type) {
      case 'message':
        return (
          <Message
            key={item.id}
            ipfsHash={item.ipfsHash!}
            from={item.from!}
            currentUserAddress={currentUser.address}
          />
        );
        
      case 'feed':
        return (
          <div key={item.id} className="flex items-center justify-center py-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Price Update: {item.price} ETH
              </span>
              <span className="text-blue-600 text-xs">
                • {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        );
        
      case 'registration':
        return (
          <div key={item.id} className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full text-sm">
              <UserPlus className="w-4 h-4 text-green-600" />
              <span className="text-green-800">
                <span className="font-medium">{item.username}</span> joined the chat
              </span>
              <span className="text-green-600 text-xs">
                • {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Chat Header - Hidden on mobile since we have the mobile header */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isGlobalChat ? '🌍 Global Chat' : `💬 ${selectedUser?.username}`}
              </h1>
              <p className="text-gray-600 mt-1">
                {isGlobalChat
                  ? 'Welcome to the decentralized chat! Connect with everyone.'
                  : `Private conversation with ${selectedUser?.username}`}
              </p>
            </div>
            {/* Manual price update button for global chat */}
            {isGlobalChat && (
              <button
                onClick={handleManualPriceUpdate}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                title="Fetch latest price update"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
                Update Price
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages and Events */}
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
        ) : displayItems.length === 0 ? (
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
            {displayItems.map(renderDisplayItem)}
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
              className="w-full px-4 py-3 pr-12 text-gray-800 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors outline-none text-base"
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