import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type DateScope = 'today' | 'this-week' | 'last-week'

interface DateContextSelectorProps {
  value: DateScope
  onChange: (scope: DateScope) => void
}

const scopeLabels: Record<DateScope, string> = {
  today: 'Today',
  'this-week': 'This Week',
  'last-week': 'Last Week',
}

const scopeDescriptions: Record<DateScope, string> = {
  today: 'Single-day view',
  'this-week': 'Current week (rolling, up to today)',
  'last-week': 'Previous full week',
}

export function DateContextSelector({
  value,
  onChange,
}: DateContextSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const options: Array<DateScope> = ['today', 'this-week', 'last-week']

  return (
    <div className="relative inline-block">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="gap-2"
      >
        {scopeLabels[value]}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-border bg-background shadow-lg z-50">
          <div className="p-2">
            {options.map((scope) => (
              <button
                key={scope}
                onClick={() => {
                  onChange(scope)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === scope
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="font-medium">{scopeLabels[scope]}</div>
                <div className="text-xs text-muted-foreground">
                  {scopeDescriptions[scope]}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
