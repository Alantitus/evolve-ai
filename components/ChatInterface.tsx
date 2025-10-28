'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import MessageList from './MessageList'
import InputBar from './InputBar'
import SlidePreview from './SlidePreview'
import { Download, Sparkles, Bot, Eye, Edit, X } from 'lucide-react'
import PreviewModal from './PreviewModal'
import SlideEditor from './SlideEditor'
import { SlideContent } from '@/types/slide'

export default function ChatInterface() {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    currentSlides,
    generatePPT,
    downloadPPT,
    clearHistory,
    rawJsonResponse,
    updateSlidesFromJson
  } = useChat()
  const [hasGeneratedPPT, setHasGeneratedPPT] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [showPreviewPanel, setShowPreviewPanel] = useState(false)
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [jsonEditorValue, setJsonEditorValue] = useState('')
  const [isEditingJson, setIsEditingJson] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{current: number; total: number; status: string} | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const lastGeneratedSlidesRef = useRef<string>('')

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (message: string) => {
    await sendMessage(message)
  }

  const handleApplyEditedSlides = (editedSlides: SlideContent[]) => {
    // Update slides via the context
    updateSlidesFromJson(JSON.stringify({ slides: editedSlides }))
    setHasGeneratedPPT(false) // Reset PPT state to allow regeneration with edited slides
    lastGeneratedSlidesRef.current = '' // Reset ref to allow regeneration
  }

  // Reset PPT state when slides change (track slides content)
  const slidesKey = JSON.stringify(currentSlides)
  useEffect(() => {
    // Automatically show preview panel when slides are generated AND there are messages
    // Don't show on initial empty screen
    if (currentSlides.length > 0 && messages.length > 0) {
      setShowPreviewPanel(true)
    } else if (messages.length === 0) {
      // Hide preview panel on initial screen
      setShowPreviewPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesKey])

  // Automatically generate PPT when slides are updated
  useEffect(() => {
    const autoGeneratePPT = async () => {
      const currentSlidesKey = JSON.stringify(currentSlides)
      
      // Only auto-generate if:
      // 1. We have slides
      // 2. We haven't generated for this set of slides yet
      // 3. Not currently generating
      // 4. Not currently loading
      if (currentSlides.length > 0 && 
          currentSlidesKey !== lastGeneratedSlidesRef.current && 
          !isGenerating && 
          !isLoading) {
        
        console.log('Auto-generating PPT for slides:', currentSlides.length)
        try {
          setIsGenerating(true)
          setGenerationProgress({ current: 0, total: currentSlides.length, status: 'Starting...' })
          await generatePPT(currentSlides, (progress) => {
            setGenerationProgress(progress)
          })
          setHasGeneratedPPT(true)
          setGenerationProgress(null)
          // Mark this set of slides as generated
          lastGeneratedSlidesRef.current = currentSlidesKey
          console.log('Auto-generation complete')
        } catch (error) {
          console.error('Error auto-generating PPT:', error)
          setGenerationProgress(null)
        } finally {
          setIsGenerating(false)
        }
      }
    }

    autoGeneratePPT()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesKey, isGenerating, isLoading])

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      {/* Chat Panel */}
      <div className={`flex flex-col bg-gray-50 relative transition-all duration-300 overflow-hidden ${
        showPreviewPanel ? 'lg:w-2/3 w-full lg:max-w-4xl pt-12 lg:pt-0' : 'w-full max-w-4xl mx-auto pt-12 lg:pt-0'
      }`}>
        {/* Messages Area */}
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
            <div className="w-full max-w-3xl space-y-6">
              <div className="text-center">
                <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Create Your Presentation
                </h1>
                <p className="text-gray-600 text-base lg:text-lg">
                  Start with a topic, we'll turn it into slides!
                </p>
              </div>
              
              {/* Input Area - Centered */}
              <div className="w-full max-w-2xl mx-auto">
                <InputBar onSend={handleSend} isLoading={isLoading} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 lg:p-6 m-2 lg:m-4 bg-white rounded-lg shadow-sm">
            <div className="max-w-3xl mx-auto">
              <MessageList messages={messages} />
            {isLoading && (
              <div className="flex items-start gap-2 mb-6">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-purple-50 border border-purple-200 px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                    <span className="text-purple-700 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
            </div>
          </div>
        )}


        {/* Input Area - Only show when there are messages */}
        {messages.length > 0 && (
          <div className="bg-gray-50">
            <div className="max-w-3xl mx-auto px-6">
              <InputBar onSend={handleSend} isLoading={isLoading} />
            </div>
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {showPreviewPanel && (
        <div className="lg:flex-1 w-full lg:w-auto flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 animate-slideIn overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">Presentation Preview</h2>
              <p className="text-xs lg:text-sm text-gray-600 mt-1">
                {currentSlides.length} slides generated
              </p>
            </div>
          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {hasGeneratedPPT && (
              <>
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="hidden sm:flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs lg:text-sm font-medium"
                  title="Edit slides"
                >
                  <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden md:inline">Edit</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="hidden sm:flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs lg:text-sm font-medium"
                  title="Preview presentation"
                >
                  <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden md:inline">Preview</span>
                </button>
                <button
                  onClick={downloadPPT}
                  className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs lg:text-sm font-medium"
                  title="Download as PPTX file"
                >
                  <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden md:inline">Download</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          {currentSlides.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium">No slides yet</p>
                <p className="text-sm mt-2">Generated slides will appear here</p>
              </div>
            </div>
          ) : (
            <>
              <SlidePreview slides={currentSlides} />
              
              {/* Progress Indicator */}
              {generationProgress && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {generationProgress.status}
                    </span>
                    <span className="text-sm text-blue-700">
                      {generationProgress.current} / {generationProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(generationProgress.current / generationProgress.total) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        slides={currentSlides}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Slide Editor */}
      <SlideEditor
        slides={currentSlides}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onApply={handleApplyEditedSlides}
      />
    </div>
  )
}

