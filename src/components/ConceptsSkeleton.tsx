import React from 'react'

export default function ConceptsSkeleton() {
  return (
    <>
      {/* Image skeleton - matches exact structure */}
      <div className="pb-4">
        <div className="w-full aspect-2/1 overflow-hidden rounded-lg">
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 skeleton-animate flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-500">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Title skeleton - matches h1 */}
      <h1
        className="bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate"
        style={{ height: '2.5rem', width: '50%', marginBottom: '1rem' }}
      ></h1>

      {/* Content skeleton - matches prose structure with fixed height */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        style={{ height: '280px', overflow: 'hidden' }}
      >
        <div className="space-y-[1.275rem]">
          {/* First paragraph */}
          <div className="space-y-[0.175rem]">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate"></div>
            <div
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate"
              style={{ width: '83%' }}
            ></div>
          </div>

          {/* Second paragraph */}
          <div className="space-y-[0.175rem]">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate"></div>
            <div
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate"
              style={{ width: '80%' }}
            ></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate"></div>
          </div>
        </div>
      </div>

      {/* Edit link skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-sm skeleton-animate w-40"></div>
    </>
  )
}
