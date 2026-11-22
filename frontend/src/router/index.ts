import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'EcoMars | الرئيسية' },
  },
  {
    path: '/discover',
    name: 'discover',
    component: () => import('../views/DiscoverView.vue'),
    meta: { title: 'EcoMars | اكتشف' },
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('../views/ShopView.vue'),
    meta: { title: 'EcoMars | المتجر' },
  },
  {
    path: '/shop/category/:slug',
    redirect: (to: any) => ({ path: '/shop', query: { category: to.params.slug } }),
  },
  {
    path: '/shop/collection/:slug',
    redirect: (to: any) => ({ path: '/shop', query: { collection: to.params.slug } }),
  },
  {
    path: '/shop/type/:slug',
    redirect: (to: any) => ({ path: '/shop', query: { type: to.params.slug } }),
  },
  {
    path: '/shop/favorites',
    redirect: () => ({ path: '/shop', query: { favorites: 'true' } }),
  },
  {
    path: '/product/:id',
    name: 'product-detail',
    component: () => import('../views/ProductDetailView.vue'),
    meta: { title: 'EcoMars | تفاصيل المنتج' },
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../views/CartView.vue'),
    meta: { title: 'EcoMars | السلة' },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/CheckoutView.vue'),
    meta: { title: 'EcoMars | إتمام الطلب' },
  },
  {
    path: '/receipt',
    name: 'receipt',
    component: () => import('../views/ReceiptView.vue'),
    meta: { title: 'EcoMars | تأكيد الطلب' },
  },
  {
    path: '/faq',
    name: 'faq',
    component: () => import('../views/FaqView.vue'),
    meta: { title: 'EcoMars | الأسئلة الشائعة' },
  },
  {
    path: '/shipping',
    name: 'shipping',
    component: () => import('../views/ShippingPolicyView.vue'),
    meta: { title: 'EcoMars | الشحن والتوصيل' },
  },
  {
    path: '/returns',
    name: 'returns',
    component: () => import('../views/ReturnPolicyView.vue'),
    meta: { title: 'EcoMars | الإرجاع والاستبدال' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: { title: 'EcoMars | عن الشركة' },
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('../views/TermsView.vue'),
    meta: { title: 'EcoMars | الشروط والأحكام' },
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyView.vue'),
    meta: { title: 'EcoMars | سياسة الخصوصية' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'EcoMars | تسجيل الدخول' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: 'EcoMars | إنشاء حساب جديد' },
  },
  {
    path: '/account',
    name: 'account',
    redirect: () => '/login',
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: 'EcoMars | حسابي ونادي المكافآت' },
  },
  {
    path: '/admin/:section?/:productId?/:initialCategory?',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: { title: 'EcoMars | إدارة المتجر' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'EcoMars | الصفحة غير موجودة' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.beforeEach(async (to, _from, next) => {
  if (to.path.startsWith('/admin')) {
    const auth = useAuthStore()

    if (!(await auth.checkStaffSession())) {
      return next('/login?redirect=' + encodeURIComponent(to.fullPath))
    }
  }
  next()
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
})
