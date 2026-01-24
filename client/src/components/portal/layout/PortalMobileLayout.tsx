import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { PortalHeader } from "./PortalHeader";

interface PortalMobileLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showNav?: boolean;
}

export function PortalMobileLayout({
  children,
  title,
  showHeader = true,
  showNav = true,
}: PortalMobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <PortalHeader title={title} />}

      {/* Main content area with safe padding for bottom nav */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto">{children}</div>
      </main>

      {showNav && <BottomNavigation />}
    </div>
  );
}
