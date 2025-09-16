import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { liskSepolia } from "wagmi/chains";
import { http } from "viem";

export const config = getDefaultConfig({
    appName: "Chat dApp",
    projectId: "3a882e00d37608ab3c3429584b7ed1d6",
    chains: [liskSepolia],
    transports:{
        [liskSepolia.id]: http("https://rpc.sepolia-api.lisk.com") 
    }
});
