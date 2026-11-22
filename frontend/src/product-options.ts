export type ColorOption = { id: string; name: string; hex: string; images: string[] }
export type ProductStock = { sku?: string; colorId?: string; color: string; size: string; stock: number }
export type EditableProduct = {
  id: string; name: string; description: string; categoryId: string; price: number;
  published: boolean; variants: ProductStock[]; colorOptions?: ColorOption[]; sizeOptions?: string[]
  /** Storefront badge shown on the product card (details.label). */
  label?: string
  /** Fit note shown under the product name (details.fit). */
  fit?: string
  /** Collection slugs this product belongs to. */
  collections?: string[]
}
