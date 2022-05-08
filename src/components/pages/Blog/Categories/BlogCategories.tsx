import React from 'react'
import AllCategoriesTag from '@site/src/components/pages/Blog/Categories/AllCategoriesTag'
import CategoryTag from '@site/src/components/pages/Blog/Categories/CategoryTag'

const BlogCategories = ({ categories, selection, updateSelection }) =>
  categories?.length >= 1 && (
    <div style={{ padding: 32 }}>
      <span style={{ padding: '2px 12px', fontSize: '80%', opacity: 0.75, userSelect: 'none' }}>Categories:</span>

      {categories.length >= 3 && (
        <AllCategoriesTag categories={categories} selection={selection} updateSelection={updateSelection} />
      )}

      {categories.map((category) => (
        <CategoryTag key={category} category={category} selection={selection} updateSelection={updateSelection} />
      ))}
    </div>
  )

export default BlogCategories
