import React from 'react'

interface Props {
  src: string
  performer?: {
    name: string
  }
  isSong?: boolean
}

const PoemAudio = (props: Props): JSX.Element => {
  const { performer, isSong, ...audioProps } = props
  return (
    <div className="flex flex-col items-center py-8 px-4">
      <audio controls className="min-w-80 w-full max-w-2xl" {...audioProps} />
      {isSong ? (
        <em>Lied. {performer ? `Gezongen door ${performer.name}.` : ''}</em>
      ) : (
        <em>Audioversie. {performer ? `Voorgelezen door ${performer.name}.` : ''}</em>
      )}
    </div>
  )
}

export default PoemAudio
