export function getProductImageSurface(name: string) {
  const value = name.toLocaleLowerCase("ru-RU")

  if (/светильник|фонарь|освещ/.test(value)) return "catalog-image-surface--lighting"
  if (/скам|урна|стол|кресло|лавоч/.test(value)) return "catalog-image-surface--furniture"
  if (/навес|пергол|павильон|бесед/.test(value)) return "catalog-image-surface--shelter"
  if (/ограж|забор|парков|велопарков/.test(value)) return "catalog-image-surface--infrastructure"
  if (/кормуш|живот|крс/.test(value)) return "catalog-image-surface--agriculture"

  return "catalog-image-surface--default"
}
