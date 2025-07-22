import React from 'react'

interface Props {
  src: string
  alt: string
  year?: number
}

const Image = ({ src, alt, year, ...props }: Props): JSX.Element => {
  return (
    <div className="flex flex-col items-center py-4">
      <img className="max-h-96 lg:max-h-[32rem] xl:max-h-[40rem]" {...props} src={src} alt={alt} />
      {alt && (
        <em className="text-base">
          {alt}
          {year && ` (${year})`}.
        </em>
      )}
    </div>
  )
}

export default Image
