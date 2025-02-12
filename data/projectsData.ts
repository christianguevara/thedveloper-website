interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'Once Soccer',
    description: `Once Soccer is a live results application of the best football leagues in the world.
    In addition, it gives you news that can be filtered by leagues or championships, position tables that are updated instantly and much more.`,
    imgSrc: '/static/images/once-preview.avif',
    href: '/blog/once-soccer',
  },
]

export default projectsData
