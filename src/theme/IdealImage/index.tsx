import React, { useState } from 'react'
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
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  const { width, height } = img.src
  const aspectRatio = width / height
  const reverseAspectRatio = height / width

  return (
    <>
      {isOpen && (
        <Modal onCloseRequested={close}>
          <div onClick={close} className="flex flex-col cursor-zoom-out">
            {/*<div>⏮️</div>*/}
            <IdealImage
              style={{
                // 50px is the minimum margin and border of the modal
                // 40px is space for attribution (source prop)
                width: `min(100vw - 50px, (100vh - 50px - 40px) * ${aspectRatio})`,
                height: `min(100vh - 50px - 40px, (100vw - 50px) * ${reverseAspectRatio})`,
                // 🔥🐶🔥 this is fine: solve aspect ratio pixel rounding sometimes causing overflow
                overflow: 'hidden',
              }}
              img={img}
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
          <IdealImage img={img} {...rest} className={cx(rest.className, { 'pb-8': !noPadding })} />
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
