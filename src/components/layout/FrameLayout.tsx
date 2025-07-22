import styles from './FrameLayout.module.css'

const FrameLayout = ({ children }) => (
  <>
    <div className={styles.frame}></div>
    <div className={styles.body}>{children}</div>
  </>
)

export default FrameLayout
