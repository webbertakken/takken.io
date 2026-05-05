import { type PropsWithChildren } from 'react'
import { useViewportHeight } from '../../hooks/useViewportHeight'
import styles from './FrameLayout.module.css'

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
