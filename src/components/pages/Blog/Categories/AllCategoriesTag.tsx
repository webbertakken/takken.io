import React from 'react'
import { Tag } from 'antd'
import cx from 'classnames'

import styles from './BlogCategories.module.scss'

const compareSortedArrays = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

const AllCategoriesTag = ({ categories, selection, updateSelection }) => {
  const areAllSelected = compareSortedArrays(categories, selection)

  console.log('render', selection, categories, areAllSelected)

  const update = () => {
    updateSelection(areAllSelected ? [] : categories)
  }

  return (
    <Tag className={cx(styles.tag, { [styles.disabled]: !areAllSelected })} onClick={update}>
      All
    </Tag>
  )
}

export default AllCategoriesTag
