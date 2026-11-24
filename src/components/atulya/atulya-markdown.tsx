"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function AtulyaMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("text-[0.95rem] leading-relaxed", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h3 className="mt-4 mb-2 text-base font-semibold text-amber-200">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mt-4 mb-2 text-base font-semibold text-amber-200">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-4 mb-2 text-[0.95rem] font-semibold text-amber-200/90">{children}</h4>
          ),
          strong: ({ children }) => <strong className="font-semibold text-amber-100">{children}</strong>,
          em: ({ children }) => <em className="text-violet-200/80">{children}</em>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
          li: ({ children }) => <li className="marker:text-amber-400/70">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-amber-300 underline underline-offset-2">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-r-lg border-l-2 border-amber-400/50 bg-amber-400/5 px-3 py-2 text-[0.85rem] text-amber-100/70">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-white/10" />,
          code: ({ children }) => (
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] text-amber-100">{children}</code>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[420px] border-collapse text-left text-[0.85rem]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.06]">{children}</thead>,
          th: ({ children }) => (
            <th className="whitespace-nowrap border-b border-white/10 px-3 py-2 font-semibold text-amber-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/5 px-3 py-2 align-top text-violet-50/85">{children}</td>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
