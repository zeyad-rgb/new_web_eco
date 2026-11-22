<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
type Customer = { name:string; phone:string; address:string }
const props = defineProps<{modelValue:Customer; lines:{sku:string;quantity:number;product:{name:string;price:number};variant:{color:string;size:string}}[]; shipping:number; subtotal:number; busy:boolean; error:string; demo:boolean}>()
const emit=defineEmits<{'update:modelValue':[value:Customer];submit:[];back:[]}>()
const draft=reactive({...props.modelValue})
const governorate=ref('');const city=ref('');const step=ref(1)
const address=computed(()=>[governorate.value,city.value,draft.address].filter(Boolean).join(' - '))
const validStock=computed(()=>props.lines.length>0)
const money=(value:number)=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:'EGP'}).format(value/100)
function review(){if(address.value.length>250)return;step.value=2}
function confirm(){if(props.busy || !validStock.value)return;emit('update:modelValue',{name:draft.name,phone:draft.phone,address:address.value});emit('submit')}
</script>
<template>
<div class="checkout-layout">
<div>
<nav class="checkout-steps" aria-label="&#1582;&#1591;&#1608;&#1575;&#1578; &#1575;&#1604;&#1591;&#1604;&#1576;"><span :aria-current="step===1?'step':undefined">1. &#1575;&#1604;&#1578;&#1608;&#1589;&#1610;&#1604;</span><span :aria-current="step===2?'step':undefined">2. &#1575;&#1604;&#1605;&#1585;&#1575;&#1580;&#1593;&#1577; &#1608;&#1575;&#1604;&#1578;&#1571;&#1603;&#1610;&#1583;</span></nav>
<p v-if="demo" class="checkout-demo">&#1591;&#1604;&#1576; &#1578;&#1580;&#1585;&#1610;&#1576;&#1610; &#8212; &#1604;&#1606; &#1610;&#1578;&#1605; &#1588;&#1581;&#1606;&#1607; &#1571;&#1608; &#1578;&#1581;&#1589;&#1610;&#1604; &#1571;&#1605;&#1608;&#1575;&#1604;.</p>
<form v-if="step===1" class="checkout-address" @submit.prevent="review">
<label>&#1575;&#1604;&#1575;&#1587;&#1605; &#1576;&#1575;&#1604;&#1603;&#1575;&#1605;&#1604;<input v-model.trim="draft.name" autocomplete="name" required maxlength="120"></label>
<label>&#1585;&#1602;&#1605; &#1575;&#1604;&#1605;&#1608;&#1576;&#1575;&#1610;&#1604;<input v-model.trim="draft.phone" autocomplete="tel" type="tel" dir="ltr" required pattern="01[0125][0-9]{8}"></label>
<label>&#1575;&#1604;&#1605;&#1581;&#1575;&#1601;&#1592;&#1577;<input v-model.trim="governorate" autocomplete="address-level1" required maxlength="60"></label>
<label>&#1575;&#1604;&#1605;&#1583;&#1610;&#1606;&#1577; &#1571;&#1608; &#1575;&#1604;&#1605;&#1606;&#1591;&#1602;&#1577;<input v-model.trim="city" autocomplete="address-level2" required maxlength="60"></label>
<label>&#1575;&#1604;&#1588;&#1575;&#1585;&#1593; &#1608;&#1585;&#1602;&#1605; &#1575;&#1604;&#1605;&#1576;&#1606;&#1609; &#1608;&#1575;&#1604;&#1583;&#1608;&#1585;<input v-model.trim="draft.address" autocomplete="street-address" required maxlength="200"></label>
<p v-if="address.length>250" role="alert">&#1575;&#1604;&#1593;&#1606;&#1608;&#1575;&#1606; &#1575;&#1604;&#1603;&#1575;&#1605;&#1604; &#1610;&#1580;&#1576; &#1571;&#1604;&#1575; &#1610;&#1578;&#1580;&#1575;&#1608;&#1586; 250 &#1581;&#1585;&#1601;&#1611;&#1575;.</p>
<button class="primary" :disabled="address.length>250 || busy">&#1605;&#1585;&#1575;&#1580;&#1593;&#1577; &#1575;&#1604;&#1591;&#1604;&#1576;</button>
<button type="button" :disabled="busy" @click="emit('back')">&#1575;&#1604;&#1585;&#1580;&#1608;&#1593; &#1604;&#1604;&#1587;&#1604;&#1577;</button>
</form>
<section v-else class="checkout-review">
<h2>&#1576;&#1610;&#1575;&#1606;&#1575;&#1578; &#1575;&#1604;&#1578;&#1608;&#1589;&#1610;&#1604;</h2><p>{{draft.name}}</p><p dir="ltr">{{draft.phone}}</p><p>{{address}}</p>
<button type="button" :disabled="busy" @click="step=1">&#1578;&#1593;&#1583;&#1610;&#1604; &#1575;&#1604;&#1576;&#1610;&#1575;&#1606;&#1575;&#1578;</button>
<h2>&#1591;&#1585;&#1610;&#1602;&#1577; &#1575;&#1604;&#1583;&#1601;&#1593;</h2><p>&#1575;&#1604;&#1583;&#1601;&#1593; &#1593;&#1606;&#1583; &#1575;&#1604;&#1575;&#1587;&#1578;&#1604;&#1575;&#1605;</p>
<p v-if="error" role="alert">{{error}}</p>
<button type="button" class="primary wide" :disabled="busy || !validStock" @click="confirm">{{busy?'&#1580;&#1575;&#1585;&#1610; &#1578;&#1571;&#1603;&#1610;&#1583; &#1575;&#1604;&#1591;&#1604;&#1576;&#8230;':'&#1578;&#1571;&#1603;&#1610;&#1583; &#1575;&#1604;&#1591;&#1604;&#1576;'}}</button>
</section>
</div>
<aside class="checkout-summary"><h2>&#1605;&#1604;&#1582;&#1589; &#1575;&#1604;&#1591;&#1604;&#1576;</h2>
<div v-for="line in lines" :key="line.sku" class="checkout-summary-line"><strong>{{line.product.name}}</strong><p>{{line.variant.color}} · {{line.variant.size}} × {{line.quantity}}</p><b>{{money(line.product.price*line.quantity)}}</b></div>
<dl><dt>&#1575;&#1604;&#1605;&#1606;&#1578;&#1580;&#1575;&#1578;</dt><dd>{{money(subtotal)}}</dd><dt>&#1575;&#1604;&#1588;&#1581;&#1606;</dt><dd>{{money(shipping)}}</dd><dt>&#1575;&#1604;&#1573;&#1580;&#1605;&#1575;&#1604;&#1610;</dt><dd><strong>{{money(subtotal+shipping)}}</strong></dd></dl>
</aside>
</div>
</template>