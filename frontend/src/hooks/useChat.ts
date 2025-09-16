import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contract';
import { createPublicClient, getContract, http } from 'viem';
import { liskSepolia } from 'viem/chains';


export const useChat = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();


  const [contract, setContract] = useState<ReturnType<typeof getContract> | null>(null);

  useEffect(() => {
    if (walletClient) {
      const publicClient = createPublicClient({
        chain: liskSepolia,
        transport: http(),
      });

      const contractInstance = getContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        client: {
          public: publicClient,
          wallet: walletClient,
        },
      });

      setContract(contractInstance);
    }
  }, [walletClient]);

  return { account: address, contract };
};
