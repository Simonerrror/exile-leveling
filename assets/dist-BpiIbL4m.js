import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import{f as t}from"./jsx-runtime-Du19kVaA.js";var n={item:`_item_qletb_1`,itemRound:`_itemRound_qletb_15`},r={hoverPrimary:`_hoverPrimary_wh3vs_2`,hoverSecondary:`_hoverSecondary_wh3vs_6`,activePrimary:`_activePrimary_wh3vs_11`,activeSecondary:`_activeSecondary_wh3vs_15`},i=e(t(),1);function a(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`)if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(n=a(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n);return r}function o(){for(var e,t,n=0,r=``,i=arguments.length;n<i;n++)(e=arguments[n])&&(t=a(e))&&(r&&(r+=` `),r+=t);return r}var s=e=>typeof e==`number`&&!isNaN(e),c=e=>typeof e==`string`,l=e=>typeof e==`function`,u=e=>c(e)||s(e),d=e=>c(e)||l(e)?e:null,f=(e,t)=>e===!1||s(e)&&e>0?e:t,p=e=>(0,i.isValidElement)(e)||c(e)||l(e)||s(e);function m(e,t,n=300){let{scrollHeight:r,style:i}=e;requestAnimationFrame(()=>{i.minHeight=`initial`,i.height=r+`px`,i.transition=`all ${n}ms`,requestAnimationFrame(()=>{i.height=`0`,i.padding=`0`,i.margin=`0`,setTimeout(t,n)})})}function h({enter:e,exit:t,appendPosition:n=!1,collapse:r=!0,collapseDuration:a=300}){return function({children:o,position:s,preventExitTransition:c,done:l,nodeRef:u,isIn:d,playToast:f}){let p=n?`${e}--${s}`:e,h=n?`${t}--${s}`:t,g=(0,i.useRef)(0);return(0,i.useLayoutEffect)(()=>{let e=u.current,t=p.split(` `),n=r=>{r.target===u.current&&(f(),e.removeEventListener(`animationend`,n),e.removeEventListener(`animationcancel`,n),g.current===0&&r.type!==`animationcancel`&&e.classList.remove(...t))};e.classList.add(...t),e.addEventListener(`animationend`,n),e.addEventListener(`animationcancel`,n)},[]),(0,i.useEffect)(()=>{let e=u.current,t=()=>{e.removeEventListener(`animationend`,t),r?m(e,l,a):l()};d||(c?t():(g.current=1,e.className+=` ${h}`,e.addEventListener(`animationend`,t)))},[d]),i.createElement(i.Fragment,null,o)}}function g(e,t){return{content:_(e.content,e.props),containerId:e.props.containerId,id:e.props.toastId,theme:e.props.theme,type:e.props.type,data:e.props.data||{},isLoading:e.props.isLoading,icon:e.props.icon,reason:e.removalReason,status:t}}function _(e,t,n=!1){return(0,i.isValidElement)(e)&&!c(e.type)?(0,i.cloneElement)(e,{closeToast:t.closeToast,toastProps:t,data:t.data,isPaused:n}):l(e)?e({closeToast:t.closeToast,toastProps:t,data:t.data,isPaused:n}):e}function v({closeToast:e,theme:t,ariaLabel:n=`close`}){return i.createElement(`button`,{className:`Toastify__close-button Toastify__close-button--${t}`,type:`button`,onClick:t=>{t.stopPropagation(),e(!0)},"aria-label":n},i.createElement(`svg`,{"aria-hidden":`true`,viewBox:`0 0 14 16`},i.createElement(`path`,{fillRule:`evenodd`,d:`M7.71 8.23l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75L1 11.98l3.75-3.75L1 4.48 2.48 3l3.75 3.75L9.98 3l1.48 1.48-3.75 3.75z`})))}function y({delay:e,isRunning:t,closeToast:n,type:r=`default`,hide:a,className:s,controlledProgress:c,progress:u,rtl:d,isIn:f,theme:p}){let m=a||c&&u===0,h={animationDuration:`${e}ms`,animationPlayState:t?`running`:`paused`};c&&(h.transform=`scaleX(${u})`);let g=o(`Toastify__progress-bar`,c?`Toastify__progress-bar--controlled`:`Toastify__progress-bar--animated`,`Toastify__progress-bar-theme--${p}`,`Toastify__progress-bar--${r}`,{"Toastify__progress-bar--rtl":d}),_=l(s)?s({rtl:d,type:r,defaultClassName:g}):o(g,s),v={[c&&u>=1?`onTransitionEnd`:`onAnimationEnd`]:c&&u<1?null:()=>{f&&n()}};return i.createElement(`div`,{className:`Toastify__progress-bar--wrp`,"data-hidden":m},i.createElement(`div`,{className:`Toastify__progress-bar--bg Toastify__progress-bar-theme--${p} Toastify__progress-bar--${r}`}),i.createElement(`div`,{role:`progressbar`,"aria-hidden":m?`true`:`false`,"aria-label":`notification timer`,"aria-valuenow":c?Math.round(u*100):void 0,"aria-valuemin":0,"aria-valuemax":100,className:_,style:h,...v}))}var b=1,x=()=>`${b++}`;function S(e,t,n){let r=1,i=0,a=[],o=[],c=t,l=new Map,u=new Set,m=e=>(u.add(e),()=>u.delete(e)),h=()=>{o=Array.from(l.values()),u.forEach(e=>e())},_=({containerId:t,toastId:n,updateId:r})=>{let i=t?t!==e:e!==1,a=l.has(n)&&r==null;return i||a},v=(e,t)=>{l.forEach(n=>{var r;(t==null||t===n.props.toastId)&&((r=n.toggle)==null||r.call(n,e))})},y=e=>{var t,r;e.isActive&&((r=(t=e.props)?.onClose)==null||r.call(t,e.removalReason),e.isActive=!1,n(g(e,`removed`)))},b=e=>{if(e==null)l.forEach(y);else{let t=l.get(e);t&&y(t)}h()},x=()=>{i-=a.length,a=[]},S=e=>{var t,r;let{toastId:i,updateId:a}=e.props,o=a==null;e.staleId&&l.delete(e.staleId),e.isActive=!0,l.set(i,e),h(),n(g(e,o?`added`:`updated`)),o&&((r=(t=e.props).onOpen)==null||r.call(t))};return{id:e,props:c,observe:m,toggle:v,removeToast:b,toasts:l,clearQueue:x,buildToast:(e,t)=>{if(_(t))return;let{toastId:n,updateId:o,data:u,staleId:m,delay:g}=t,v=o==null;v&&i++;let y={...c,style:c.toastStyle,key:r++,...Object.fromEntries(Object.entries(t).filter(([e,t])=>t!=null)),toastId:n,updateId:o,data:u,isIn:!1,className:d(t.className||c.toastClassName),progressClassName:d(t.progressClassName||c.progressClassName),autoClose:!t.isLoading&&f(t.autoClose,c.autoClose),closeToast(e){let t=l.get(n);t&&(t.removalReason=e,b(n))},deleteToast(){if(l.get(n)!=null){if(l.delete(n),i--,i<0&&(i=0),a.length>0){S(a.shift());return}h()}}};y.closeButton=c.closeButton,t.closeButton===!1||p(t.closeButton)?y.closeButton=t.closeButton:t.closeButton===!0&&(y.closeButton=!p(c.closeButton)||c.closeButton);let x={content:e,props:y,staleId:m};c.limit&&c.limit>0&&i>c.limit&&v?a.push(x):s(g)?setTimeout(()=>{S(x)},g):S(x)},setProps(e){c=e},setToggle:(e,t)=>{let n=l.get(e);n&&(n.toggle=t)},isToastActive:e=>l.get(e)?.isActive,getSnapshot:()=>o}}var C=new Map,w=[],T=new Set,E=e=>T.forEach(t=>t(e)),D=()=>C.size>0;function O(){w.forEach(e=>N(e.content,e.options)),w=[]}var k=(e,{containerId:t})=>C.get(t||1)?.toasts.get(e);function A(e,t){var n;if(t)return!!((n=C.get(t))!=null&&n.isToastActive(e));let r=!1;return C.forEach(t=>{t.isToastActive(e)&&(r=!0)}),r}function j(e){if(!D()){w=w.filter(t=>e!=null&&t.options.toastId!==e);return}if(e==null||u(e))C.forEach(t=>{t.removeToast(e)});else if(e&&(`containerId`in e||`id`in e)){let t=C.get(e.containerId);t?t.removeToast(e.id):C.forEach(t=>{t.removeToast(e.id)})}}var M=(e={})=>{C.forEach(t=>{t.props.limit&&(!e.containerId||t.id===e.containerId)&&t.clearQueue()})};function N(e,t){p(e)&&(D()||w.push({content:e,options:t}),C.forEach(n=>{n.buildToast(e,t)}))}function P(e){var t;(t=C.get(e.containerId||1))==null||t.setToggle(e.id,e.fn)}function F(e,t){C.forEach(n=>{(t==null||!(t!=null&&t.containerId)||t?.containerId===n.id)&&n.toggle(e,t?.id)})}function I(e){let t=e.containerId||1;return{subscribe(n){let r=S(t,e,E);C.set(t,r);let i=r.observe(n);return O(),()=>{i(),C.delete(t)}},setProps(e){var n;(n=C.get(t))==null||n.setProps(e)},getSnapshot(){return C.get(t)?.getSnapshot()}}}function L(e){return T.add(e),()=>{T.delete(e)}}function R(e){return e&&(c(e.toastId)||s(e.toastId))?e.toastId:x()}function z(e,t){return N(e,t),t.toastId}function B(e,t){return{...t,type:t&&t.type||e,toastId:R(t)}}function V(e){return(t,n)=>z(t,B(e,n))}function H(e,t){return z(e,B(`default`,t))}H.loading=(e,t)=>z(e,B(`default`,{isLoading:!0,autoClose:!1,closeOnClick:!1,closeButton:!1,draggable:!1,...t}));function U(e,{pending:t,error:n,success:r},i){let a;t&&(a=c(t)?H.loading(t,i):H.loading(t.render,{...i,...t}));let o={isLoading:null,autoClose:null,closeOnClick:null,closeButton:null,draggable:null},s=(e,t,n)=>{if(t==null){H.dismiss(a);return}let r={type:e,...o,...i,data:n},s=c(t)?{render:t}:t;return a?H.update(a,{...r,...s}):H(s.render,{...r,...s}),n},u=l(e)?e():e;return u.then(e=>s(`success`,r,e)).catch(e=>s(`error`,n,e)),u}H.promise=U,H.success=V(`success`),H.info=V(`info`),H.error=V(`error`),H.warning=V(`warning`),H.warn=H.warning,H.dark=(e,t)=>z(e,B(`default`,{theme:`dark`,...t}));function W(e){j(e)}H.dismiss=W,H.clearWaitingQueue=M,H.isActive=A,H.update=(e,t={})=>{let n=k(e,t);if(n){let{props:r,content:i}=n,a={delay:100,...r,...t,toastId:t.toastId||e,updateId:x()};a.toastId!==e&&(a.staleId=e);let o=a.render||i;delete a.render,z(o,a)}},H.done=e=>{H.update(e,{progress:1})},H.onChange=L,H.play=e=>F(!0,e),H.pause=e=>F(!1,e);function G(e){let{subscribe:t,getSnapshot:n,setProps:r}=(0,i.useRef)(I(e)).current;r(e);let a=(0,i.useSyncExternalStore)(t,n,n)?.slice();function o(t){if(!a)return[];let n=new Map;return e.newestOnTop&&a.reverse(),a.forEach(e=>{let{position:t}=e.props;n.has(t)||n.set(t,[]),n.get(t).push(e)}),Array.from(n,e=>t(e[0],e[1]))}return{getToastToRender:o,isToastActive:A,count:a?.length}}function K(e){let[t,n]=(0,i.useState)(!1),[r,a]=(0,i.useState)(!1),o=(0,i.useRef)(null),s=(0,i.useRef)({start:0,delta:0,removalDistance:0,canCloseOnClick:!0,canDrag:!1,didMove:!1}).current,{autoClose:c,pauseOnHover:l,closeToast:u,onClick:d,closeOnClick:f}=e;P({id:e.toastId,containerId:e.containerId,fn:n}),(0,i.useEffect)(()=>{if(e.pauseOnFocusLoss)return p(),()=>{m()}},[e.pauseOnFocusLoss]);function p(){document.hasFocus()||v(),window.addEventListener(`focus`,_),window.addEventListener(`blur`,v)}function m(){window.removeEventListener(`focus`,_),window.removeEventListener(`blur`,v)}function h(t){if(e.draggable===!0||e.draggable===t.pointerType){y();let n=o.current;s.canCloseOnClick=!0,s.canDrag=!0,n.style.transition=`none`,e.draggableDirection===`x`?(s.start=t.clientX,s.removalDistance=n.offsetWidth*(e.draggablePercent/100)):(s.start=t.clientY,s.removalDistance=n.offsetHeight*(e.draggablePercent===80?e.draggablePercent*1.5:e.draggablePercent)/100)}}function g(t){let{top:n,bottom:r,left:i,right:a}=o.current.getBoundingClientRect();t.pointerType===`mouse`&&e.pauseOnHover&&t.clientX>=i&&t.clientX<=a&&t.clientY>=n&&t.clientY<=r?v():_()}function _(){n(!0)}function v(){n(!1)}function y(){s.didMove=!1,document.addEventListener(`pointermove`,x),document.addEventListener(`pointerup`,S)}function b(){document.removeEventListener(`pointermove`,x),document.removeEventListener(`pointerup`,S)}function x(n){let r=o.current;if(s.canDrag&&r){s.didMove=!0,t&&v(),e.draggableDirection===`x`?s.delta=n.clientX-s.start:s.delta=n.clientY-s.start,s.start!==n.clientX&&(s.canCloseOnClick=!1);let i=e.draggableDirection===`x`?`${s.delta}px, var(--y)`:`0, calc(${s.delta}px + var(--y))`;r.style.transform=`translate3d(${i},0)`,r.style.opacity=`${1-Math.abs(s.delta/s.removalDistance)}`}}function S(){b();let t=o.current;if(s.canDrag&&s.didMove&&t){if(s.canDrag=!1,Math.abs(s.delta)>s.removalDistance){a(!0),e.closeToast(!0),e.collapseAll();return}t.style.transition=`transform 0.2s, opacity 0.2s`,t.style.removeProperty(`transform`),t.style.removeProperty(`opacity`)}}let C={onPointerDown:h,onPointerUp:g};return c&&l&&(C.onMouseEnter=v,e.stacked||(C.onMouseLeave=_)),f&&(C.onClick=e=>{d&&d(e),s.canCloseOnClick&&u(!0)}),{playToast:_,pauseToast:v,isRunning:t,preventExitTransition:r,toastRef:o,eventHandlers:C}}var q=typeof window<`u`?i.useLayoutEffect:i.useEffect,J=({theme:e,type:t,isLoading:n,...r})=>i.createElement(`svg`,{viewBox:`0 0 24 24`,width:`100%`,height:`100%`,fill:e===`colored`?`currentColor`:`var(--toastify-icon-color-${t})`,...r});function Y(e){return i.createElement(J,{...e},i.createElement(`path`,{d:`M23.32 17.191L15.438 2.184C14.728.833 13.416 0 11.996 0c-1.42 0-2.733.833-3.443 2.184L.533 17.448a4.744 4.744 0 000 4.368C1.243 23.167 2.555 24 3.975 24h16.05C22.22 24 24 22.044 24 19.632c0-.904-.251-1.746-.68-2.44zm-9.622 1.46c0 1.033-.724 1.823-1.698 1.823s-1.698-.79-1.698-1.822v-.043c0-1.028.724-1.822 1.698-1.822s1.698.79 1.698 1.822v.043zm.039-12.285l-.84 8.06c-.057.581-.408.943-.897.943-.49 0-.84-.367-.896-.942l-.84-8.065c-.057-.624.25-1.095.779-1.095h1.91c.528.005.84.476.784 1.1z`}))}function X(e){return i.createElement(J,{...e},i.createElement(`path`,{d:`M12 0a12 12 0 1012 12A12.013 12.013 0 0012 0zm.25 5a1.5 1.5 0 11-1.5 1.5 1.5 1.5 0 011.5-1.5zm2.25 13.5h-4a1 1 0 010-2h.75a.25.25 0 00.25-.25v-4.5a.25.25 0 00-.25-.25h-.75a1 1 0 010-2h1a2 2 0 012 2v4.75a.25.25 0 00.25.25h.75a1 1 0 110 2z`}))}function ee(e){return i.createElement(J,{...e},i.createElement(`path`,{d:`M12 0a12 12 0 1012 12A12.014 12.014 0 0012 0zm6.927 8.2l-6.845 9.289a1.011 1.011 0 01-1.43.188l-4.888-3.908a1 1 0 111.25-1.562l4.076 3.261 6.227-8.451a1 1 0 111.61 1.183z`}))}function te(e){return i.createElement(J,{...e},i.createElement(`path`,{d:`M11.983 0a12.206 12.206 0 00-8.51 3.653A11.8 11.8 0 000 12.207 11.779 11.779 0 0011.8 24h.214A12.111 12.111 0 0024 11.791 11.766 11.766 0 0011.983 0zM10.5 16.542a1.476 1.476 0 011.449-1.53h.027a1.527 1.527 0 011.523 1.47 1.475 1.475 0 01-1.449 1.53h-.027a1.529 1.529 0 01-1.523-1.47zM11 12.5v-6a1 1 0 012 0v6a1 1 0 11-2 0z`}))}function ne(){return i.createElement(`div`,{className:`Toastify__spinner`})}var Z={info:X,warning:Y,success:ee,error:te,spinner:ne},re=e=>e in Z;function ie({theme:e,type:t,isLoading:n,icon:r}){let a=null,o={theme:e,type:t};return r===!1||(l(r)?a=r({...o,isLoading:n}):(0,i.isValidElement)(r)?a=(0,i.cloneElement)(r,o):n?a=Z.spinner():re(t)&&(a=Z[t](o))),a}var ae=e=>{let{isRunning:t,preventExitTransition:n,toastRef:r,eventHandlers:a,playToast:s}=K(e),{closeButton:c,children:u,autoClose:d,onClick:f,type:p,hideProgressBar:m,closeToast:h,transition:g,position:b,className:x,style:S,progressClassName:C,updateId:w,role:T,progress:E,rtl:D,toastId:O,deleteToast:k,isIn:A,isLoading:j,closeOnClick:M,theme:N,ariaLabel:P}=e,F=o(`Toastify__toast`,`Toastify__toast-theme--${N}`,`Toastify__toast--${p}`,{"Toastify__toast--rtl":D},{"Toastify__toast--close-on-click":M}),I=l(x)?x({rtl:D,position:b,type:p,defaultClassName:F}):o(F,x),L=ie(e),R=!!E||!d,z={closeToast:h,type:p,theme:N},B=null;return c===!1||(B=l(c)?c(z):(0,i.isValidElement)(c)?(0,i.cloneElement)(c,z):v(z)),i.createElement(g,{isIn:A,done:k,position:b,preventExitTransition:n,nodeRef:r,playToast:s},i.createElement(`div`,{id:O,tabIndex:0,onClick:f,"data-in":A,className:I,...a,style:S,ref:r,...A&&{role:T,"aria-label":P}},L!=null&&i.createElement(`div`,{className:o(`Toastify__toast-icon`,{"Toastify--animate-icon Toastify__zoom-enter":!j})},L),_(u,e,!t),B,!e.customProgressBar&&i.createElement(y,{...w&&!R?{key:`p-${w}`}:{},rtl:D,theme:N,delay:d,isRunning:t,isIn:A,closeToast:h,hide:m,type:p,className:C,controlledProgress:R,progress:E||0})))},Q=(e,t=!1)=>({enter:`Toastify--animate Toastify__${e}-enter`,exit:`Toastify--animate Toastify__${e}-exit`,appendPosition:t}),oe=h(Q(`bounce`,!0));h(Q(`slide`,!0)),h(Q(`zoom`)),h(Q(`flip`));var se={position:`top-right`,transition:oe,autoClose:5e3,closeButton:!0,pauseOnHover:!0,pauseOnFocusLoss:!0,draggable:`touch`,draggablePercent:80,draggableDirection:`x`,role:`alert`,theme:`light`,"aria-label":`Notifications Alt+T`,hotKeys:e=>e.altKey&&e.code===`KeyT`};function ce(e){let t={...se,...e},n=e.stacked,[r,a]=(0,i.useState)(!0),s=(0,i.useRef)(null),{getToastToRender:c,isToastActive:u,count:f}=G(t),{className:p,style:m,rtl:h,containerId:g,hotKeys:_}=t;function v(e){let t=o(`Toastify__toast-container`,`Toastify__toast-container--${e}`,{"Toastify__toast-container--rtl":h});return l(p)?p({position:e,rtl:h,defaultClassName:t}):o(t,d(p))}function y(){n&&(a(!0),H.play())}return q(()=>{if(n){let e=s.current.querySelectorAll(`[data-in="true"]`),n=t.position?.includes(`top`),i=0,a=0;Array.from(e).reverse().forEach((e,t)=>{let o=e;o.classList.add(`Toastify__toast--stacked`),t>0&&(o.dataset.collapsed=`${r}`),o.dataset.pos||(o.dataset.pos=n?`top`:`bot`);let s=i*(r?.2:1)+(r?0:12*t),c=Math.max(.5,1-(r?a:0));o.style.setProperty(`--y`,`${n?s:s*-1}px`),o.style.setProperty(`--g`,`12`),o.style.setProperty(`--s`,`${c}`),i+=o.offsetHeight,a+=.025})}},[r,f,n]),(0,i.useEffect)(()=>{function e(e){var t;let n=s.current;_(e)&&((t=n?.querySelector(`[tabIndex="0"]`))==null||t.focus(),a(!1),H.pause()),e.key===`Escape`&&(document.activeElement===n||n!=null&&n.contains(document.activeElement))&&(a(!0),H.play())}return document.addEventListener(`keydown`,e),()=>{document.removeEventListener(`keydown`,e)}},[_]),i.createElement(`section`,{ref:s,className:`Toastify`,id:g,onMouseEnter:()=>{n&&(a(!1),H.pause())},onMouseLeave:y,"aria-live":`polite`,"aria-atomic":`false`,"aria-relevant":`additions text`,"aria-label":t[`aria-label`]},c((e,t)=>{let r=t.length?{...m}:{...m,pointerEvents:`none`};return i.createElement(`div`,{tabIndex:-1,className:v(e),"data-stacked":n,style:r,key:`c-${e}`},t.map(({content:e,props:t})=>i.createElement(ae,{...t,stacked:n,collapseAll:y,isIn:u(t.toastId,t.containerId),key:`t-${t.key}`},e)))}))}var le=`:root {
  --toastify-color-light: #fff;
  --toastify-color-dark: #121212;
  --toastify-color-info: #3498db;
  --toastify-color-success: #07bc0c;
  --toastify-color-warning: #f1c40f;
  --toastify-color-error: hsl(6, 78%, 57%);
  --toastify-color-transparent: rgba(255, 255, 255, 0.7);

  --toastify-icon-color-info: var(--toastify-color-info);
  --toastify-icon-color-success: var(--toastify-color-success);
  --toastify-icon-color-warning: var(--toastify-color-warning);
  --toastify-icon-color-error: var(--toastify-color-error);

  --toastify-container-width: fit-content;
  --toastify-toast-width: 320px;
  --toastify-toast-offset: 16px;
  --toastify-toast-top: max(var(--toastify-toast-offset), env(safe-area-inset-top));
  --toastify-toast-right: max(var(--toastify-toast-offset), env(safe-area-inset-right));
  --toastify-toast-left: max(var(--toastify-toast-offset), env(safe-area-inset-left));
  --toastify-toast-bottom: max(var(--toastify-toast-offset), env(safe-area-inset-bottom));
  --toastify-toast-background: #fff;
  --toastify-toast-padding: 14px;
  --toastify-toast-min-height: 64px;
  --toastify-toast-max-height: 800px;
  --toastify-toast-bd-radius: 6px;
  --toastify-toast-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  --toastify-font-family: sans-serif;
  --toastify-z-index: 9999;
  --toastify-text-color-light: #757575;
  --toastify-text-color-dark: #fff;

  /* Used only for colored theme */
  --toastify-text-color-info: #fff;
  --toastify-text-color-success: #fff;
  --toastify-text-color-warning: #fff;
  --toastify-text-color-error: #fff;

  --toastify-spinner-color: #616161;
  --toastify-spinner-color-empty-area: #e0e0e0;
  --toastify-color-progress-light: linear-gradient(to right, #4cd964, #5ac8fa, #007aff, #34aadc, #5856d6, #ff2d55);
  --toastify-color-progress-dark: #bb86fc;
  --toastify-color-progress-info: var(--toastify-color-info);
  --toastify-color-progress-success: var(--toastify-color-success);
  --toastify-color-progress-warning: var(--toastify-color-warning);
  --toastify-color-progress-error: var(--toastify-color-error);
  /* used to control the opacity of the progress trail */
  --toastify-color-progress-bgo: 0.2;
}

.Toastify__toast-container {
  z-index: var(--toastify-z-index);
  -webkit-transform: translate3d(0, 0, var(--toastify-z-index));
  position: fixed;
  width: var(--toastify-container-width);
  box-sizing: border-box;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.Toastify__toast-container--top-left {
  top: var(--toastify-toast-top);
  left: var(--toastify-toast-left);
}
.Toastify__toast-container--top-center {
  top: var(--toastify-toast-top);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.Toastify__toast-container--top-right {
  top: var(--toastify-toast-top);
  right: var(--toastify-toast-right);
  align-items: end;
}
.Toastify__toast-container--bottom-left {
  bottom: var(--toastify-toast-bottom);
  left: var(--toastify-toast-left);
}
.Toastify__toast-container--bottom-center {
  bottom: var(--toastify-toast-bottom);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.Toastify__toast-container--bottom-right {
  bottom: var(--toastify-toast-bottom);
  right: var(--toastify-toast-right);
  align-items: end;
}

.Toastify__toast {
  --y: 0px;
  position: relative;
  touch-action: none;
  width: var(--toastify-toast-width);
  min-height: var(--toastify-toast-min-height);
  box-sizing: border-box;
  margin-bottom: 1rem;
  padding: var(--toastify-toast-padding);
  border-radius: var(--toastify-toast-bd-radius);
  box-shadow: var(--toastify-toast-shadow);
  max-height: var(--toastify-toast-max-height);
  font-family: var(--toastify-font-family);
  /* webkit only issue #791 */
  z-index: 0;
  /* inner swag */
  display: flex;
  flex: 1 auto;
  align-items: center;
  word-break: break-word;
}

@media only screen and (max-width: 480px) {
  .Toastify__toast-container {
    width: 100vw;
    left: env(safe-area-inset-left);
    margin: 0;
  }
  .Toastify__toast-container--top-left,
  .Toastify__toast-container--top-center,
  .Toastify__toast-container--top-right {
    top: env(safe-area-inset-top);
    transform: translateX(0);
  }
  .Toastify__toast-container--bottom-left,
  .Toastify__toast-container--bottom-center,
  .Toastify__toast-container--bottom-right {
    bottom: env(safe-area-inset-bottom);
    transform: translateX(0);
  }
  .Toastify__toast-container--rtl {
    right: env(safe-area-inset-right);
    left: initial;
  }
  .Toastify__toast {
    --toastify-toast-width: 100%;
    margin-bottom: 0;
    border-radius: 0;
  }
}

.Toastify__toast-container[data-stacked='true'] {
  width: var(--toastify-toast-width);
}

@media only screen and (max-width: 480px) {
  .Toastify__toast-container[data-stacked='true'] {
    width: 100vw;
  }
}

.Toastify__toast--stacked {
  position: absolute;
  width: 100%;
  transform: translate3d(0, var(--y), 0) scale(var(--s));
  transition: transform 0.3s;
}

.Toastify__toast--stacked[data-collapsed] .Toastify__toast-body,
.Toastify__toast--stacked[data-collapsed] .Toastify__close-button {
  transition: opacity 0.1s;
}

.Toastify__toast--stacked[data-collapsed='false'] {
  overflow: visible;
}

.Toastify__toast--stacked[data-collapsed='true']:not(:last-child) > * {
  opacity: 0;
}

.Toastify__toast--stacked:after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: calc(var(--g) * 1px);
  bottom: 100%;
}

.Toastify__toast--stacked[data-pos='top'] {
  top: 0;
}

.Toastify__toast--stacked[data-pos='bot'] {
  bottom: 0;
}

.Toastify__toast--stacked[data-pos='bot'].Toastify__toast--stacked:before {
  transform-origin: top;
}

.Toastify__toast--stacked[data-pos='top'].Toastify__toast--stacked:before {
  transform-origin: bottom;
}

.Toastify__toast--stacked:before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  transform: scaleY(3);
  z-index: -1;
}

.Toastify__toast--rtl {
  direction: rtl;
}

.Toastify__toast--close-on-click {
  cursor: pointer;
}

.Toastify__toast-icon {
  margin-inline-end: 10px;
  width: 22px;
  flex-shrink: 0;
  display: flex;
}

.Toastify--animate {
  animation-fill-mode: both;
  animation-duration: 0.5s;
}

.Toastify--animate-icon {
  animation-fill-mode: both;
  animation-duration: 0.3s;
}

.Toastify__toast-theme--dark {
  background: var(--toastify-color-dark);
  color: var(--toastify-text-color-dark);
}

.Toastify__toast-theme--light {
  background: var(--toastify-color-light);
  color: var(--toastify-text-color-light);
}

.Toastify__toast-theme--colored.Toastify__toast--default {
  background: var(--toastify-color-light);
  color: var(--toastify-text-color-light);
}

.Toastify__toast-theme--colored.Toastify__toast--info {
  color: var(--toastify-text-color-info);
  background: var(--toastify-color-info);
}

.Toastify__toast-theme--colored.Toastify__toast--success {
  color: var(--toastify-text-color-success);
  background: var(--toastify-color-success);
}

.Toastify__toast-theme--colored.Toastify__toast--warning {
  color: var(--toastify-text-color-warning);
  background: var(--toastify-color-warning);
}

.Toastify__toast-theme--colored.Toastify__toast--error {
  color: var(--toastify-text-color-error);
  background: var(--toastify-color-error);
}

.Toastify__progress-bar-theme--light {
  background: var(--toastify-color-progress-light);
}

.Toastify__progress-bar-theme--dark {
  background: var(--toastify-color-progress-dark);
}

.Toastify__progress-bar--info {
  background: var(--toastify-color-progress-info);
}

.Toastify__progress-bar--success {
  background: var(--toastify-color-progress-success);
}

.Toastify__progress-bar--warning {
  background: var(--toastify-color-progress-warning);
}

.Toastify__progress-bar--error {
  background: var(--toastify-color-progress-error);
}

.Toastify__progress-bar-theme--colored.Toastify__progress-bar--info,
.Toastify__progress-bar-theme--colored.Toastify__progress-bar--success,
.Toastify__progress-bar-theme--colored.Toastify__progress-bar--warning,
.Toastify__progress-bar-theme--colored.Toastify__progress-bar--error {
  background: var(--toastify-color-transparent);
}

.Toastify__close-button {
  color: #fff;
  position: absolute;
  top: 6px;
  right: 6px;
  background: transparent;
  outline: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.7;
  transition: 0.3s ease;
  z-index: 1;
}

.Toastify__toast--rtl .Toastify__close-button {
  left: 6px;
  right: unset;
}

.Toastify__close-button--light {
  color: #000;
  opacity: 0.3;
}

.Toastify__close-button > svg {
  fill: currentColor;
  height: 16px;
  width: 14px;
}

.Toastify__close-button:hover,
.Toastify__close-button:focus {
  opacity: 1;
}

@keyframes Toastify__trackProgress {
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
}

.Toastify__progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.7;
  transform-origin: left;
}

.Toastify__progress-bar--animated {
  animation: Toastify__trackProgress linear 1 forwards;
}

.Toastify__progress-bar--controlled {
  transition: transform 0.2s;
}

.Toastify__progress-bar--rtl {
  right: 0;
  left: initial;
  transform-origin: right;
  border-bottom-left-radius: initial;
}

.Toastify__progress-bar--wrp {
  position: absolute;
  overflow: hidden;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 5px;
  border-bottom-left-radius: var(--toastify-toast-bd-radius);
  border-bottom-right-radius: var(--toastify-toast-bd-radius);
}

.Toastify__progress-bar--wrp[data-hidden='true'] {
  opacity: 0;
}

.Toastify__progress-bar--bg {
  opacity: var(--toastify-color-progress-bgo);
  width: 100%;
  height: 100%;
}

.Toastify__spinner {
  width: 20px;
  height: 20px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: var(--toastify-spinner-color-empty-area);
  border-right-color: var(--toastify-spinner-color);
  animation: Toastify__spin 0.65s linear infinite;
}

@keyframes Toastify__bounceInRight {
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  from {
    opacity: 0;
    transform: translate3d(3000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(-25px, 0, 0);
  }
  75% {
    transform: translate3d(10px, 0, 0);
  }
  90% {
    transform: translate3d(-5px, 0, 0);
  }
  to {
    transform: none;
  }
}

@keyframes Toastify__bounceOutRight {
  20% {
    opacity: 1;
    transform: translate3d(-20px, var(--y), 0);
  }
  to {
    opacity: 0;
    transform: translate3d(2000px, var(--y), 0);
  }
}

@keyframes Toastify__bounceInLeft {
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  0% {
    opacity: 0;
    transform: translate3d(-3000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(25px, 0, 0);
  }
  75% {
    transform: translate3d(-10px, 0, 0);
  }
  90% {
    transform: translate3d(5px, 0, 0);
  }
  to {
    transform: none;
  }
}

@keyframes Toastify__bounceOutLeft {
  20% {
    opacity: 1;
    transform: translate3d(20px, var(--y), 0);
  }
  to {
    opacity: 0;
    transform: translate3d(-2000px, var(--y), 0);
  }
}

@keyframes Toastify__bounceInUp {
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  from {
    opacity: 0;
    transform: translate3d(0, 3000px, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, -20px, 0);
  }
  75% {
    transform: translate3d(0, 10px, 0);
  }
  90% {
    transform: translate3d(0, -5px, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes Toastify__bounceOutUp {
  20% {
    transform: translate3d(0, calc(var(--y) - 10px), 0);
  }
  40%,
  45% {
    opacity: 1;
    transform: translate3d(0, calc(var(--y) + 20px), 0);
  }
  to {
    opacity: 0;
    transform: translate3d(0, -2000px, 0);
  }
}

@keyframes Toastify__bounceInDown {
  from,
  60%,
  75%,
  90%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  0% {
    opacity: 0;
    transform: translate3d(0, -3000px, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, 25px, 0);
  }
  75% {
    transform: translate3d(0, -10px, 0);
  }
  90% {
    transform: translate3d(0, 5px, 0);
  }
  to {
    transform: none;
  }
}

@keyframes Toastify__bounceOutDown {
  20% {
    transform: translate3d(0, calc(var(--y) - 10px), 0);
  }
  40%,
  45% {
    opacity: 1;
    transform: translate3d(0, calc(var(--y) + 20px), 0);
  }
  to {
    opacity: 0;
    transform: translate3d(0, 2000px, 0);
  }
}

.Toastify__bounce-enter--top-left,
.Toastify__bounce-enter--bottom-left {
  animation-name: Toastify__bounceInLeft;
}

.Toastify__bounce-enter--top-right,
.Toastify__bounce-enter--bottom-right {
  animation-name: Toastify__bounceInRight;
}

.Toastify__bounce-enter--top-center {
  animation-name: Toastify__bounceInDown;
}

.Toastify__bounce-enter--bottom-center {
  animation-name: Toastify__bounceInUp;
}

.Toastify__bounce-exit--top-left,
.Toastify__bounce-exit--bottom-left {
  animation-name: Toastify__bounceOutLeft;
}

.Toastify__bounce-exit--top-right,
.Toastify__bounce-exit--bottom-right {
  animation-name: Toastify__bounceOutRight;
}

.Toastify__bounce-exit--top-center {
  animation-name: Toastify__bounceOutUp;
}

.Toastify__bounce-exit--bottom-center {
  animation-name: Toastify__bounceOutDown;
}

@keyframes Toastify__zoomIn {
  from {
    opacity: 0;
    transform: scale3d(0.3, 0.3, 0.3);
  }
  50% {
    opacity: 1;
  }
}

@keyframes Toastify__zoomOut {
  from {
    opacity: 1;
  }
  50% {
    opacity: 0;
    transform: translate3d(0, var(--y), 0) scale3d(0.3, 0.3, 0.3);
  }
  to {
    opacity: 0;
  }
}

.Toastify__zoom-enter {
  animation-name: Toastify__zoomIn;
}

.Toastify__zoom-exit {
  animation-name: Toastify__zoomOut;
}

@keyframes Toastify__flipIn {
  from {
    transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
    animation-timing-function: ease-in;
    opacity: 0;
  }
  40% {
    transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
    animation-timing-function: ease-in;
  }
  60% {
    transform: perspective(400px) rotate3d(1, 0, 0, 10deg);
    opacity: 1;
  }
  80% {
    transform: perspective(400px) rotate3d(1, 0, 0, -5deg);
  }
  to {
    transform: perspective(400px);
  }
}

@keyframes Toastify__flipOut {
  from {
    transform: translate3d(0, var(--y), 0) perspective(400px);
  }
  30% {
    transform: translate3d(0, var(--y), 0) perspective(400px) rotate3d(1, 0, 0, -20deg);
    opacity: 1;
  }
  to {
    transform: translate3d(0, var(--y), 0) perspective(400px) rotate3d(1, 0, 0, 90deg);
    opacity: 0;
  }
}

.Toastify__flip-enter {
  animation-name: Toastify__flipIn;
}

.Toastify__flip-exit {
  animation-name: Toastify__flipOut;
}

@keyframes Toastify__slideInRight {
  from {
    transform: translate3d(110%, 0, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, var(--y), 0);
  }
}

@keyframes Toastify__slideInLeft {
  from {
    transform: translate3d(-110%, 0, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, var(--y), 0);
  }
}

@keyframes Toastify__slideInUp {
  from {
    transform: translate3d(0, 110%, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, var(--y), 0);
  }
}

@keyframes Toastify__slideInDown {
  from {
    transform: translate3d(0, -110%, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, var(--y), 0);
  }
}

@keyframes Toastify__slideOutRight {
  from {
    transform: translate3d(0, var(--y), 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(110%, var(--y), 0);
  }
}

@keyframes Toastify__slideOutLeft {
  from {
    transform: translate3d(0, var(--y), 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(-110%, var(--y), 0);
  }
}

@keyframes Toastify__slideOutDown {
  from {
    transform: translate3d(0, var(--y), 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(0, 500px, 0);
  }
}

@keyframes Toastify__slideOutUp {
  from {
    transform: translate3d(0, var(--y), 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(0, -500px, 0);
  }
}

.Toastify__slide-enter--top-left,
.Toastify__slide-enter--bottom-left {
  animation-name: Toastify__slideInLeft;
}

.Toastify__slide-enter--top-right,
.Toastify__slide-enter--bottom-right {
  animation-name: Toastify__slideInRight;
}

.Toastify__slide-enter--top-center {
  animation-name: Toastify__slideInDown;
}

.Toastify__slide-enter--bottom-center {
  animation-name: Toastify__slideInUp;
}

.Toastify__slide-exit--top-left,
.Toastify__slide-exit--bottom-left {
  animation-name: Toastify__slideOutLeft;
  animation-timing-function: ease-in;
  animation-duration: 0.3s;
}

.Toastify__slide-exit--top-right,
.Toastify__slide-exit--bottom-right {
  animation-name: Toastify__slideOutRight;
  animation-timing-function: ease-in;
  animation-duration: 0.3s;
}

.Toastify__slide-exit--top-center {
  animation-name: Toastify__slideOutUp;
  animation-timing-function: ease-in;
  animation-duration: 0.3s;
}

.Toastify__slide-exit--bottom-center {
  animation-name: Toastify__slideOutDown;
  animation-timing-function: ease-in;
  animation-duration: 0.3s;
}

@keyframes Toastify__spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`,$=new Map,ue=(e,t)=>{q(()=>{if(!e||typeof document>`u`)return;let n=document,r=$.get(n);if(r){t&&r.setAttribute(`nonce`,t);return}let i=n.createElement(`style`);i.textContent=e,t&&i.setAttribute(`nonce`,t),n.head.appendChild(i),$.set(n,i)},[t])};function de(e){return ue(le,e.nonce),i.createElement(ce,{...e})}export{n as i,H as n,r,de as t};