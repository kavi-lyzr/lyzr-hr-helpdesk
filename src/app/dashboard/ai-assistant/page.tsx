'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useState } from "react";

const suggestedQuestions = [
  "What's the leave policy?",
  'How do I submit expenses?',
  'What are my benefits?',
  'How do I request time off?',
  'Where are company policies?',
  'IT support help',
  'Payroll questions',
  'Training resources'
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);
      setInput('');
      // Simulate bot response
      setIsLoading(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: 'This is a simulated response.' }]);
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-4xl space-y-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-4xl font-bold text-gray-900/80">HR Assistant</h1>
              <p className="text-xl text-gray-600/60">Your intelligent workplace assistant</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {suggestedQuestions.map((question) => (
                <Button key={question} variant="outline" onClick={() => setInput(question)}>
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-600" />}
                </div>
                <div className="max-w-2xl">
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'border border-gray-200 bg-white'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div className="max-w-2xl">
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <p className="text-sm text-gray-500">Thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t bg-white p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2"
              size="icon"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}