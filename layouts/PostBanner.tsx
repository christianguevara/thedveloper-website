import { ReactNode } from 'react'
import Image from '@/components/Image'
import Bleed from 'pliny/ui/Bleed'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import ArrowLink from '@/components/ArrowLink'

interface LayoutProps {
  content: CoreContent<Blog>
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
}

export default function PostMinimal({ content, next, prev, children }: LayoutProps) {
  const { slug, title, images, caption, parsedCredits } = content
  const displayImage =
    images && images.length > 0 ? images[0] : 'https://picsum.photos/seed/picsum/800/400'

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article>
        <div>
          <div className="space-y-1 pb-10 text-center dark:border-gray-700">
            <div className="w-full">
              <Bleed>
                <div className="relative aspect-2/1 w-full">
                  <Image src={displayImage} alt={title} fill className="object-cover" />
                  <div className="absolute right-0 bottom-0 left-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                    {parsedCredits && (
                      <div className="text-xs [text-shadow:_0_1px_1px_black]">
                        Photo by:{' '}
                        {parsedCredits.url ? (
                          <Link href={parsedCredits.url} className="hover:underline">
                            {parsedCredits.text}
                          </Link>
                        ) : (
                          parsedCredits.text
                        )}
                      </div>
                    )}
                    {caption && (
                      <div className="text-right text-sm [text-shadow:_0_1px_1px_black]">
                        {caption}
                      </div>
                    )}
                  </div>
                </div>
              </Bleed>
            </div>
            <div className="relative pt-10">
              <PageTitle>{title}</PageTitle>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none py-4">{children}</div>
          {siteMetadata.comments && (
            <div className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300" id="comment">
              <Comments slug={slug} />
            </div>
          )}
          <footer>
            <div className="flex flex-col text-sm font-medium sm:flex-row sm:justify-between sm:text-base">
              {prev && prev.path && (
                <div className="pt-4 xl:pt-8">
                  <ArrowLink
                    href={`/${prev.path}`}
                    text={prev.title}
                    direction="left"
                    aria-label={`Previous post: ${prev.title}`}
                  />
                </div>
              )}
              {next && next.path && (
                <div className="pt-4 xl:pt-8">
                  <ArrowLink
                    href={`/${next.path}`}
                    text={next.title}
                    aria-label={`Next post: ${next.title}`}
                  />
                </div>
              )}
            </div>
          </footer>
        </div>
      </article>
    </SectionContainer>
  )
}
