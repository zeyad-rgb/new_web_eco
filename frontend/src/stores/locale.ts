import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Locale = 'en' | 'ar'

export const translations = {
  en: {
    // Nav & Mega Menu
    'nav.brand': 'STUDIO ACTIVE',
    'nav.all_products': 'ALL PRODUCTS',
    'nav.men': 'MEN',
    'nav.women': 'WOMEN',
    'nav.kids': 'KIDS',
    'nav.sports': 'SPORTS',
    'nav.training': 'TRAINING',
    'nav.lifestyle': 'LIFESTYLE',
    'nav.sale': 'SALE',
    'nav.latest': 'NEW ARRIVALS',
    'nav.bestsellers': 'BEST SELLERS',
    'nav.search': 'Search',
    'nav.search_placeholder': 'Search products, styles, collections…',
    'nav.wishlist': 'Wishlist',
    'nav.account': 'Account',
    'nav.bag': 'Bag',
    'nav.cart': 'Bag',
    'nav.language': 'العربية',
    'nav.switch_lang': 'Switch to Arabic',

    // Announcement Bar
    'announcement.shipping': 'FREE EXPRESS SHIPPING ON ORDERS OVER 1,000 EGP',
    'announcement.discount': 'JOIN THE CLUB — GET 10% OFF YOUR FIRST ORDER',
    'announcement.returns': 'EASY 14-DAY EXCHANGES & RETURNS ACROSS EGYPT',

    // Hero
    'hero.badge': 'SUMMER 2026 ACTIVEWEAR',
    'hero.title_1': 'ENGINEERED FOR POWER',
    'hero.sub_1': 'High-performance athletic gear built for intense training and daily comfort.',
    'hero.cta_shop': 'SHOP THE COLLECTION',
    'hero.cta_explore': 'EXPLORE NEW ARRIVALS',
    'hero.title_2': 'LIMITLESS MOTION',
    'hero.sub_2': 'Lightweight breathable fabrics designed to keep you cool and dry.',
    'hero.title_3': 'NEXT-GEN STREETWEAR',
    'hero.sub_3': 'Athletic apparel designed for both the gym floor and urban life.',

    // Common Buttons & Labels
    'common.add_to_bag': 'ADD TO BAG',
    'common.quick_add': 'QUICK ADD',
    'common.out_of_stock': 'SOLD OUT',
    'common.new': 'NEW',
    'common.bestseller': 'BESTSELLER',
    'common.select_size': 'SELECT SIZE',
    'common.size_guide': 'Size Guide',
    'common.color': 'Color',
    'common.size': 'Size',
    'common.qty': 'Quantity',
    'common.price': 'Price',
    'common.free': 'FREE',
    'common.egp': 'EGP',
    'common.currency': 'EGP',
    'common.subtotal': 'Subtotal',
    'common.total': 'Total',
    'common.shipping': 'Shipping',
    'common.checkout': 'CHECKOUT',
    'common.view_cart': 'VIEW BAG',
    'common.apply': 'Apply',
    'common.promo_placeholder': 'Promo code (e.g. ECOMARS10)',
    'common.remove': 'Remove',
    'common.edit': 'Edit',
    'common.loading': 'Loading…',

    // Shop & Filters
    'shop.title': 'All Products',
    'shop.filter_sort': 'Filter & Sort',
    'shop.sort_by': 'Sort By',
    'shop.sort_default': 'Featured',
    'shop.sort_newest': 'Newest First',
    'shop.sort_price_low': 'Price: Low to High',
    'shop.sort_price_high': 'Price: High to Low',
    'shop.search_model_placeholder': 'Search by model, style, or color…',
    'shop.all_collections': 'All Collections',
    'shop.all_categories': 'All Categories',
    'shop.all_types': 'All Types',
    'shop.all_sizes': 'All Sizes',
    'shop.all_fits': 'All Fits',
    'shop.all_colors': 'All Colors',
    'shop.filter_by_color': 'Filter by color',
    'shop.filter_all': 'All',
    'shop.filter_category': 'Category',
    'shop.filter_collection': 'Collection',
    'shop.filter_color': 'Color',
    'shop.filter_size': 'Size',
    'shop.filter_fit': 'Fit',
    'shop.clear_all': 'Clear All',
    'shop.active_filters': 'Applied Filters:',
    'shop.no_results': 'No matching products found',
    'shop.no_results_sub': 'Try adjusting your search keywords or clear some filters to see the full activewear collection.',
    'shop.items_count': 'products',

    // Cart Drawer & Cart View
    'cart.title': 'Shopping Bag',
    'cart.empty_title': 'Your bag is empty',
    'cart.empty_desc': 'Looks like you haven\'t added any activewear yet. Explore our latest gear and start moving!',
    'cart.explore_shop': 'SHOP ALL PRODUCTS',
    'cart.start_shopping': 'START SHOPPING NOW',
    'cart.free_shipping_left': 'Add {amount} more for FREE shipping!',
    'cart.free_shipping_unlocked': '🎉 Congratulations! You have unlocked FREE shipping.',
    'cart.taxes_notice': 'Shipping & taxes calculated at checkout',
    'cart.back_to_shop': 'All Products',
    'cart.clear_bag': 'Empty Bag',
    'cart.feature_free_shipping': 'Free Shipping',
    'cart.feature_free_shipping_sub': 'On orders over 1,000 EGP',
    'cart.feature_free_returns': 'Free Returns & Exchange',
    'cart.feature_free_returns_sub': 'Within 14 days of delivery',
    'cart.feature_secure_pay': '100% Secure Payment',
    'cart.feature_secure_pay_sub': 'Cash on delivery or card',
    'cart.size_label': 'Size:',
    'cart.unit_price': 'Unit Price:',
    'cart.stock_exceeded': 'Requested quantity exceeds available stock (Only {count} left)',
    'cart.low_stock': '⚡ Only {count} items left in stock',
    'cart.remove': 'Remove',
    'cart.order_summary': 'Order Summary',
    'cart.subtotal': 'Subtotal ({count} {unit})',
    'cart.unit_item': 'item',
    'cart.unit_items': 'items',
    'cart.est_shipping': 'Estimated Shipping',
    'cart.free_badge': 'FREE',
    'cart.free_shipping_hint': 'Add {amount} more for free shipping.',
    'cart.est_total': 'Estimated Total',
    'cart.vat_included': 'Inclusive of VAT',
    'cart.stock_alert': '⚠️ Please adjust quantities that exceed available stock before proceeding.',
    'cart.proceed_checkout': 'PROCEED TO CHECKOUT',
    'cart.continue_shopping': 'Continue Shopping',
    'cart.trust_secure': '100% Encrypted & Secure Payment',
    'cart.trust_fast': 'Fast Delivery & Live Tracking',
    'cart.trust_returns': 'Free 14-Day Returns & Exchange',

    // Checkout
    'checkout.title': 'Fast & Secure Checkout',
    'checkout.page_title': 'Checkout & Payment',
    'checkout.subtitle': 'Enter delivery details and select your preferred payment method.',
    'checkout.empty_title': 'Your shopping bag is empty',
    'checkout.empty_desc': 'You cannot proceed to checkout without adding products first.',
    'checkout.back_to_shop': 'RETURN TO SHOP',
    'checkout.demo_fill': '⚡ Fill Fast Demo Details',
    'checkout.name_placeholder': 'e.g. Alex Morgan',
    'checkout.city_placeholder': 'e.g. New Cairo, Maadi, Smouha...',
    'checkout.address_placeholder': 'Street name, building #, floor, apt #...',
    'checkout.notes_placeholder': 'Nearby landmarks, building code, or preferred timing...',
    'checkout.shipping_std_desc': 'Safe doorstep delivery across all Egyptian governorates',
    'checkout.shipping_exp_desc': 'Priority expedited handling & delivery for Cairo & Giza',
    'checkout.free': 'FREE',
    'checkout.subtotal': 'Subtotal:',
    'checkout.shipping_fee': 'Shipping Fee:',
    'checkout.applied_discount': 'Discount Applied:',
    'checkout.grand_total': 'Grand Total:',
    'checkout.submitting': 'Processing your order...',
    'checkout.confirm_with_total': 'CONFIRM ORDER · {total} →',
    'checkout.promo_placeholder': 'Promo Code (try ECOMARS10)',
    'checkout.apply_code': 'APPLY',
    'checkout.code_applied': 'APPLIED',
    'checkout.code_success': '✓ 10% discount applied successfully!',
    'checkout.security_note': '100% Secure Checkout. Your personal and payment data is fully encrypted.',
    'checkout.size_lbl': 'Size:',
    'checkout.step_1': 'Shipping Address',
    'checkout.step_2': 'Shipping Method',
    'checkout.step_3': 'Payment Method',
    'checkout.full_name': 'Full Name *',
    'checkout.phone': 'Mobile Phone *',
    'checkout.alt_phone': 'Alternative Phone (Optional)',
    'checkout.governorate': 'Governorate *',
    'checkout.city': 'City / Area *',
    'checkout.address': 'Detailed Address *',
    'checkout.notes': 'Delivery Instructions (Optional)',
    'checkout.shipping_std': 'Standard Delivery (3-5 business days)',
    'checkout.shipping_exp': 'Express Delivery (24-48 hours)',
    'checkout.cod': 'Cash on Delivery (COD)',
    'checkout.cod_desc': 'Pay in cash upon inspection and delivery',
    'checkout.card': 'Credit / Debit Card (Visa, Mastercard, Meeza)',
    'checkout.card_desc': 'Secure instant payment via encrypted 256-bit gateway',
    'checkout.instapay': 'InstaPay / Mobile Wallet',
    'checkout.instapay_desc': 'Instant transfer via InstaPay app or digital wallet',
    'checkout.popular': 'Most Popular',
    'checkout.secure': 'Encrypted',
    'checkout.instant': 'Instant',
    'checkout.order_summary': 'Order Summary',
    'checkout.confirm_order': 'PLACE ORDER',
    'checkout.guarantee_secure': '100% Secure Payment',
    'checkout.guarantee_returns': '14-Day Free Returns',
    'checkout.guarantee_inspect': 'Inspect Before Payment',

    // Receipt
    'receipt.title': 'THANK YOU FOR YOUR ORDER!',
    'receipt.subtitle': 'Your order has been confirmed. We have sent confirmation details and will notify you when it ships.',
    'receipt.order_num': 'Order Number',
    'receipt.copy': 'Copy 📋',
    'receipt.copied': 'Copied ✓',
    'receipt.total_amount': 'Total Amount',
    'receipt.payment_method': 'Payment Method',
    'receipt.timeline_title': 'Order Progress & Fulfillment',
    'receipt.step_confirmed': 'Confirmed',
    'receipt.step_processing': 'Preparing',
    'receipt.step_shipped': 'On The Way',
    'receipt.step_delivered': 'Delivered',
    'receipt.delivery_time_title': 'Estimated Delivery',
    'receipt.delivery_time_desc': 'Within 2 to 4 business days across Egypt.',
    'receipt.returns_title': 'Free Returns & Exchange',
    'receipt.returns_desc': 'Hassle-free 14-day exchange and returns from delivery date.',
    'receipt.support_title': 'Customer Care',
    'receipt.support_desc': 'Support team is available daily from 9:00 AM to 10:00 PM.',
    'receipt.continue_shopping': 'CONTINUE SHOPPING →',
    'receipt.print_receipt': '🖨 Print Receipt',
    'receipt.empty_title': 'No active order found',
    'receipt.empty_desc': 'You have not placed an order in this browser session yet.',

    // Profile & Member Club
    'profile.club_title': 'EcoMars Club Member',
    'profile.welcome': 'Welcome, {name}!',
    'profile.member_since': 'Member since {date}',
    'profile.reward_points': 'Reward Points',
    'profile.points_hint': 'Earn 10 points for every 100 EGP spent to redeem for exclusive discounts and perks.',
    'profile.account_info': 'Account Information',
    'profile.name': 'Name:',
    'profile.email': 'Email:',
    'profile.phone': 'Mobile:',
    'profile.quick_activity': 'Quick Activity',
    'profile.wishlist': 'Wishlist Items ♡',
    'profile.in_cart': 'In Shopping Bag 🛒',
    'profile.exclusive_benefits': 'Exclusive Membership Benefits',
    'profile.free_shipping_benefit': 'Free Shipping Always',
    'profile.free_shipping_sub': 'On orders over 800 EGP instead of 1,000 EGP',
    'profile.birthday_discount': 'Birthday Reward',
    'profile.birthday_sub': '20% off discount voucher delivered to your inbox',
    'profile.early_access': 'Early Sale Access',
    'profile.early_access_sub': 'Shop new drops and seasonal sales 24 hours early',
    'profile.track_package': 'Track Your Activewear Order',
    'profile.track_subtitle': 'Enter your order reference ID to check real-time fulfillment status.',
    'profile.track_input_placeholder': 'e.g. c8a31e84-5f...',
    'profile.track_btn': 'Track Order 🔍',
    'profile.tracking_loading': 'Searching...',
    'profile.order_status': 'Order Status',
    'profile.amount_due': 'Amount Due',
    'profile.sign_out': 'Sign Out',

    // Search
    'search.popular': 'Trending Searches',
    'search.matching_categories': 'Matching Categories',
    'search.suggested_products': 'Suggested Products',
    'search.no_products_found': 'No products found matching "{query}". Press search to view all results.',
    'search.see_all_results': 'View all results for "{query}" →',
    'search.clear': 'Clear',
    'search.cancel': 'Cancel',

    // Auth
    'auth.login_title': 'Welcome Back',
    'auth.login_subtitle': 'Sign in to access your orders and member rewards.',
    'auth.register_title': 'Create an Account',
    'auth.register_subtitle': 'Create an account to save your details and follow your orders.',
    'auth.email': 'Email Address *',
    'auth.password': 'Password *',
    'auth.confirm_password': 'Confirm Password *',
    'auth.remember_me': 'Remember me on this device',
    'auth.forgot_password': 'Forgot password?',
    'auth.sign_in_btn': 'SIGN IN →',
    'auth.register_btn': 'CREATE ACCOUNT →',
    'auth.have_account': 'Already have an account?',
    'auth.no_account': 'Don\'t have an account yet?',
    'auth.agree_terms': 'I agree to the Terms of Service and Privacy Policy.',

    // Footer
    'footer.brand_desc': 'Specialized high-performance athletic apparel and gear designed to give you comfort, durability, and freedom of motion during intense workouts and everyday lifestyle.',
    'footer.shop_by': 'Shop By Category',
    'footer.help': 'Customer Service & Support',
    'footer.about': 'About EcoMars',
    'footer.faq': 'FAQ & Help Center',
    'footer.shipping_policy': 'Shipping & Delivery',
    'footer.returns_policy': 'Returns & Exchanges',
    'footer.terms': 'Terms & Conditions',
    'footer.privacy': 'Privacy Policy',
    'footer.rights': '© 2026 EcoMars · Studio Active. All Rights Reserved.',
    'footer.made_in': 'Engineered with passion in Egypt 🇪🇬',

    // PDP Details
    'pdp.free_shipping_notice': 'Free delivery on orders over 1,000 EGP',
    'pdp.easy_returns_notice': 'Free 14-day exchange & return guarantee',
    'pdp.specs': 'Specifications & Technology',
    'pdp.care': 'Care Instructions',
    'pdp.reviews': 'Reviews & Ratings',
    'pdp.related': 'YOU MIGHT ALSO LIKE',
    'pdp.view_all': 'VIEW ALL →',
  },
  ar: {
    // Nav & Mega Menu
    'nav.brand': 'STUDIO ACTIVE',
    'nav.all_products': 'كل المنتجات',
    'nav.men': 'رجال',
    'nav.women': 'نساء',
    'nav.kids': 'أطفال',
    'nav.sports': 'رياضة',
    'nav.training': 'التمرين',
    'nav.lifestyle': 'لايف ستايل',
    'nav.sale': 'تخفيضات',
    'nav.latest': 'وصل حديثاً',
    'nav.bestsellers': 'الأكثر مبيعاً',
    'nav.search': 'بحث',
    'nav.search_placeholder': 'ابحث عن موديل، تشكيلة، أو مقاس…',
    'nav.wishlist': 'المفضلة',
    'nav.account': 'حسابي',
    'nav.bag': 'السلة',
    'nav.cart': 'السلة',
    'nav.language': 'English',
    'nav.switch_lang': 'Switch to English',

    // Announcement Bar
    'announcement.shipping': 'شحن مجاني لكافة الطلبات فوق ١٬٠٠٠ جنيه مصري',
    'announcement.discount': 'انضم لنادي الأعضاء — واحصل على خصم ١٠٪ على أول طلب',
    'announcement.returns': 'استبدال واسترجاع مجاني وسهل خلال ١٤ يوماً في جميع المحافظات',

    // Hero
    'hero.badge': 'تشكيلة صيف ٢٠٢٦ الرياضية',
    'hero.title_1': 'مصممة لأعلى أداء',
    'hero.sub_1': 'ملابس رياضية عالية الجودة صُممت للتمارين الشاقة والراحة اليومية القصوى.',
    'hero.cta_shop': 'تسوق التشكيلة الآن',
    'hero.cta_explore': 'اكتشف وصل حديثاً',
    'hero.title_2': 'حركة بلا حدود',
    'hero.sub_2': 'أقمشة تقنية خفيفة تمنحك الانتعاش والجفاف طوال فترة التمرين.',
    'hero.title_3': 'أناقة الشارع الرياضية',
    'hero.sub_3': 'تصاميم تجمع بين كفاءة الجيم وأناقة المظهر اليومي.',

    // Common Buttons & Labels
    'common.add_to_bag': 'أضف للحقيبة',
    'common.quick_add': 'إضافة سريعة',
    'common.out_of_stock': 'نفد من المخزون',
    'common.new': 'جديد',
    'common.bestseller': 'الأكثر طلباً',
    'common.select_size': 'اختر المقاس',
    'common.size_guide': 'دليل المقاسات',
    'common.color': 'اللون',
    'common.size': 'المقاس',
    'common.qty': 'الكمية',
    'common.price': 'السعر',
    'common.free': 'مجاني',
    'common.egp': 'ج.م',
    'common.currency': 'جنيه',
    'common.subtotal': 'المجموع الفرعي',
    'common.total': 'الإجمالي النهائي',
    'common.shipping': 'الشحن',
    'common.checkout': 'إتمام الطلب',
    'common.view_cart': 'عرض السلة',
    'common.apply': 'تطبيق',
    'common.promo_placeholder': 'كود الخصم (مثل ECOMARS10)',
    'common.remove': 'إزالة',
    'common.edit': 'تعديل',
    'common.loading': 'جاري التحميل…',

    // Shop & Filters
    'shop.title': 'كل المنتجات',
    'shop.filter_sort': 'فلترة وترتيب',
    'shop.sort_by': 'الترتيب',
    'shop.sort_default': 'الترتيب الافتراضي',
    'shop.sort_newest': 'وصل حديثًا أولًا',
    'shop.sort_price_low': 'السعر من الأقل للأعلى',
    'shop.sort_price_high': 'السعر من الأعلى للأقل',
    'shop.search_model_placeholder': 'ابحث عن موديل، تشكيلة، أو لون…',
    'shop.all_collections': 'كل المجموعات',
    'shop.all_categories': 'كل التصنيفات',
    'shop.all_types': 'كل الأنواع',
    'shop.all_sizes': 'كل المقاسات',
    'shop.all_fits': 'كل القصّات',
    'shop.all_colors': 'كل الألوان',
    'shop.filter_by_color': 'فلترة بالألوان',
    'shop.filter_all': 'الكل',
    'shop.filter_category': 'التصنيف',
    'shop.filter_collection': 'المجموعة',
    'shop.filter_color': 'اللون',
    'shop.filter_size': 'المقاس',
    'shop.filter_fit': 'القصّة',
    'shop.clear_all': 'مسح الكل',
    'shop.active_filters': 'الفلاتر المطبقة:',
    'shop.no_results': 'لم نتمكن من العثور على أي نتائج مطابقة',
    'shop.no_results_sub': 'جرّب التحقق من كتابة الكلمات، أو إزالة بعض الفلاتر لعرض التشكيلة كاملة.',
    'shop.items_count': 'منتج',

    // Cart Drawer & Cart View
    'cart.title': 'حقيبة التسوق',
    'cart.empty_title': 'حقيبتك فارغة',
    'cart.empty_desc': 'لم تقم بإضافة أي منتجات إلى حقيبة التسوق بعد. استكشف أحدث التشكيلات والعروض الرياضية الحصرية!',
    'cart.explore_shop': 'تصفح كل المنتجات ←',
    'cart.start_shopping': 'ابدأ التسوق الآن',
    'cart.free_shipping_left': 'أضف منتجات بقيمة {amount} للحصول على شحن مجاني!',
    'cart.free_shipping_unlocked': '🎉 تهانينا! طلبك مؤهل الآن للحصول على شحن مجاني.',
    'cart.taxes_notice': 'تكلفة الشحن تُحسب عند إتمام الدفع',
    'cart.back_to_shop': 'كل المنتجات',
    'cart.clear_bag': 'تفريغ الحقيبة',
    'cart.feature_free_shipping': 'شحن مجاني',
    'cart.feature_free_shipping_sub': 'للطلبات الأكثر من ١,٠٠٠ ج.م',
    'cart.feature_free_returns': 'إرجاع واستبدال مجاني',
    'cart.feature_free_returns_sub': 'خلال ١٤ يوم من الاستلام',
    'cart.feature_secure_pay': 'دفع آمن ١٠٠٪',
    'cart.feature_secure_pay_sub': 'نقداً عند الاستلام أو بالبطاقة',
    'cart.size_label': 'المقاس:',
    'cart.unit_price': 'سعر القطعة:',
    'cart.stock_exceeded': 'الكمية المطلوبة تتجاوز المخزون المتوفر (المتاح: {count} فقط)',
    'cart.low_stock': '⚡ متبقي {count} قطع فقط في المخزون',
    'cart.remove': 'إزالة',
    'cart.order_summary': 'ملخص الطلب',
    'cart.subtotal': 'المجموع الفرعي ({count} {unit})',
    'cart.unit_item': 'قطعة',
    'cart.unit_items': 'قطع',
    'cart.est_shipping': 'الشحن التقديري',
    'cart.free_badge': 'مجاني',
    'cart.free_shipping_hint': 'أضف منتجات بقيمة {amount} للشحن المجاني.',
    'cart.est_total': 'المجموع الكلي التقديري',
    'cart.vat_included': 'شامل ضريبة القيمة المضافة',
    'cart.stock_alert': '⚠️ يرجى تصحيح الكميات التي تتجاوز المخزون قبل المتابعة لإتمام الطلب.',
    'cart.proceed_checkout': 'المتابعة لإتمام الطلب',
    'cart.continue_shopping': 'متابعة التسوق',
    'cart.trust_secure': 'دفع آمن ومشفر بنسبة ١٠٠٪',
    'cart.trust_fast': 'توصيل سريع وتتبع فوري للشحنة',
    'cart.trust_returns': 'إرجاع واستبدال مجاني خلال ١٤ يوم',

    // Checkout
    'checkout.title': 'إتمام الطلب السريع والآمن',
    'checkout.page_title': 'إتمام الطلب والدفع',
    'checkout.subtitle': 'أدخل بيانات التوصيل واختر طريقة الدفع المناسبة لك.',
    'checkout.empty_title': 'حقيبة التسوق فارغة',
    'checkout.empty_desc': 'لا يمكنك إتمام الطلب بدون إضافة منتجات أولاً.',
    'checkout.back_to_shop': 'العودة للتسوق',
    'checkout.demo_fill': '⚡ ملء بيانات تجريبية سريعة',
    'checkout.name_placeholder': 'مثال: أحمد محمد',
    'checkout.city_placeholder': 'مثال: مصر الجديدة، التجمع، سموحة…',
    'checkout.address_placeholder': 'الشارع، رقم العقار، الدور، الشقة…',
    'checkout.notes_placeholder': 'أقرب علامة مميزة أو مواعيد التسليم المفضلة…',
    'checkout.shipping_std_desc': 'توصيل آمن لباب البيت لكافة المحافظات',
    'checkout.shipping_exp_desc': 'أولوية الشحن والتسليم السريع للقاهرة والجيزة',
    'checkout.free': 'مجاني',
    'checkout.subtotal': 'المجموع الفرعي:',
    'checkout.shipping_fee': 'تكلفة الشحن:',
    'checkout.applied_discount': 'الخصم المطبق:',
    'checkout.grand_total': 'الإجمالي النهائي:',
    'checkout.submitting': 'جاري تسجيل الطلب…',
    'checkout.confirm_with_total': 'تأكيد الطلب بمبلغ {total} ←',
    'checkout.promo_placeholder': 'كود الخصم (جرب ECOMARS10)',
    'checkout.apply_code': 'تطبيق',
    'checkout.code_applied': 'تم التطبيق',
    'checkout.code_success': '✓ تم تطبيق خصم ١٠٪ بنجاح!',
    'checkout.security_note': 'تسوق آمن ١٠٠٪. بياناتك الشخصية محمية ومشفرة بالكامل.',
    'checkout.size_lbl': 'المقاس:',
    'checkout.step_1': 'بيانات التوصيل والاتصال',
    'checkout.step_2': 'خيارات الشحن',
    'checkout.step_3': 'طريقة الدفع',
    'checkout.full_name': 'الاسم بالكامل *',
    'checkout.phone': 'رقم الموبايل *',
    'checkout.alt_phone': 'رقم موبايل بديل (اختياري)',
    'checkout.governorate': 'المحافظة *',
    'checkout.city': 'المدينة / المنطقة *',
    'checkout.address': 'العنوان بالتفصيل (اسم الشارع، رقم العمارة، رقم الشقة) *',
    'checkout.notes': 'ملاحظات إضافية للتوصيل (اختياري)',
    'checkout.shipping_std': 'شحن قياسي (٣ - ٥ أيام عمل)',
    'checkout.shipping_exp': 'شحن سريع إكسبريس (خلال ٢٤ - ٤٨ ساعة)',
    'checkout.cod': 'الدفع نقداً عند الاستلام (COD)',
    'checkout.cod_desc': 'ادفع نقداً لمندوب الشحن بعد فحص ومعاينة المنتج والتأكد من المقاس',
    'checkout.card': 'بطاقة بنكية (فيزا / ماستركارد / ميزة)',
    'checkout.card_desc': 'دفع إلكتروني فوري ومحمي بتشفير أمني 256-bit عبر بوابة دفع معتمدة',
    'checkout.instapay': 'إنستاباي / محفظة إلكترونية (InstaPay / Wallets)',
    'checkout.instapay_desc': 'تحويل لحظي عبر تطبيق إنستاباي، فودافون كاش، أو منافذ فوري',
    'checkout.popular': 'الأكثر شيوعاً',
    'checkout.secure': 'آمن ومشفّر',
    'checkout.instant': 'تحويل فوري',
    'checkout.order_summary': 'ملخص الطلب',
    'checkout.confirm_order': 'تأكيد الطلب',
    'checkout.guarantee_secure': 'دفع آمن ومعتمد',
    'checkout.guarantee_returns': 'استبدال مجاني خلال ١٤ يوم',
    'checkout.guarantee_inspect': 'معاينة قبل الاستلام',

    // Receipt
    'receipt.title': 'شكرًا لطلبك من EcoMars!',
    'receipt.subtitle': 'تم استلام طلبك وتأكيده بنجاح. سنرسل لك رسالة تأكيد ومتابعة لحالة الشحنة.',
    'receipt.order_num': 'رقم الطلب',
    'receipt.copy': 'نسخ 📋',
    'receipt.copied': 'تم النسخ ✓',
    'receipt.total_amount': 'المبلغ الإجمالي',
    'receipt.payment_method': 'طريقة الدفع',
    'receipt.timeline_title': 'مراحل تنفيذ الطلب',
    'receipt.step_confirmed': 'تم التأكيد',
    'receipt.step_processing': 'جاري التجهيز',
    'receipt.step_shipped': 'في الطريق إليك',
    'receipt.step_delivered': 'تم التسليم',
    'receipt.delivery_time_title': 'موعد التوصيل المتوقع',
    'receipt.delivery_time_desc': 'خلال 2 إلى 4 أيام عمل لكافة محافظات مصر.',
    'receipt.returns_title': 'سياسة الإرجاع والاستبدال',
    'receipt.returns_desc': 'استبدال واسترجاع مجاني وسهل خلال 14 يومًا من تاريخ الاستلام.',
    'receipt.support_title': 'خدمة العملاء',
    'receipt.support_desc': 'فريق الدعم متواجد لمساعدتك يوميًا من 9 صباحًا حتى 10 مساءً.',
    'receipt.continue_shopping': 'متابعة التسوق ←',
    'receipt.print_receipt': '🖨 طباعة الإيصال',
    'receipt.empty_title': 'لا توجد بيانات لطلب حالي',
    'receipt.empty_desc': 'يبدو أنك لم تقم بإنهاء أي طلب مؤخرًا في هذه الجلسة، أو تم تفريغ البيانات.',

    // Profile & Member Club
    'profile.club_title': 'نادي أعضاء EcoMars',
    'profile.welcome': 'أهلاً بك، {name}!',
    'profile.member_since': 'عضو منذ {date}',
    'profile.reward_points': 'نقطة مكافآت',
    'profile.points_hint': 'اكسب ١٠ نقاط مقابل كل ١٠٠ جنيه مشتريات لاستبدالها بخصومات حصرية وقسائم شراء.',
    'profile.account_info': 'معلومات الحساب',
    'profile.name': 'الاسم:',
    'profile.email': 'البريد الإلكتروني:',
    'profile.phone': 'رقم الموبايل:',
    'profile.quick_activity': 'النشاط السريع',
    'profile.wishlist': 'المنتجات المفضلة ♡',
    'profile.in_cart': 'في حقيبة التسوق 🛒',
    'profile.exclusive_benefits': 'مزايا عضويتك الحصرية',
    'profile.free_shipping_benefit': 'شحن مجاني دائم',
    'profile.free_shipping_sub': 'للطلبات فوق ٨٠٠ جنيه بدلاً من ١٬٠٠٠ جنيه',
    'profile.birthday_discount': 'خصم في يوم ميلادك',
    'profile.birthday_sub': 'كوبون خصم ٢٠٪ يصلك في بريدك',
    'profile.early_access': 'وصول مبكر للتخفيضات',
    'profile.early_access_sub': 'تسوق التشكيلات الجديدة قبل الجميع بـ ٢٤ ساعة',
    'profile.track_package': 'تتبع حالة شحنتك الرياضية',
    'profile.track_subtitle': 'أدخل رقم الطلب للتحقق الفوري من حالة التجهيز وموعد وصول المندوب.',
    'profile.track_input_placeholder': 'مثال: c8a31e84-5f...',
    'profile.track_btn': 'تتبع الشحنة 🔍',
    'profile.tracking_loading': 'جاري البحث…',
    'profile.order_status': 'حالة الطلب',
    'profile.amount_due': 'المبلغ المطلوب',
    'profile.sign_out': 'تسجيل الخروج',

    // Search
    'search.popular': 'الأكثر بحثاً',
    'search.matching_categories': 'الأقسام المطابقة',
    'search.suggested_products': 'المنتجات المقترحة',
    'search.no_products_found': 'لم نعثر على منتجات تطابق "{query}". اضغط بحث لتفقد كافة الخيارات.',
    'search.see_all_results': 'عرض كافة نتائج البحث عن "{query}" ←',
    'search.clear': 'مسح',
    'search.cancel': 'إلغاء',

    // Auth
    'auth.login_title': 'تسجيل الدخول',
    'auth.login_subtitle': 'أدخل بياناتك للوصول إلى حسابك ومتابعة طلباتك.',
    'auth.register_title': 'إنشاء حساب جديد',
    'auth.register_subtitle': 'أنشئ حساباً لحفظ بياناتك ومتابعة طلباتك.',
    'auth.email': 'البريد الإلكتروني *',
    'auth.password': 'كلمة المرور *',
    'auth.confirm_password': 'تأكيد كلمة المرور *',
    'auth.remember_me': 'تذكرني على هذا الجهاز',
    'auth.forgot_password': 'نسيت كلمة المرور؟',
    'auth.sign_in_btn': 'تسجيل الدخول →',
    'auth.register_btn': 'تسجيل حساب جديد →',
    'auth.have_account': 'لديك حساب بالفعل؟',
    'auth.no_account': 'ليس لديك حساب بعد؟',
    'auth.agree_terms': 'أوافق على الشروط والأحكام وسياسة الخصوصية.',

    // Footer
    'footer.brand_desc': 'علامة تجارية متخصصة في الملابس والمستلزمات الرياضية عالية الجودة، صُممت لتمنحك الراحة والمرونة أثناء التمرين وفي كل لحظة من يومك.',
    'footer.shop_by': 'تسوق حسب القسم',
    'footer.help': 'خدمة العملاء والمساعدة',
    'footer.about': 'عن EcoMars',
    'footer.faq': 'الأسئلة الشائعة',
    'footer.shipping_policy': 'الشحن ومناطق التوصيل',
    'footer.returns_policy': 'سياسة الإرجاع والاستبدال',
    'footer.terms': 'الشروط والأحكام',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.rights': '© 2026 EcoMars · Studio Active. جميع الحقوق محفوظة.',
    'footer.made_in': 'صُنع بحب في مصر 🇪🇬',

    // PDP Details
    'pdp.free_shipping_notice': 'شحن مجاني للطلبات فوق ١٬٠٠٠ جنيه',
    'pdp.easy_returns_notice': 'استبدال واسترجاع مجاني خلال ١٤ يوم',
    'pdp.specs': 'المواصفات والتقنيات الرياضية',
    'pdp.care': 'إرشادات الغسيل والعناية',
    'pdp.reviews': 'تقييمات وآراء العملاء',
    'pdp.related': 'قد يعجبك أيضاً',
    'pdp.view_all': 'تصفح الكل ←',
  },
} as const

export const useLocaleStore = defineStore('locale', () => {
  // Default to 'en' as requested by user, with stored preference
  const locale = ref<Locale>(
    (typeof window !== 'undefined' &&
      (localStorage.getItem('ecomars_lang') as Locale)) ||
      'en'
  )

  const isRTL = computed(() => locale.value === 'ar')

  function initLocale() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ecomars_lang') as Locale | null
      const initial = saved || 'en'
      applyLocale(initial)
    }
  }

  function applyLocale(newLocale: Locale) {
    locale.value = newLocale
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecomars_lang', newLocale)
      document.documentElement.lang = newLocale
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
      if (newLocale === 'ar') {
        document.body.classList.add('rtl-arabic')
        document.body.classList.remove('ltr-english')
      } else {
        document.body.classList.add('ltr-english')
        document.body.classList.remove('rtl-arabic')
      }
    }
  }

  function toggleLocale() {
    const next = locale.value === 'en' ? 'ar' : 'en'
    applyLocale(next)
    return next
  }

  function t(key: string, params?: Record<string, string | number>): string {
    const dict = translations[locale.value] as Record<string, string>
    let text = dict[key] || (translations.en as Record<string, string>)[key] || key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return text
  }

  // Localized product details helper
  function getProductName(product: { name: string; label?: string }): string {
    if (locale.value === 'en') {
      return product.label || product.name
    }
    return product.name
  }

  /** Fit values are stored in English ('Regular', 'Oversized'); show them in the page language. */
  function getFitName(fit: string | undefined | null): string {
    if (!fit) return ''
    if (locale.value === 'en') return fit
    const map: Record<string, string> = {
      slim: 'قصة ضيقة',
      regular: 'قصة عادية',
      relaxed: 'قصة مريحة',
      oversized: 'قصة واسعة',
    }
    return map[fit.trim().toLowerCase()] ?? fit
  }

  function getCategoryName(category: { name: string; slug: string }): string {
    if (locale.value === 'en') {
      const map: Record<string, string> = {
        men: 'Men',
        women: 'Women',
        kids: 'Kids',
        tees: 'T-Shirts',
        shorts: 'Shorts',
        bottoms: 'Pants & Joggers',
        'men-shoes': 'Shoes',
        'men-clothing': 'Clothing',
        'men-accessories': 'Accessories',
        'women-clothing': 'Clothing',
        'women-tees': 'T-Shirts',
        'women-shorts': 'Shorts',
        'women-shoes': 'Shoes',
        'women-accessories': 'Accessories',
        sneakers: 'Sneakers',
        caps: 'Caps',
      }
      return map[category.slug] || category.name
    }
    return category.name
  }

  return {
    locale,
    isRTL,
    initLocale,
    applyLocale,
    toggleLocale,
    t,
    getProductName,
    getCategoryName,
    getFitName,
  }
})
