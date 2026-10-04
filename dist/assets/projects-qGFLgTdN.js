import{c as i,a as c,B as d}from"./index-BzZzciaz.js";import{j as u}from"./framer-nxbTUBLO.js";import{r as o}from"./vendor-DKBIQQPz.js";import{c as f}from"./sections-Dcpmnjbt.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=i("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=i("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]),l=d("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground hover:bg-primary/80",secondary:"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",destructive:"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",outline:"text-foreground"}},defaultVariants:{variant:"default"}});function b({className:e,variant:r,...a}){return u.jsx("div",{className:c(l({variant:r}),e),...a})}const m=[{slug:"vr",name:"VR"},{slug:"ar",name:"AR"},{slug:"interactive",name:"Interactive"},{slug:"award",name:"Awards"}];function C(){const[e,r]=o.useState(m),[a,t]=o.useState(!1),s=async()=>{const{data:n}=await f.from("project_categories").select("*").order("display_order");n?.length&&r(n),t(!0)};return o.useEffect(()=>{s()},[]),{categories:e,loaded:a,reload:s}}const _=(e,r)=>e.find(a=>a.slug===r)?.name??r.replace(/-/g," "),w=e=>{const r=[e.video_url,...e.video_urls??[]].filter(t=>!!t),a=[e.cover_image_url,...e.gallery_images??[]].filter(t=>!!t);return[...r.map(t=>({type:"video",src:t})),...Array.from(new Set(a)).map(t=>({type:"image",src:t}))]},L=e=>(e??[]).flatMap(r=>r.split(/\s*[-–—|/]\s*/)).map(r=>r.trim()).filter(Boolean);export{b as B,h as C,x as a,_ as c,L as n,w as p,C as u};
