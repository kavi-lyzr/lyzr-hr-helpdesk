"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatEmptyState } from "@/components/chat-empty-state";
import { StarterQuestionsList } from "@/components/starter-questions";
import { GradientManager } from "@/components/gradient-manager";
import { useAuth } from "@/lib/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, Bot, History, RefreshCw, Plus } from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isStreaming?: boolean;
}

interface UserData {
  _id: string;
  currentOrganization: string;
  name: string;
  email: string;
}

interface ConversationSummary {
  _id: string;
  title: string;
  lastMessageAt: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const { userId, isAuthenticated } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user data and current org from URL
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !isAuthenticated) return;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const orgId = urlParams.get("org");

        const response = await fetch(
          `/api/v1/user/organizations?userId=${userId}`
        );
        if (!response.ok) return;

        const data = await response.json();

        let currentOrgId = "";
        const userName =
          data.user?.name ||
          (data.user?.email ? data.user.email.split("@")[0] : "User");
        const userEmail = data.user?.email || "";

        if (orgId && data.organizations) {
          const org = data.organizations.find((o: any) => o._id === orgId);
          if (org) currentOrgId = orgId;
        }

        if (!currentOrgId && data.organizations?.length > 0) {
          currentOrgId = data.organizations[0]._id;
        }

        if (!currentOrgId) return;

        setUserData({
          _id: userId,
          currentOrganization: currentOrgId,
          name: userName,
          email: userEmail,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId, isAuthenticated]);

  // Load conversations from DB when org changes
  const loadConversations = useCallback(async () => {
    if (!userData?.currentOrganization || !userData._id) return;

    try {
      const response = await fetch(
        `/api/v1/conversations?organizationId=${userData.currentOrganization}&userId=${userData._id}`
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, [userData?.currentOrganization, userData?._id]);

  useEffect(() => {
    if (userData?.currentOrganization) {
      loadConversations();
    }
  }, [userData?.currentOrganization, loadConversations]);

  // Listen for organization changes via URL
  useEffect(() => {
    const handleOrgChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newOrgId = urlParams.get("org");

      if (newOrgId && userData && newOrgId !== userData.currentOrganization) {
        // Abort any ongoing stream
        abortControllerRef.current?.abort();

        // Clear current conversation state
        setMessages([]);
        setConversationId(null);
        setConversations([]);
        setIsLoading(false);

        // Update org — the useEffect on userData.currentOrganization will reload conversations
        setUserData((prev) =>
          prev ? { ...prev, currentOrganization: newOrgId } : prev
        );
      }
    };

    window.addEventListener("popstate", handleOrgChange);
    window.addEventListener("organizationChanged", handleOrgChange);

    // Polling fallback for router.push (doesn't trigger popstate)
    const interval = setInterval(handleOrgChange, 1000);

    return () => {
      window.removeEventListener("popstate", handleOrgChange);
      window.removeEventListener("organizationChanged", handleOrgChange);
      clearInterval(interval);
    };
  }, [userData]);

  // Create new conversation
  const createNewConversation = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setIsLoading(false);
  }, []);

  // Load conversation from history
  const loadConversation = useCallback(
    async (conv: ConversationSummary) => {
      abortControllerRef.current?.abort();
      setIsLoading(false);

      try {
        const response = await fetch(
          `/api/v1/conversations/${conv._id}/messages`
        );
        if (!response.ok) return;

        const data = await response.json();
        setConversationId(conv._id);
        setMessages(
          (data.messages || []).map((msg: any) => ({
            id: msg._id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } catch (error) {
        console.error("Error loading conversation:", error);
      }
    },
    []
  );

  // Send message with SSE streaming
  const handleSend = async (content: string) => {
    if (!content.trim() || !userData?.currentOrganization || isLoading) return;

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    // Add placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          organizationId: userData.currentOrganization,
          userId: userData._id,
          conversationId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Extract conversation ID from headers
      const newConversationId = response.headers.get("X-Conversation-Id");
      const isNew = response.headers.get("X-Is-New") === "true";

      if (newConversationId) {
        setConversationId(newConversationId);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";
      let sseBuffer = ""; // Buffer for partial SSE lines across chunks
      let receivedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;

        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || ""; // Keep incomplete last line in buffer

        for (const line of lines) {
          // Use trimStart to preserve trailing spaces in token content
          const stripped = line.trimStart();
          if (!stripped || !stripped.startsWith("data: ")) continue;

          const token = stripped.slice(6);

          if (token === "[DONE]") {
            receivedDone = true;
            break;
          }
          if (token === "[ERROR]") {
            throw new Error("Stream error from server");
          }

          // Don't skip empty-ish tokens — spaces are meaningful for markdown
          if (token === undefined) continue;

          // Unescape the token
          const unescaped = token
            .replace(/\\n/g, "\n")
            .replace(/\\\\/g, "\\");

          accumulated += unescaped;

          // Update the assistant message in real-time
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulated }
                : msg
            )
          );
        }

        if (receivedDone) break;
      }

      // Finalize: mark as not streaming
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      // Refresh conversation list if this was a new conversation
      if (isNew) {
        loadConversations();
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        // User navigated away or started new conversation — mark as done
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      } else {
        console.error("Error sending message:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "I'm sorry, I'm having trouble connecting to the AI assistant right now. Please try again later.",
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

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

  return (
    <>
      <GradientManager hasMessages={messages.length > 0} />
      <div className="flex flex-col h-full relative items-center justify-center">
        {/* Fixed conversation controls at top */}
        <div className="fixed top-20 right-4 z-30 flex items-center gap-2">
          {/* History dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 max-h-64 overflow-y-auto"
            >
              {conversations.length > 0 ? (
                <>
                  {conversations.map((conv) => (
                    <DropdownMenuItem
                      key={conv._id}
                      onClick={() => loadConversation(conv)}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    >
                      <div className="font-medium text-sm truncate w-full">
                        {conv.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={createNewConversation}
                    className="gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    New Conversation
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  disabled
                  className="text-center text-muted-foreground"
                >
                  No conversations yet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New conversation button */}
          <Button
            variant="outline"
            size="sm"
            onClick={createNewConversation}
            className="gap-2 bg-background/90 backdrop-blur-sm shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            New
          </Button>
        </div>

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
          <div className="w-full relative pt-10">
            {/* Messages Area */}
            <div className="w-full">
              <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-32">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 border border-border/30 backdrop-blur-sm"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        message.content ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert
                                         prose-headings:font-bold prose-headings:text-foreground
                                         prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
                                         prose-headings:mt-4 prose-headings:mb-2
                                         prose-p:text-foreground prose-p:my-2 prose-p:leading-relaxed
                                         prose-strong:text-foreground prose-strong:font-semibold
                                         prose-code:text-foreground prose-code:bg-background/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                                         prose-pre:bg-background/80 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-3
                                         prose-ul:my-2 prose-ol:my-2 prose-li:my-1
                                         prose-blockquote:border-l-primary prose-blockquote:bg-background/50 prose-blockquote:my-3
                                         [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <Streamdown parseIncompleteMarkdown={true}>
                              {message.content.replace(/\\\\/g, "\\")}
                            </Streamdown>
                          </div>
                        ) : message.isStreaming ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              AI is thinking...
                            </span>
                          </div>
                        ) : null
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap userchatcontent">
                          {message.content}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "opacity-60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp instanceof Date
                          ? message.timestamp.toLocaleTimeString()
                          : new Date(
                              message.timestamp
                            ).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed Input Area at Bottom */}
            <div className="fixed bottom-0 z-20 flex justify-center lg:left-64 left-16 right-0 bg-gradient-to-b from-transparent to-background backdrop-blur-sm">
              <div className="w-full max-w-4xl px-4">
                <ChatInput
                  onSend={handleSend}
                  isLoading={isLoading}
                  placeholder="Ask a follow-up question..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
