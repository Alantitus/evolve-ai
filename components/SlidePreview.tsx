'use client'

import { SlideContent } from '@/types/slide'

interface SlidePreviewProps {
  slides: SlideContent[]
}

export default function SlidePreview({ slides }: SlidePreviewProps) {
  return (
    <div className="w-full">
      <div className="space-y-6">
        {slides.map((slide, index) => (
          <div
            key={`${slide.title}-${index}`}
            className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200"
            style={{ height: '280px' }}
          >
            <div className="relative h-full bg-white p-8 flex flex-col justify-center">
              {/* Slide Number - Top Right */}
              <div className="absolute top-4 right-4 z-10">
                <span className="text-4xl font-bold text-gray-200">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Title */}
                {slide.title && (
                  <h3 className="text-3xl font-bold text-gray-900 leading-tight">
                    {slide.title}
                  </h3>
                )}

                {/* Content Bullets */}
                {slide.content && slide.content.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {slide.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold mt-1 text-lg">•</span>
                        <p className="text-base text-gray-700 flex-1">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
