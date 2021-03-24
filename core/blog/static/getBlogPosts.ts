import matter from 'gray-matter'
import { parseISO, format } from 'date-fns'
import fs from 'fs'
import { join } from 'path'

const postsDirectory = join(process.cwd(), 'posts')

export function getPostBySlug(filePath) {
  const slug = filePath.replace(/\.md$/, '')
  const fullPath = join(postsDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  const { data, content } = matter(fileContents)
  const date = format(parseISO(data.date), 'MMMM dd, yyyy')

  return { slug, meta: { ...data, date }, content }
}

export function getAllPosts() {
  const slugs = fs.readdirSync(postsDirectory)
  const posts = slugs.map((slug) => getPostBySlug(slug))

  return posts
}
