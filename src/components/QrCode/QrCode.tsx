import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QrCodeProps extends React.SVGProps<SVGSVGElement> {
  value: string
  sizePx?: number
  includeMargin?: boolean
}

const QrCode: React.FC<QrCodeProps> = ({ value, sizePx = 400, includeMargin = true }) => {
  return <QRCodeSVG value={value} size={sizePx} includeMargin={includeMargin} />
}

export default QrCode
