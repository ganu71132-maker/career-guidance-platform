import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext({});

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextData, setContextData] = useState(null); // { type: 'code'|'resume', data: any }
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi! I'm your AI assistant. How can I help you today?" }
  ]);

  const toggleChat = () => setIsOpen(prev => !prev);
  
  const openChatWithContext = (context) => {
    setContextData(context);
    setIsOpen(true);
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([{ role: 'model', content: "Hi! I'm your AI assistant. How can I help you today?" }]);
  };

  return (
    <ChatContext.Provider value={{
      isOpen,
      setIsOpen,
      toggleChat,
      contextData,
      setContextData,
      openChatWithContext,
      messages,
      addMessage,
      clearMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
}
