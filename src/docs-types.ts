export type Example = Readonly<{
  id: string
  name: string
  title: string
  category: string
  collection: 'docs' | 'gala'
  markdown: string
  code: string
  image: string | null
  error: string | null
}>
