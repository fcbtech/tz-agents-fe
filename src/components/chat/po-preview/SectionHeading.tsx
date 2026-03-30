import type { ReactNode } from 'react'

export default function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1">
      {children}
    </h3>
  )
}
