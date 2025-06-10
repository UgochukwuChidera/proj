
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { askQuestion, type AskQuestionInput, type AskQuestionOutput } from '@/ai/flows/chatbot-assistant';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export function ChatbotClientPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiInput: AskQuestionInput = { question: input };
      const response: AskQuestionOutput = await askQuestion(aiInput);
      const botMessage: Message = { id: (Date.now() + 1).toString(), text: response.answer, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  useEffect(() => {
    // Initial greeting from bot
    setMessages([{
      id: 'initial-greeting',
      text: "Hello! I'm the Landmark University Resource Hub assistant. How can I help you navigate the application's features today?",
      sender: 'bot'
    }]);
  }, []);


  return (
    <div className="container mx-auto py-8 flex justify-center">
      <Card className="w-full max-w-2xl h-[calc(100vh-10rem)] flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <Bot className="mr-2 h-7 w-7" /> Chatbot Assistant
          </CardTitle>
          <CardDescription>Ask me questions about how to use this application.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-3',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback><Bot size={18}/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[70%] p-3 text-sm',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-l-lg rounded-br-lg'
                        : 'bg-muted text-muted-foreground rounded-r-lg rounded-bl-lg'
                    )}
                    style={{borderRadius: '0.25rem'}} // Override for boxy
                  >
                    {message.text}
                  </div>
                  {message.sender === 'user' && (
                     <Avatar className="h-8 w-8 shrink-0">
                       <AvatarFallback><User size={18}/></AvatarFallback>
                     </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback><Bot size={18}/></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted text-muted-foreground p-3 rounded-r-lg rounded-bl-lg text-sm" style={{borderRadius: '0.25rem'}}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex w-full items-center space-x-2"
          >
            <Input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || input.trim() === ''} className="font-body">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
