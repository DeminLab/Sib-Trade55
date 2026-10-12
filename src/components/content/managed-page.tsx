import { pageRepository } from '@/lib/repositories'
import sanitizeHtml from 'sanitize-html'
export async function managedPage(slug: string) {
  const page = await pageRepository.getBySlug(slug)
  if (!page) return null
  return <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><h1 className="text-3xl font-semibold">{page.title}</h1>{page.excerpt && <p className="mt-3 text-muted-foreground">{page.excerpt}</p>}<div className="blog-body prose mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }} /></article>
}
