import React, { useState } from 'react'
import IdealImage from '@theme-original/IdealImage'
import Modal from '@site/src/components/Modal/Modal'
import cx from 'classnames'
import styles from './index.module.css'

interface IdealImageWrapperProps extends React.ComponentProps<typeof IdealImage> {}

const IdealImageWrapper: React.FC<IdealImageWrapperProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <>
      {isOpen && (
        <Modal onCloseRequested={close} title="test">
          <div onClick={close} className="flex flex-row cursor-zoom-out">
            {/*<div>⏮️</div>*/}
            <IdealImage
              {...props}
              className={cx(props.className, styles.idealImageWithoutPadding)}
            />
            {/*<div>⏭️</div>*/}
          </div>
        </Modal>
      )}

      <div onClick={open} className="cursor-zoom-in">
        <IdealImage {...props} className={cx(props.className, 'pb-8')} />
      </div>
    </>
  )
}

export default IdealImageWrapper
