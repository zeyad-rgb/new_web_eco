import { useAuthStore } from '../stores/auth'

export async function staffRequest(path: string, options: RequestInit = {}): Promise<any> {
  const auth = useAuthStore()
  const send = () => {
    const headers = new Headers(options.headers)
    headers.set('Accept', 'application/json')
    if (options.method && options.method !== 'GET') headers.set('X-CSRF-TOKEN', auth.csrfToken)
    return fetch('/staff/' + path, { ...options, headers, credentials: 'include' })
  }
  let response = await send()
  if (response.status === 419 && await auth.checkStaffSession()) response = await send()
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const details = Object.values(body?.errors || {}).flat().filter((value): value is string => typeof value === 'string')
    const message = response.status === 413 ? 'The server rejected the upload size. Check PHP upload_max_filesize and post_max_size.'
      : response.status === 401 || response.status === 419 ? 'Your session expired. Sign in again; your product draft is retained.'
      : details.length ? [...new Set(details)].slice(0, 6).join('\n')
      : body?.message || `Request failed (${response.status}). Check the backend connection.`
    throw new Error(message)
  }
  return body
}
