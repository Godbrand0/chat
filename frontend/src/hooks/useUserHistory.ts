import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useBlockNumber } from "wagmi";
import { parseAbiItem, type AbiEvent, type WatchEventOnLogsParameter } from "viem";
import { CONTRACT_ADDRESS } from "../config/contract";

type HistoryItem = {
  type: "message" | "registration";
  from?: string;
  to?: string;
  username?: string;
  profilePicHash?: string;
  ipfsHash?: string;
  txHash: string;
  timestamp: number;
};

// Pre-parse ABI strings and assert as AbiEvent
const MESSAGE_SENT_EVENT = parseAbiItem(
  "event MessageSent(address indexed from, address indexed to, string ipfsHash)"
) as AbiEvent;

const USER_REGISTERED_EVENT = parseAbiItem(
  "event UserRegistered(address indexed user, string username, string profilePicHash)"
) as AbiEvent;

export function useUserHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const block = useBlockNumber();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!address || !publicClient || !block.data) return;

    const unwatchers: Array<() => void> = [];

    const fetchPastLogs = async () => {
      try {
        // Search from genesis to capture all historical data
        const fromBlock = 0n; // Start from the very beginning
        console.log('Searching blocks from:', fromBlock.toString(), 'to:', block.data.toString());
        const toBlock = block.data;

        const eventDefs: Array<{ type: HistoryItem["type"]; event: AbiEvent }> = [
          { type: "message", event: MESSAGE_SENT_EVENT },
          { type: "registration", event: USER_REGISTERED_EVENT },
        ];

        const all: HistoryItem[] = [];

        for (const e of eventDefs) {
          const logs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: e.event,
            fromBlock,
            toBlock,
          });
          
          console.log(`Found ${logs.length} logs for event type: ${e.type}`);
          if (e.type === "message") {
            console.log('Message logs:', logs);
          }

          const userLogs = logs.filter((log) => {
            if (!log.args || Array.isArray(log.args)) return false;
            const args = log.args as Record<string, unknown>;

            if (e.type === "message") {
              // Include global messages (to address(0)) for everyone
              // Also include private messages where user is sender or recipient
              const isGlobalMessage = 
                typeof args.to === "string" && 
                args.to.toLowerCase() === "0x0000000000000000000000000000000000000000";
              
              const isUserInvolvedMessage = 
                (typeof args.from === "string" &&
                  args.from.toLowerCase() === address.toLowerCase()) ||
                (typeof args.to === "string" &&
                  args.to.toLowerCase() === address.toLowerCase());
                  
              const shouldInclude = isGlobalMessage || isUserInvolvedMessage;
              
              // Simple logging for debugging
              if (e.type === "message" && shouldInclude) {
                console.log('Including message:', { from: args.from, to: args.to, isGlobal: isGlobalMessage });
              }
              
              return shouldInclude;
            } else if (e.type === "registration") {
              // Include all user registrations, not just current user's
              return typeof args.user === "string";
            }
            return false;
          });

          all.push(
            ...userLogs.map((log) => {
              const baseItem = {
                type: e.type,
                txHash: log.transactionHash,
                timestamp: Date.now(), // Ideally: fetch block.timestamp
              };

              if (!log.args || Array.isArray(log.args)) return baseItem;
              const args = log.args as Record<string, unknown>;

              if (e.type === "message") {
                return {
                  ...baseItem,
                  from: args.from as string,
                  to: args.to as string,
                  ipfsHash: args.ipfsHash as string,
                };
              } else if (e.type === "registration") {
                return {
                  ...baseItem,
                  from: args.user as string,
                  username: args.username as string,
                  profilePicHash: args.profilePicHash as string,
                };
              }

              return baseItem;
            })
          );
        }

        setHistory(all.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.error("fetchPastLogs error:", err);
      }
    };

    const watchNewLogs = () => {
      const addToHistory =
        (type: HistoryItem["type"]) =>
        (logs: WatchEventOnLogsParameter<AbiEvent>) => {
          const userLogs = logs.filter((log) => {
            if (!log.args || Array.isArray(log.args)) return false;
            const args = log.args as Record<string, unknown>;

            if (type === "message") {
              // Include global messages (to address(0)) for everyone
              // Also include private messages where user is sender or recipient
              const isGlobalMessage = 
                typeof args.to === "string" && 
                args.to.toLowerCase() === "0x0000000000000000000000000000000000000000";
              
              const isUserInvolvedMessage = 
                (typeof args.from === "string" &&
                  args.from.toLowerCase() === address.toLowerCase()) ||
                (typeof args.to === "string" &&
                  args.to.toLowerCase() === address.toLowerCase());
                  
              return isGlobalMessage || isUserInvolvedMessage;
            } else if (type === "registration") {
              // Include all user registrations
              return typeof args.user === "string";
            }
            return false;
          });

          setHistory((prev) => {
            const newItems = userLogs.map((log) => {
              const baseItem = {
                type,
                txHash: log.transactionHash || "",
                timestamp: Date.now(),
              };

              if (!log.args || Array.isArray(log.args)) return baseItem;
              const args = log.args as Record<string, unknown>;

              if (type === "message") {
                return {
                  ...baseItem,
                  from: args.from as string,
                  to: args.to as string,
                  ipfsHash: args.ipfsHash as string,
                };
              } else if (type === "registration") {
                return {
                  ...baseItem,
                  from: args.user as string,
                  username: args.username as string,
                  profilePicHash: args.profilePicHash as string,
                };
              }

              return baseItem;
            });
            return [...newItems, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          });
        };

      unwatchers.push(
        publicClient.watchEvent({
          address: CONTRACT_ADDRESS,
          event: MESSAGE_SENT_EVENT,
          onLogs: addToHistory("message"),
        })
      );

      unwatchers.push(
        publicClient.watchEvent({
          address: CONTRACT_ADDRESS,
          event: USER_REGISTERED_EVENT,
          onLogs: addToHistory("registration"),
        })
      );
    };

    fetchPastLogs();
    watchNewLogs();

    return () => {
      unwatchers.forEach((u) => u());
    };
  }, [address, publicClient, block.data]);

  return history;
}
