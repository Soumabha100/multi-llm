import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownRenderer = ({ content, isUser }) => {
  return (
    <div className={`markdown-body ${isUser ? 'text-white' : 'text-[var(--text-primary)]'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="rounded-xl overflow-hidden my-4 border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-gray-300 text-xs border-b border-gray-800">
                  <span className="font-mono uppercase tracking-wider">{match[1]}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))} 
                    className="hover:text-white focus:outline-none transition-colors"
                  >
                    Copy code
                  </button>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: '1rem', background: '#0d1117' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={`${className} bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-mono text-sm`} {...props}>
                {children}
              </code>
            );
          },
          p({node, ...props}) {
            return <p className="leading-relaxed mb-4 last:mb-0" {...props} />;
          },
          ul({node, ...props}) {
            return <ul className="list-disc list-outside ml-6 mb-4 space-y-2" {...props} />;
          },
          ol({node, ...props}) {
            return <ol className="list-decimal list-outside ml-6 mb-4 space-y-2" {...props} />;
          },
          li({node, ...props}) {
            return <li className="pl-1 leading-relaxed" {...props} />;
          },
          a({node, ...props}) {
            return <a className={`${isUser ? 'text-blue-200 hover:text-white' : 'text-blue-500 hover:text-blue-600'} underline underline-offset-4 transition-colors`} target="_blank" rel="noopener noreferrer" {...props} />;
          },
          h1({node, ...props}) { return <h1 className="text-2xl font-bold mt-8 mb-4 border-b border-[var(--border-color)] pb-2" {...props} />; },
          h2({node, ...props}) { return <h2 className="text-xl font-bold mt-6 mb-3" {...props} />; },
          h3({node, ...props}) { return <h3 className="text-lg font-bold mt-5 mb-2" {...props} />; },
          table({node, ...props}) {
            return (
              <div className="overflow-x-auto my-6 rounded-xl border border-[var(--border-color)] shadow-sm">
                <table className="min-w-full divide-y divide-[var(--border-color)] text-sm" {...props} />
              </div>
            );
          },
          thead({node, ...props}) { return <thead className="bg-[var(--bg-secondary)]" {...props} />; },
          th({node, ...props}) {
            return <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider" {...props} />;
          },
          td({node, ...props}) {
            return <td className="px-4 py-3 whitespace-nowrap border-t border-[var(--border-color)]" {...props} />;
          },
          blockquote({node, ...props}) {
            return <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 italic bg-[var(--bg-secondary)]/50 rounded-r-lg" {...props} />;
          },
          strong({node, ...props}) {
            return <strong className="font-semibold" {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
