'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { X, Send, ImageIcon, FileText, MessageSquare, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ResponseActionsOval } from './response-actions-oval'
import { AIOperationsService } from '@/app/api/chat/ai-operations'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface File {
  name: string
  content: string
}

interface RightPanelProps {
  isOpen: boolean
  onClose: () => void
  files: File[]
  onEditFile: (name: string, content: string) => void
  onCreateFile: (name: string, content: string) => void
  onDeleteFile: (name: string) => void
}

const CodeBlock = ({ language, children, fileName, description }) => {
  const { toast } = useToast()

  const handleAccept = async () => {
    const extension = {
      python: 'py',
      typescript: 'ts',
      javascript: 'js',
      // Add more mappings as needed
    }[language] || language

    const path = fileName || `script.${extension}`
    
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'create',
          path,
          content: String(children),
          metadata: {
            fileType: language,
            description: description || 'Code from chat',
            overwrite: true
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: `Created file: ${path}`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }

  const handleDeny = () => {
    toast({
      description: 'Code changes rejected',
    });
  }

  return (
    <div className="relative">
      <ResponseActionsOval 
        onAccept={handleAccept}
        onDeny={handleDeny}
      />
      <pre className={`language-${language}`}>
        <code>{children}</code>
      </pre>
    </div>
  )
}

export function RightPanel({ 
  isOpen, 
  onClose, 
  files, 
  onEditFile, 
  onCreateFile, 
  onDeleteFile 
}: RightPanelProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          files,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from AI')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage = data.message
      if (!assistantMessage) {
        throw new Error('Invalid response format')
      }

      setMessages(prev => [...prev, assistantMessage])

      // Handle file operations from AI responses
      const text = assistantMessage.content
      if (text.startsWith('CREATE_FILE:')) {
        const [_, filename, content] = text.split(':')
        onCreateFile(filename, content)
        toast({
          title: 'File Created',
          description: `Created ${filename}`,
        })
      } else if (text.startsWith('EDIT_FILE:')) {
        const [_, filename, content] = text.split(':')
        onEditFile(filename, content)
        toast({
          title: 'File Updated',
          description: `Updated ${filename}`,
        })
      } else if (text.startsWith('DELETE_FILE:')) {
        const [_, filename] = text.split(':')
        onDeleteFile(filename)
        toast({
          title: 'File Deleted',
          description: `Deleted ${filename}`,
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process request',
        variant: 'destructive',
      })
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!isOpen) return null

  return (
    <div className="w-80 border-l bg-background flex flex-col shadow-lg">
      <div className="flex flex-col border-b">
        <div className="flex items-center justify-between p-4">
          <div className="font-medium">AI Assistant</div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-2 pb-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button 
              variant={activeTab === 'chat' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="flex-1 rounded-md h-8"
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button 
              variant={activeTab === 'files' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="flex-1 rounded-md h-8"
              onClick={() => setActiveTab('files')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Files
            </Button>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 h-[calc(100%-8rem)]">
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "text-sm p-3 rounded-lg",
                  message.role === 'user' 
                    ? 'bg-muted ml-4' 
                    : 'bg-primary/5 mr-4'
                )}
              >
                <div className="font-medium mb-1">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm dark:prose-invert max-w-none"
                    components={{
                      code: ({node, inline, className, children, ...props}) => {
                        if (!inline) {
                          const language = (className || '').replace('language-', '')
                          const codeBlock = message.thoughtProcess?.response.codeBlocks?.find(
                            block => block.code === String(children)
                          )
                          
                          return (
                            <CodeBlock 
                              language={language}
                              fileName={codeBlock?.fileName}
                              description={codeBlock?.description}
                            >
                              {children}
                            </CodeBlock>
                          )
                        }
                        return <code className={className} {...props}>{children}</code>
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-sm bg-primary/5 p-3 rounded-lg mr-4">
                <div className="font-medium mb-1">AI Assistant</div>
                <div className="text-muted-foreground">Thinking...</div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'files' && (
          <div className="p-4 space-y-2">
            {files.map((file) => (
              <div 
                key={file.name}
                className="text-sm p-2 hover:bg-muted rounded-md cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{file.name}</span>
                </div>
                <div className="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setActiveTab('chat')
                      setInput(`Show me the contents of ${file.name}`)
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="sticky bottom-0 p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your code or request changes..."
            className="resize-none pr-12 rounded-lg"
            rows={3}
            disabled={isLoading}
          />
          <Button 
            type="submit"
            size="icon" 
            className="absolute right-2 bottom-2 rounded-full h-8 w-8"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

