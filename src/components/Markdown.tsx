import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold mb-3 uppercase tracking-wider border-b border-white/30 pb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-md font-bold mb-2 uppercase tracking-wide">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-2 uppercase">{children}</h3>,
        code: ({ children }) => (
          <code className="bg-white text-black border border-white px-1 py-0.5 font-mono text-[11px] font-bold">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-black p-4 overflow-x-auto mb-3 font-mono text-xs border-2 border-white retro-shadow-black">
            {children}
          </pre>
        ),
        strong: ({ children }) => <strong className="font-bold text-white uppercase">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

