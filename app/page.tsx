import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import Main from './Main'

const isProduction = process.env.NODE_ENV === 'production'

export default async function Page() {
  const sortedPosts = sortPosts(allBlogs)
  const posts = allCoreContent(sortedPosts).filter((post) => (isProduction ? post.listed : true))
  return <Main posts={posts} />
}
