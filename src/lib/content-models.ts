export const contentModels = {
  pages: { title: 'Страницы', key: 'pages', list: 'pages', fields: ['title', 'slug', 'excerpt', 'body', 'publishedAt'] },
  blog: { title: 'Блог', key: 'blog', list: 'posts', fields: ['title', 'slug', 'excerpt', 'body', 'author', 'tags', 'coverImage', 'publishedAt'] },
  cases: { title: 'Кейсы', key: 'cases', list: 'cases', fields: ['title', 'slug', 'excerpt', 'description', 'task', 'solution', 'result', 'city', 'year', 'category', 'categorySlug', 'coverImage', 'gallery', 'materials', 'characteristics', 'productionStages', 'featured', 'publishedAt'] },
  materials: { title: 'Материалы', key: 'materials', list: 'materials', fields: ['name', 'slug', 'summary', 'properties', 'applications', 'advantages', 'limitations', 'technicalData'] },
  coatings: { title: 'Покрытия', key: 'materials', list: 'coatings', fields: ['name', 'slug', 'summary', 'properties', 'applications', 'advantages', 'limitations', 'technicalData'] },
  ralColors: { title: 'Цвета RAL', key: 'materials', list: 'ralColors', fields: ['code', 'name', 'hex', 'group'] },
} as const
export type ContentCollection = keyof typeof contentModels
export const fieldLabels: Record<string, string> = {
  title: 'Название', name: 'Название', slug: 'Адрес страницы', excerpt: 'Краткое описание', body: 'Текст (HTML)', publishedAt: 'Дата публикации', author: 'Автор', tags: 'Метки', coverImage: 'Обложка',
  description: 'Описание', task: 'Задача', solution: 'Решение', result: 'Результат', city: 'Город', year: 'Год', category: 'Категория', categorySlug: 'Адрес категории', gallery: 'Галерея', materials: 'Материалы', characteristics: 'Характеристики', productionStages: 'Этапы', featured: 'Показывать в подборке',
  summary: 'Краткое описание', properties: 'Свойства', applications: 'Применение', advantages: 'Преимущества', limitations: 'Ограничения', technicalData: 'Технические данные', code: 'Код RAL', hex: 'Цвет HEX', group: 'Группа', url: 'Изображение', alt: 'Описание изображения', label: 'Название', value: 'Значение',
}
export function newContentItem(collection: ContentCollection): Record<string, unknown> {
  const common = { id: '', title: '', slug: '', excerpt: '', body: '', publishedAt: new Date().toISOString() }
  switch (collection) {
    case 'pages': return common
    case 'blog': return { ...common, author: 'Команда СИБ-ТРЕЙД', tags: [], coverImage: { url: '', alt: '' } }
    case 'cases': return { ...common, description: '', task: '', solution: '', result: '', city: '', year: new Date().getFullYear(), category: '', categorySlug: '', coverImage: { url: '', alt: '' }, gallery: [], materials: [], characteristics: [], productionStages: [], featured: false }
    case 'ralColors': return { code: '', name: '', hex: '#808080', group: '' }
    default: return { id: '', name: '', slug: '', kind: collection === 'coatings' ? 'coating' : 'material', summary: '', properties: [], applications: [], advantages: [], limitations: [], technicalData: [] }
  }
}
