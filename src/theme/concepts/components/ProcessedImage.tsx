import React, { useState } from 'react'
import Modal from '../../../components/Modal/Modal'
import type { ProcessedImageData } from '../../../plugins/frontmatter-image-processor'

interface ProcessedImageProps {
  processedData: ProcessedImageData | null
  size: 'thumbnail' | 'medium' | 'large' | 'original'
  alt: string
  className?: string
  enableModal?: boolean
}

export default function ProcessedImage({
  processedData,
  size,
  alt,
  className = '',
  enableModal = false,
}: ProcessedImageProps): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get the appropriate image URL based on size
  const imageUrl = processedData?.processed?.[size] || processedData?.src || ''

  // For modal, use the largest available image
  const modalImageUrl =
    processedData?.processed?.original || processedData?.processed?.large || imageUrl

  const handleClick = () => {
    if (enableModal) {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${enableModal ? 'cursor-zoom-in' : ''}`}
        loading="lazy"
        onClick={handleClick}
      />

      {enableModal && isModalOpen && (
        <Modal onCloseRequested={() => setIsModalOpen(false)}>
          <div onClick={() => setIsModalOpen(false)} className="flex flex-col cursor-zoom-out">
            <img
              src={modalImageUrl}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain"
              style={{
                width: 'auto',
                height: 'auto',
              }}
            />
          </div>
        </Modal>
      )}
    </>
  )
}
