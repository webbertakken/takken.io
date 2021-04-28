import React, { useState } from 'react'
import DefaultLayout from '@/components/layout/DefaultLayout'
import Categories from '@/components/pages/Blog/Categories/BlogCategories'
import Posts from '@/components/pages/Blog/Posts/BlogPosts'

const BlogIndexPage = ({ posts, categories }) => {
  const [selectedCategories, setSelectedCategories] = useState(categories)

  const updateSelection = (newSelection) => {
    setSelectedCategories(newSelection.slice().sort())
  }

  return (
    <DefaultLayout>
      <Categories categories={categories} selection={selectedCategories} updateSelection={updateSelection} />
      <Posts posts={posts} selectedCategories={selectedCategories} />
    </DefaultLayout>
  )
}

export default BlogIndexPage
