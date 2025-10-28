
import React, { useState, useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import { SparklesIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from './Icons';

// Make marked and hljs available in the window scope
declare global {
  interface Window {
    marked: any;
    hljs: any;
  }
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.role === Role.USER) {
    return <UserMessage content={message.content} />;
  }
  return <ModelMessage content={message.content} references={message.references} />;
};

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex justify-end my-2">
    <div className="max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl rounded-br-none bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
      <p className="font-semibold text-white/90">You</p>
      <p className="text-white">{content}</p>
    </div>
  </div>
);

const ModelMessage: React.FC<{ content: string; references?: Message['references'] }> = ({ content, references }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showAllRefs, setShowAllRefs] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && window.marked && window.hljs) {
      const parsedHtml = window.marked.parse(content);
      contentRef.current.innerHTML = parsedHtml;
      contentRef.current.querySelectorAll('pre code').forEach((block) => {
        window.hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const visibleRefs = showAllRefs ? references : references?.slice(0, 3);

  return (
    <div className="flex justify-start my-2">
      <div className="max-w-xl lg:max-w-3xl w-full p-5 rounded-2xl rounded-bl-none bg-black/30 backdrop-blur-lg border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-gray-200">AI Assistant</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-200"
            title="Copy to clipboard"
          >
            {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
          </button>
        </div>
        <div ref={contentRef} className="prose-custom max-w-none text-gray-300 space-y-4" />
        {references && references.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <ExternalLinkIcon className="w-4 h-4" />
              References
            </h4>
            <div className="space-y-2">
              {visibleRefs?.map((ref, index) => (
                <a
                  key={index}
                  href={ref.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 text-sm"
                >
                  <p className="text-indigo-400 truncate font-medium">{ref.title}</p>
                  <p className="text-gray-500 truncate text-xs">{ref.uri}</p>
                </a>
              ))}
            </div>
            {references.length > 3 && (
              <button
                onClick={() => setShowAllRefs(!showAllRefs)}
                className="text-indigo-400 text-sm mt-3 hover:underline"
              >
                {showAllRefs ? 'Show less' : `Show ${references.length - 3} more`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
