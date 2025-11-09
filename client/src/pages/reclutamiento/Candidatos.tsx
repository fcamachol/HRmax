import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Candidatos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidatos</h1>
        <p className="text-muted-foreground">Base de datos de candidatos y gestión de información</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo de Candidatos</CardTitle>
          <CardDescription>
            Próximamente: base de datos completa de candidatos con gestión de CVs y documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo permitirá registrar candidatos, almacenar su información de contacto, 
            experiencia, educación, habilidades, idiomas, y gestionar sus documentos (CVs, certificados, etc.).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
