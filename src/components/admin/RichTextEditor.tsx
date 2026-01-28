import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Image,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Eye,
  Edit,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = useCallback((before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const wrapSelection = useCallback((wrapper: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const newText = value.substring(0, start) + wrapper + selectedText + wrapper + value.substring(end);
      onChange(newText);
    } else {
      insertAtCursor(wrapper, wrapper);
    }
  }, [value, onChange, insertAtCursor]);

  const insertHeading = useCallback((level: number) => {
    const prefix = "#".repeat(level) + " ";
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newText);
  }, [value, onChange]);

  const insertList = useCallback((ordered: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const lines = selectedText.split("\n");
      const formattedLines = lines.map((line, index) => 
        ordered ? `${index + 1}. ${line}` : `- ${line}`
      );
      const newText = value.substring(0, start) + formattedLines.join("\n") + value.substring(end);
      onChange(newText);
    } else {
      insertAtCursor(ordered ? "\n1. " : "\n- ");
    }
  }, [value, onChange, insertAtCursor]);

  const insertLink = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const newText = value.substring(0, start) + `[${selectedText}](url)` + value.substring(end);
      onChange(newText);
    } else {
      insertAtCursor("[link text](", ")");
    }
  }, [value, onChange, insertAtCursor]);

  const insertImage = useCallback(() => {
    insertAtCursor("![alt text](", ")");
  }, [insertAtCursor]);

  const insertBlockquote = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText = value.substring(0, lineStart) + "> " + value.substring(lineStart);
    onChange(newText);
  }, [value, onChange]);

  const insertCodeBlock = useCallback(() => {
    insertAtCursor("\n```\n", "\n```\n");
  }, [insertAtCursor]);

  const insertHorizontalRule = useCallback(() => {
    insertAtCursor("\n---\n");
  }, [insertAtCursor]);

  // Simple markdown to HTML converter for preview
  const renderMarkdown = (text: string): string => {
    let html = text
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-6 border-border">')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4">')
      // Lists
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-6 list-decimal">$1</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-6 list-disc">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="my-4">')
      .replace(/\n/g, '<br>');
    
    return `<div class="prose prose-invert max-w-none"><p class="my-4">${html}</p></div>`;
  };

  const toolbarButtons = [
    { icon: Heading1, action: () => insertHeading(1), tooltip: "Heading 1" },
    { icon: Heading2, action: () => insertHeading(2), tooltip: "Heading 2" },
    { icon: Heading3, action: () => insertHeading(3), tooltip: "Heading 3" },
    { type: "separator" },
    { icon: Bold, action: () => wrapSelection("**"), tooltip: "Bold (Ctrl+B)" },
    { icon: Italic, action: () => wrapSelection("*"), tooltip: "Italic (Ctrl+I)" },
    { icon: Underline, action: () => wrapSelection("__"), tooltip: "Underline" },
    { icon: Strikethrough, action: () => wrapSelection("~~"), tooltip: "Strikethrough" },
    { type: "separator" },
    { icon: List, action: () => insertList(false), tooltip: "Bullet List" },
    { icon: ListOrdered, action: () => insertList(true), tooltip: "Numbered List" },
    { type: "separator" },
    { icon: Link2, action: insertLink, tooltip: "Insert Link" },
    { icon: Image, action: insertImage, tooltip: "Insert Image" },
    { icon: Quote, action: insertBlockquote, tooltip: "Blockquote" },
    { icon: Code, action: insertCodeBlock, tooltip: "Code Block" },
    { icon: Minus, action: insertHorizontalRule, tooltip: "Horizontal Rule" },
  ];

  return (
    <div className="border border-input rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b border-input bg-muted/30 px-2">
          {/* Toolbar */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-0.5 py-1.5 overflow-x-auto">
              {toolbarButtons.map((button, index) => 
                button.type === "separator" ? (
                  <Separator key={index} orientation="vertical" className="h-6 mx-1" />
                ) : (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={button.action}
                        disabled={activeTab === "preview"}
                      >
                        <button.icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{button.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              )}
            </div>
          </TooltipProvider>

          {/* View toggle */}
          <TabsList className="h-8 bg-transparent">
            <TabsTrigger value="edit" className="h-7 text-xs gap-1">
              <Edit className="h-3 w-3" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 text-xs gap-1">
              <Eye className="h-3 w-3" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Write your content here... Use markdown for formatting."}
            className="min-h-[300px] border-0 rounded-none focus-visible:ring-0 resize-y font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div 
            className="min-h-[300px] p-4 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        </TabsContent>
      </Tabs>

      <div className="border-t border-input bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        Supports Markdown formatting • **bold** • *italic* • # headings • - lists • [links](url)
      </div>
    </div>
  );
}
