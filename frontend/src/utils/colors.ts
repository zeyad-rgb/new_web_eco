import type { ColorOption } from '../types'

export const DEFAULT_PALETTE: Record<string, string> = {
  أسود: '#191a1d',
  أبيض: '#ffffff',
  رمادي: '#909093',
  كحلي: '#1b2a4a',
  زيتي: '#4a5320',
  بيج: '#d8cbb5',
  أحمر: '#b32626',
}

export function getColorHex(name: string, colorOptions?: ColorOption[]): string {
  const match = colorOptions?.find((option) => option.name === name)
  if (match?.hex) return match.hex
  return DEFAULT_PALETTE[name] ?? '#777777'
}
