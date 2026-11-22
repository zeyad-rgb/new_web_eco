import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { stages: [{duration:'30s',target:10},{duration:'1m',target:50},{duration:'1m',target:100},{duration:'30s',target:0}], thresholds: {http_req_failed:['rate<0.01'],http_req_duration:['p(95)<800']} };
export default function () { if (!__ENV.BASE_URL) throw new Error('Set BASE_URL to your staging URL'); const r=http.get(__ENV.BASE_URL+'/api/v1/products'); check(r, {'catalog successful':r=>r.status===200}); sleep(2); }
