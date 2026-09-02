"use client";

import React from "react";
import { User, Store } from "lucide-react";
import { POSNetworkBadge } from "./POSNetworkBadge";

export function POSHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-[#0b0b0b] px-6 py-3 text-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#32D583]/10 text-[#32D583]">
            <Store className="h-4 w-4" />
          </div>
          <span className="text-sm font-extrabold tracking-wide">WORSCOI POS</span>
        </div>

        <div className="hidden items-center gap-2 border-l border-white/10 pl-4 text-xs text-gray-400 sm:flex">
          <User className="h-3.5 w-3.5" />
          <span>
            Operador: <strong>Miguel António</strong>
          </span>
        </div>
      </div>

      <POSNetworkBadge />
    </header>
  );
}
