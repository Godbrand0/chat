"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "../../components/chatInterface";
import { useUserProfile } from "../../hooks/useChatContract";
import { useAccount } from "wagmi";
import { UserSidebar } from "@/components/sidebar";
import { User } from "@/types/user";
import { useUsers } from "../../hooks/useUsers";
import { Menu, X } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const { address } = useAccount(); // connected wallet
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch all registered users (from events or contract)
  const { users: registeredUsers, isLoading: usersLoading } = useUsers();

  // Fetch current user's profile
  // profile is typed as [username: string, profilePicHash: string] | undefined
  const { data: profile, isLoading } = useUserProfile(address) as {
    data: [string, string] | undefined;
    isLoading: boolean;
  };

  useEffect(() => {
    if (!address) {
      router.push("/");
      return;
    }

    if (!isLoading) {
      if (!profile) {
        router.push("/register");
      } else {
        // Map contract profile data to User type
        const user: User = {
          address,
          username: profile[0],        // profile returned as [username, profilePicHash]
          profilePicHash: profile[1],
        };
        setCurrentUser(user);
        setLoading(false);
      }
    }
  }, [address, profile, isLoading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleUserSelect = (user: User | null) => {
    setSelectedUser(user);
    setSidebarOpen(false); // Close sidebar on mobile when user is selected
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 absolute top-0 left-0 right-0 z-20">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="font-semibold text-gray-900">
          {selectedUser ? selectedUser.username : 'Global Chat'}
        </h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 fixed md:relative z-40 transition-transform duration-300 ease-in-out`}>
        <UserSidebar
          users={registeredUsers}
          currentUser={currentUser}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          isLoading={usersLoading}
        />
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col pt-16 md:pt-0">
        {currentUser ? (
          <ChatInterface
            currentUser={currentUser}
            selectedUser={selectedUser}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">👤</span>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">No user selected</p>
                <p className="text-sm text-gray-500">Please wait while we load your profile</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
