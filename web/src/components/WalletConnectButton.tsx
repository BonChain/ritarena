"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletConnectButton() {
  return (
    <div className="ritarena-wallet-button">
      <WalletMultiButton />
      <style jsx global>{`
        .ritarena-wallet-button .wallet-adapter-button {
          background: #14f195;
          color: #050508;
          font-family: var(--font-ui);
          font-weight: 700;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          transition: filter 0.2s;
        }
        .ritarena-wallet-button .wallet-adapter-button:hover:not(:disabled) {
          filter: brightness(1.1);
          background: #14f195;
        }
        .ritarena-wallet-button .wallet-adapter-modal-wrapper {
          background: rgba(10, 10, 15, 0.95);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}
