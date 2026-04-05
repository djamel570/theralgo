'use client'
import { cn } from '@/lib/utils'

type BadgeVariant = 'active' | 'pending' | 'paused' | 'generating' | 'completed' | 'inactive' | 'new'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paused: 'bg-red-50 text-red-700 border-red-200',
  generating: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-slate-50 text-slate-700 border-slate-200',
  inactive: 'bg-slate-50 text-slate-500 border-slate-200',
  new: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function Badge({ variant = 'pending', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {variant === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
      {children}
    </span>
  )
}
