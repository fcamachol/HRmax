import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Variable } from 'lucide-react';

export default function VariableNode({ node, selected }: NodeViewProps) {
  const variableKey = node.attrs.variableKey as string;
  const label = node.attrs.label as string;

  return (
    <NodeViewWrapper
      as="span"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 cursor-default ${
        selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      }`}
      data-variable-key={variableKey}
      data-variable-label={label}
    >
      <Variable className="h-3 w-3" />
      {label || variableKey}
    </NodeViewWrapper>
  );
}
