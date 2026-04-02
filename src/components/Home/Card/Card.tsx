import React, { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
}

interface CardItemProps {
  children: ReactNode
}

const Card = ({ title, children }: CardProps) => {
  return (
    <div className="basis-72 lg:basis-96 grow p-4 border-2 border-solid border-gray-300 dark:border-gray-500 rounded-sm">
      <h2 className="text-xl">{title}</h2>
      <ul className="list-none p-0">{children}</ul>
    </div>
  )
}

Card.Item = ({ children }: CardItemProps) => {
  return <li>{children}</li>
}

export default Card
