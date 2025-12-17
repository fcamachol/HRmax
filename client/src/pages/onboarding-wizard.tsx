import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { SectionRenderer } from "@/components/onboarding/sections";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function OnboardingWizard() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <OnboardingProvider clienteId={1}>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <OnboardingSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between p-3 border-b border-border bg-background">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-hidden">
              <SectionRenderer />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </OnboardingProvider>
  );
}
