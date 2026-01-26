import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Link,
  Image,
  Table,
  Highlighter,
  Palette,
  ALargeSmall,
  ChevronsUpDown,
} from 'lucide-react';
import { useState, useCallback } from 'react';

interface TemplateEditorToolbarProps {
  editor: Editor | null;
  onInsertImage?: () => void;
}

const fontFamilies = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

const fontSizes = [
  { value: '8pt', label: '8' },
  { value: '9pt', label: '9' },
  { value: '10pt', label: '10' },
  { value: '11pt', label: '11' },
  { value: '12pt', label: '12' },
  { value: '14pt', label: '14' },
  { value: '18pt', label: '18' },
  { value: '24pt', label: '24' },
  { value: '30pt', label: '30' },
  { value: '36pt', label: '36' },
  { value: '48pt', label: '48' },
  { value: '60pt', label: '60' },
  { value: '72pt', label: '72' },
];

const lineHeights = [
  { value: '1', label: 'Sencillo' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: 'Doble' },
];

const headingLevels = [
  { value: 'paragraph', label: 'Párrafo' },
  { value: 'h1', label: 'Título 1' },
  { value: 'h2', label: 'Título 2' },
  { value: 'h3', label: 'Título 3' },
  { value: 'h4', label: 'Título 4' },
];

const colors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
];

export default function TemplateEditorToolbar({ editor, onInsertImage }: TemplateEditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);

  // Get current font size from editor
  const getCurrentFontSize = useCallback(() => {
    if (!editor) return '11pt';
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontSize || '11pt';
  }, [editor]);

  // Get current font family from editor
  const getCurrentFontFamily = useCallback(() => {
    if (!editor) return 'Arial';
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontFamily || 'Arial';
  }, [editor]);

  // Get current line height
  const getCurrentLineHeight = useCallback(() => {
    if (!editor) return '1.15';
    const attrs = editor.getAttributes('paragraph');
    return attrs.lineHeight || '1.15';
  }, [editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkPopover(false);
    setLinkUrl('');
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        icon={Undo}
        title="Deshacer"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        icon={Redo}
        title="Rehacer"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Heading level */}
      <Select
        value={
          editor.isActive('heading', { level: 1 }) ? 'h1' :
          editor.isActive('heading', { level: 2 }) ? 'h2' :
          editor.isActive('heading', { level: 3 }) ? 'h3' :
          editor.isActive('heading', { level: 4 }) ? 'h4' :
          'paragraph'
        }
        onValueChange={(value) => {
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else {
            const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4;
            editor.chain().focus().toggleHeading({ level }).run();
          }
        }}
      >
        <SelectTrigger className="w-28 h-8">
          <SelectValue placeholder="Estilo" />
        </SelectTrigger>
        <SelectContent>
          {headingLevels.map((heading) => (
            <SelectItem key={heading.value} value={heading.value}>
              {heading.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Font family */}
      <Select
        value={getCurrentFontFamily()}
        onValueChange={(value) => {
          editor.chain().focus().setFontFamily(value).run();
        }}
      >
        <SelectTrigger className="w-32 h-8">
          <SelectValue placeholder="Fuente" />
        </SelectTrigger>
        <SelectContent>
          {fontFamilies.map((font) => (
            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font size */}
      <Select
        value={getCurrentFontSize()}
        onValueChange={(value) => {
          editor.chain().focus().setFontSize(value).run();
        }}
      >
        <SelectTrigger className="w-16 h-8">
          <SelectValue placeholder="11" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((size) => (
            <SelectItem key={size.value} value={size.value}>
              {size.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={Bold}
        title="Negrita"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={Italic}
        title="Cursiva"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        icon={Underline}
        title="Subrayado"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={Strikethrough}
        title="Tachado"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Color de texto">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-10 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => editor.chain().focus().setColor(color).run()}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Highlight */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Resaltar">
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-10 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        icon={AlignLeft}
        title="Alinear a la izquierda"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        icon={AlignCenter}
        title="Centrar"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        icon={AlignRight}
        title="Alinear a la derecha"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        icon={AlignJustify}
        title="Justificar"
      />

      {/* Line height (interlineado) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Interlineado">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="text-xs">{getCurrentLineHeight()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1">
          <div className="flex flex-col">
            {lineHeights.map((lh) => (
              <Button
                key={lh.value}
                variant={getCurrentLineHeight() === lh.value ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start"
                onClick={() => editor.chain().focus().setLineHeight(lh.value).run()}
              >
                {lh.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={List}
        title="Lista con viñetas"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={ListOrdered}
        title="Lista numerada"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Link */}
      <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-accent' : ''}`}
            title="Insertar enlace"
          >
            <Link className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <Label>URL del enlace</Label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={setLink}>
                Insertar
              </Button>
              {editor.isActive('link') && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setShowLinkPopover(false);
                  }}
                >
                  Quitar enlace
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image */}
      {onInsertImage && (
        <ToolbarButton
          onClick={onInsertImage}
          icon={Image}
          title="Insertar imagen"
        />
      )}

      {/* Table */}
      <ToolbarButton
        onClick={insertTable}
        icon={Table}
        title="Insertar tabla"
      />
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

function ToolbarButton({ onClick, isActive, disabled, icon: Icon, title }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${isActive ? 'bg-accent' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
