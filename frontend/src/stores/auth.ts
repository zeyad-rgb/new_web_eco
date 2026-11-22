import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  joinedDate: string
  clubTier: 'برونزي' | 'فضي' | 'ذهبي'
  points: number
  role?: 'customer' | 'catalog_manager' | 'admin'
}

export interface StaffSession {
  signedIn: boolean
  role: 'admin' | 'catalog_manager' | null
  email?: string
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<UserProfile | null>(null)
    const token = ref<string | null>(null)
    const csrfToken = ref<string>('')
    const staffSession = ref<StaffSession | null>(null)

    const isStaff = computed(() => !!staffSession.value?.signedIn || user.value?.role === 'admin' || user.value?.role === 'catalog_manager')
    const isAdmin = computed(() => staffSession.value?.role === 'admin' || user.value?.role === 'admin')
    const isAuthenticated = computed(() => !!user.value || !!staffSession.value?.signedIn)

    async function fetchCsrfToken(): Promise<string> {
      try {
        const res = await fetch('/staff/session', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        })
        if (!res.ok) { setStaffSession(null); return csrfToken.value }
        const data = await res.json()
        if (data.csrf) {
          csrfToken.value = data.csrf
        }
        if (data.signedIn) {
          setStaffSession({
            signedIn: true,
            role: data.role,
            email: user.value?.email || 'admin@studioactive.com',
          })
        }
        if (!data.signedIn) setStaffSession(null)
        return csrfToken.value
      } catch {
        setStaffSession(null)
        return csrfToken.value
      }
    }

    async function customerRequest(path: string, data?: object): Promise<boolean> {
      const csrf = await fetchCsrfToken()
      const response = await fetch('/customer/' + path, {
        method: data ? 'POST' : 'GET', credentials: 'include',
        headers: { Accept: 'application/json', ...(data ? { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf } : {}) },
        body: data ? JSON.stringify(data) : undefined,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Authentication failed.')
      staffSession.value = null
      user.value = result.user || null
      csrfToken.value = result.csrf || csrf
      token.value = null
      return !!user.value
    }

    async function login(email: string, password: string): Promise<boolean> {
      return customerRequest('login', { email, password })
    }

    function acceptCustomer(profile: UserProfile, csrf: string) {
      user.value = profile
      staffSession.value = null
      token.value = null
      csrfToken.value = csrf
    }

    function loginAsStaff(email: string, role: 'admin' | 'catalog_manager' = 'admin', staffCsrf?: string) {
      if (staffCsrf) {
        csrfToken.value = staffCsrf
      }
      const sessionToken = staffCsrf || csrfToken.value || 'stf_' + crypto.randomUUID().replace(/-/g, '')
      staffSession.value = { signedIn: true, role, email }
      user.value = {
        id: 'staff-' + (role || 'manager'),
        name: role === 'admin' ? 'Admin / مسؤول المتجر' : 'Staff / مدير المنتجات',
        email,
        phone: '',
        joinedDate: 'نوفمبر ٢٠٢٦',
        clubTier: 'ذهبي',
        points: 9999,
        role,
      }
      token.value = sessionToken
    }

    function setStaffSession(session: StaffSession | null) {
      staffSession.value = session
      if (session?.signedIn && !user.value) {
        user.value = {
          id: 'staff-session',
          name: session.role === 'admin' ? 'Admin / مسؤول المتجر' : 'Staff / مدير المنتجات',
          email: session.email || 'admin@studioactive.com',
          phone: '',
          joinedDate: 'نوفمبر ٢٠٢٦',
          clubTier: 'ذهبي',
          points: 9999,
          role: session.role || 'admin',
        }
      } else if (!session?.signedIn && (user.value?.role === 'admin' || user.value?.role === 'catalog_manager')) {
        user.value = null
      }
    }

    async function checkStaffSession(): Promise<boolean> {
      try {
        const res = await fetch('/staff/session', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        })
        if (!res.ok) { setStaffSession(null); return false }
        const data = await res.json()
        if (data.csrf) {
          csrfToken.value = data.csrf
        }
        if (data.signedIn) {
          setStaffSession({
            signedIn: true,
            role: data.role,
            email: user.value?.email || 'admin@studioactive.com',
          })
          if (data.csrf) {
            token.value = data.csrf
          }
          return true
        } else {
          setStaffSession(null)
          return false
        }
      } catch {
        return false
      }
    }

    async function register(name: string, email: string, phone: string, password: string): Promise<boolean> {
      return customerRequest('register', { name, email, phone, password })
    }

    async function logout(): Promise<void> {
      const activeCsrf = csrfToken.value
      // Clear state immediately in Pinia and LocalStorage
      user.value = null
      token.value = null
      staffSession.value = null
      try {
        localStorage.removeItem('ecomars_auth')
      } catch {
        // Ignore
      }

      // Instruct server to invalidate session and regenerate token
      try {
        const res = await fetch('/staff/logout', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            ...(activeCsrf ? { 'X-CSRF-TOKEN': activeCsrf } : {}),
          },
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.csrf) {
            csrfToken.value = data.csrf
          }
        } else {
          await fetchCsrfToken()
        }
      } catch {
        // Offline safe
      }
    }

    return {
      user,
      acceptCustomer,
      refreshCustomer: () => customerRequest('session'),
      token,
      csrfToken,
      staffSession,
      isStaff,
      isAdmin,
      isAuthenticated,
      login,
      loginAsStaff,
      setStaffSession,
      checkStaffSession,
      fetchCsrfToken,
      register,
      logout,
    }
  },
  {
    persist: {
      key: 'ecomars_auth',
      pick: ['user'],
    },
  }
)
