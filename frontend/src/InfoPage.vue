<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{ slug: string }>()
const pages: Record<string,string> = {
  about:'&#1593;&#1606; EcoMars', contact:'&#1578;&#1608;&#1575;&#1589;&#1604; &#1605;&#1593;&#1606;&#1575;', faq:'&#1575;&#1604;&#1571;&#1587;&#1574;&#1604;&#1577; &#1575;&#1604;&#1588;&#1575;&#1574;&#1593;&#1577;',
  shipping:'&#1575;&#1604;&#1588;&#1581;&#1606; &#1608;&#1575;&#1604;&#1578;&#1608;&#1589;&#1610;&#1604;', returns:'&#1575;&#1604;&#1575;&#1587;&#1578;&#1576;&#1583;&#1575;&#1604; &#1608;&#1575;&#1604;&#1575;&#1587;&#1578;&#1585;&#1580;&#1575;&#1593;',
  privacy:'&#1587;&#1610;&#1575;&#1587;&#1577; &#1575;&#1604;&#1582;&#1589;&#1608;&#1589;&#1610;&#1577;', terms:'&#1575;&#1604;&#1588;&#1585;&#1608;&#1591; &#1608;&#1575;&#1604;&#1571;&#1581;&#1603;&#1575;&#1605;',
  'size-guide':'&#1583;&#1604;&#1610;&#1604; &#1575;&#1604;&#1605;&#1602;&#1575;&#1587;&#1575;&#1578;', track:'&#1578;&#1578;&#1576;&#1593; &#1591;&#1604;&#1576;', login:'&#1578;&#1587;&#1580;&#1610;&#1604; &#1575;&#1604;&#1583;&#1582;&#1608;&#1604;', register:'&#1573;&#1606;&#1588;&#1575;&#1569; &#1581;&#1587;&#1575;&#1576;', profile:'&#1581;&#1587;&#1575;&#1576;&#1610;', orders:'&#1591;&#1604;&#1576;&#1575;&#1578;&#1610;'
}
const title = computed(()=>pages[props.slug] ?? '&#1575;&#1604;&#1589;&#1601;&#1581;&#1577; &#1594;&#1610;&#1585; &#1605;&#1608;&#1580;&#1608;&#1583;&#1577;')
const orderId=ref(''); const notice=ref('')
const questions=[['How do I place an order?','Choose a product, color and size, add it to your cart, then enter your delivery details.'],['How can I choose a size?','Use the sizes listed on each product. A measured size chart will be added when product measurements are available.'],['Can I track an order?','Enter your order number here. Live carrier updates require a shipping provider integration.']]
function track(){notice.value=orderId.value.trim()?'Live tracking is not connected yet. Please contact store support with your order number.':'Enter your order number.'}
</script>
<template><section class="app-page info-page"><a class="back-link" href="#/">&#1575;&#1604;&#1585;&#1574;&#1610;&#1587;&#1610;&#1577;</a><h1 v-html="title"></h1>
<template v-if="slug==='about'"><p>EcoMars activewear for training and everyday movement.</p><a class="primary" href="#/shop">Shop products</a></template>
<template v-else-if="slug==='faq'"><details v-for="q in questions" :key="q[0]"><summary>{{q[0]}}</summary><p>{{q[1]}}</p></details></template>
<form v-else-if="slug==='track'" @submit.prevent="track"><label>Order number<input v-model="orderId" required autocomplete="off"></label><button class="primary">Track order</button><p v-if="notice" role="status">{{notice}}</p></form>
<template v-else-if="slug==='shipping'"><p>Shipping cost and estimated delivery are shown before order confirmation. Delivery times vary by area.</p><p>Carrier schedules and service areas will be published after the store's shipping agreement is confirmed.</p></template>
<template v-else-if="slug==='returns'"><p>The final exchange and return policy must be approved by the store before publication.</p><p>Contact customer support about an existing order.</p></template>
<template v-else-if="slug==='privacy'||slug==='terms'"><p>This policy needs review against the store's actual data handling and operating terms before launch.</p></template>
<template v-else-if="slug==='size-guide'"><p>Product size options appear on each product page. Measurement charts will be added when model measurements are entered.</p><a class="primary" href="#/shop">Browse products</a></template>
<template v-else-if="['login','register','profile','orders'].includes(slug)"><p>Customer account management needs secure authentication and account endpoints on the server. Account access is not enabled yet.</p><a class="primary" href="#/shop">Continue shopping</a></template>
<template v-else-if="slug==='contact'"><p>Customer support contact channels will be added after the store shares its official phone, email and social links.</p></template>
<template v-else><p>This address is not available.</p><a class="primary" href="#/">Home</a></template></section></template>