import React, { useState, useEffect } from 'react'
import IdealImage from '@theme-original/IdealImage'
import Modal from '@site/src/components/Modal/Modal'
import cx from 'classnames'

interface IdealImageWrapperProps extends React.ComponentProps<typeof IdealImage> {
  source?: React.JSX.Element
  noPadding?: boolean
}

const IdealImageWrapper: React.FC<IdealImageWrapperProps> = ({
  source,
  className,
  img,
  noPadding,
  alt,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [originalDimensions, setOriginalDimensions] = useState({ width: 2000, height: 1200 })

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  // Extract the original source for high-res modal display
  // Use the largest available image from IdealImage's images array
  const originalSrc =
    typeof img === 'string'
      ? img
      : img.src?.images?.slice(-1)[0]?.path || img.src?.src || img.src || img

  // Load original image to get true dimensions for modal aspect ratio
  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      setOriginalDimensions({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.src = originalSrc
  }, [originalSrc])

  // Use original dimensions for modal aspect ratio calculations
  const aspectRatio = originalDimensions.width / originalDimensions.height
  const reverseAspectRatio = originalDimensions.height / originalDimensions.width

  return (
    <>
      {isOpen && (
        <Modal onCloseRequested={close}>
          <div onClick={close} className="flex flex-col cursor-zoom-out">
            {/*<div>⏮️</div>*/}
            <img
              style={{
                // 50px is the minimum margin and border of the modal
                // 40px is space for attribution (source prop)
                width: `min(100vw - 50px, (100vh - 50px - 40px) * ${aspectRatio})`,
                height: `min(100vh - 50px - 40px, (100vw - 50px) * ${reverseAspectRatio})`,
                // 🔥🐶🔥 this is fine: solve aspect ratio pixel rounding sometimes causing overflow
                overflow: 'hidden',
              }}
              src={originalSrc}
              alt={alt}
              {...rest}
              className={cx(className)}
            />
            {source && (
              <sup className="p-2">
                <sub>{source}</sub>
              </sup>
            )}
            {/*<div>⏭️</div>*/}
          </div>
        </Modal>
      )}

      <div onClick={open} className="cursor-zoom-in leading-[0]">
        <div className="flex flex-col pb-8">
          <IdealImage
            img={img}
            alt={alt}
            {...rest}
            className={cx(rest.className, { 'pb-8': !noPadding })}
          />
          {source && (
            <sup>
              <sub>{source}</sub>
            </sup>
          )}
        </div>
      </div>
    </>
  )
}

export default IdealImageWrapper
