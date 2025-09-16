import { useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
} from "../config/contract";
import { useUserHistory } from "./useUserHistory"; // 👈 bring in the logs hook

// ---------- Write hooks ----------
export function useChatContract() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  // 👇 handle logging side effects properly
  useEffect(() => {
    if (isConfirmed && receipt) {
      console.log("✅ Transaction confirmed:", receipt);
    }
  }, [isConfirmed, receipt]);

  useEffect(() => {
    if (error) {
      console.error("❌ Transaction failed:", error);
    }
  }, [error]);

  // 👇 add logs hook here
  const history = useUserHistory();

  const register = async (name: string, profilePicHash: string) => {
    console.log("📌 Registering user:", { name, profilePicHash });
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "register",
      args: [name, profilePicHash],
    });
  };

  const sendGlobalMessage = (ipfsHash: string) => {
    console.log("💬 Sending global message:", { ipfsHash });
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "sendGlobalMessage",
      args: [ipfsHash],
    });
  };

  const sendPrivateMessage = (to: `0x${string}`, ipfsHash: string) => {
    console.log("📩 Sending private message:", { to, ipfsHash });
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "sendPrivateMessage",
      args: [to, ipfsHash],
    });
  };

  return {
    register,
    sendGlobalMessage,
    sendPrivateMessage,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    history, // 👈 surface logs directly from here
  };
}

// ---------- Read hooks (unchanged) ----------

// Current user's profile
export function useMyProfile(address: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getMyProfile",
    args: [],
    query: { enabled: !!address },
  });

  return {
    ...result,
    data: result.data as [string, string] | undefined,
  };
}

export function useUserProfile(address: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    ...result,
    data: result.data as [string, string] | undefined, // 👈 type as tuple
  };
}


export function useIsRegistered(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useIsUsernameAvailable(name: string | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isUsernameAvailable",
    args: name ? [name] : undefined,
    query: { enabled: !!name && name.length > 0 },
  });
}

export function useGetAddressByUsername(username: string | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAddressByUsername",
    args: username ? [username] : undefined,
    query: { enabled: !!username && username.length > 0 },
  });
}
