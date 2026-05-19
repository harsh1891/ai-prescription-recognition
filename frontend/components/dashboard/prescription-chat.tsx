'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface PrescriptionChatProps {
  prescriptionId: number | null;
}

export default function PrescriptionChat({ prescriptionId }: PrescriptionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      text: 'Hello! I am your Prescription Copilot. Ask me anything about this prescription (e.g., "When should I take Opox-CV?", "Is it safe after food?").' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Reset chat context when switching prescriptions
  useEffect(() => {
    if (prescriptionId) {
      setMessages([
        { role: 'assistant', text: 'Switched to new prescription context. How can I assist you with this record?' }
      ]);
    }
  }, [prescriptionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !prescriptionId) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: prescriptionId,
          message: userMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to assistant backend router');

      // Append an initial blank assistant message to stream text into
      setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let streamBuffer = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split('\n');
          streamBuffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // Highly resilient regex extraction to capture the "text" property even if lines are bunched
            if (cleanLine.includes('data:')) {
              try {
                // Isolate the core JSON content payload boundary
                const jsonStartIdx = cleanLine.indexOf('{');
                if (jsonStartIdx !== -1) {
                  const targetJson = cleanLine.substring(jsonStartIdx);
                  const dataObj = JSON.parse(targetJson);
                  
                  if (dataObj && typeof dataObj.text === 'string') {
                    accumulatedText += dataObj.text;
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        updated[updated.length - 1] = { role: 'assistant', text: accumulatedText };
                      }
                      return updated;
                    });
                  }
                }
              } catch (err) {
                // Fallback direct key parsing if nested JSON parsing fails
                try {
                  const match = cleanLine.match(/"text"\s*:\s*"(.*?)"/);
                  if (match && match[1]) {
                    // Unescape typical text chunk escape slashes safely
                    const cleanChunk = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                    accumulatedText += cleanChunk;
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        updated[updated.length - 1] = { role: 'assistant', text: accumulatedText };
                      }
                      return updated;
                    });
                  }
                } catch (fallbackErr) {
                  console.error("Streaming parsing failure intercepted:", fallbackErr);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '⚠️ Failed to get a response. Please check your backend configuration.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] bg-white shadow-sm border border-slate-200">
      <CardHeader className="py-3 border-b flex flex-row items-center gap-2 space-y-0">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <CardTitle className="text-base font-semibold text-slate-800">Prescription Copilot AI</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Scrollable message viewport */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-xl p-3 max-w-[85%] text-sm whitespace-pre-line leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100'
              }`}>
                {msg.text || (loading && index === messages.length - 1 ? "Thinking..." : "")}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Action form bar */}
        <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={prescriptionId ? "Ask about food timings, schedules..." : "Select a prescription to chat..."}
            className="flex-1 text-sm transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={!prescriptionId || loading}
          />
          <Button 
            type="submit" 
            className="bg-blue-600 text-white hover:bg-blue-700 transition"
            disabled={loading || !input.trim() || !prescriptionId}
          >
            Ask
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}