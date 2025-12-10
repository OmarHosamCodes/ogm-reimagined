import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

// Re-export all UI components
export * from "./alert";
export * from "./avatar";
export * from "./badge";
export * from "./button";
export * from "./card";
export * from "./dialog";
export * from "./dropdown-menu";
export * from "./field";
export * from "./input";
export * from "./label";
export * from "./progress";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./sidebar";
export * from "./skeleton";
export * from "./switch";
export * from "./tabs";
export * from "./textarea";
export * from "./theme";
export * from "./toast";
export * from "./tooltip";

// Custom components
export * from "./community-avatar";
export * from "./file-upload";
export * from "./member-avatar";
export * from "./rich-text-editor";
export * from "./video-player";
