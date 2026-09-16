import React from "react";
import type { Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-4 text-3xl font-bold text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 mb-3 text-2xl font-semibold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 mb-2 text-xl font-heading">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-7 text-foreground">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-6 text-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r border-l-4 border-border bg-background py-2 pl-4 text-foreground/70 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-border" />,
  code: ({ children, className }) => {
    const language = className?.replace(/^language-/, "").toUpperCase();
    if (language) {
      return <code className={`${className} bg-transparent p-0 text-[13px] text-foreground`}>{children}</code>;
    }

    return (
      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-background px-4 py-3 font-mono text-[13px] leading-6 text-foreground whitespace-pre-wrap">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border border-border text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
  th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-heading underline decoration-2 underline-offset-2 hover:bg-main">
      {children}
    </a>
  ),
};
