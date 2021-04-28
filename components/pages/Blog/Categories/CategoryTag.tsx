import React from 'react'
import { Tag } from 'antd'
import cx from 'classnames'

import styles from './BlogCategories.module.scss'

const CategoryTag = ({ selection, category, updateSelection }) => {
  const isActive = selection.includes(category)

  const update = () => {
    updateSelection(isActive ? selection.filter((c) => c !== category) : [...selection, category])
  }

  return (
    <Tag className={cx(styles.tag, { [styles.disabled]: !isActive })} onClick={update}>
      {category}
    </Tag>
  )
}

export default CategoryTag
