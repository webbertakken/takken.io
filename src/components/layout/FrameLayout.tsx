import styles from './FrameLayout.module.css'

const FrameLayout = ({ children }) => (
  <>
    {/* Content */}
    <div className={styles.frameBody}>{children}</div>

    {/* Animations */}
    <div className={styles.frameAnimated1}>
      <div className={styles.frameAnimated2} />
      <div className={styles.frameShadow} />
    </div>
  </>
)

export default FrameLayout
