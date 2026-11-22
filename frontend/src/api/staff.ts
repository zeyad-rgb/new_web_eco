import { useAuthStore } from '../stores/auth'

async function send(path: string, options: RequestInit): Promise<{ body: any; response: Response }> {
  const auth = useAuthStore()
  const attempt = () => {
    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')
    if (options.method && options.method !== 'GET') headers.set('X-CSRF-TOKEN', auth.csrfToken)
    return fetch('/staff/' + path, { ...options, headers, credentials: 'include' })
  }
  let response = await attempt()
  if (response.status === 419 && await auth.checkStaffSession()) response = await attempt()
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const details = Object.values(body?.errors || {}).flat().filter((value): value is string => typeof value === 'string')
    const message = response.status === 413 ? 'The server rejected the upload size. Check PHP upload_max_filesize and post_max_size.'
      : response.status === 401 || response.status === 419 ? 'Your session expired. Sign in again; your product draft is retained.'
      : details.length ? [...new Set(details)].slice(0, 6).join('\n')
      : body?.message || `Request failed (${response.status}). Check the backend connection.`
    throw new Error(message)
  }
  return { body, response }
}

export async function staffRequest(path: string, options: RequestInit = {}): Promise<any> {
  return (await send(path, options)).body
}

/** GET a paginated staff list; `total` comes from the X-Total-Count header when the API sends it. */
export async function staffList<T = any>(path: string): Promise<{ items: T[]; total: number | null }> {
  const { body, response } = await send(path, {})
  const header = response.headers.get('X-Total-Count')
  return { items: Array.isArray(body) ? body : [], total: header === null ? null : Number(header) }
}
