export type Example = Readonly<{
  id: string
  name: string
  title: string
  category: string
  collection: 'elements' | 'topics'
  markdown: string
  code: string
  image: string | null
  error: string | null
}>
