import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnect() {
  return (
    <div className="flex justify-center items-center">
      <div className=" rounded-lg shadow-lg border border-slate-200 p-1">
        <ConnectButton />
      </div>
    </div>
  );
}
