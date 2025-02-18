import Link from './Link'
import type { LinkProps } from 'next/link'

type ArrowLinkProps = LinkProps & {
  text: string
  href: string
  direction?: 'right' | 'left'
  className?: string
}

const ArrowLink = ({
  text,
  href,
  direction = 'right',
  className = '',
  ...rest
}: ArrowLinkProps) => {
  const arrow = direction === 'right' ? '→' : '←'
  const arrowClass = `inline-block transition-transform ${
    direction === 'right' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'
  }`

  return (
    <Link
      href={href}
      className={`text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 group ${className}`}
      {...rest}
    >
      {direction === 'left' && (
        <>
          <span className={arrowClass}>{arrow}</span>
          &nbsp;
        </>
      )}

      {text}

      {direction === 'right' && (
        <>
          &nbsp;
          <span className={arrowClass}>{arrow}</span>
        </>
      )}
    </Link>
  )
}

export default ArrowLink
