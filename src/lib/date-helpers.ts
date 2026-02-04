import type { DateScope } from '@/components/date-context-selector'

interface DateRange {
    start: Date
    end: Date
}

/**
 * Get the date range for a given scope
 */
export function getDateRange(scope: DateScope): DateRange {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (scope === 'today') {
        const end = new Date(today)
        end.setHours(23, 59, 59, 999)
        return { start: today, end }
    }

    // Find start of current week (Monday)
    const dayOfWeek = today.getDay()
    const distance = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() + distance)
    weekStart.setHours(0, 0, 0, 0)

    if (scope === 'this-week') {
        const end = new Date(today)
        end.setHours(23, 59, 59, 999)
        return { start: weekStart, end }
    }

    // Last week
    const lastWeekEnd = new Date(weekStart)
    lastWeekEnd.setDate(weekStart.getDate() - 1)
    lastWeekEnd.setHours(23, 59, 59, 999)

    const lastWeekStart = new Date(lastWeekEnd)
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
    lastWeekStart.setHours(0, 0, 0, 0)

    return { start: lastWeekStart, end: lastWeekEnd }
}

/**
 * Get days of week for display
 */
export function getDaysOfWeek(scope: DateScope) {
    const { start, end } = getDateRange(scope)
    const days: Array<Date> = []

    const current = new Date(start)
    while (current <= end) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    return days
}

/**
 * Filter data by date scope
 */
export function filterByDateScope<T extends { _creationTime: number }>(
    data: Array<T>,
    scope: DateScope,
): Array<T> {
    const { start, end } = getDateRange(scope)
    const startTime = start.getTime()
    const endTime = end.getTime()

    return data.filter((item) => {
        const itemTime = item._creationTime
        return itemTime >= startTime && itemTime <= endTime
    })
}

/**
 * Format date to MM/DD
 */
export function formatDateShort(date: Date): string {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(
        date.getDate(),
    ).padStart(2, '0')}`
}

/**
 * Get week comparison label
 */
export function getComparisonLabel(scope: DateScope): string {
    if (scope === 'today') return 'vs Yesterday'
    if (scope === 'this-week') return 'vs Last Week'
    return 'vs 2 Weeks Ago'
}
