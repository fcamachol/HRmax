import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { FontFamily } from '@tiptap/extension-font-family';
import { forwardRef, useImperativeHandle, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { VariableExtension } from './VariableExtension';
import { FontSize } from './FontSizeExtension';
import { LineHeight } from './LineHeightExtension';
import TemplateEditorToolbar from './TemplateEditorToolbar';
import './template-editor.css';

// Paper sizes in pixels at 96 DPI
const PAPER_SIZES = {
  letter: { width: 816, height: 1056 },   // 8.5" x 11"
  legal: { width: 816, height: 1344 },    // 8.5" x 14"
  a4: { width: 794, height: 1123 },       // 210mm x 297mm
};

// Default margins in pixels (0.75")
const DEFAULT_MARGIN = 72;

interface TemplateEditorProps {
  content: unknown;
  onChange: (content: unknown) => void;
  placeholder?: string;
  readOnly?: boolean;
  onInsertImage?: () => void;
  paperSize?: 'letter' | 'legal' | 'a4';
  orientation?: 'portrait' | 'landscape';
}

export interface TemplateEditorRef {
  insertVariable: (variableKey: string, label: string) => void;
  insertImage: (url: string, alt?: string) => void;
  getHTML: () => string;
  getJSON: () => unknown;
}

const TemplateEditor = forwardRef<TemplateEditorRef, TemplateEditorProps>(
  ({
    content,
    onChange,
    placeholder = 'Escribe aquí el contenido de tu plantilla...',
    readOnly = false,
    onInsertImage,
    paperSize = 'letter',
    orientation = 'portrait',
  }, ref) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);

    // Calculate page dimensions based on paper size and orientation
    const dimensions = useMemo(() => {
      const size = PAPER_SIZES[paperSize] || PAPER_SIZES.letter;
      if (orientation === 'landscape') {
        return { width: size.height, height: size.width };
      }
      return size;
    }, [paperSize, orientation]);

    // Content area height (page height minus top and bottom margins)
    const contentHeight = dimensions.height - (DEFAULT_MARGIN * 2);

    // Calculate number of pages needed based on content height
    const calculatePages = useCallback(() => {
      if (!editorContainerRef.current) return;

      const editorElement = editorContainerRef.current.querySelector('.ProseMirror');
      if (!editorElement) return;

      const contentScrollHeight = editorElement.scrollHeight;
      const pagesNeeded = Math.max(1, Math.ceil(contentScrollHeight / contentHeight));

      if (pagesNeeded !== pageCount) {
        setPageCount(pagesNeeded);
      }
    }, [contentHeight, pageCount]);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4],
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        LineHeight,
        Highlight.configure({
          multicolor: true,
        }),
        Underline,
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        Link.configure({
          openOnClick: false,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        Placeholder.configure({
          placeholder,
        }),
        VariableExtension,
      ],
      content: content as any,
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        onChange(editor.getJSON());
        // Recalculate pages after content changes
        setTimeout(calculatePages, 10);
      },
    });

    // Update content when prop changes
    useEffect(() => {
      if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
        editor.commands.setContent(content as any);
        setTimeout(calculatePages, 10);
      }
    }, [content, editor, calculatePages]);

    // Calculate pages on mount and when dimensions change
    useEffect(() => {
      const timer = setTimeout(calculatePages, 100);
      return () => clearTimeout(timer);
    }, [calculatePages, dimensions, editor]);

    // Recalculate on window resize
    useEffect(() => {
      const handleResize = () => calculatePages();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [calculatePages]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      insertVariable: (variableKey: string, label: string) => {
        editor?.chain().focus().insertVariable({ variableKey, label }).run();
      },
      insertImage: (url: string, alt?: string) => {
        editor?.chain().focus().setImage({ src: url, alt }).run();
      },
      getHTML: () => editor?.getHTML() || '',
      getJSON: () => editor?.getJSON() || {},
    }));

    // Gap between pages (Google Docs style)
    const PAGE_GAP = 10;

    return (
      <div className="template-editor flex flex-col h-full">
        {!readOnly && (
          <TemplateEditorToolbar editor={editor} onInsertImage={onInsertImage} />
        )}
        <div className="page-wrapper flex-1 overflow-auto">
          <div
            className="page-container"
            ref={editorContainerRef}
            style={{
              position: 'relative',
              width: dimensions.width,
              minHeight: pageCount * dimensions.height + (pageCount - 1) * PAGE_GAP,
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            {/* Render page backgrounds (Google Docs style) */}
            {Array.from({ length: pageCount }, (_, i) => (
              <div
                key={i}
                className="page-background"
                style={{
                  position: 'absolute',
                  top: i * (dimensions.height + PAGE_GAP),
                  left: 0,
                  width: dimensions.width,
                  height: dimensions.height,
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Editor content */}
            <div
              style={{
                position: 'relative',
                padding: DEFAULT_MARGIN,
                zIndex: 1,
              }}
            >
              <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none focus:outline-none"
              />
            </div>

            {/* Page break gaps (gray space between pages) */}
            {pageCount > 1 && Array.from({ length: pageCount - 1 }, (_, i) => (
              <div
                key={`gap-${i}`}
                style={{
                  position: 'absolute',
                  top: (i + 1) * dimensions.height + i * PAGE_GAP,
                  left: -20,
                  right: -20,
                  height: PAGE_GAP,
                  background: '#f1f3f4',
                  zIndex: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

TemplateEditor.displayName = 'TemplateEditor';

export default TemplateEditor;
