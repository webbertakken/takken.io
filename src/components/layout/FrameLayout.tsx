import styles from './FrameLayout.module.css'

const FrameLayout = ({ children }) => (
  <>
    <div className={styles.frame} />
    <div className={styles.body}>{children}</div>
  </>
)

export default FrameLayout
