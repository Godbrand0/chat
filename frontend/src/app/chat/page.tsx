"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "../../components/chatInterface";
import { useUserProfile } from "../../hooks/useChatContract";
import { useAccount } from "wagmi";
import { UserSidebar } from "@/components/sidebar";
import { User } from "@/types/user";
import { useUsers } from "../../hooks/useUsers";

export default function ChatPage() {
  const router = useRouter();
  const { address } = useAccount(); // connected wallet
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all registered users (from events or contract)
  const { users: registeredUsers } = useUsers();

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
    return <p>Loading profile...</p>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
    <UserSidebar
      users={registeredUsers.filter(u => u.address !== currentUser?.address)}
      currentUser={currentUser}
      selectedUser={selectedUser}
      onUserSelect={setSelectedUser}
    />

      {/* Chat Interface */}
      <div className="flex-1">
        {currentUser && (
          <ChatInterface
            currentUser={currentUser}
            selectedUser={selectedUser}
          />
        )}
      </div>
    </div>
  );
}
