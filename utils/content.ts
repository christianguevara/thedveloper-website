import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import { allBlogs, Blog } from 'contentlayer/generated'
import { slug } from 'github-slugger'

const isProduction = process.env.NODE_ENV === 'production'

interface FilterOptions {
  tag?: string | null
}

const tagFilter = (post: Blog, tag: string) => {
  return post.tags && post.tags.map((t) => slug(t)).includes(tag)
}

export function filterPosts(posts = allBlogs, options: FilterOptions = { tag: null }) {
  return allCoreContent(
    sortPosts(
      posts.filter((post) => {
        // In development, show all posts by default
        if (!isProduction) {
          if (options.tag) {
            return tagFilter(post, options.tag)
          }
          return true
        }
        // In production, apply all filters
        if (post.draft === true) return false
        if (post.listed === false) return false
        if (options.tag) {
          return tagFilter(post, options.tag)
        }
        return true
      })
    )
  )
}
