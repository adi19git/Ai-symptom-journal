"use client"

import { useState, useRef, useEffect } from "react"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Brain, Send, User } from "lucide-react"
import { saveAIMessage, getAIMessages } from "@/lib/storage"
import type { AIMessage, Symptom } from "@/lib/types"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import { analyzeSymptoms } from "@/lib/ai-service"

export default function AIChat({ symptoms }: { symptoms: Symptom[] }) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMessages(getAIMessages())
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (input.trim() === "") return

    const userMessage: AIMessage = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    saveAIMessage(userMessage)
    setInput("")
    setIsLoading(true)

    try {
      const aiResponse = await analyzeSymptoms(input, symptoms)

      const aiMessage: AIMessage = {
        id: uuidv4(),
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])
      saveAIMessage(aiMessage)
    } catch (error) {
      console.error("AI error:", error)

      const errorMessage: AIMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "⚠️ Sorry, I couldn't analyze that. Please try again later.",
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, errorMessage])
      saveAIMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm flex flex-col h-[600px]">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-t-lg pb-4">
        <div className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          <CardTitle>AI Health Assistant</CardTitle>
        </div>
        <CardDescription className="text-purple-100">
          Ask questions about your symptoms and get personalized insights
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow overflow-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 text-purple-400" />
              <p className="mb-2">No conversation history yet.</p>
              <p className="text-sm max-w-xs">
                Ask me questions about your symptoms, potential triggers, or patterns I've noticed in your data.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3",
                  message.role === "user" ? "bg-muted/50 self-end" : "bg-purple-50 self-start"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={message.role === "user" ? "bg-muted-foreground text-background" : "bg-purple-500 text-white"}
                  >
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="font-medium">
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-500 text-white">
                  <Bot className="h-4 w-4 animate-bounce" />
                </AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground italic">Analyzing symptoms...</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            ref={inputRef}
            placeholder="Ask about your symptoms..."
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || input.trim() === ""}
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          >
            {isLoading ? <span className="animate-pulse">...</span> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
