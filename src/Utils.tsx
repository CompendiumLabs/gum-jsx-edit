import type { ReactNode } from 'react'

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

export { Pane }
