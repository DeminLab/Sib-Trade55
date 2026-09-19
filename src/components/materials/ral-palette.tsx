"use client"

import { useMemo, useState } from "react"
import type { RalColor } from "@/types"

export function RalPalette({ colors }: { colors: RalColor[] }) {
  const groups = useMemo(() => ["Все", ...new Set(colors.map((color) => color.group))], [colors])
  const [activeGroup, setActiveGroup] = useState("Все")
  const visibleColors = activeGroup === "Все" ? colors : colors.filter((color) => color.group === activeGroup)

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-5">
        {groups.map((group) => <button key={group} type="button" onClick={() => setActiveGroup(group)} className={`border px-3 py-2 text-xs font-semibold transition-colors ${activeGroup === group ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"}`}>{group}</button>)}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
        {visibleColors.map((color) => <div key={color.code} className="group"><div className="aspect-square border border-black/10 shadow-sm transition-transform group-hover:-translate-y-1" style={{ backgroundColor: color.hex }} /><div className="mt-2 font-mono text-xs font-semibold">{color.code}</div><div className="mt-1 text-xs text-muted-foreground">{color.name}</div></div>)}
      </div>
      <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">Экранная палитра используется для предварительного выбора. Точный оттенок зависит от партии, фактуры и условий освещения — перед оформлением заказа согласуем физический образец.</p>
    </div>
  )
}
