import React, { useRef, useState } from 'react'
import { useFrame } from 'react-three-fiber'
import { Mesh } from 'three'

export const Box = (props) => {
  const mesh = useRef<Mesh>()
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y += 0.01
  })

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [2.5, 2.5, 2.5] : [1.75, 1.75, 1.75]}
      onClick={(e) => setActive(!active)}
      onPointerOver={(e) => setHover(true)}
      onPointerOut={(e) => setHover(false)}
    >
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}
