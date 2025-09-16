"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useUserProfile } from "../hooks/useChatContract";
import { WalletConnect } from "@/components/walletConnect";

export default function HomePage() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: profile, isLoading } = useUserProfile(address);

  // Redirect based on wallet & profile
  useEffect(() => {
    if (!address) return;

    if (!isLoading) {
      if (profile) {
        router.push("/chat");
      } else {
        router.push("/register");
      }
    }
  }, [address, profile, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      {/* Branding */}
      <h1 className="text-5xl font-bold text-blue-900 mb-6 text-center">
        Welcome to <span className="text-blue-600">Chat-verse</span>
      </h1>
      <p className="text-center text-gray-700 mb-8 max-w-lg">
        Connect your wallet to start chatting securely and globally. 
        Your messages are stored on IPFS and verified on-chain.
      </p>

      {/* Wallet Connect */}
      <div className="mb-6">
        <WalletConnect />
      </div>

      {/* Optional Footer */}
      <footer className="text-gray-500 text-sm mt-8">
        &copy; {new Date().getFullYear()} Chat-verse. All rights reserved.
      </footer>
    </div>
  );
}
