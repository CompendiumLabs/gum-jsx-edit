import { StrictMode, useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentType, MouseEvent } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import type { NavigationProps, Page } from './navigation'

type PageComponent = ComponentType<NavigationProps>
type LoadedPages = Partial<Record<Page, PageComponent>>

const loadedPages: LoadedPages = {}
const loadingPages: Partial<Record<Page, Promise<PageComponent>>> = {}
const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname.replace(/\/+$/, '')

function currentPage(): Page {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path === `${basePath}/docs` ? 'docs' : 'editor'
}

function loadPage(page: Page): Promise<PageComponent> {
  const loaded = loadedPages[page]
  if (loaded) return Promise.resolve(loaded)
  const pending = loadingPages[page]
  if (pending) return pending

  const promise = (page === 'docs' ? import('./Docs') : import('./App')).then(module => {
    loadedPages[page] = module.default
    return module.default
  })
  loadingPages[page] = promise
  return promise
}

function Router() {
  const initialPage = useRef(currentPage())
  const requestId = useRef(0)
  const [activePage, setActivePage] = useState(initialPage.current)
  const [pages, setPages] = useState<LoadedPages>(() => ({ ...loadedPages }))

  const showPage = useCallback(async (page: Page, href?: string) => {
    const id = ++requestId.current
    const component = await loadPage(page)
    if (id !== requestId.current) return

    setPages(current => current[page] ? current : { ...current, [page]: component })
    if (href) window.history.pushState(null, '', href)
    setActivePage(page)
  }, [])

  useEffect(() => {
    void showPage(initialPage.current)
    const onPopState = () => void showPage(currentPage())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [showPage])

  useEffect(() => {
    document.title = activePage === 'docs' ? 'Gum docs — examples' : 'gum edit'
  }, [activePage])

  const onNavigate = useCallback((event: MouseEvent<HTMLAnchorElement>, page: Page) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
      || event.shiftKey || event.altKey || event.currentTarget.target === '_blank') return
    event.preventDefault()
    void showPage(page, event.currentTarget.href)
  }, [showPage])

  const Editor = pages.editor
  const Docs = pages.docs
  if (!pages[activePage]) {
    return <div className="p-6 text-sm text-gray-500" role="status">Loading…</div>
  }

  return (
    <>
      {Editor && (
        <div className={activePage === 'editor' ? 'contents' : 'hidden'}>
          <Editor onNavigate={onNavigate} />
        </div>
      )}
      {activePage === 'docs' && Docs && <Docs onNavigate={onNavigate} />}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
