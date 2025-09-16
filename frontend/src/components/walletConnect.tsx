import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnect() {
  return (
    <div className="flex justify-center lg:justify-end">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-1">
        <ConnectButton />
      </div>
    </div>
  );
}
