'use client'

import { useState } from 'react'
import { Send, Mic, Globe, Paperclip } from 'lucide-react'

interface InputBarProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function InputBar({ onSend, isLoading }: InputBarProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <div className="border-t border-gray-200 p-6">
      {/* Input Field */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full px-6 py-4 pr-32 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (input.trim() && !isLoading) {
                  onSend(input.trim())
                  setInput('')
                }
              }
            }}
          />
          
          {/* Input Icons */}
          <div className="absolute right-4 top-4 flex items-start gap-3">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Web search"
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}


