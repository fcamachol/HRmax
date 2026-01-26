import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import VariableNode from './VariableNode';

export interface VariableOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    templateVariable: {
      insertVariable: (attributes: { variableKey: string; label: string }) => ReturnType;
    };
  }
}

export const VariableExtension = Node.create<VariableOptions>({
  name: 'templateVariable',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      variableKey: {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-key'),
        renderHTML: attributes => {
          if (!attributes.variableKey) {
            return {};
          }
          return {
            'data-variable-key': attributes.variableKey,
          };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-variable-label': attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'template-variable',
      }),
      `{{${HTMLAttributes['data-variable-key']}}}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableNode);
  },

  addCommands() {
    return {
      insertVariable:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});

export default VariableExtension;
