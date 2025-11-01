import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Administra la configuración del sistema
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Razón Social</Label>
                <Input
                  id="company-name"
                  placeholder="Empresa S.A. de C.V."
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-rfc">RFC de la Empresa</Label>
                <Input
                  id="company-rfc"
                  placeholder="EMP123456ABC"
                  className="font-mono uppercase"
                  data-testid="input-company-rfc"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Domicilio Fiscal</Label>
              <Input
                id="company-address"
                placeholder="Calle Principal #123, Col. Centro, CDMX"
                data-testid="input-company-address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración Fiscal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isr-rate">Tasa ISR (%)</Label>
                <Input
                  id="isr-rate"
                  type="number"
                  placeholder="10.88"
                  className="font-mono"
                  data-testid="input-isr-rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imss-rate">Tasa IMSS (%)</Label>
                <Input
                  id="imss-rate"
                  type="number"
                  placeholder="5.00"
                  className="font-mono"
                  data-testid="input-imss-rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="infonavit-rate">Tasa Infonavit (%)</Label>
                <Input
                  id="infonavit-rate"
                  type="number"
                  placeholder="3.00"
                  className="font-mono"
                  data-testid="input-infonavit-rate"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="uma">UMA Diaria (MXN)</Label>
              <Input
                id="uma"
                type="number"
                placeholder="108.57"
                className="font-mono"
                data-testid="input-uma"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Nómina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vacation-days">Días de Vacaciones (por año)</Label>
                <Input
                  id="vacation-days"
                  type="number"
                  placeholder="12"
                  data-testid="input-vacation-days"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aguinaldo-days">Días de Aguinaldo</Label>
                <Input
                  id="aguinaldo-days"
                  type="number"
                  placeholder="15"
                  data-testid="input-aguinaldo-days"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button data-testid="button-save-settings">
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  );
}
