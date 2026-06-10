'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const codeStyle = {
  margin: 0,
  borderRadius: '0.85rem',
  padding: '1rem',
  fontSize: '0.85rem',
  background: '#faf9f5'
} as const;

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative my-3" dir="ltr">
      <button
        type="button"
        onClick={copy}
        className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-line bg-surface/80 px-2 py-1 text-xs text-subtle backdrop-blur hover:text-ink"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'نُسخ' : 'نسخ'}
      </button>
      <SyntaxHighlighter language={language} style={oneLight} PreTag="div" customStyle={codeStyle}>
        {value.replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (match) return <CodeBlock language={match[1]} value={String(children)} />;
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-rkn">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
