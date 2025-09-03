"use client";

import { useState, useContext, useEffect } from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatEmptyState } from "@/components/chat-empty-state";
import { StarterQuestionsList } from "@/components/starter-questions";
import { GradientManager } from "@/components/gradient-manager";
import { useAuth } from "@/lib/AuthProvider";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface UserData {
  _id: string;
  currentOrganization: string;
  name: string;
  email: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { userId, isAuthenticated } = useAuth();

  // Fetch user data including current organization
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !isAuthenticated) return;

      try {
        const response = await fetch(`/api/v1/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          // For now, we'll set the user data structure needed
          // This should be enhanced to properly get current organization
          setUserData({
            _id: userId,
            currentOrganization: data.organizations?.[0]?._id || '', // Use first org for now
            name: data.user?.name || 'User',
            email: data.user?.email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId, isAuthenticated]);

  // Don't render until we have user data
  if (!userData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AI assistant...</p>
        </div>
      </div>
    );
  }

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    if (!userData?.currentOrganization) {
      console.error('No current organization selected');
      return;
    }

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
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          organizationId: userData.currentOrganization,
          userId: userData._id,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update session ID for conversation continuity
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "I'm sorry, I'm having trouble connecting to the AI assistant right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
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