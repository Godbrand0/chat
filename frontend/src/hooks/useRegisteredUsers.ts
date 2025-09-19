/* eslint-disable @typescript-eslint/no-explicit-any */
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
        const fromBlock = 9233595n; // Start from genesis to capture all users
        const toBlock = block.data;
        const maxBlockRange = block.data; // Keep under 50k limit with buffer

        console.log('Fetching user registrations from block:', fromBlock.toString(), 'to:', toBlock.toString());

        let allLogs: any[] = [];

        // If range is within limit, fetch directly
        if (toBlock - fromBlock <= maxBlockRange) {
          allLogs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: USER_REGISTERED_EVENT,
            fromBlock,
            toBlock,
          });
        } else {
          // Split into chunks for large block ranges
          let currentFrom = fromBlock;
          
          while (currentFrom < toBlock) {
            const currentTo = currentFrom + maxBlockRange > toBlock ? toBlock : currentFrom + maxBlockRange;
            
            console.log(`Fetching user registration chunk from ${currentFrom} to ${currentTo}`);
            
            const logs = await publicClient.getLogs({
              address: CONTRACT_ADDRESS,
              event: USER_REGISTERED_EVENT,
              fromBlock: currentFrom,
              toBlock: currentTo,
            });
            
            console.log(`Found ${logs.length} user registrations in chunk`);
            allLogs.push(...logs);
            
            currentFrom = currentTo + 1n;
          }
        }

        console.log(`Total user registrations found: ${allLogs.length}`);

        const registeredUsers: UserHistoryItem[] = allLogs
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

  return { users };
}
