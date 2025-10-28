'use client'

import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { SlideContent } from '@/types/slide'
import { useState, useEffect } from 'react'

interface PreviewModalProps {
  slides: SlideContent[]
  isOpen: boolean
  onClose: () => void
}

export default function PreviewModal({ slides, isOpen, onClose }: PreviewModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Reset to first slide when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1)
      } else if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentSlide, slides.length, onClose])

  if (!isOpen) return null

  const slide = slides[currentSlide]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl aspect-video relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Slide content */}
        <div className="p-12 h-full flex flex-col">
          {/* Slide number indicator */}
          <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded shadow text-sm text-gray-600">
            Slide {currentSlide + 1} of {slides.length}
          </div>

          {/* Title */}
          {slide.title && (
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              {slide.title}
            </h1>
          )}

          {/* Content */}
          {slide.content && slide.content.length > 0 && (
            <div className="flex-1 space-y-4">
              {slide.content.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-lg text-gray-700"
                >
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <p className="flex-1">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentSlide > 0 && (
          <button
            onClick={() => setCurrentSlide(currentSlide - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-80 text-gray-700 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentSlide < slides.length - 1 && (
          <button
            onClick={() => setCurrentSlide(currentSlide + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-80 text-gray-700 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-blue-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

