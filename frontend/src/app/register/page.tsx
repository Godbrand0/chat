'use client'

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import UserRegistration from '../../components/register';
import { useIsRegistered, useChatContract } from '../../hooks/useChatContract';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ClientOnly } from '../../components/ClientOnly';

export default function RegisterPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { data: isRegistered } = useIsRegistered(address);
  const { register, isPending: isRegisteringTx, isConfirming } = useChatContract();

  useEffect(() => {
    if (!isConnected) return;
    if (isRegistered) router.replace('/chat');
  }, [isConnected, isRegistered, router]);

  const handleRegister = async (name: string, profilePicHash: string) => {
    await register(name, profilePicHash);
  };

  return (
    <ClientOnly fallback={<LoadingScreen message="Preparing registration..." />}>
      {!isConnected ? (
        <LoadingScreen message="Connect wallet to continue..." />
      ) : isRegistered === undefined ? (
        <LoadingScreen message="Checking registration..." />
      ) : isRegistered ? (
        <LoadingScreen message="Redirecting to chat..." />
      ) : (
        <UserRegistration onRegister={handleRegister} loading={isRegisteringTx || isConfirming} />
      )}
    </ClientOnly>
  );
}


