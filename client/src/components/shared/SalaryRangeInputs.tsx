import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface SalaryRangeInputsProps {
  form: UseFormReturn<any>;
  minFieldName: string;
  maxFieldName: string;
  minLabel?: string;
  maxLabel?: string;
  required?: boolean;
}

export function SalaryRangeInputs({
  form,
  minFieldName,
  maxFieldName,
  minLabel = "Salario Mínimo",
  maxLabel = "Salario Máximo",
  required = false,
}: SalaryRangeInputsProps) {
  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numericValue = value.replace(/[^0-9]/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(numericValue));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name={minFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{minLabel}{required && <span className="text-destructive"> *</span>}</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? undefined : parseFloat(value));
                }}
                data-testid={`input-${minFieldName}`}
              />
            </FormControl>
            {field.value && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(field.value.toString())}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={maxFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{maxLabel}{required && <span className="text-destructive"> *</span>}</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? undefined : parseFloat(value));
                }}
                data-testid={`input-${maxFieldName}`}
              />
            </FormControl>
            {field.value && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(field.value.toString())}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
