import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CaseProject } from "@/types"

interface CaseCardProps {
  project: CaseProject
  featured?: boolean
}

export function CaseCard({ project, featured = false }: CaseCardProps) {
  return (
    <Link
      href={`/cases/${project.slug}`}
      className={cn("group block", featured && "md:col-span-2")}
    >
      <div className={cn("relative overflow-hidden bg-surface-subtle", featured ? "aspect-[16/8]" : "aspect-[4/3]")}>
        <Image
          src={project.coverImage.url}
          alt={project.coverImage.alt}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/75 via-neutral-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-white/70">
            <Badge variant="outline" className="border-white/40 text-white">{project.category}</Badge>
            <span>{project.year}</span>
          </div>
          <h2 className={cn("mt-3 max-w-2xl font-semibold tracking-[-0.04em]", featured ? "text-3xl sm:text-4xl" : "text-2xl")}>{project.title}</h2>
          <div className="mt-3 flex items-center justify-between gap-4 text-sm text-white/75">
            <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{project.city}</span>
            <span className="inline-flex items-center gap-1 font-medium text-white">Смотреть проект <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
          </div>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{project.excerpt}</p>
    </Link>
  )
}
