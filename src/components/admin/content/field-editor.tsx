"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { fieldLabels } from '@/lib/content-models'
import Image from 'next/image'
const inputClass = 'min-h-11 w-full min-w-0 border border-input bg-background px-3 py-2 text-base'
const label = (key: string) => fieldLabels[key] ?? key
const templates: Record<string, unknown> = { gallery: { url: '', alt: '' }, characteristics: { label: '', value: '' }, technicalData: { label: '', value: '' }, productionStages: { title: '', description: '' } }
export function FieldEditor({ name, value, onChange, onUpload }: { name: string; value: unknown; onChange: (value: unknown) => void; onUpload?: (delta: number) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  if (typeof value === 'boolean') return <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />{label(name)}</label>
  if (Array.isArray(value)) {
    if (!templates[name]) return <label className="block space-y-2"><span className="text-sm font-medium">{label(name)} · по одному пункту на строку</span><textarea className={inputClass} rows={4} value={value.join('\n')} onChange={e => onChange(e.target.value.split('\n'))} /></label>
    return <fieldset className="min-w-0 space-y-3 border border-border p-4"><legend className="px-1 text-sm font-semibold">{label(name)}</legend>{value.map((entry, i) => <div key={i} className="space-y-3 border-b border-border pb-4"><FieldEditor onUpload={onUpload} name={name === 'gallery' ? 'coverImage' : name} value={entry} onChange={next => onChange(value.map((v, n) => n === i ? next : v))} /><Button variant="outline" type="button" onClick={() => onChange(value.filter((_, n) => n !== i))}>Убрать пункт {i + 1}</Button></div>)}<Button type="button" variant="outline" onClick={() => onChange([...value, structuredClone(templates[name])])}>Добавить пункт</Button></fieldset>
  }
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const image = 'url' in object
    async function upload(file?: File) {
      if (!file) return
      setUploading(true); setError('')
      onUpload?.(1)
      try {
        const form = new FormData(); form.append('image', file)
        const res = await fetch('/api/admin/media', { method: 'POST', body: form })
        const data = await res.json(); if (!res.ok) throw new Error(data.message)
        onChange(data)
      } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка загрузки') }
      finally { setUploading(false); onUpload?.(-1) }
    }
    return <fieldset disabled={uploading} className="min-w-0 space-y-3 border border-border p-4"><legend className="px-1 text-sm font-semibold">{label(name)}</legend>{Object.entries(object).filter(([k]) => !['width', 'height'].includes(k)).map(([k, v]) => <FieldEditor onUpload={onUpload} key={k} name={k} value={v} onChange={next => onChange({ ...object, [k]: next })} />)}{image && <label className="block space-y-2 text-sm">Загрузить изображение до 10 МБ<input className="block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => void upload(e.target.files?.[0])} /></label>}{uploading && <p role="status">Загружаем…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{image && typeof object.url === 'string' && object.url && <a className="block text-sm text-primary underline" href={object.url} target="_blank" rel="noreferrer"><Image src={String(object.url)} alt={String(object.alt ?? "Изображение")} width={320} height={200} className="mb-2 max-h-48 w-full object-contain" />Посмотреть изображение</a>}</fieldset>
  }
  const long = ['body', 'excerpt', 'description', 'task', 'solution', 'result', 'summary'].includes(name)
  return <label className="block min-w-0 space-y-2"><span className="text-sm font-medium">{label(name)}</span>{long ? <textarea rows={name === 'body' ? 12 : 3} className={inputClass} value={String(value ?? '')} onChange={e => onChange(e.target.value)} /> : <input className={inputClass} type={typeof value === 'number' ? 'number' : 'text'} value={String(value ?? '')} onChange={e => onChange(typeof value === 'number' ? Number(e.target.value) : e.target.value)} />}</label>
}

