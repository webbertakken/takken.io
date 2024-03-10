import styles from '@site/src/components/Home/index.module.css'
import React from 'react'

const Card = ({ title, children }) => {
  return (
    <div className="basis-72 lg:basis-96 grow p-4 border-2 border-solid border-gray-300 dark:border-gray-500 rounded">
      <h2 className={styles.heading}>{title}</h2>
      <ul className="list-none p-0">{children}</ul>
    </div>
  )
}

Card.Item = ({ children }) => {
  return <li>{children}</li>
}

export default Card
