import styles from './FrameLayout.module.scss'

const FrameLayout = ({ children }) => (
  <div className={styles.layout}>
    <div className={styles.frame} />
    <div className={styles.body}>{children}</div>
  </div>
)

export default FrameLayout
