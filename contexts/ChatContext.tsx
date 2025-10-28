'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { SlideContent } from '@/types/slide'
import { saveMessages, saveSlides, getMessages, getSlides, updateSession, createSession } from '@/lib/supabase'
import { supabase, getUserIdentifier } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface GenerationProgress {
  current: number
  total: number
  status: string
}

interface ChatContextType {
  messages: Message[]
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  currentSlides: SlideContent[]
  generatePPT: (slides: SlideContent[], onProgress?: (progress: GenerationProgress) => void) => Promise<Blob>
  downloadPPT: () => void
  exportToPDF: () => void
  exportToPowerPointOnline: () => void
  clearHistory: () => void
  sessionId: string | null
  rawJsonResponse: string | null
  updateSlidesFromJson: (jsonString: string) => boolean
  onCreateSession: (sessionId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children, sessionId, onCreateSession }: { children: React.ReactNode; sessionId?: string | null; onCreateSession: (sessionId: string) => void }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSlides, setCurrentSlides] = useState<SlideContent[]>([])
  const [rawJsonResponse, setRawJsonResponse] = useState<string | null>(null)
  const isInitialLoadRef = useRef(true)
  const pptRef = useRef<Blob | null>(null)
  const titleUpdatedForSessionRef = useRef<string | null>(null)

  // Load conversation from Supabase or localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('ChatContext: Loading data for sessionId:', sessionId)
      // Mark that we're doing an initial load
      isInitialLoadRef.current = true
      
      // Clear state first when switching sessions
      setMessages([])
      setCurrentSlides([])
      setRawJsonResponse(null)
      setIsLoading(false) // Ensure loading state is cleared
      titleUpdatedForSessionRef.current = null // Reset title update tracking
      
      if (sessionId && supabase) {
        try {
          // Try to load from Supabase first
          const [supabaseMessages, supabaseSlides] = await Promise.all([
            getMessages(sessionId),
            getSlides(sessionId)
          ])
          
          if (supabaseMessages && supabaseMessages.length > 0) {
            const messagesWithDates = supabaseMessages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at)
            }))
            setMessages(messagesWithDates)
          }
          
          if (supabaseSlides && supabaseSlides.length > 0) {
            const slidesData = supabaseSlides.map((slide: any) => ({
              title: slide.title,
              content: Array.isArray(slide.content) ? slide.content : []
            }))
            console.log(`Loaded ${slidesData.length} slides for session ${sessionId}`)
            console.log('Loaded slides data:', slidesData.map(s => ({ title: s.title, points: s.content.length })))
            setCurrentSlides(slidesData)
            // Also set the raw JSON response
            setRawJsonResponse(JSON.stringify({ slides: slidesData }, null, 2))
          } else {
            console.log(`No slides found for session ${sessionId}`)
            setCurrentSlides([])
            setRawJsonResponse(null)
          }
          
          return
        } catch (error) {
          console.error('Error loading from Supabase:', error)
        }
      }
      
      // Mark initial load as complete
      isInitialLoadRef.current = false
    }
    
    loadData()
  }, [sessionId])

  // Save conversation to localStorage only if no sessionId (non-Supabase mode)
  useEffect(() => {
    if (!sessionId) {
      try {
        if (messages.length > 0) {
          localStorage.setItem('ppt-ai-messages', JSON.stringify(messages))
        } else {
          // Clear localStorage when no messages
          localStorage.removeItem('ppt-ai-messages')
        }
      } catch (error) {
        console.error('Failed to save messages to localStorage:', error)
      }
    }
  }, [messages, sessionId])

  useEffect(() => {
    if (!sessionId) {
      try {
        if (currentSlides.length > 0) {
          localStorage.setItem('ppt-ai-slides', JSON.stringify(currentSlides))
        } else {
          // Clear localStorage when no slides
          localStorage.removeItem('ppt-ai-slides')
        }
      } catch (error) {
        console.error('Failed to save slides to localStorage:', error)
      }
    }
  }, [currentSlides, sessionId])

  const sendMessage = useCallback(async (content: string) => {
    console.log('sendMessage called with:', content)
    console.trace('sendMessage call stack:')
    
    // If no session exists, create one automatically
    let effectiveSessionId = sessionId
    if (!effectiveSessionId && supabase) {
      console.log('No session exists, creating new session...')
      try {
        const identifier = user?.id || await getUserIdentifier()
        const newSession = await createSession(identifier, 'New Chat')
        if (newSession) {
          effectiveSessionId = newSession.id
          console.log('Created new session:', effectiveSessionId)
          if (effectiveSessionId) {
            onCreateSession(effectiveSessionId)
          }
          // Allow React to update the sessionId before continuing
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error('Error creating session:', error)
      }
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages((prev: Message[]) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local')
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      // Using gemini-2.5-pro-preview-05-06 for high-quality generation
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

      // Build context from recent messages
      const recentMessages = messages.slice(-5)
      let conversationHistory = ''
      if (recentMessages.length > 0) {
        conversationHistory = recentMessages.map((m: Message) => 
          `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
        ).join('\n')
      }

      const hasExistingSlides = currentSlides.length > 0
      const slidesContext = hasExistingSlides 
        ? JSON.stringify(currentSlides, null, 2) 
        : 'No previous slides'

      // Determine the user's intent
      const isAddingSlides = hasExistingSlides && (
        content.toLowerCase().includes('add') ||
        content.toLowerCase().includes('insert') ||
        content.toLowerCase().includes('create another') ||
        content.toLowerCase().includes('add another') ||
        content.toLowerCase().includes('add more')
      )
      
      const isModifyingSlides = hasExistingSlides && (
        content.toLowerCase().includes('modify') ||
        content.toLowerCase().includes('update') ||
        content.toLowerCase().includes('change') ||
        content.toLowerCase().includes('edit') ||
        content.toLowerCase().includes('revise')
      )

      const fullPrompt = `You are an expert presentation content creator. Your task is to generate or edit presentation slides based on user requests.

User's current request: "${content}"

Conversation history:
${conversationHistory}

Current slides (if any):
${slidesContext}

Based on the user's request, you need to:
${hasExistingSlides ? 
  isAddingSlides ? 
    `1. ADD NEW slides based on the user's request - DO NOT include existing slides
2. Return ONLY the new slides that should be added to the presentation
3. The new slides should complement the existing content
4. Create 1-3 relevant slides based on the user's request
5. Each slide must have unique and different content` :
  isModifyingSlides ?
    `1. MODIFY the existing slides based on the user's request
2. Return ALL ${currentSlides.length} slides - update the ones that need changes, keep others as-is
3. Update only the slides that need changes based on the request
4. If the request doesn't specify which slide to modify, update the most relevant one(s)
5. Maintain the same slide order and structure` :
    `1. REPLACE or completely regenerate ALL slides based on the user's request
2. Return a complete new set of slides
3. Do not copy existing slides unless the user specifically requests it` :
  `1. Create NEW slides for a new presentation
2. This is the first request in the conversation
3. Create 5-10 slides on the requested topic`}

IMPORTANT: Each slide MUST have unique and different content. Do NOT duplicate the same content across multiple slides.

Return ONLY a valid JSON object in this exact structure (no markdown, no code blocks):
{
  "slides": [
    {
      "title": "Slide Title",
      "content": [
        "Point 1",
        "Point 2",
        "Point 3"
      ]
    }
  ]
}

CRITICAL: Return ONLY the JSON object. Do NOT include any text, markdown, or explanations before or after the JSON.`

      // Retry logic for handling overloaded API errors
      const MAX_RETRIES = 3
      let attempts = 0
      let result, response, text
      
      while (attempts < MAX_RETRIES) {
        try {
          result = await model.generateContent(fullPrompt)
          response = result.response
          text = response.text()
          break // Success, exit retry loop
        } catch (apiError: any) {
          attempts++
          
          // Check if it's a 503 error (overloaded) and we have retries left
          if (attempts < MAX_RETRIES && apiError?.message?.includes('503')) {
            console.log(`API overloaded, retrying (${attempts}/${MAX_RETRIES})...`)
            // Exponential backoff: wait 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
            continue
          } else {
            // Not a retryable error or out of retries
            throw apiError
          }
        }
      }
      
      if (!text) {
        throw new Error('Failed to get response from AI after multiple attempts')
      }

      // Parse the JSON response
      let slides: SlideContent[]
      try {
        // Remove any markdown code blocks or extra text if present
        let cleanedText = text.trim()
        
        // Remove markdown code blocks
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        
        // Extract JSON if it's wrapped in other text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanedText = jsonMatch[0]
        }
        
        const data = JSON.parse(cleanedText)
        slides = data.slides || []
        
        // Store the raw JSON response for editing
        setRawJsonResponse(JSON.stringify({ slides }, null, 2))
        
        // Debug: Log parsed slides
        console.log('Parsed slides:', slides)
        console.log('Number of slides:', slides.length)
        
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        console.error('Response was:', text)
        throw new Error('Failed to parse AI response. Please try again.')
      }

      if (slides.length === 0) {
        throw new Error('No slides were generated. Please try rephrasing your request.')
      }

      // Handle different update modes based on user intent
      let updatedSlides: SlideContent[] = slides
      let messageContent = ''
      
      if (isAddingSlides && hasExistingSlides) {
        // Add mode: keep existing slides and append new ones
        updatedSlides = [...currentSlides, ...slides]
        messageContent = `Added ${slides.length} new slide${slides.length > 1 ? 's' : ''} to your presentation (now ${updatedSlides.length} total)!`
      } else if (isModifyingSlides && hasExistingSlides) {
        // Modify mode: use AI's response which should include modified slides
        updatedSlides = slides
        messageContent = `Updated your presentation with ${slides.length} slide${slides.length > 1 ? 's' : ''}!`
      } else {
        // Replace mode: use AI's response completely
        updatedSlides = slides
        messageContent = `Generated ${slides.length} slide${slides.length > 1 ? 's' : ''} for your presentation!`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date()
      }

      setMessages((prev: Message[]) => [...prev, assistantMessage])
      setCurrentSlides(updatedSlides)
    } catch (error) {
      console.error('Error:', error)
      
      // Handle different types of errors
      let errorContent = 'An unexpected error occurred'
      
      if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('overloaded')) {
          errorContent = 'The AI service is currently overloaded. Please try again in a moment.'
        } else if (error.message.includes('API key')) {
          errorContent = 'API key not configured. Please check your environment variables.'
        } else if (error.message.includes('parse')) {
          errorContent = 'Failed to parse AI response. Please try rephrasing your request.'
        } else {
          errorContent = error.message
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages((prev: Message[]) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [messages, currentSlides, sessionId, user, onCreateSession])

  const generatePPT = useCallback(async (
    slides: SlideContent[], 
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<Blob> => {
    try {
      const { default: PptxGenJS } = await import('pptxgenjs')
      const pptx = new PptxGenJS()

      // Set presentation properties
      pptx.author = 'Evolve AI'
      pptx.company = 'Evolve AI Generator'
      pptx.title = 'AI Generated Presentation'

      const totalSlides = slides.length

      // Add slides with progress updates
      for (let index = 0; index < slides.length; index++) {
        const slide = slides[index]
        const currentSlide = pptx.addSlide()
        
        // Update progress
        onProgress?.({
          current: index + 1,
          total: totalSlides,
          status: `Creating slide ${index + 1} of ${totalSlides}...`
        })

        // Add a small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // Add title
        if (slide.title) {
          currentSlide.addText(slide.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
            color: '363636'
          })
        }

        // Add content as bullet points
        if (slide.content && slide.content.length > 0) {
          const maxItems = 7
          const itemsToShow = slide.content.slice(0, maxItems)
          
          itemsToShow.forEach((item, itemIndex) => {
            const yPosition = 1.5 + (itemIndex * 0.65)
            currentSlide.addText(item, {
              x: 0.5,
              y: yPosition,
              w: 9,
              h: 0.5,
              fontSize: 16,
              color: '5F5F5F',
              bullet: true
            })
          })

          if (slide.content.length > maxItems) {
            const remainingItems = slide.content.length - maxItems
            currentSlide.addText(
              `... and ${remainingItems} more point${remainingItems > 1 ? 's' : ''}`,
              {
                x: 0.5,
                y: 1.5 + (maxItems * 0.65),
                w: 9,
                h: 0.4,
                fontSize: 14,
                color: '999999',
                italic: true
              }
            )
          }
        }
      }

      // Final progress update
      onProgress?.({
        current: totalSlides,
        total: totalSlides,
        status: 'Finalizing presentation...'
      })

      // Generate the presentation as a blob
      const result = await pptx.write({ outputType: 'blob' })
      const blob = result as Blob
      pptRef.current = blob
      
      return blob
    } catch (error) {
      console.error('Error generating PPT:', error)
      throw new Error('Failed to generate PowerPoint presentation')
    }
  }, [])

  const downloadPPT = useCallback(() => {
    if (!pptRef.current) {
      alert('No presentation to download. Generate one first!')
      return
    }

    const url = URL.createObjectURL(pptRef.current)
    const a = document.createElement('a')
    a.href = url
    a.download = 'presentation.pptx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const exportToPDF = useCallback(() => {
    if (!pptRef.current) {
      alert('No presentation to export. Generate one first!')
      return
    }

    // Note: Direct PDF conversion from PPTX requires server-side processing
    // For now, we'll open the PPTX in the browser for user to print as PDF
    const url = URL.createObjectURL(pptRef.current)
    
    // Create a modal with instructions
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `
    
    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 500px; margin: 20px;">
        <h2 style="margin-top: 0;">PDF Export</h2>
        <p>To convert your presentation to PDF:</p>
        <ol style="text-align: left;">
          <li>Download the PPTX file</li>
          <li>Open it in Microsoft PowerPoint, Google Slides, or LibreOffice</li>
          <li>Use File → Export → Save as PDF</li>
        </ol>
        <p style="margin-top: 1rem;">Alternatively, use online converters like:</p>
        <ul style="text-align: left;">
          <li><a href="https://www.ilovepdf.com/ppt-to-pdf" target="_blank">iLovePDF</a></li>
          <li><a href="https://smallpdf.com/ppt-to-pdf" target="_blank">SmallPDF</a></li>
        </ul>
        <button onclick="this.closest('div').parentElement.remove(); URL.revokeObjectURL('${url}')" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Got it
        </button>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Cleanup on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
        URL.revokeObjectURL(url)
      }
    })
  }, [])

  const exportToPowerPointOnline = useCallback(async () => {
    if (!pptRef.current) {
      alert('No presentation to export. Generate one first!')
      return
    }

    try {
      // Create a modal with instructions for online viewing
      const modal = document.createElement('div')
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `
      
      modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 500px; margin: 20px;">
          <h2 style="margin-top: 0;">Open in PowerPoint Online</h2>
          <p>To view your presentation online:</p>
          <ol style="text-align: left;">
            <li>Click "Download PPTX" to save the file</li>
            <li>Go to <a href="https://office.live.com/start/PowerPoint.aspx" target="_blank">PowerPoint Online</a></li>
            <li>Upload your file to view and edit it</li>
          </ol>
          <p style="margin-top: 1rem;">Or use Google Slides:</p>
          <ul style="text-align: left;">
            <li>Upload the PPTX to <a href="https://slides.google.com" target="_blank">Google Slides</a></li>
            <li>View and edit online for free</li>
          </ul>
          <button onclick="this.closest('div').parentElement.remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
      `
      
      document.body.appendChild(modal)
      
      // Cleanup on click outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })
    } catch (error) {
      console.error('Error showing online view instructions:', error)
      alert('Failed to show online view options')
    }
  }, [])

  const updateSlidesFromJson = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString)
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid JSON structure. Expected { "slides": [...] }')
      }
      
      if (data.slides.length === 0) {
        throw new Error('No slides found in JSON')
      }
      
      // Validate slide structure
      for (const slide of data.slides) {
        if (!slide.title || !Array.isArray(slide.content)) {
          throw new Error('Invalid slide structure. Each slide must have "title" and "content" fields')
        }
      }
      
      setCurrentSlides(data.slides)
      setRawJsonResponse(jsonString)
      return true
    } catch (error) {
      console.error('Error updating slides from JSON:', error)
      alert(`Failed to update slides: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
      return false
    }
  }, [])

  const clearHistory = useCallback(() => {
    if (confirm('Are you sure you want to clear all conversation history?')) {
      setMessages([])
      setCurrentSlides([])
      setRawJsonResponse(null)
      pptRef.current = null
      localStorage.removeItem('ppt-ai-messages')
      localStorage.removeItem('ppt-ai-slides')
    }
  }, [])

  // Update session title based on first message
  useEffect(() => {
    if (!sessionId || !supabase) {
      // Reset ref when no session
      titleUpdatedForSessionRef.current = null
      return
    }
    
    // Reset the ref if we switched sessions (current sessionId doesn't match the ref)
    if (titleUpdatedForSessionRef.current && titleUpdatedForSessionRef.current !== sessionId) {
      titleUpdatedForSessionRef.current = null
    }
    
    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.role === 'user')
    
    if (!firstUserMessage) return
    
    // Only update title once per session, when we have exactly 2 messages
    // This indicates it's a brand new session and we haven't updated the title yet
    if (titleUpdatedForSessionRef.current === sessionId) {
      // Already updated title for this session
      return
    }
    
    const shouldUpdateTitle = messages.length === 2
    
    if (!shouldUpdateTitle) return
    
    const messageText = firstUserMessage.content.trim()
    
    // Skip if message is too short or just a generic greeting
    if (messageText.length < 3 || 
        /^(hi|hello|hey|thanks?|ok|yes|no)$/i.test(messageText)) {
      return
    }
    
    // Remove common prefixes and clean up the message
    let cleanTitle = messageText
      .replace(/^(create|make|generate|design|build|write|show|explain|tell me about|i want|i need|can you|please|help me with|start|begin)/i, '')
      .trim()
      .replace(/^(about|for|on|regarding)\s+/i, '')
      .trim()
      .replace(/\s+slides?$/i, '')
      .trim()
    
    // If the message is a question, remove the question mark and capitalize
    cleanTitle = cleanTitle.replace(/\?+$/, '')
    
    // Capitalize first letter
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)
    
    // Truncate to 50 characters max
    const title = cleanTitle.length > 50 
      ? cleanTitle.substring(0, 50).trim() + '...' 
      : cleanTitle
    
    // Only update if title changed and is not empty
    if (title && title.length > 0 && title !== 'New Chat') {
      console.log('Updating session title:', title)
      updateSession(sessionId, { title }).then(() => {
        // Mark that we've updated the title for this session
        titleUpdatedForSessionRef.current = sessionId
      }).catch((error) => {
        console.error('Error updating session title:', error)
      })
    }
  }, [messages, sessionId])

  // Save to Supabase when messages or slides change
  useEffect(() => {
    if (sessionId && supabase && messages.length > 0) {
      // Save messages to Supabase
      try {
        saveMessages(sessionId, messages)
      } catch (error) {
        console.error('Error saving messages:', error)
      }
    }
  }, [messages, sessionId])

  useEffect(() => {
    // Don't save during initial load
    if (isInitialLoadRef.current) {
      return
    }
    
    if (sessionId && supabase && currentSlides.length > 0) {
      // Save slides to Supabase
      try {
        console.log(`Saving ${currentSlides.length} slides to session ${sessionId}`)
        saveSlides(sessionId, currentSlides)
      } catch (error) {
        console.error('Error saving slides:', error)
      }
    }
  }, [currentSlides, sessionId])

  return (
    <ChatContext.Provider value={{
      messages,
      sendMessage,
      isLoading,
      currentSlides,
      generatePPT,
      downloadPPT,
      exportToPDF,
      exportToPowerPointOnline,
      clearHistory,
      sessionId: sessionId || null,
      rawJsonResponse,
      updateSlidesFromJson,
      onCreateSession
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

