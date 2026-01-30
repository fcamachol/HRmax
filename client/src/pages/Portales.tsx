import {
  Link2,
  Copy,
  ExternalLink,
  Shield,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCliente } from "@/contexts/ClienteContext";

// Portal configuration
const portales = [
  {
    id: "denuncias",
    title: "Canal de Denuncias",
    description: "Portal anónimo para reportar incidencias - NOM-035-STPS-2018",
    icon: Shield,
    urlPattern: "/denuncia", // /denuncia/:clienteId
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    id: "empleados",
    title: "Portal de Empleados",
    description: "Autoservicio para empleados - Recibos, solicitudes, documentos",
    icon: Smartphone,
    urlPattern: "/portal", // /portal/:clienteId
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
];

export default function Portales() {
  const { clienteId } = useCliente();
  const { toast } = useToast();

  // Generate portal URL
  const getPortalUrl = (portal: typeof portales[0]) => {
    if (!clienteId) return null;
    return `${window.location.origin}${portal.urlPattern}/${clienteId}`;
  };

  // Copy URL to clipboard
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copiado", description: "URL del portal copiada al portapapeles" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="h-6 w-6" />
          Portales de Empleados
        </h1>
        <p className="text-muted-foreground">
          Enlaces a los portales de autoservicio para compartir con empleados
        </p>
      </div>

      {/* Portal Cards */}
      <div className="grid gap-6">
        {portales.map((portal) => {
          const Icon = portal.icon;
          const url = getPortalUrl(portal);

          return (
            <Card key={portal.id} className={`${portal.borderColor}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${portal.bgColor}`}>
                    <Icon className={`h-5 w-5 ${portal.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{portal.title}</CardTitle>
                    <CardDescription>{portal.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL del Portal</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={url || ""}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => url && copyUrl(url)}
                      title="Copiar URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => url && window.open(url, "_blank")}
                      title="Abrir en nueva pestaña"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
