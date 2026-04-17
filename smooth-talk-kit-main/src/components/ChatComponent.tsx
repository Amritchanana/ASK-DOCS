import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as React from 'react';
import { Send, Bot, User, FileText } from 'lucide-react';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}

interface IMessage {
  role: 'assistant' | 'user';
  content: string;
  documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/chat?message=${encodeURIComponent(userMessage)}`);
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.message,
          documents: data?.documents,
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          PDF Assistant
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ask questions about your uploaded documents
        </p>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Upload a PDF document and start asking questions about its content
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[70%] ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <Card
                    className={`p-4 ${
                      msg.role === 'user'
                        ? 'bg-chat-user-bg text-chat-user-fg border-none'
                        : 'bg-chat-assistant-bg text-chat-assistant-fg border-chat-border'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </Card>

                  {msg.documents && msg.documents.length > 0 && (
                    <div className="space-y-2 w-full">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Referenced documents:
                      </p>
                      {msg.documents.map((doc, docIndex) => (
                        <Card
                          key={docIndex}
                          className="p-3 bg-muted/50 border-chat-border"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            {doc.metadata?.loc?.pageNumber && (
                              <Badge variant="outline" className="text-xs">
                                Page {doc.metadata.loc.pageNumber}
                              </Badge>
                            )}
                            {doc.metadata?.source && (
                              <Badge variant="secondary" className="text-xs">
                                {doc.metadata.source.split('/').pop()}
                              </Badge>
                            )}
                          </div>
                          {doc.pageContent && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {doc.pageContent.substring(0, 200)}
                              {doc.pageContent.length > 200 && '...'}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                </div>
                <Card className="p-4 bg-chat-assistant-bg border-chat-border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="border-t bg-card p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your document..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendChatMessage}
            disabled={!message.trim() || isLoading}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;