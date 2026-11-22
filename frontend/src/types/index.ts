import type { ColorOption, ProductStock, EditableProduct } from '../product-options'
import type { Category, ProductType } from '../taxonomy'

export type { ColorOption, ProductStock, EditableProduct, Category, ProductType }

export type Variant = ProductStock & { sku: string }

export type Group = { slug: string; name: string }

export type Product = {
  categoryId: string | null
  collections: string[]
  fit: string
  id: string
  name: string
  label: string
  category: string
  price: number
  image: string
  images?: string[]
  colorOptions?: ColorOption[]
  sizeOptions?: string[]
  description: string
  variants: Variant[]
}

export type ManagedProduct = Pick<Product, 'id' | 'name' | 'description' | 'price'> &
  Partial<Pick<Product, 'label' | 'image' | 'images' | 'colorOptions' | 'sizeOptions' | 'fit' | 'collections'>> & {
    categoryId: string
    published: boolean
    variants: ProductStock[]
  }

export type CartLine = {
  sku: string
  quantity: number
}

export type CartItemResolved = CartLine & {
  product: Product
  variant: Variant
}

export type CustomerInfo = {
  name: string
  phone: string
  address: string
}

export type OrderReceipt = {
  id: string
  total: number
  whatsapp?: {
    sent: boolean
    phone: string
    message: string
    whatsapp_url: string
  }
}
