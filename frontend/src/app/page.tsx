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
    <div>
      <WalletConnect/>
    </div>
  );
}
