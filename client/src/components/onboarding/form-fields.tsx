import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { YesNoNa } from "@shared/schema";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  validated?: boolean;
  onValidatedChange?: (validated: boolean) => void;
  testId?: string;
  required?: boolean;
  type?: string;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  validated,
  onValidatedChange,
  testId,
  required,
  type = "text",
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {onValidatedChange !== undefined && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={validated}
              onCheckedChange={(checked) => onValidatedChange(checked === true)}
              data-testid={`${testId}-validated`}
            />
            <Label className="text-xs text-muted-foreground">Validado</Label>
          </div>
        )}
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className={cn(validated && "border-chart-2")}
      />
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
  rows?: number;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  testId,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        rows={rows}
      />
    </div>
  );
}

interface YesNoFieldProps {
  label: string;
  value: YesNoNa;
  onChange: (value: YesNoNa) => void;
  testId?: string;
  showNa?: boolean;
  fundamento?: string;
}

export function YesNoField({ label, value, onChange, testId, showNa = true, fundamento }: YesNoFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">{label}</Label>
        {fundamento && (
          <span className="text-xs text-muted-foreground">{fundamento}</span>
        )}
      </div>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as YesNoNa)}
        className="flex flex-wrap gap-4"
        data-testid={testId}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${testId}-yes`} />
          <Label htmlFor={`${testId}-yes`} className="text-sm font-normal">Sí</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${testId}-no`} />
          <Label htmlFor={`${testId}-no`} className="text-sm font-normal">No</Label>
        </div>
        {showNa && (
          <div className="flex items-center gap-2">
            <RadioGroupItem value="na" id={`${testId}-na`} />
            <Label htmlFor={`${testId}-na`} className="text-sm font-normal">N/A</Label>
          </div>
        )}
      </RadioGroup>
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
  description?: string;
}

export function CheckboxField({ label, checked, onChange, testId, description }: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(c) => onChange(c === true)}
        data-testid={testId}
        className="mt-0.5"
      />
      <div className="flex flex-col gap-0.5">
        <Label className="text-sm font-normal">{label}</Label>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );
}

interface DocumentStatusFieldProps {
  label: string;
  required?: boolean | string;
  received: boolean;
  valid: boolean;
  observations: string;
  fileUrl?: string;
  onReceivedChange: (received: boolean) => void;
  onValidChange: (valid: boolean) => void;
  onObservationsChange: (observations: string) => void;
  onFileChange?: (fileUrl: string) => void;
  testId?: string;
}

export function DocumentStatusField({
  label,
  required,
  received,
  valid,
  observations,
  fileUrl,
  onReceivedChange,
  onValidChange,
  onObservationsChange,
  onFileChange,
  testId,
}: DocumentStatusFieldProps) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileChange) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        onFileChange(data.fileUrl);
        onReceivedChange(true);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="grid grid-cols-12 items-center gap-4 rounded-md border border-border p-3">
      <div className="col-span-3 flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        {required === true && <Badge variant="secondary" className="text-xs">Requerido</Badge>}
        {typeof required === "string" && <Badge variant="outline" className="text-xs">{required}</Badge>}
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <Checkbox
          checked={received}
          onCheckedChange={(c) => onReceivedChange(c === true)}
          data-testid={`${testId}-received`}
        />
        <Label className="text-xs text-muted-foreground">Recibido</Label>
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <Checkbox
          checked={valid}
          onCheckedChange={(c) => onValidChange(c === true)}
          data-testid={`${testId}-valid`}
        />
        <Label className="text-xs text-muted-foreground">Vigente</Label>
      </div>
      <div className="col-span-3">
        <Input
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          placeholder="Observaciones..."
          className="text-sm"
          data-testid={`${testId}-observations`}
        />
      </div>
      <div className="col-span-2 flex items-center gap-2">
        {onFileChange && (
          <>
            <input
              type="file"
              id={`${testId}-file`}
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label
              htmlFor={`${testId}-file`}
              className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {fileUrl ? "Cambiar" : "Subir"}
            </label>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 underline hover:text-blue-600"
              >
                Ver
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  description?: string;
  fundamento?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, description, fundamento, children, className }: SectionCardProps) {
  return (
    <Card className={cn("border-card-border", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {fundamento && (
          <div className="mt-2 rounded-md bg-muted/50 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Fundamento: </span>
            <span className="text-xs text-muted-foreground">{fundamento}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  testId?: string;
  min?: number;
  max?: number;
  suffix?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  testId,
  min,
  max,
  suffix,
}: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          data-testid={testId}
          min={min}
          max={max}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

export function DateField({ label, value, onChange, testId }: DateFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      />
    </div>
  );
}
