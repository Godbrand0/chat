import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useBlockNumber } from "wagmi";
import { parseAbiItem, type AbiEvent, type WatchEventOnLogsParameter } from "viem";
import { CONTRACT_ADDRESS } from "../config/contract";

type HistoryItem = {
  type: "message" | "registration" | "feed";
  from?: string;
  to?: string;
  username?: string;
  profilePicHash?: string;
  ipfsHash?: string;
  price?: string;
  txHash: string;
  timestamp: number;
};

// Pre-parse ABI strings
const MESSAGE_SENT_EVENT = parseAbiItem(
  "event MessageSent(address indexed from, address indexed to, string ipfsHash)"
) as AbiEvent;

const USER_REGISTERED_EVENT = parseAbiItem(
  "event UserRegistered(address indexed user, string username, string profilePicHash)"
) as AbiEvent;

const PRICE_FETCHED_EVENT = parseAbiItem(
  "event PriceFetched(int256 price, uint256 timestamp)"
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
        const fromBlock = 9233595n; // first deployment block
        const toBlock = block.data;

        const eventDefs: Array<{ type: HistoryItem["type"]; event: AbiEvent }> = [
          { type: "message", event: MESSAGE_SENT_EVENT },
          { type: "registration", event: USER_REGISTERED_EVENT },
          { type: "feed", event: PRICE_FETCHED_EVENT },
        ];

        const all: HistoryItem[] = [];

        for (const e of eventDefs) {
          const logs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: e.event,
            fromBlock,
            toBlock,
          });

          // Fetch block timestamps in parallel
          const logsWithTimestamps = await Promise.all(
            logs.map(async (log) => {
              const blk = await publicClient.getBlock({ blockNumber: log.blockNumber });
              return { log, blockTimestamp: Number(blk.timestamp) * 1000 };
            })
          );

          for (const { log, blockTimestamp } of logsWithTimestamps) {
            if (!log.args || Array.isArray(log.args)) continue;
            const args = log.args as Record<string, unknown>;

            if (e.type === "message") {
              const isGlobal =
                typeof args.to === "string" &&
                args.to.toLowerCase() === "0x0000000000000000000000000000000000000000";
              const involved =
                (typeof args.from === "string" &&
                  args.from.toLowerCase() === address.toLowerCase()) ||
                (typeof args.to === "string" &&
                  args.to.toLowerCase() === address.toLowerCase());

              if (!(isGlobal || involved)) continue;

              all.push({
                type: "message",
                txHash: log.transactionHash,
                timestamp: blockTimestamp,
                from: args.from as string,
                to: args.to as string,
                ipfsHash: args.ipfsHash as string,
              });
            } else if (e.type === "registration") {
              all.push({
                type: "registration",
                txHash: log.transactionHash,
                timestamp: blockTimestamp,
                from: args.user as string,
                username: args.username as string,
                profilePicHash: args.profilePicHash as string,
              });
            } else if (e.type === "feed") {
              const priceValue = args.price as bigint;
              const formattedPrice = (Number(priceValue) / 1e18).toFixed(4);
              const eventTimestamp = Number(args.timestamp as bigint) * 1000;

              all.push({
                type: "feed",
                txHash: log.transactionHash,
                timestamp: eventTimestamp || blockTimestamp,
                price: formattedPrice,
                from: "0x0000000000000000000000000000000000000000",
              });
            }
          }
        }

        setHistory(all.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.error("fetchPastLogs error:", err);
      }
    };

    const watchNewLogs = () => {
      const addToHistory =
        (type: HistoryItem["type"]) =>
        async (logs: WatchEventOnLogsParameter<AbiEvent>) => {
          const newItems: HistoryItem[] = [];

          for (const log of logs) {
            if (!log.args || Array.isArray(log.args)) continue;
            const args = log.args as Record<string, unknown>;

            const blk = await publicClient.getBlock({ blockNumber: log.blockNumber });
            const blockTimestamp = Number(blk.timestamp) * 1000;

            if (type === "message") {
              const isGlobal =
                typeof args.to === "string" &&
                args.to.toLowerCase() === "0x0000000000000000000000000000000000000000";
              const involved =
                (typeof args.from === "string" &&
                  args.from.toLowerCase() === address.toLowerCase()) ||
                (typeof args.to === "string" &&
                  args.to.toLowerCase() === address.toLowerCase());

              if (!(isGlobal || involved)) continue;

              newItems.push({
                type: "message",
                txHash: log.transactionHash || "",
                timestamp: blockTimestamp,
                from: args.from as string,
                to: args.to as string,
                ipfsHash: args.ipfsHash as string,
              });
            } else if (type === "registration") {
              newItems.push({
                type: "registration",
                txHash: log.transactionHash || "",
                timestamp: blockTimestamp,
                from: args.user as string,
                username: args.username as string,
                profilePicHash: args.profilePicHash as string,
              });
            } else if (type === "feed") {
              const priceValue = args.price as bigint;
              const formattedPrice = (Number(priceValue) / 1e18).toFixed(4);
              const eventTimestamp = Number(args.timestamp as bigint) * 1000;

              newItems.push({
                type: "feed",
                txHash: log.transactionHash || "",
                timestamp: eventTimestamp || blockTimestamp,
                price: formattedPrice,
                from: "0x0000000000000000000000000000000000000000",
              });
            }
          }

          setHistory((prev) =>
            [...newItems, ...prev].sort((a, b) => b.timestamp - a.timestamp)
          );
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
      unwatchers.push(
        publicClient.watchEvent({
          address: CONTRACT_ADDRESS,
          event: PRICE_FETCHED_EVENT,
          onLogs: addToHistory("feed"),
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
