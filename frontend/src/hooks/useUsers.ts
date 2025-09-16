import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem, type AbiEvent } from 'viem';
import { CONTRACT_ADDRESS } from '../config/contract';
import { User } from '../types/user';

// Pre-parse ABI string and assert as AbiEvent
const USER_REGISTERED_EVENT = parseAbiItem(
  "event UserRegistered(address indexed user, string username, string profilePicHash)"
) as AbiEvent;

export function useUsers() {
  // We don't use address here; keeping hook minimal
  const publicClient = usePublicClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient) return;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        // Get recent blocks to fetch user registrations
        const blockNumber = await publicClient.getBlockNumber();
        // Search from genesis to capture all historical data
        const fromBlock = 0n; // Start from the very beginning
        console.log('Searching user registrations from block:', fromBlock.toString(), 'to:', blockNumber.toString());
        
        // Fetch all user registration events
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: USER_REGISTERED_EVENT,
          fromBlock,
          toBlock: blockNumber,
        });
        
        console.log('Found user registration logs:', logs.length);
        console.log('User registration logs:', logs);

        // Convert logs to user objects
        const userMap = new Map<string, User>();
        
        logs.forEach((log) => {
          if (log.args && !Array.isArray(log.args)) {
            const args = log.args as Record<string, unknown>;
            const userAddress = args.user as string;
            const username = args.username as string;
            const profilePicHash = args.profilePicHash as string;
            
            userMap.set(userAddress, {
              address: userAddress,
              username,
              profilePicHash
            });
          }
        });

        setUsers(Array.from(userMap.values()));
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();

    // Watch for new user registrations
    const unwatch = publicClient.watchEvent({
      address: CONTRACT_ADDRESS,
      event: USER_REGISTERED_EVENT,
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (log.args && !Array.isArray(log.args)) {
            const args = log.args as Record<string, unknown>;
            const userAddress = args.user as string;
            const username = args.username as string;
            const profilePicHash = args.profilePicHash as string;
            
            setUsers(prev => {
              const userExists = prev.some(user => user.address === userAddress);
              if (!userExists) {
                return [...prev, {
                  address: userAddress,
                  username,
                  profilePicHash
                }];
              }
              return prev;
            });
          }
        });
      }
    });

    return () => {
      unwatch();
    };
  }, [publicClient]);

  return { users, isLoading };
}
