import { type PropsWithChildren } from 'react'
import styles from './FrameLayout.module.css'
import { useViewportHeight } from '../../hooks/useViewportHeight'

const FrameLayout = ({ children }: PropsWithChildren) => {
  useViewportHeight()

  return (
    <>
      <div className={styles.frame} />
      <div className={styles.body}>{children}</div>
    </>
  )
}

export default FrameLayout
