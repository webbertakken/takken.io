import React from 'react'
import { Canvas } from 'react-three-fiber'
import { Box } from "@site/src/components/layout/components/BackgroundCanvas/components/Box";

export default function BackgroundCanvas(props) {
  return (
    <Canvas {...props}>
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Box position={[0, 0, 0]} />
    </Canvas>
  )
}
