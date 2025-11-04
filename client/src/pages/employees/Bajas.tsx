import { useState } from "react";
import { CasosLegalesKanban } from "@/components/CasosLegalesKanban";
import { BajaWizard } from "@/components/BajaWizard";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";

export default function Bajas() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bajas de Personal</h1>
          <p className="text-muted-foreground mt-2">
            Gestión del proceso de bajas y terminaciones laborales
          </p>
        </div>
        <Button 
          onClick={() => setIsWizardOpen(true)}
          data-testid="button-new-baja-wizard"
        >
          <UserMinus className="h-4 w-4 mr-2" />
          Nueva Baja
        </Button>
      </div>

      <CasosLegalesKanban hideNewButton={true} />
      <BajaWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />
    </div>
  );
}
