"use client";

import { useState, useContext, useEffect, useCallback } from "react";
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

  // Load conversation from localStorage
  useEffect(() => {
    if (userData?.currentOrganization) {
      const storageKey = `chat_session_${userData.currentOrganization}`;
      const storedSession = localStorage.getItem(storageKey);
      
      if (storedSession) {
        try {
          const { sessionId: storedSessionId, messages: storedMessages } = JSON.parse(storedSession);
          setSessionId(storedSessionId);
          setMessages(storedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (error) {
          console.error('Error loading stored conversation:', error);
        }
      }
    }
  }, [userData?.currentOrganization]);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (userData?.currentOrganization && messages.length > 0) {
      const storageKey = `chat_session_${userData.currentOrganization}`;
      const sessionData = {
        sessionId,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(sessionData));
    }
  }, [messages, sessionId, userData?.currentOrganization]);

  // Fetch user data and get current organization from URL
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !isAuthenticated) return;

      try {
        // Get current organization from URL parameter (like header and sidebar do)
        const urlParams = new URLSearchParams(window.location.search);
        const orgId = urlParams.get('org');

        const response = await fetch(`/api/v1/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          
          let currentOrgId = '';
          let userName = data.user?.name || 'User';
          let userEmail = data.user?.email || '';

          // Use organization from URL parameter if available
          if (orgId && data.organizations) {
            const org = data.organizations.find((o: any) => o._id === orgId);
            if (org) {
              currentOrgId = orgId;
              console.log('Using current organization from URL:', org.name);
            } else {
              console.warn('Organization from URL not found in user organizations');
            }
          }
          
          // Fallback to first organization if no URL org or org not found
          if (!currentOrgId && data.organizations?.length > 0) {
            currentOrgId = data.organizations[0]._id;
            console.log('Falling back to first organization:', data.organizations[0].name);
          }

          if (!currentOrgId) {
            console.error('No organizations found for user');
            return;
          }

          setUserData({
            _id: userId,
            currentOrganization: currentOrgId,
            name: userName,
            email: userEmail,
          });
          
          console.log('AI Assistant initialized with organization:', currentOrgId);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId, isAuthenticated]);

  // Clear conversation function
  const clearConversation = useCallback(() => {
    if (userData?.currentOrganization) {
      const storageKey = `chat_session_${userData.currentOrganization}`;
      localStorage.removeItem(storageKey);
      setMessages([]);
      setSessionId(null);
      console.log('Conversation cleared for organization:', userData.currentOrganization);
    }
  }, [userData?.currentOrganization]);

  // Listen for organization changes in URL (when user switches in header)
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newOrgId = urlParams.get('org');
      
      if (newOrgId && userData && newOrgId !== userData.currentOrganization) {
        console.log('Organization changed via URL, updating AI assistant:', newOrgId);
        
        // Clear current conversation when switching organizations
        clearConversation();
        
        // Update userData with new organization
        setUserData({
          ...userData,
          currentOrganization: newOrgId
        });
      }
    };

    // Listen for URL changes (when user switches org in header)
    window.addEventListener('popstate', handleUrlChange);
    
    // Also listen for custom organization change events
    window.addEventListener('organizationChanged', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('organizationChanged', handleUrlChange);
    };
  }, [userData, clearConversation]);

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
      const requestBody = {
        message: content,
        organizationId: userData.currentOrganization,
        userId: userData._id,
        sessionId: sessionId,
      };
      
      console.log('Sending chat request:', requestBody);

      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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