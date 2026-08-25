"use client";

import { SessionProvider } from "next-auth/react";
import { PopupsProvider } from "@/components/ui/popups";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PopupsProvider>{children}</PopupsProvider>
    </SessionProvider>
  );
}