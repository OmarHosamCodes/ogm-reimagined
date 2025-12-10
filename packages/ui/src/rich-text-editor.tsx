"use client";

import * as React from "react";
import { Button } from "./button";
import { cn } from "./index";
import { Textarea } from "./textarea";

interface RichTextEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
  showToolbar?: boolean;
}

/**
 * A simple rich text editor that uses Markdown.
 * For a full-featured editor, consider integrating TipTap or Lexical.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  disabled = false,
  minHeight = "150px",
  maxHeight = "400px",
  showToolbar = true,
  className,
  ...props
}: RichTextEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition =
        start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const toolbarActions = [
    { label: "B", title: "Bold", action: () => insertFormatting("**", "**") },
    { label: "I", title: "Italic", action: () => insertFormatting("*", "*") },
    {
      label: "S",
      title: "Strikethrough",
      action: () => insertFormatting("~~", "~~"),
    },
    { label: "H1", title: "Heading 1", action: () => insertFormatting("# ") },
    { label: "H2", title: "Heading 2", action: () => insertFormatting("## ") },
    { label: "•", title: "Bullet List", action: () => insertFormatting("- ") },
    {
      label: "1.",
      title: "Numbered List",
      action: () => insertFormatting("1. "),
    },
    {
      label: "🔗",
      title: "Link",
      action: () => insertFormatting("[", "](url)"),
    },
    { label: "`", title: "Code", action: () => insertFormatting("`", "`") },
    {
      label: "```",
      title: "Code Block",
      action: () => insertFormatting("```\n", "\n```"),
    },
    { label: ">", title: "Quote", action: () => insertFormatting("> ") },
  ];

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {showToolbar && (
        <div className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-1">
          {toolbarActions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 min-w-7 px-2 text-xs font-medium"
              title={action.title}
              onClick={action.action}
              disabled={disabled}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="resize-none font-mono text-sm"
        style={{ minHeight, maxHeight }}
      />
      <p className="text-xs text-muted-foreground">
        Supports Markdown formatting
      </p>
    </div>
  );
}
