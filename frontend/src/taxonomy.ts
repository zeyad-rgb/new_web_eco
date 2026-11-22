export type ProductType = { slug: string; name: string }
export type Category = ProductType & { parent_slug: string | null; type_slug: string | null }

export function categoryPath(categories: Category[], slug: string | null): Category[] {
  const bySlug = new Map(categories.map(category => [category.slug, category]))
  const visited = new Set<string>()
  const path: Category[] = []
  while (slug && !visited.has(slug)) {
    visited.add(slug)
    const category = bySlug.get(slug)
    if (!category) break
    path.unshift(category)
    slug = category.parent_slug
  }
  return path
}

export function categoryRows(categories: Category[]) {
  const paths = categories.map(category => ({ category, path: categoryPath(categories, category.slug) }))
  return paths.sort((a, b) => {
    for (let index = 0; index < Math.min(a.path.length, b.path.length); index++) {
      const aPosition = categories.indexOf(a.path[index])
      const bPosition = categories.indexOf(b.path[index])
      if (aPosition !== bPosition) return aPosition - bPosition
    }
    return a.path.length - b.path.length
  })
}

export function categoryBranch(categories: Category[], slug: string) {
  const children = new Map<string, string[]>()
  for (const category of categories) {
    if (!category.parent_slug) continue
    const siblings = children.get(category.parent_slug) ?? []
    siblings.push(category.slug)
    children.set(category.parent_slug, siblings)
  }
  const included = new Set<string>()
  const pending = [slug]
  while (pending.length) {
    const current = pending.pop()!
    if (included.has(current)) continue
    included.add(current)
    for (const child of children.get(current) ?? []) pending.push(child)
  }
  return included
}
