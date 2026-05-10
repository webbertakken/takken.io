import ToolPage from '@theme/ToolPage/ToolPage'
import ToolBody from './ui/ToolBody'

const RawTuner = (): React.JSX.Element => {
  return (
    <ToolPage title="RAW tuner">
      <p>
        Drop a RAW or JPEG and get an auto-tuned preview plus suggested looks. Everything runs in
        your browser on your GPU. Nothing is uploaded.
      </p>
      <ToolBody />
    </ToolPage>
  )
}

export default RawTuner
