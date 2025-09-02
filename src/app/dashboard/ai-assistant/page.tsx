"use client";

import { useState } from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatEmptyState } from "@/components/chat-empty-state";
import { StarterQuestionsList } from "@/components/starter-questions";
import { GradientManager } from "@/components/gradient-manager";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate AI response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm here to help with your HR questions! This is a simulated response. The actual AI integration will be implemented with the Lyzr API using the organization's API key.",
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <GradientManager hasMessages={messages.length > 0} />
      <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
        {messages.length === 0 ? (
          <ChatEmptyState>
            <ChatInput 
              onSend={handleSend} 
              isLoading={isLoading}
              placeholder="Ask a question about HR policies, benefits, or procedures..."
            />
            <StarterQuestionsList handleSend={handleSend} />
          </ChatEmptyState>
        ) : (
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 border border-border/30 backdrop-blur-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/60 border border-border/30 backdrop-blur-sm rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border/30 p-4 bg-background/50 backdrop-blur-sm">
              <ChatInput 
                onSend={handleSend} 
                isLoading={isLoading}
                placeholder="Ask a follow-up question..."
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}