import styles from './FrameLayout.module.css'
import { useViewportHeight } from '../../hooks/useViewportHeight'

const FrameLayout = ({ children }) => {
  useViewportHeight()

  return (
    <>
      <div className={styles.frame} />
      <div className={styles.body}>{children}</div>
    </>
  )
}

export default FrameLayout
