import React, { useState, useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { generateKoiiaaiResponse } from '../services/koiiaaiService';
import { HistoryIcon } from './Icons';
import { Conversation, HistoryItem } from '../types'; // Import Conversation and HistoryItem

const STORAGE_KEY = 'koiiaai_chat_history';

const KoiiaaiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<HistoryItem[]>([]); // State for storing multiple conversations
  const [showHistory, setShowHistory] = useState<boolean>(false); // State to control history panel visibility
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history from localStorage on component mount
  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID());
    }
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        setChatHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load chat history from localStorage:", error);
    }
    scrollToBottom();
  }, [sessionId]);

  // Save current conversation to history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Determine if it's a new conversation or an existing one being updated
      const currentHistoryItem: HistoryItem = {
        id: sessionId,
        title: messages[0].content.substring(0, 50) + '...', // Use first user message as title
        conversation: messages,
      };

      setChatHistory(prevHistory => {
        const existingIndex = prevHistory.findIndex(item => item.id === sessionId);
        if (existingIndex > -1) {
          const updatedHistory = [...prevHistory];
          updatedHistory[existingIndex] = currentHistoryItem;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
          return updatedHistory;
        } else {
          const newHistory = [...prevHistory, currentHistoryItem];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
          return newHistory;
        }
      });
    }
  }, [messages, sessionId]);

  // Scroll to bottom when messages or loading state changes
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
      const stream = generateKoiiaaiResponse(newMessages, sessionId); 
      let streamedContent = '';
      const aiMessagePlaceholder: Message = { role: Role.MODEL, content: streamedContent };
      setMessages([...newMessages, aiMessagePlaceholder]);

      for await (const chunk of stream) {
        streamedContent += chunk.content;
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1] = { ...aiMessagePlaceholder, content: streamedContent };
          return updatedMessages;
        });
      }
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
    "당신은 누구이고 역할은?",
    "당신은 출력하는 예시 보여주세요",
    "제공기관이 광개토연구소인 데이터 찾아줘",
  ];

  const handleLoadHistoryItem = (historyItem: HistoryItem) => {
    setMessages(historyItem.conversation);
    setSessionId(historyItem.id);
    setShowHistory(false); // Hide history panel after loading
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(crypto.randomUUID()); // Generate new session ID for a new chat
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#11111B] text-white font-sans">
      <header className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#11111B]/80 backdrop-blur-sm z-10">
        <h1 className="text-xl font-bold">koiia ai 검색</h1>
        <button 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            onClick={() => setShowHistory(!showHistory)} // Toggle history panel
        >
            <HistoryIcon className="w-5 h-5" />
            <span>Show History</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {showHistory ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Chat History</h2>
            <button 
                className="mb-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleNewChat}
            >
                New Chat
            </button>
            {chatHistory.length === 0 ? (
              <p>No chat history yet.</p>
            ) : (
              <ul className="space-y-2">
                {chatHistory.map(item => (
                  <li 
                    key={item.id}
                    className="p-3 rounded-lg bg-black/30 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => handleLoadHistoryItem(item)}
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">koiia AI Assistant</h2>
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
        )}
      </main>

      <footer className="p-4 md:p-6 sticky bottom-0 bg-[#11111B]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default KoiiaaiChat;
