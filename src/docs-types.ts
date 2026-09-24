export type Example = Readonly<{
  id: string
  name: string
  title: string
  category: string
  collection: 'guides' | 'elements' | 'gallery'
  markdown: string
  code: string
  image: string | null
  error: string | null
}>
