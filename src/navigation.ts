import type { MouseEvent } from 'react'

export type Page = 'editor' | 'docs'

export type NavigationProps = {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, page: Page) => void
}
