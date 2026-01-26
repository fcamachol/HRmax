import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { User, Building2, FileText, Settings, Search, Plus } from 'lucide-react';
import { templateVariableCategories, type TemplateVariableCategory } from '@shared/templateVariables';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Building2,
  FileText,
  Settings,
};

interface VariablePickerProps {
  onInsert: (variableKey: string, label: string) => void;
  customVariables?: Array<{ key: string; label: string }>;
}

export default function VariablePicker({ onInsert, customVariables = [] }: VariablePickerProps) {
  const [search, setSearch] = useState('');

  const filteredCategories = Object.entries(templateVariableCategories).map(([key, category]) => {
    const filteredVars = Object.entries(category.variables).filter(([varKey, variable]) => {
      const searchLower = search.toLowerCase();
      return (
        varKey.toLowerCase().includes(searchLower) ||
        variable.label.toLowerCase().includes(searchLower) ||
        (variable.description?.toLowerCase().includes(searchLower) ?? false)
      );
    });
    return { key, category, filteredVars };
  }).filter(({ filteredVars, key }) => filteredVars.length > 0 || key === 'custom');

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar variable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={['empleado', 'empresa', 'documento']} className="px-2">
          {filteredCategories.map(({ key, category, filteredVars }) => {
            const Icon = iconMap[category.icon] || FileText;

            // Handle custom variables category
            if (key === 'custom') {
              return (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{category.label}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {customVariables.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pb-2">
                      {category.description && (
                        <p className="text-xs text-muted-foreground mb-2 px-2">
                          {category.description}
                        </p>
                      )}
                      {customVariables.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2">
                          No hay variables personalizadas definidas
                        </p>
                      ) : (
                        customVariables.map((customVar) => (
                          <VariableButton
                            key={customVar.key}
                            variableKey={`custom.${customVar.key}`}
                            label={customVar.label}
                            onClick={() => onInsert(`custom.${customVar.key}`, customVar.label)}
                          />
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }

            return (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{category.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {filteredVars.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pb-2">
                    {filteredVars.map(([varKey, variable]) => (
                      <VariableButton
                        key={varKey}
                        variableKey={varKey}
                        label={variable.label}
                        example={variable.example}
                        description={variable.description}
                        onClick={() => onInsert(varKey, variable.label)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

interface VariableButtonProps {
  variableKey: string;
  label: string;
  example?: string;
  description?: string;
  onClick: () => void;
}

function VariableButton({ variableKey, label, example, description, onClick }: VariableButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm group"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {example && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Ej: {example}
        </p>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5 italic">
          {description}
        </p>
      )}
    </button>
  );
}
