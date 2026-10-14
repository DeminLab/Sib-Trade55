"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"

const sortOptions = [
  { value: "newest", label: "Сначала новые" },
  { value: "name", label: "Название: А-Я" },
]

interface SortDropdownProps {
  currentSort: string
}

export function SortDropdown({ currentSort }: SortDropdownProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value === "newest") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    params.delete("page")
    const query = params.toString()
    router.push(query ? `/shop?${query}` : "/shop")
  }

  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={currentSort}
        onChange={handleChange}
        aria-label="Сортировка товаров"
        className="min-h-11 w-full appearance-none rounded-sm border border-border bg-white py-2 pl-3 pr-8 text-base text-foreground outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
