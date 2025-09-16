import { useEffect, useState } from "react";
import { usePublicClient, useBlockNumber } from "wagmi";
import { parseAbiItem, type AbiEvent } from "viem";
import { CONTRACT_ADDRESS } from "../config/contract";

export type UserHistoryItem = {
  username: string;
  address: string;
  profilePicHash: string;
};

const USER_REGISTERED_EVENT = parseAbiItem(
  "event UserRegistered(address indexed user, string username, string profilePicHash)"
) as AbiEvent;

export function useRegisteredUsers() {
  const publicClient = usePublicClient();
  const block = useBlockNumber();
  const [users, setUsers] = useState<UserHistoryItem[]>([]);

  useEffect(() => {
    if (!publicClient || !block.data) return;

    const fetchPastRegistrations = async () => {
      try {
        const fromBlock = block.data > 5000n ? block.data - 5000n : 0n;
        const toBlock = block.data;

        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: USER_REGISTERED_EVENT,
          fromBlock,
          toBlock,
        });

        const registeredUsers: UserHistoryItem[] = logs
          .map((log) => {
            if (!log.args || Array.isArray(log.args)) return null;
            const args = log.args as Record<string, unknown>;
            return {
              address: args.user as string,
              username: args.username as string,
              profilePicHash: args.profilePicHash as string,
            };
          })
          .filter(Boolean) as UserHistoryItem[];

        setUsers(registeredUsers);
      } catch (err) {
        console.error("Error fetching registered users:", err);
      }
    };

    fetchPastRegistrations();

    // Optional: watch for new registrations
    const unwatch = publicClient.watchEvent({
      address: CONTRACT_ADDRESS,
      event: USER_REGISTERED_EVENT,
      onLogs: (logs) => {
        const newUsers: UserHistoryItem[] = logs
          .map((log) => {
            if (!log.args || Array.isArray(log.args)) return null;
            const args = log.args as Record<string, unknown>;
            return {
              address: args.user as string,
              username: args.username as string,
              profilePicHash: args.profilePicHash as string,
            };
          })
          .filter(Boolean) as UserHistoryItem[];

        setUsers((prev) => {
          // merge new users without duplicates
          const existingAddresses = new Set(prev.map((u) => u.address));
          const merged = [...prev, ...newUsers.filter((u) => !existingAddresses.has(u.address))];
          return merged;
        });
      },
    });

    return () => unwatch();
  }, [publicClient, block.data]);

  return users;
}
