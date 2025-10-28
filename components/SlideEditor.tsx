'use client'

import { useState, useEffect } from 'react'
import { SlideContent } from '@/types/slide'
import { X, Check, Plus, Trash2 } from 'lucide-react'

interface SlideEditorProps {
  slides: SlideContent[]
  isOpen: boolean
  onClose: () => void
  onApply: (slides: SlideContent[]) => void
}

export default function SlideEditor({ slides, isOpen, onClose, onApply }: SlideEditorProps) {
  const [editedSlides, setEditedSlides] = useState<SlideContent[]>([])
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      // Deep copy slides for editing
      setEditedSlides(JSON.parse(JSON.stringify(slides)))
      setActiveSlideIndex(0)
    }
  }, [isOpen, slides])

  if (!isOpen) return null

  const currentSlide = editedSlides[activeSlideIndex]

  const handleTitleChange = (index: number, title: string) => {
    const updated = [...editedSlides]
    updated[index].title = title
    setEditedSlides(updated)
  }

  const handleContentChange = (slideIndex: number, contentIndex: number, value: string) => {
    const updated = [...editedSlides]
    updated[slideIndex].content[contentIndex] = value
    setEditedSlides(updated)
  }

  const handleAddContent = (slideIndex: number) => {
    const updated = [...editedSlides]
    updated[slideIndex].content.push('New point')
    setEditedSlides(updated)
  }

  const handleRemoveContent = (slideIndex: number, contentIndex: number) => {
    const updated = [...editedSlides]
    updated[slideIndex].content.splice(contentIndex, 1)
    setEditedSlides(updated)
  }

  const handleAddSlide = () => {
    const newSlide: SlideContent = {
      title: 'New Slide',
      content: ['Point 1', 'Point 2']
    }
    setEditedSlides([...editedSlides, newSlide])
    setActiveSlideIndex(editedSlides.length)
  }

  const handleRemoveSlide = (index: number) => {
    if (editedSlides.length <= 1) {
      alert('You must have at least one slide')
      return
    }
    const updated = editedSlides.filter((_, i) => i !== index)
    setEditedSlides(updated)
    if (activeSlideIndex >= updated.length) {
      setActiveSlideIndex(updated.length - 1)
    }
  }

  const handleApply = () => {
    onApply(editedSlides)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Presentation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Slide List Sidebar */}
          <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-4">
              <button
                onClick={handleAddSlide}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <Plus className="w-4 h-4" />
                Add Slide
              </button>
            </div>
            <div className="space-y-2 px-4 pb-4">
              {editedSlides.map((slide, index) => (
                <div
                  key={index}
                  onClick={() => setActiveSlideIndex(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeSlideIndex === index
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-white border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Slide {index + 1}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {slide.title || 'Untitled'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {slide.content.length} points
                      </div>
                    </div>
                    {editedSlides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveSlide(index)
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentSlide && (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Slide Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slide Title
                  </label>
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => handleTitleChange(activeSlideIndex, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    placeholder="Enter slide title"
                  />
                </div>

                {/* Slide Content */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Content Points
                    </label>
                    <button
                      onClick={() => handleAddContent(activeSlideIndex)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Point
                    </button>
                  </div>
                  <div className="space-y-3">
                    {currentSlide.content.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-3 text-lg">•</span>
                        <textarea
                          value={point}
                          onChange={(e) => handleContentChange(activeSlideIndex, pointIndex, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                          placeholder="Enter content point"
                        />
                        {currentSlide.content.length > 1 && (
                          <button
                            onClick={() => handleRemoveContent(activeSlideIndex, pointIndex)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded mt-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="border-t pt-6 mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preview
                  </label>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {currentSlide.title || 'Untitled Slide'}
                    </h3>
                    <div className="space-y-2">
                      {currentSlide.content.map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-start gap-2 text-gray-700">
                          <span className="text-blue-600 font-bold mt-1">•</span>
                          <span>{point || 'Empty point'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {editedSlides.length} slide{editedSlides.length !== 1 ? 's' : ''} • {currentSlide?.content.length || 0} points
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

