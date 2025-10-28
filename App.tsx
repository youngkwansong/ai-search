
import React, { useState, useEffect, useRef } from 'react';
import { Message, Role } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { generateResponse } from './services/geminiService';
import { HistoryIcon } from './components/Icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (prompt: string) => {
    if (isLoading) return;

    const userMessage: Message = { role: Role.USER, content: prompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const modelResponse = await generateResponse(newMessages);
      const aiMessage: Message = {
        role: Role.MODEL,
        content: modelResponse.content,
        references: modelResponse.references,
      };
      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: Role.MODEL,
        content: `Sorry, I encountered an error: ${(error as Error).message}`,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const examplePrompts = [
    "What are the latest AI trends in 2025?",
    "Explain quantum computing in simple terms.",
    "Give me a 3-day itinerary for a trip to Tokyo.",
  ];

  return (
    <div className="flex flex-col h-screen bg-[#11111B] text-white font-sans">
      <header className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#11111B]/80 backdrop-blur-sm z-10">
        <h1 className="text-xl font-bold">Conversation</h1>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
            <HistoryIcon className="w-5 h-5" />
            <span>Show History</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Gemini AI Assistant</h2>
                    <p>Start a conversation by typing below or choosing a prompt.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      {examplePrompts.map((prompt, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSendMessage(prompt)}
                            className="p-4 rounded-xl bg-black/30 border border-white/10 hover:bg-white/10 transition-all duration-300 text-left text-sm"
                           >
                            {prompt}
                          </button>
                      ))}
                  </div>
              </div>
          )}
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start my-2">
              <div className="max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl rounded-bl-none bg-black/30 backdrop-blur-lg border border-white/10">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 md:p-6 sticky bottom-0 bg-[#11111B]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;
