import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

type ToolbarLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> & {
  children: ReactNode
  href: string
}

type ToolbarActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'type'> & {
  children: ReactNode
}

const baseButtonClasses = 'toolbar-button min-w-16 inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm border border-gray-300 bg-white px-2.5 py-1.5 text-xs leading-4 text-gray-700 transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'

function ToolbarButton(props: ToolbarLinkProps): ReactElement
function ToolbarButton(props: ToolbarActionProps): ReactElement
function ToolbarButton(props: ToolbarLinkProps | ToolbarActionProps) {
  if ('href' in props) {
    const { children, ...linkProps } = props
    return (
      <a {...linkProps} className={`${baseButtonClasses} no-underline hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900`}>
        {children}
      </a>
    )
  }

  const { children, ...buttonProps } = props
  return (
    <button {...buttonProps} className={`${baseButtonClasses} enabled:hover:border-gray-400 enabled:hover:bg-gray-100 enabled:hover:text-gray-900 disabled:cursor-default disabled:opacity-40`} type="button">
      {children}
    </button>
  )
}

function Pane({ children, leftTitle, rightTitle, ariaLabel }: { children: ReactNode, leftTitle?: ReactNode, rightTitle?: ReactNode, ariaLabel?: string }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-sm border border-gray-300 bg-white" aria-label={ariaLabel}>
      { (leftTitle || rightTitle) && (
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-4 font-mono text-[11px] tracking-[0.02em] text-gray-600">
          {leftTitle && <span>{leftTitle}</span>}
          {rightTitle && <span className="text-gray-500">{rightTitle}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

export { ToolbarButton, Pane }
