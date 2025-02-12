export const dynamic = 'force-static'

// import { NewsletterAPI } from 'pliny/newsletter'
// import siteMetadata from '@/data/siteMetadata'

// Original newsletter subscription handler code commented out
// const handler = NewsletterAPI({
//   provider: siteMetadata.newsletter.provider,
// })

const handler = () => new Response(null, { status: 200 })
export { handler as GET, handler as POST }
