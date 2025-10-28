'use client'

import { Message } from '@/types/message'
import { Bot } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="space-y-2 text-sm text-gray-500">
        <p className="font-medium">Try asking:</p>
        <p>"Create a presentation about AI"</p>
        <p>"Make slides for a marketing strategy"</p>
        <p>"Design a company overview deck"</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-6 ${message.role === 'user' ? 'text-right' : ''}`}
        >
          {message.role === 'user' ? (
            <div className="max-w-2xl ml-auto">
              <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-md inline-block">
                <p className="leading-relaxed whitespace-pre-wrap text-sm">
                  {message.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-md">
                  <p className="leading-relaxed whitespace-pre-wrap text-gray-900 text-sm">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


