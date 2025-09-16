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
        const fromBlock = block.data > 5000n ? block.data - 5000n : 0n;
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

          const userLogs = logs.filter((log) => {
            if (!log.args || Array.isArray(log.args)) return false;
            const args = log.args as Record<string, unknown>;

            if (e.type === "message") {
              return (
                (typeof args.from === "string" &&
                  args.from.toLowerCase() === address.toLowerCase()) ||
                (typeof args.to === "string" &&
                  args.to.toLowerCase() === address.toLowerCase())
              );
            } else if (e.type === "registration") {
              return (
                typeof args.user === "string" &&
                args.user.toLowerCase() === address.toLowerCase()
              );
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
              return (
                (typeof args.from === "string" &&
                  args.from.toLowerCase() === address.toLowerCase()) ||
                (typeof args.to === "string" &&
                  args.to.toLowerCase() === address.toLowerCase())
              );
            } else if (type === "registration") {
              return (
                typeof args.user === "string" &&
                args.user.toLowerCase() === address.toLowerCase()
              );
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
