var Po=Object.defineProperty;var Do=(s,e,t)=>e in s?Po(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var J=(s,e,t)=>(Do(s,typeof e!="symbol"?e+"":e,t),t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();class Io{constructor(){J(this,"APP_ID","glApp");J(this,"ASSETS_PATH","/assets/");J(this,"DPR",Math.min(2,window.devicePixelRatio||1));J(this,"USE_PIXEL_LIMIT",!0);J(this,"MAX_PIXEL_COUNT",2560*1440);J(this,"DEFAULT_POSITION",[20,18,20]);J(this,"DEFAULT_LOOKAT_POSITION",[0,0,0]);J(this,"WEBGL_OPTS",{antialias:!0,alpha:!1});J(this,"SIMULATION_SPEED_SCALE",2);J(this,"FREE_BLOCKS_COUNT",10);if(window.URLSearchParams){const t=(n=>[...n].reduce((i,[r,o])=>(i[r]=o===""?!0:o,i),{}))(new URLSearchParams(window.location.search));this.override(t)}}override(e){for(const t in e)if(this[t]!==void 0){const n=e[t].toString();typeof this[t]=="boolean"?this[t]=!(n==="0"||n===!1):typeof this[t]=="number"?this[t]=parseFloat(n):typeof this[t]=="string"&&(this[t]=n)}}}const Mt=new Io;function No(s){return s&&s.__esModule&&Object.prototype.hasOwnProperty.call(s,"default")?s.default:s}var Za={exports:{}};(function(s){(function(e){function t(){this._listeners=[],this.dispatchCount=0}var n=t.prototype;n.add=a,n.addOnce=c,n.remove=l,n.dispatch=u;var i="Callback function is missing!",r=Array.prototype.slice;function o(h){h.sort(function(f,g){return f=f.p,g=g.p,g<f?1:g>f?-1:0})}function a(h,f,g,v){if(!h)throw i;g=g||0;for(var m=this._listeners,d,M,C,w=m.length;w--;)if(d=m[w],d.f===h&&d.c===f)return!1;typeof g=="function"&&(M=g,g=v,C=4),m.unshift({f:h,c:f,p:g,r:M||h,a:r.call(arguments,C||3),j:0}),o(m)}function c(h,f,g,v){if(!h)throw i;var m=this,d=function(){return m.remove.call(m,h,f),h.apply(f,r.call(arguments,0))};v=r.call(arguments,0),v.length===1&&v.push(e),v.splice(2,0,d),a.apply(m,v)}function l(h,f){if(!h)return this._listeners.length=0,!0;for(var g=this._listeners,v,m=g.length;m--;)if(v=g[m],v.f===h&&(!f||v.c===f))return v.j=0,g.splice(m,1),!0;return!1}function u(h){h=r.call(arguments,0),this.dispatchCount++;for(var f=this.dispatchCount,g=this._listeners,v,m,d=g.length;d--;)if(v=g[d],v&&v.j<f&&(v.j=f,v.r.apply(v.c,v.a.concat(h))===!1)){m=v;break}for(g=this._listeners,d=g.length;d--;)g[d].j=0;return m}s.exports=t})()})(Za);var Fo=Za.exports;const Ai=No(Fo);/**
 * @license
 * Copyright 2010-2022 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const vs="148",Kn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Jn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Oo=0,bs=1,Uo=2,ja=1,zo=2,Fi=3,qn=0,jt=1,Ss=2,Zi=3,In=0,xi=1,ws=2,Ts=3,Es=4,Bo=5,gi=100,ko=101,Go=102,As=103,Cs=104,Ho=200,Vo=201,Wo=202,Xo=203,$a=204,Ka=205,qo=206,Yo=207,Zo=208,jo=209,$o=210,Ko=0,Jo=1,Qo=2,cs=3,el=4,tl=5,nl=6,il=7,Ja=0,rl=1,sl=2,bn=0,al=1,ol=2,ll=3,cl=4,ul=5,Qa=300,Si=301,Mi=302,us=303,hs=304,Sr=306,ds=1e3,Gt=1001,fs=1002,yt=1003,Rs=1004,Er=1005,bt=1006,hl=1007,yi=1008,Yn=1009,dl=1010,fl=1011,eo=1012,pl=1013,Gn=1014,rn=1015,yn=1016,ml=1017,gl=1018,vi=1020,_l=1021,xl=1022,Ht=1023,vl=1024,Sl=1025,Vn=1026,bi=1027,to=1028,Ml=1029,yl=1030,bl=1031,wl=1033,Ar=33776,Cr=33777,Rr=33778,Lr=33779,Ls=35840,Ps=35841,Ds=35842,Is=35843,Tl=36196,Ns=37492,Fs=37496,Os=37808,Us=37809,zs=37810,Bs=37811,ks=37812,Gs=37813,Hs=37814,Vs=37815,Ws=37816,Xs=37817,qs=37818,Ys=37819,Zs=37820,js=37821,$s=36492,wn=3e3,rt=3001,El=3200,Al=3201,Cl=0,Rl=1,ln="srgb",ki="srgb-linear",Pr=7680,Ll=519,Ks=35044,Qn=35048,Js="300 es",ps=1035;class jn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const i=this._listeners[e];if(i!==void 0){const r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}}const Et=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Dr=Math.PI/180,Qs=180/Math.PI;function Gi(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Et[s&255]+Et[s>>8&255]+Et[s>>16&255]+Et[s>>24&255]+"-"+Et[e&255]+Et[e>>8&255]+"-"+Et[e>>16&15|64]+Et[e>>24&255]+"-"+Et[t&63|128]+Et[t>>8&255]+"-"+Et[t>>16&255]+Et[t>>24&255]+Et[n&255]+Et[n>>8&255]+Et[n>>16&255]+Et[n>>24&255]).toLowerCase()}function Pt(s,e,t){return Math.max(e,Math.min(t,s))}function Pl(s,e){return(s%e+e)%e}function Ir(s,e,t){return(1-t)*s+t*e}function ea(s){return(s&s-1)===0&&s!==0}function ms(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function ji(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function zt(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}class We{constructor(e=0,t=0){We.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Vt{constructor(){Vt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1]}set(e,t,n,i,r,o,a,c,l){const u=this.elements;return u[0]=e,u[1]=i,u[2]=a,u[3]=t,u[4]=r,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],f=n[2],g=n[5],v=n[8],m=i[0],d=i[3],M=i[6],C=i[1],w=i[4],T=i[7],E=i[2],N=i[5],B=i[8];return r[0]=o*m+a*C+c*E,r[3]=o*d+a*w+c*N,r[6]=o*M+a*T+c*B,r[1]=l*m+u*C+h*E,r[4]=l*d+u*w+h*N,r[7]=l*M+u*T+h*B,r[2]=f*m+g*C+v*E,r[5]=f*d+g*w+v*N,r[8]=f*M+g*T+v*B,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-n*r*u+n*a*c+i*r*l-i*o*c}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,f=a*c-u*r,g=l*r-o*c,v=t*h+n*f+i*g;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const m=1/v;return e[0]=h*m,e[1]=(i*l-u*n)*m,e[2]=(a*n-i*o)*m,e[3]=f*m,e[4]=(u*t-i*c)*m,e[5]=(i*r-a*t)*m,e[6]=g*m,e[7]=(n*c-l*t)*m,e[8]=(o*t-n*r)*m,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-i*l,i*c,-i*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Nr.makeScale(e,t)),this}rotate(e){return this.premultiply(Nr.makeRotation(-e)),this}translate(e,t){return this.premultiply(Nr.makeTranslation(e,t)),this}makeTranslation(e,t){return this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Nr=new Vt;function no(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function vr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Wn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function _r(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}const Fr={[ln]:{[ki]:Wn},[ki]:{[ln]:_r}},Ct={legacyMode:!0,get workingColorSpace(){return ki},set workingColorSpace(s){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(s,e,t){if(this.legacyMode||e===t||!e||!t)return s;if(Fr[e]&&Fr[e][t]!==void 0){const n=Fr[e][t];return s.r=n(s.r),s.g=n(s.g),s.b=n(s.b),s}throw new Error("Unsupported color space conversion.")},fromWorkingColorSpace:function(s,e){return this.convert(s,this.workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this.workingColorSpace)}},io={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},mt={r:0,g:0,b:0},Kt={h:0,s:0,l:0},$i={h:0,s:0,l:0};function Or(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}function Ki(s,e){return e.r=s.r,e.g=s.g,e.b=s.b,e}class je{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,t===void 0&&n===void 0?this.set(e):this.setRGB(e,t,n)}set(e){return e&&e.isColor?this.copy(e):typeof e=="number"?this.setHex(e):typeof e=="string"&&this.setStyle(e),this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ln){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ct.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=Ct.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ct.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=Ct.workingColorSpace){if(e=Pl(e,1),t=Pt(t,0,1),n=Pt(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Or(o,r,e+1/3),this.g=Or(o,r,e),this.b=Or(o,r,e-1/3)}return Ct.toWorkingColorSpace(this,i),this}setStyle(e,t=ln){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^((?:rgb|hsl)a?)\(([^\)]*)\)/.exec(e)){let r;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(255,parseInt(r[1],10))/255,this.g=Math.min(255,parseInt(r[2],10))/255,this.b=Math.min(255,parseInt(r[3],10))/255,Ct.toWorkingColorSpace(this,t),n(r[4]),this;if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(100,parseInt(r[1],10))/100,this.g=Math.min(100,parseInt(r[2],10))/100,this.b=Math.min(100,parseInt(r[3],10))/100,Ct.toWorkingColorSpace(this,t),n(r[4]),this;break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a)){const c=parseFloat(r[1])/360,l=parseFloat(r[2])/100,u=parseFloat(r[3])/100;return n(r[4]),this.setHSL(c,l,u,t)}break}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],o=r.length;if(o===3)return this.r=parseInt(r.charAt(0)+r.charAt(0),16)/255,this.g=parseInt(r.charAt(1)+r.charAt(1),16)/255,this.b=parseInt(r.charAt(2)+r.charAt(2),16)/255,Ct.toWorkingColorSpace(this,t),this;if(o===6)return this.r=parseInt(r.charAt(0)+r.charAt(1),16)/255,this.g=parseInt(r.charAt(2)+r.charAt(3),16)/255,this.b=parseInt(r.charAt(4)+r.charAt(5),16)/255,Ct.toWorkingColorSpace(this,t),this}return e&&e.length>0?this.setColorName(e,t):this}setColorName(e,t=ln){const n=io[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Wn(e.r),this.g=Wn(e.g),this.b=Wn(e.b),this}copyLinearToSRGB(e){return this.r=_r(e.r),this.g=_r(e.g),this.b=_r(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ln){return Ct.fromWorkingColorSpace(Ki(this,mt),e),Pt(mt.r*255,0,255)<<16^Pt(mt.g*255,0,255)<<8^Pt(mt.b*255,0,255)<<0}getHexString(e=ln){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ct.workingColorSpace){Ct.fromWorkingColorSpace(Ki(this,mt),t);const n=mt.r,i=mt.g,r=mt.b,o=Math.max(n,i,r),a=Math.min(n,i,r);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(i-r)/h+(i<r?6:0);break;case i:c=(r-n)/h+2;break;case r:c=(n-i)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=Ct.workingColorSpace){return Ct.fromWorkingColorSpace(Ki(this,mt),t),e.r=mt.r,e.g=mt.g,e.b=mt.b,e}getStyle(e=ln){return Ct.fromWorkingColorSpace(Ki(this,mt),e),e!==ln?`color(${e} ${mt.r} ${mt.g} ${mt.b})`:`rgb(${mt.r*255|0},${mt.g*255|0},${mt.b*255|0})`}offsetHSL(e,t,n){return this.getHSL(Kt),Kt.h+=e,Kt.s+=t,Kt.l+=n,this.setHSL(Kt.h,Kt.s,Kt.l),this}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Kt),e.getHSL($i);const n=Ir(Kt.h,$i.h,t),i=Ir(Kt.s,$i.s,t),r=Ir(Kt.l,$i.l,t);return this.setHSL(n,i,r),this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}je.NAMES=io;let ei;class ro{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ei===void 0&&(ei=vr("canvas")),ei.width=e.width,ei.height=e.height;const n=ei.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=ei}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=vr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=Wn(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Wn(t[n]/255)*255):t[n]=Wn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}class so{constructor(e=null){this.isSource=!0,this.uuid=Gi(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(Ur(i[o].image)):r.push(Ur(i[o]))}else r=Ur(i);n.url=r}return t||(e.images[this.uuid]=n),n}}function Ur(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?ro.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Dl=0;class Ut extends jn{constructor(e=Ut.DEFAULT_IMAGE,t=Ut.DEFAULT_MAPPING,n=Gt,i=Gt,r=bt,o=yi,a=Ht,c=Yn,l=Ut.DEFAULT_ANISOTROPY,u=wn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Dl++}),this.uuid=Gi(),this.name="",this.source=new so(e),this.mipmaps=[],this.mapping=t,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new We(0,0),this.repeat=new We(1,1),this.center=new We(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.encoding=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.encoding=e.encoding,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.5,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,type:this.type,encoding:this.encoding,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Qa)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ds:e.x=e.x-Math.floor(e.x);break;case Gt:e.x=e.x<0?0:1;break;case fs:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ds:e.y=e.y-Math.floor(e.y);break;case Gt:e.y=e.y<0?0:1;break;case fs:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}Ut.DEFAULT_IMAGE=null;Ut.DEFAULT_MAPPING=Qa;Ut.DEFAULT_ANISOTROPY=1;class gt{constructor(e=0,t=0,n=0,i=1){gt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const c=e.elements,l=c[0],u=c[4],h=c[8],f=c[1],g=c[5],v=c[9],m=c[2],d=c[6],M=c[10];if(Math.abs(u-f)<.01&&Math.abs(h-m)<.01&&Math.abs(v-d)<.01){if(Math.abs(u+f)<.1&&Math.abs(h+m)<.1&&Math.abs(v+d)<.1&&Math.abs(l+g+M-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const w=(l+1)/2,T=(g+1)/2,E=(M+1)/2,N=(u+f)/4,B=(h+m)/4,x=(v+d)/4;return w>T&&w>E?w<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(w),i=N/n,r=B/n):T>E?T<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(T),n=N/i,r=x/i):E<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(E),n=B/r,i=x/r),this.set(n,i,r,t),this}let C=Math.sqrt((d-v)*(d-v)+(h-m)*(h-m)+(f-u)*(f-u));return Math.abs(C)<.001&&(C=1),this.x=(d-v)/C,this.y=(h-m)/C,this.z=(f-u)/C,this.w=Math.acos((l+g+M-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Zn extends jn{constructor(e=1,t=1,n={}){super(),this.isWebGLRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new gt(0,0,e,t),this.scissorTest=!1,this.viewport=new gt(0,0,e,t);const i={width:e,height:t,depth:1};this.texture=new Ut(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.encoding),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps!==void 0?n.generateMipmaps:!1,this.texture.internalFormat=n.internalFormat!==void 0?n.internalFormat:null,this.texture.minFilter=n.minFilter!==void 0?n.minFilter:bt,this.depthBuffer=n.depthBuffer!==void 0?n.depthBuffer:!0,this.stencilBuffer=n.stencilBuffer!==void 0?n.stencilBuffer:!1,this.depthTexture=n.depthTexture!==void 0?n.depthTexture:null,this.samples=n.samples!==void 0?n.samples:0}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new so(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ao extends Ut{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=yt,this.minFilter=yt,this.wrapR=Gt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Il extends Ut{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=yt,this.minFilter=yt,this.wrapR=Gt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class an{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let c=n[i+0],l=n[i+1],u=n[i+2],h=n[i+3];const f=r[o+0],g=r[o+1],v=r[o+2],m=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=f,e[t+1]=g,e[t+2]=v,e[t+3]=m;return}if(h!==m||c!==f||l!==g||u!==v){let d=1-a;const M=c*f+l*g+u*v+h*m,C=M>=0?1:-1,w=1-M*M;if(w>Number.EPSILON){const E=Math.sqrt(w),N=Math.atan2(E,M*C);d=Math.sin(d*N)/E,a=Math.sin(a*N)/E}const T=a*C;if(c=c*d+f*T,l=l*d+g*T,u=u*d+v*T,h=h*d+m*T,d===1-a){const E=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=E,l*=E,u*=E,h*=E}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,r,o){const a=n[i],c=n[i+1],l=n[i+2],u=n[i+3],h=r[o],f=r[o+1],g=r[o+2],v=r[o+3];return e[t]=a*v+u*h+c*g-l*f,e[t+1]=c*v+u*f+l*h-a*g,e[t+2]=l*v+u*g+a*f-c*h,e[t+3]=u*v-a*h-c*f-l*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t){const n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(i/2),h=a(r/2),f=c(n/2),g=c(i/2),v=c(r/2);switch(o){case"XYZ":this._x=f*u*h+l*g*v,this._y=l*g*h-f*u*v,this._z=l*u*v+f*g*h,this._w=l*u*h-f*g*v;break;case"YXZ":this._x=f*u*h+l*g*v,this._y=l*g*h-f*u*v,this._z=l*u*v-f*g*h,this._w=l*u*h+f*g*v;break;case"ZXY":this._x=f*u*h-l*g*v,this._y=l*g*h+f*u*v,this._z=l*u*v+f*g*h,this._w=l*u*h-f*g*v;break;case"ZYX":this._x=f*u*h-l*g*v,this._y=l*g*h+f*u*v,this._z=l*u*v-f*g*h,this._w=l*u*h+f*g*v;break;case"YZX":this._x=f*u*h+l*g*v,this._y=l*g*h+f*u*v,this._z=l*u*v-f*g*h,this._w=l*u*h-f*g*v;break;case"XZY":this._x=f*u*h-l*g*v,this._y=l*g*h-f*u*v,this._z=l*u*v+f*g*h,this._w=l*u*h+f*g*v;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t!==!1&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],f=n+a+h;if(f>0){const g=.5/Math.sqrt(f+1);this._w=.25/g,this._x=(u-c)*g,this._y=(r-l)*g,this._z=(o-i)*g}else if(n>a&&n>h){const g=2*Math.sqrt(1+n-a-h);this._w=(u-c)/g,this._x=.25*g,this._y=(i+o)/g,this._z=(r+l)/g}else if(a>h){const g=2*Math.sqrt(1+a-n-h);this._w=(r-l)/g,this._x=(i+o)/g,this._y=.25*g,this._z=(c+u)/g}else{const g=2*Math.sqrt(1+h-n-a);this._w=(o-i)/g,this._x=(r+l)/g,this._y=(c+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Pt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+o*a+i*l-r*c,this._y=i*u+o*c+r*a-n*l,this._z=r*u+o*l+n*c-i*a,this._w=o*u-n*a-i*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,r=this._z,o=this._w;let a=o*e._w+n*e._x+i*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const g=1-t;return this._w=g*o+t*this._w,this._x=g*n+t*this._x,this._y=g*i+t*this._y,this._z=g*r+t*this._z,this.normalize(),this._onChangeCallback(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-t)*u)/l,f=Math.sin(t*u)/l;return this._w=o*h+this._w*f,this._x=n*h+this._x*f,this._y=i*h+this._y*f,this._z=r*h+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(r),n*Math.cos(r),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class W{constructor(e=0,t=0,n=0){W.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ta.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ta.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=c*t+o*i-a*n,u=c*n+a*t-r*i,h=c*i+r*n-o*t,f=-r*t-o*n-a*i;return this.x=l*c+f*-r+u*-a-h*-o,this.y=u*c+f*-o+h*-r-l*-a,this.z=h*c+f*-a+l*-o-u*-r,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=i*c-r*a,this.y=r*o-n*c,this.z=n*a-i*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return zr.copy(this).projectOnVector(e),this.sub(zr)}reflect(e){return this.sub(zr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Pt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const zr=new W,ta=new an;class Hi{constructor(e=new W(1/0,1/0,1/0),t=new W(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.length;c<l;c+=3){const u=e[c],h=e[c+1],f=e[c+2];u<t&&(t=u),h<n&&(n=h),f<i&&(i=f),u>r&&(r=u),h>o&&(o=h),f>a&&(a=f)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromBufferAttribute(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.count;c<l;c++){const u=e.getX(c),h=e.getY(c),f=e.getZ(c);u<t&&(t=u),h<n&&(n=h),f<i&&(i=f),u>r&&(r=u),h>o&&(o=h),f>a&&(a=f)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Nn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0)if(t&&n.attributes!=null&&n.attributes.position!==void 0){const r=n.attributes.position;for(let o=0,a=r.count;o<a;o++)Nn.fromBufferAttribute(r,o).applyMatrix4(e.matrixWorld),this.expandByPoint(Nn)}else n.boundingBox===null&&n.computeBoundingBox(),Br.copy(n.boundingBox),Br.applyMatrix4(e.matrixWorld),this.union(Br);const i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Nn),Nn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ci),Ji.subVectors(this.max,Ci),ti.subVectors(e.a,Ci),ni.subVectors(e.b,Ci),ii.subVectors(e.c,Ci),En.subVectors(ni,ti),An.subVectors(ii,ni),Fn.subVectors(ti,ii);let t=[0,-En.z,En.y,0,-An.z,An.y,0,-Fn.z,Fn.y,En.z,0,-En.x,An.z,0,-An.x,Fn.z,0,-Fn.x,-En.y,En.x,0,-An.y,An.x,0,-Fn.y,Fn.x,0];return!kr(t,ti,ni,ii,Ji)||(t=[1,0,0,0,1,0,0,0,1],!kr(t,ti,ni,ii,Ji))?!1:(Qi.crossVectors(En,An),t=[Qi.x,Qi.y,Qi.z],kr(t,ti,ni,ii,Ji))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return Nn.copy(e).clamp(this.min,this.max).sub(e).length()}getBoundingSphere(e){return this.getCenter(e.center),e.radius=this.getSize(Nn).length()*.5,e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(fn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const fn=[new W,new W,new W,new W,new W,new W,new W,new W],Nn=new W,Br=new Hi,ti=new W,ni=new W,ii=new W,En=new W,An=new W,Fn=new W,Ci=new W,Ji=new W,Qi=new W,On=new W;function kr(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){On.fromArray(s,r);const a=i.x*Math.abs(On.x)+i.y*Math.abs(On.y)+i.z*Math.abs(On.z),c=e.dot(On),l=t.dot(On),u=n.dot(On);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const Nl=new Hi,Ri=new W,Gr=new W;class Ms{constructor(e=new W,t=-1){this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Nl.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ri.subVectors(e,this.center);const t=Ri.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Ri,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Gr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ri.copy(e.center).add(Gr)),this.expandByPoint(Ri.copy(e.center).sub(Gr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const pn=new W,Hr=new W,er=new W,Cn=new W,Vr=new W,tr=new W,Wr=new W;class Fl{constructor(e=new W,t=new W(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.direction).multiplyScalar(e).add(this.origin)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,pn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.direction).multiplyScalar(n).add(this.origin)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=pn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(pn.copy(this.direction).multiplyScalar(t).add(this.origin),pn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Hr.copy(e).add(t).multiplyScalar(.5),er.copy(t).sub(e).normalize(),Cn.copy(this.origin).sub(Hr);const r=e.distanceTo(t)*.5,o=-this.direction.dot(er),a=Cn.dot(this.direction),c=-Cn.dot(er),l=Cn.lengthSq(),u=Math.abs(1-o*o);let h,f,g,v;if(u>0)if(h=o*c-a,f=o*a-c,v=r*u,h>=0)if(f>=-v)if(f<=v){const m=1/u;h*=m,f*=m,g=h*(h+o*f+2*a)+f*(o*h+f+2*c)+l}else f=r,h=Math.max(0,-(o*f+a)),g=-h*h+f*(f+2*c)+l;else f=-r,h=Math.max(0,-(o*f+a)),g=-h*h+f*(f+2*c)+l;else f<=-v?(h=Math.max(0,-(-o*r+a)),f=h>0?-r:Math.min(Math.max(-r,-c),r),g=-h*h+f*(f+2*c)+l):f<=v?(h=0,f=Math.min(Math.max(-r,-c),r),g=f*(f+2*c)+l):(h=Math.max(0,-(o*r+a)),f=h>0?r:Math.min(Math.max(-r,-c),r),g=-h*h+f*(f+2*c)+l);else f=o>0?-r:r,h=Math.max(0,-(o*f+a)),g=-h*h+f*(f+2*c)+l;return n&&n.copy(this.direction).multiplyScalar(h).add(this.origin),i&&i.copy(er).multiplyScalar(f).add(Hr),g}intersectSphere(e,t){pn.subVectors(e.center,this.origin);const n=pn.dot(this.direction),i=pn.dot(pn)-n*n,r=e.radius*e.radius;if(i>r)return null;const o=Math.sqrt(r-i),a=n-o,c=n+o;return a<0&&c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,f=this.origin;return l>=0?(n=(e.min.x-f.x)*l,i=(e.max.x-f.x)*l):(n=(e.max.x-f.x)*l,i=(e.min.x-f.x)*l),u>=0?(r=(e.min.y-f.y)*u,o=(e.max.y-f.y)*u):(r=(e.max.y-f.y)*u,o=(e.min.y-f.y)*u),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),h>=0?(a=(e.min.z-f.z)*h,c=(e.max.z-f.z)*h):(a=(e.max.z-f.z)*h,c=(e.min.z-f.z)*h),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,pn)!==null}intersectTriangle(e,t,n,i,r){Vr.subVectors(t,e),tr.subVectors(n,e),Wr.crossVectors(Vr,tr);let o=this.direction.dot(Wr),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Cn.subVectors(this.origin,e);const c=a*this.direction.dot(tr.crossVectors(Cn,tr));if(c<0)return null;const l=a*this.direction.dot(Vr.cross(Cn));if(l<0||c+l>o)return null;const u=-a*Cn.dot(Wr);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class wt{constructor(){wt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}set(e,t,n,i,r,o,a,c,l,u,h,f,g,v,m,d){const M=this.elements;return M[0]=e,M[4]=t,M[8]=n,M[12]=i,M[1]=r,M[5]=o,M[9]=a,M[13]=c,M[2]=l,M[6]=u,M[10]=h,M[14]=f,M[3]=g,M[7]=v,M[11]=m,M[15]=d,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new wt().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/ri.setFromMatrixColumn(e,0).length(),r=1/ri.setFromMatrixColumn(e,1).length(),o=1/ri.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){const f=o*u,g=o*h,v=a*u,m=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=g+v*l,t[5]=f-m*l,t[9]=-a*c,t[2]=m-f*l,t[6]=v+g*l,t[10]=o*c}else if(e.order==="YXZ"){const f=c*u,g=c*h,v=l*u,m=l*h;t[0]=f+m*a,t[4]=v*a-g,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=g*a-v,t[6]=m+f*a,t[10]=o*c}else if(e.order==="ZXY"){const f=c*u,g=c*h,v=l*u,m=l*h;t[0]=f-m*a,t[4]=-o*h,t[8]=v+g*a,t[1]=g+v*a,t[5]=o*u,t[9]=m-f*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){const f=o*u,g=o*h,v=a*u,m=a*h;t[0]=c*u,t[4]=v*l-g,t[8]=f*l+m,t[1]=c*h,t[5]=m*l+f,t[9]=g*l-v,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){const f=o*c,g=o*l,v=a*c,m=a*l;t[0]=c*u,t[4]=m-f*h,t[8]=v*h+g,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=g*h+v,t[10]=f-m*h}else if(e.order==="XZY"){const f=o*c,g=o*l,v=a*c,m=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=f*h+m,t[5]=o*u,t[9]=g*h-v,t[2]=v*h-g,t[6]=a*u,t[10]=m*h+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Ol,e,Ul)}lookAt(e,t,n){const i=this.elements;return Bt.subVectors(e,t),Bt.lengthSq()===0&&(Bt.z=1),Bt.normalize(),Rn.crossVectors(n,Bt),Rn.lengthSq()===0&&(Math.abs(n.z)===1?Bt.x+=1e-4:Bt.z+=1e-4,Bt.normalize(),Rn.crossVectors(n,Bt)),Rn.normalize(),nr.crossVectors(Bt,Rn),i[0]=Rn.x,i[4]=nr.x,i[8]=Bt.x,i[1]=Rn.y,i[5]=nr.y,i[9]=Bt.y,i[2]=Rn.z,i[6]=nr.z,i[10]=Bt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],f=n[9],g=n[13],v=n[2],m=n[6],d=n[10],M=n[14],C=n[3],w=n[7],T=n[11],E=n[15],N=i[0],B=i[4],x=i[8],R=i[12],H=i[1],ne=i[5],ae=i[9],z=i[13],F=i[2],ee=i[6],oe=i[10],he=i[14],te=i[3],_e=i[7],re=i[11],Z=i[15];return r[0]=o*N+a*H+c*F+l*te,r[4]=o*B+a*ne+c*ee+l*_e,r[8]=o*x+a*ae+c*oe+l*re,r[12]=o*R+a*z+c*he+l*Z,r[1]=u*N+h*H+f*F+g*te,r[5]=u*B+h*ne+f*ee+g*_e,r[9]=u*x+h*ae+f*oe+g*re,r[13]=u*R+h*z+f*he+g*Z,r[2]=v*N+m*H+d*F+M*te,r[6]=v*B+m*ne+d*ee+M*_e,r[10]=v*x+m*ae+d*oe+M*re,r[14]=v*R+m*z+d*he+M*Z,r[3]=C*N+w*H+T*F+E*te,r[7]=C*B+w*ne+T*ee+E*_e,r[11]=C*x+w*ae+T*oe+E*re,r[15]=C*R+w*z+T*he+E*Z,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],f=e[10],g=e[14],v=e[3],m=e[7],d=e[11],M=e[15];return v*(+r*c*h-i*l*h-r*a*f+n*l*f+i*a*g-n*c*g)+m*(+t*c*g-t*l*f+r*o*f-i*o*g+i*l*u-r*c*u)+d*(+t*l*h-t*a*g-r*o*h+n*o*g+r*a*u-n*l*u)+M*(-i*a*u-t*c*h+t*a*f+i*o*h-n*o*f+n*c*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],f=e[10],g=e[11],v=e[12],m=e[13],d=e[14],M=e[15],C=h*d*l-m*f*l+m*c*g-a*d*g-h*c*M+a*f*M,w=v*f*l-u*d*l-v*c*g+o*d*g+u*c*M-o*f*M,T=u*m*l-v*h*l+v*a*g-o*m*g-u*a*M+o*h*M,E=v*h*c-u*m*c-v*a*f+o*m*f+u*a*d-o*h*d,N=t*C+n*w+i*T+r*E;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/N;return e[0]=C*B,e[1]=(m*f*r-h*d*r-m*i*g+n*d*g+h*i*M-n*f*M)*B,e[2]=(a*d*r-m*c*r+m*i*l-n*d*l-a*i*M+n*c*M)*B,e[3]=(h*c*r-a*f*r-h*i*l+n*f*l+a*i*g-n*c*g)*B,e[4]=w*B,e[5]=(u*d*r-v*f*r+v*i*g-t*d*g-u*i*M+t*f*M)*B,e[6]=(v*c*r-o*d*r-v*i*l+t*d*l+o*i*M-t*c*M)*B,e[7]=(o*f*r-u*c*r+u*i*l-t*f*l-o*i*g+t*c*g)*B,e[8]=T*B,e[9]=(v*h*r-u*m*r-v*n*g+t*m*g+u*n*M-t*h*M)*B,e[10]=(o*m*r-v*a*r+v*n*l-t*m*l-o*n*M+t*a*M)*B,e[11]=(u*a*r-o*h*r-u*n*l+t*h*l+o*n*g-t*a*g)*B,e[12]=E*B,e[13]=(u*m*i-v*h*i+v*n*f-t*m*f-u*n*d+t*h*d)*B,e[14]=(v*a*i-o*m*i-v*n*c+t*m*c+o*n*d-t*a*d)*B,e[15]=(o*h*i-u*a*i+u*n*c-t*h*c-o*n*f+t*a*f)*B,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,u=r*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,u*a+n,u*c-i*o,0,l*c-i*a,u*c+i*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,u=o+o,h=a+a,f=r*l,g=r*u,v=r*h,m=o*u,d=o*h,M=a*h,C=c*l,w=c*u,T=c*h,E=n.x,N=n.y,B=n.z;return i[0]=(1-(m+M))*E,i[1]=(g+T)*E,i[2]=(v-w)*E,i[3]=0,i[4]=(g-T)*N,i[5]=(1-(f+M))*N,i[6]=(d+C)*N,i[7]=0,i[8]=(v+w)*B,i[9]=(d-C)*B,i[10]=(1-(f+m))*B,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let r=ri.set(i[0],i[1],i[2]).length();const o=ri.set(i[4],i[5],i[6]).length(),a=ri.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],Jt.copy(this);const l=1/r,u=1/o,h=1/a;return Jt.elements[0]*=l,Jt.elements[1]*=l,Jt.elements[2]*=l,Jt.elements[4]*=u,Jt.elements[5]*=u,Jt.elements[6]*=u,Jt.elements[8]*=h,Jt.elements[9]*=h,Jt.elements[10]*=h,t.setFromRotationMatrix(Jt),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,o){const a=this.elements,c=2*r/(t-e),l=2*r/(n-i),u=(t+e)/(t-e),h=(n+i)/(n-i),f=-(o+r)/(o-r),g=-2*o*r/(o-r);return a[0]=c,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=l,a[9]=h,a[13]=0,a[2]=0,a[6]=0,a[10]=f,a[14]=g,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,n,i,r,o){const a=this.elements,c=1/(t-e),l=1/(n-i),u=1/(o-r),h=(t+e)*c,f=(n+i)*l,g=(o+r)*u;return a[0]=2*c,a[4]=0,a[8]=0,a[12]=-h,a[1]=0,a[5]=2*l,a[9]=0,a[13]=-f,a[2]=0,a[6]=0,a[10]=-2*u,a[14]=-g,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const ri=new W,Jt=new wt,Ol=new W(0,0,0),Ul=new W(1,1,1),Rn=new W,nr=new W,Bt=new W,na=new wt,ia=new an;class Vi{constructor(e=0,t=0,n=0,i=Vi.DefaultOrder){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],o=i[4],a=i[8],c=i[1],l=i[5],u=i[9],h=i[2],f=i[6],g=i[10];switch(t){case"XYZ":this._y=Math.asin(Pt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Pt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,g),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Pt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,g),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Pt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,g),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Pt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,g));break;case"XZY":this._z=Math.asin(-Pt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,g),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return na.makeRotationFromQuaternion(e),this.setFromRotationMatrix(na,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ia.setFromEuler(this),this.setFromQuaternion(ia,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}toVector3(){console.error("THREE.Euler: .toVector3() has been removed. Use Vector3.setFromEuler() instead")}}Vi.DefaultOrder="XYZ";Vi.RotationOrders=["XYZ","YZX","ZXY","XZY","YXZ","ZYX"];class oo{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let zl=0;const ra=new W,si=new an,mn=new wt,ir=new W,Li=new W,Bl=new W,kl=new an,sa=new W(1,0,0),aa=new W(0,1,0),oa=new W(0,0,1),Gl={type:"added"},la={type:"removed"};class Dt extends jn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:zl++}),this.uuid=Gi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Dt.DefaultUp.clone();const e=new W,t=new Vi,n=new an,i=new W(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new wt},normalMatrix:{value:new Vt}}),this.matrix=new wt,this.matrixWorld=new wt,this.matrixAutoUpdate=Dt.DefaultMatrixAutoUpdate,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=Dt.DefaultMatrixWorldAutoUpdate,this.layers=new oo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return si.setFromAxisAngle(e,t),this.quaternion.multiply(si),this}rotateOnWorldAxis(e,t){return si.setFromAxisAngle(e,t),this.quaternion.premultiply(si),this}rotateX(e){return this.rotateOnAxis(sa,e)}rotateY(e){return this.rotateOnAxis(aa,e)}rotateZ(e){return this.rotateOnAxis(oa,e)}translateOnAxis(e,t){return ra.copy(e).applyQuaternion(this.quaternion),this.position.add(ra.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(sa,e)}translateY(e){return this.translateOnAxis(aa,e)}translateZ(e){return this.translateOnAxis(oa,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(mn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ir.copy(e):ir.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Li.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?mn.lookAt(Li,ir,this.up):mn.lookAt(ir,Li,this.up),this.quaternion.setFromRotationMatrix(mn),i&&(mn.extractRotation(i.matrixWorld),si.setFromRotationMatrix(mn),this.quaternion.premultiply(si.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(Gl)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(la)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){for(let e=0;e<this.children.length;e++){const t=this.children[e];t.parent=null,t.dispatchEvent(la)}return this.children.length=0,this}attach(e){return this.updateWorldMatrix(!0,!1),mn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),mn.multiply(e.parent.matrixWorld)),e.applyMatrix4(mn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t){let n=[];this[e]===t&&n.push(this);for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectsByProperty(e,t);o.length>0&&(n=n.concat(o))}return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Li,e,Bl),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Li,kl,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++){const r=t[n];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const i=this.children;for(let r=0,o=i.length;r<o;r++){const a=i[r];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.5,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const h=c[l];r(e.shapes,h)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];i.animations.push(r(e.animations,c))}}if(t){const a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),f=o(e.skeletons),g=o(e.animations),v=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),f.length>0&&(n.skeletons=f),g.length>0&&(n.animations=g),v.length>0&&(n.nodes=v)}return n.object=i,n;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}Dt.DefaultUp=new W(0,1,0);Dt.DefaultMatrixAutoUpdate=!0;Dt.DefaultMatrixWorldAutoUpdate=!0;const Qt=new W,gn=new W,Xr=new W,_n=new W,ai=new W,oi=new W,ca=new W,qr=new W,Yr=new W,Zr=new W;class Sn{constructor(e=new W,t=new W,n=new W){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Qt.subVectors(e,t),i.cross(Qt);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Qt.subVectors(i,t),gn.subVectors(n,t),Xr.subVectors(e,t);const o=Qt.dot(Qt),a=Qt.dot(gn),c=Qt.dot(Xr),l=gn.dot(gn),u=gn.dot(Xr),h=o*l-a*a;if(h===0)return r.set(-2,-1,-1);const f=1/h,g=(l*c-a*u)*f,v=(o*u-a*c)*f;return r.set(1-g-v,v,g)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,_n),_n.x>=0&&_n.y>=0&&_n.x+_n.y<=1}static getUV(e,t,n,i,r,o,a,c){return this.getBarycoord(e,t,n,i,_n),c.set(0,0),c.addScaledVector(r,_n.x),c.addScaledVector(o,_n.y),c.addScaledVector(a,_n.z),c}static isFrontFacing(e,t,n,i){return Qt.subVectors(n,t),gn.subVectors(e,t),Qt.cross(gn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Qt.subVectors(this.c,this.b),gn.subVectors(this.a,this.b),Qt.cross(gn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Sn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Sn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,r){return Sn.getUV(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return Sn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Sn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let o,a;ai.subVectors(i,n),oi.subVectors(r,n),qr.subVectors(e,n);const c=ai.dot(qr),l=oi.dot(qr);if(c<=0&&l<=0)return t.copy(n);Yr.subVectors(e,i);const u=ai.dot(Yr),h=oi.dot(Yr);if(u>=0&&h<=u)return t.copy(i);const f=c*h-u*l;if(f<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(n).addScaledVector(ai,o);Zr.subVectors(e,r);const g=ai.dot(Zr),v=oi.dot(Zr);if(v>=0&&g<=v)return t.copy(r);const m=g*l-c*v;if(m<=0&&l>=0&&v<=0)return a=l/(l-v),t.copy(n).addScaledVector(oi,a);const d=u*v-g*h;if(d<=0&&h-u>=0&&g-v>=0)return ca.subVectors(r,i),a=(h-u)/(h-u+(g-v)),t.copy(i).addScaledVector(ca,a);const M=1/(d+m+f);return o=m*M,a=f*M,t.copy(n).addScaledVector(ai,o).addScaledVector(oi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}let Hl=0;class Mr extends jn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Hl++}),this.uuid=Gi(),this.name="",this.type="Material",this.blending=xi,this.side=qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=$a,this.blendDst=Ka,this.blendEquation=gi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=cs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ll,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Pr,this.stencilZFail=Pr,this.stencilZPass=Pr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn("THREE.Material: '"+t+"' parameter is undefined.");continue}const i=this[t];if(i===void 0){console.warn("THREE."+this.type+": '"+t+"' is not a property of this material.");continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.5,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==xi&&(n.blending=this.blending),this.side!==qn&&(n.side=this.side),this.vertexColors&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=this.transparent),n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.stencilWrite=this.stencilWrite,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(n.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=this.premultipliedAlpha),this.wireframe===!0&&(n.wireframe=this.wireframe),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=this.flatShading),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(t){const r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class lo extends Mr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new je(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Ja,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const pt=new W,rr=new We;class Wt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Ks,this.updateRange={offset:0,count:-1},this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)rr.fromBufferAttribute(this,t),rr.applyMatrix3(e),this.setXY(t,rr.x,rr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyMatrix3(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyMatrix4(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyNormalMatrix(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.transformDirection(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}set(e,t=0){return this.array.set(e,t),this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ji(t,this.array)),t}setX(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ji(t,this.array)),t}setY(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ji(t,this.array)),t}setZ(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ji(t,this.array)),t}setW(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),n=zt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),n=zt(n,this.array),i=zt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),n=zt(n,this.array),i=zt(i,this.array),r=zt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Ks&&(e.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(e.updateRange=this.updateRange),e}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class co extends Wt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class uo extends Wt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Xn extends Wt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Vl=0;const Xt=new wt,jr=new Dt,li=new W,kt=new Hi,Pi=new Hi,St=new W;class Tn extends jn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Vl++}),this.uuid=Gi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(no(e)?uo:co)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Vt().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Xt.makeRotationFromQuaternion(e),this.applyMatrix4(Xt),this}rotateX(e){return Xt.makeRotationX(e),this.applyMatrix4(Xt),this}rotateY(e){return Xt.makeRotationY(e),this.applyMatrix4(Xt),this}rotateZ(e){return Xt.makeRotationZ(e),this.applyMatrix4(Xt),this}translate(e,t,n){return Xt.makeTranslation(e,t,n),this.applyMatrix4(Xt),this}scale(e,t,n){return Xt.makeScale(e,t,n),this.applyMatrix4(Xt),this}lookAt(e){return jr.lookAt(e),jr.updateMatrix(),this.applyMatrix4(jr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(li).negate(),this.translate(li.x,li.y,li.z),this}setFromPoints(e){const t=[];for(let n=0,i=e.length;n<i;n++){const r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Xn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Hi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new W(-1/0,-1/0,-1/0),new W(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];kt.setFromBufferAttribute(r),this.morphTargetsRelative?(St.addVectors(this.boundingBox.min,kt.min),this.boundingBox.expandByPoint(St),St.addVectors(this.boundingBox.max,kt.max),this.boundingBox.expandByPoint(St)):(this.boundingBox.expandByPoint(kt.min),this.boundingBox.expandByPoint(kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ms);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new W,1/0);return}if(e){const n=this.boundingSphere.center;if(kt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const a=t[r];Pi.setFromBufferAttribute(a),this.morphTargetsRelative?(St.addVectors(kt.min,Pi.min),kt.expandByPoint(St),St.addVectors(kt.max,Pi.max),kt.expandByPoint(St)):(kt.expandByPoint(Pi.min),kt.expandByPoint(Pi.max))}kt.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)St.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(St));if(t)for(let r=0,o=t.length;r<o;r++){const a=t[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)St.fromBufferAttribute(a,l),c&&(li.fromBufferAttribute(e,l),St.add(li)),i=Math.max(i,n.distanceToSquared(St))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,i=t.position.array,r=t.normal.array,o=t.uv.array,a=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Wt(new Float32Array(4*a),4));const c=this.getAttribute("tangent").array,l=[],u=[];for(let H=0;H<a;H++)l[H]=new W,u[H]=new W;const h=new W,f=new W,g=new W,v=new We,m=new We,d=new We,M=new W,C=new W;function w(H,ne,ae){h.fromArray(i,H*3),f.fromArray(i,ne*3),g.fromArray(i,ae*3),v.fromArray(o,H*2),m.fromArray(o,ne*2),d.fromArray(o,ae*2),f.sub(h),g.sub(h),m.sub(v),d.sub(v);const z=1/(m.x*d.y-d.x*m.y);isFinite(z)&&(M.copy(f).multiplyScalar(d.y).addScaledVector(g,-m.y).multiplyScalar(z),C.copy(g).multiplyScalar(m.x).addScaledVector(f,-d.x).multiplyScalar(z),l[H].add(M),l[ne].add(M),l[ae].add(M),u[H].add(C),u[ne].add(C),u[ae].add(C))}let T=this.groups;T.length===0&&(T=[{start:0,count:n.length}]);for(let H=0,ne=T.length;H<ne;++H){const ae=T[H],z=ae.start,F=ae.count;for(let ee=z,oe=z+F;ee<oe;ee+=3)w(n[ee+0],n[ee+1],n[ee+2])}const E=new W,N=new W,B=new W,x=new W;function R(H){B.fromArray(r,H*3),x.copy(B);const ne=l[H];E.copy(ne),E.sub(B.multiplyScalar(B.dot(ne))).normalize(),N.crossVectors(x,ne);const z=N.dot(u[H])<0?-1:1;c[H*4]=E.x,c[H*4+1]=E.y,c[H*4+2]=E.z,c[H*4+3]=z}for(let H=0,ne=T.length;H<ne;++H){const ae=T[H],z=ae.start,F=ae.count;for(let ee=z,oe=z+F;ee<oe;ee+=3)R(n[ee+0]),R(n[ee+1]),R(n[ee+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Wt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,g=n.count;f<g;f++)n.setXYZ(f,0,0,0);const i=new W,r=new W,o=new W,a=new W,c=new W,l=new W,u=new W,h=new W;if(e)for(let f=0,g=e.count;f<g;f+=3){const v=e.getX(f+0),m=e.getX(f+1),d=e.getX(f+2);i.fromBufferAttribute(t,v),r.fromBufferAttribute(t,m),o.fromBufferAttribute(t,d),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),a.fromBufferAttribute(n,v),c.fromBufferAttribute(n,m),l.fromBufferAttribute(n,d),a.add(u),c.add(u),l.add(u),n.setXYZ(v,a.x,a.y,a.z),n.setXYZ(m,c.x,c.y,c.z),n.setXYZ(d,l.x,l.y,l.z)}else for(let f=0,g=t.count;f<g;f+=3)i.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),n.setXYZ(f+0,u.x,u.y,u.z),n.setXYZ(f+1,u.x,u.y,u.z),n.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeBufferGeometries() instead."),this}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)St.fromBufferAttribute(e,t),St.normalize(),e.setXYZ(t,St.x,St.y,St.z)}toNonIndexed(){function e(a,c){const l=a.array,u=a.itemSize,h=a.normalized,f=new l.constructor(c.length*u);let g=0,v=0;for(let m=0,d=c.length;m<d;m++){a.isInterleavedBufferAttribute?g=c[m]*a.data.stride+a.offset:g=c[m]*u;for(let M=0;M<u;M++)f[v++]=l[g++]}return new Wt(f,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Tn,n=this.index.array,i=this.attributes;for(const a in i){const c=i[a],l=e(c,n);t.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let u=0,h=l.length;u<h;u++){const f=l[u],g=e(f,n);c.push(g)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const i={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let h=0,f=l.length;h<f;h++){const g=l[h];u.push(g.toJSON(e.data))}u.length>0&&(i[c]=u,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const i=e.attributes;for(const l in i){const u=i[l];this.setAttribute(l,u.clone(t))}const r=e.morphAttributes;for(const l in r){const u=[],h=r[l];for(let f=0,g=h.length;f<g;f++)u.push(h[f].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let l=0,u=o.length;l<u;l++){const h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,e.parameters!==void 0&&(this.parameters=Object.assign({},e.parameters)),this}dispose(){this.dispatchEvent({type:"dispose"})}}const ua=new wt,ci=new Fl,$r=new Ms,Di=new W,Ii=new W,Ni=new W,Kr=new W,sr=new W,ar=new We,or=new We,lr=new We,Jr=new W,cr=new W;class sn extends Dt{constructor(e=new Tn,t=new lo){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const a=this.morphTargetInfluences;if(r&&a){sr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=a[c],h=r[c];u!==0&&(Kr.fromBufferAttribute(h,e),o?sr.addScaledVector(Kr,u):sr.addScaledVector(Kr.sub(t),u))}t.add(sr)}return this.isSkinnedMesh&&this.boneTransform(e,t),t}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;if(i===void 0||(n.boundingSphere===null&&n.computeBoundingSphere(),$r.copy(n.boundingSphere),$r.applyMatrix4(r),e.ray.intersectsSphere($r)===!1)||(ua.copy(r).invert(),ci.copy(e.ray).applyMatrix4(ua),n.boundingBox!==null&&ci.intersectsBox(n.boundingBox)===!1))return;let o;const a=n.index,c=n.attributes.position,l=n.attributes.uv,u=n.attributes.uv2,h=n.groups,f=n.drawRange;if(a!==null)if(Array.isArray(i))for(let g=0,v=h.length;g<v;g++){const m=h[g],d=i[m.materialIndex],M=Math.max(m.start,f.start),C=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let w=M,T=C;w<T;w+=3){const E=a.getX(w),N=a.getX(w+1),B=a.getX(w+2);o=ur(this,d,e,ci,l,u,E,N,B),o&&(o.faceIndex=Math.floor(w/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,f.start),v=Math.min(a.count,f.start+f.count);for(let m=g,d=v;m<d;m+=3){const M=a.getX(m),C=a.getX(m+1),w=a.getX(m+2);o=ur(this,i,e,ci,l,u,M,C,w),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}else if(c!==void 0)if(Array.isArray(i))for(let g=0,v=h.length;g<v;g++){const m=h[g],d=i[m.materialIndex],M=Math.max(m.start,f.start),C=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let w=M,T=C;w<T;w+=3){const E=w,N=w+1,B=w+2;o=ur(this,d,e,ci,l,u,E,N,B),o&&(o.faceIndex=Math.floor(w/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,f.start),v=Math.min(c.count,f.start+f.count);for(let m=g,d=v;m<d;m+=3){const M=m,C=m+1,w=m+2;o=ur(this,i,e,ci,l,u,M,C,w),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}}}function Wl(s,e,t,n,i,r,o,a){let c;if(e.side===jt?c=n.intersectTriangle(o,r,i,!0,a):c=n.intersectTriangle(i,r,o,e.side===qn,a),c===null)return null;cr.copy(a),cr.applyMatrix4(s.matrixWorld);const l=t.ray.origin.distanceTo(cr);return l<t.near||l>t.far?null:{distance:l,point:cr.clone(),object:s}}function ur(s,e,t,n,i,r,o,a,c){s.getVertexPosition(o,Di),s.getVertexPosition(a,Ii),s.getVertexPosition(c,Ni);const l=Wl(s,e,t,n,Di,Ii,Ni,Jr);if(l){i&&(ar.fromBufferAttribute(i,o),or.fromBufferAttribute(i,a),lr.fromBufferAttribute(i,c),l.uv=Sn.getUV(Jr,Di,Ii,Ni,ar,or,lr,new We)),r&&(ar.fromBufferAttribute(r,o),or.fromBufferAttribute(r,a),lr.fromBufferAttribute(r,c),l.uv2=Sn.getUV(Jr,Di,Ii,Ni,ar,or,lr,new We));const u={a:o,b:a,c,normal:new W,materialIndex:0};Sn.getNormal(Di,Ii,Ni,u.normal),l.face=u}return l}class Wi extends Tn{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};const a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],u=[],h=[];let f=0,g=0;v("z","y","x",-1,-1,n,t,e,o,r,0),v("z","y","x",1,-1,n,t,-e,o,r,1),v("x","z","y",1,1,e,n,t,i,o,2),v("x","z","y",1,-1,e,n,-t,i,o,3),v("x","y","z",1,-1,e,t,n,i,r,4),v("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new Xn(l,3)),this.setAttribute("normal",new Xn(u,3)),this.setAttribute("uv",new Xn(h,2));function v(m,d,M,C,w,T,E,N,B,x,R){const H=T/B,ne=E/x,ae=T/2,z=E/2,F=N/2,ee=B+1,oe=x+1;let he=0,te=0;const _e=new W;for(let re=0;re<oe;re++){const Z=re*ne-z;for(let q=0;q<ee;q++){const le=q*H-ae;_e[m]=le*C,_e[d]=Z*w,_e[M]=F,l.push(_e.x,_e.y,_e.z),_e[m]=0,_e[d]=0,_e[M]=N>0?1:-1,u.push(_e.x,_e.y,_e.z),h.push(q/B),h.push(1-re/x),he+=1}}for(let re=0;re<x;re++)for(let Z=0;Z<B;Z++){const q=f+Z+ee*re,le=f+Z+ee*(re+1),ge=f+(Z+1)+ee*(re+1),Se=f+(Z+1)+ee*re;c.push(q,le,Se),c.push(le,ge,Se),te+=6}a.addGroup(g,te,R),g+=te,f+=he}}static fromJSON(e){return new Wi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function wi(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Rt(s){const e={};for(let t=0;t<s.length;t++){const n=wi(s[t]);for(const i in n)e[i]=n[i]}return e}function Xl(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function ho(s){return s.getRenderTarget()===null&&s.outputEncoding===rt?ln:ki}const ql={clone:wi,merge:Rt};var Yl=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Zl=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class un extends Mr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Yl,this.fragmentShader=Zl,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=wi(e.uniforms),this.uniformsGroups=Xl(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class fo extends Dt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new wt,this.projectionMatrix=new wt,this.projectionMatrixInverse=new wt}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(-t[8],-t[9],-t[10]).normalize()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class nn extends fo{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Qs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Dr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Qs*2*Math.atan(Math.tan(Dr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Dr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*i/c,t-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const ui=-90,hi=1;class jl extends Dt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n;const i=new nn(ui,hi,e,t);i.layers=this.layers,i.up.set(0,1,0),i.lookAt(1,0,0),this.add(i);const r=new nn(ui,hi,e,t);r.layers=this.layers,r.up.set(0,1,0),r.lookAt(-1,0,0),this.add(r);const o=new nn(ui,hi,e,t);o.layers=this.layers,o.up.set(0,0,-1),o.lookAt(0,1,0),this.add(o);const a=new nn(ui,hi,e,t);a.layers=this.layers,a.up.set(0,0,1),a.lookAt(0,-1,0),this.add(a);const c=new nn(ui,hi,e,t);c.layers=this.layers,c.up.set(0,1,0),c.lookAt(0,0,1),this.add(c);const l=new nn(ui,hi,e,t);l.layers=this.layers,l.up.set(0,1,0),l.lookAt(0,0,-1),this.add(l)}update(e,t){this.parent===null&&this.updateMatrixWorld();const n=this.renderTarget,[i,r,o,a,c,l]=this.children,u=e.getRenderTarget(),h=e.toneMapping,f=e.xr.enabled;e.toneMapping=bn,e.xr.enabled=!1;const g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0),e.render(t,i),e.setRenderTarget(n,1),e.render(t,r),e.setRenderTarget(n,2),e.render(t,o),e.setRenderTarget(n,3),e.render(t,a),e.setRenderTarget(n,4),e.render(t,c),n.texture.generateMipmaps=g,e.setRenderTarget(n,5),e.render(t,l),e.setRenderTarget(u),e.toneMapping=h,e.xr.enabled=f,n.texture.needsPMREMUpdate=!0}}class po extends Ut{constructor(e,t,n,i,r,o,a,c,l,u){e=e!==void 0?e:[],t=t!==void 0?t:Si,super(e,t,n,i,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class $l extends Zn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new po(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.encoding),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:bt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.encoding=t.encoding,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Wi(5,5,5),r=new un({name:"CubemapFromEquirect",uniforms:wi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:jt,blending:In});r.uniforms.tEquirect.value=t;const o=new sn(i,r),a=t.minFilter;return t.minFilter===yi&&(t.minFilter=bt),new jl(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,i){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}}const Qr=new W,Kl=new W,Jl=new Vt;class zn{constructor(e=new W(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=Qr.subVectors(n,t).cross(Kl.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(this.normal).multiplyScalar(-this.distanceToPoint(e)).add(e)}intersectLine(e,t){const n=e.delta(Qr),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(n).multiplyScalar(r).add(e.start)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Jl.getNormalMatrix(e),i=this.coplanarPoint(Qr).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const di=new Ms,hr=new W;class mo{constructor(e=new zn,t=new zn,n=new zn,i=new zn,r=new zn,o=new zn){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e){const t=this.planes,n=e.elements,i=n[0],r=n[1],o=n[2],a=n[3],c=n[4],l=n[5],u=n[6],h=n[7],f=n[8],g=n[9],v=n[10],m=n[11],d=n[12],M=n[13],C=n[14],w=n[15];return t[0].setComponents(a-i,h-c,m-f,w-d).normalize(),t[1].setComponents(a+i,h+c,m+f,w+d).normalize(),t[2].setComponents(a+r,h+l,m+g,w+M).normalize(),t[3].setComponents(a-r,h-l,m-g,w-M).normalize(),t[4].setComponents(a-o,h-u,m-v,w-C).normalize(),t[5].setComponents(a+o,h+u,m+v,w+C).normalize(),this}intersectsObject(e){const t=e.geometry;return t.boundingSphere===null&&t.computeBoundingSphere(),di.copy(t.boundingSphere).applyMatrix4(e.matrixWorld),this.intersectsSphere(di)}intersectsSprite(e){return di.center.set(0,0,0),di.radius=.7071067811865476,di.applyMatrix4(e.matrixWorld),this.intersectsSphere(di)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(hr.x=i.normal.x>0?e.max.x:e.min.x,hr.y=i.normal.y>0?e.max.y:e.min.y,hr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(hr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function go(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Ql(s,e){const t=e.isWebGL2,n=new WeakMap;function i(l,u){const h=l.array,f=l.usage,g=s.createBuffer();s.bindBuffer(u,g),s.bufferData(u,h,f),l.onUploadCallback();let v;if(h instanceof Float32Array)v=5126;else if(h instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(t)v=5131;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else v=5123;else if(h instanceof Int16Array)v=5122;else if(h instanceof Uint32Array)v=5125;else if(h instanceof Int32Array)v=5124;else if(h instanceof Int8Array)v=5120;else if(h instanceof Uint8Array)v=5121;else if(h instanceof Uint8ClampedArray)v=5121;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:v,bytesPerElement:h.BYTES_PER_ELEMENT,version:l.version}}function r(l,u,h){const f=u.array,g=u.updateRange;s.bindBuffer(h,l),g.count===-1?s.bufferSubData(h,0,f):(t?s.bufferSubData(h,g.offset*f.BYTES_PER_ELEMENT,f,g.offset,g.count):s.bufferSubData(h,g.offset*f.BYTES_PER_ELEMENT,f.subarray(g.offset,g.offset+g.count)),g.count=-1),u.onUploadCallback()}function o(l){return l.isInterleavedBufferAttribute&&(l=l.data),n.get(l)}function a(l){l.isInterleavedBufferAttribute&&(l=l.data);const u=n.get(l);u&&(s.deleteBuffer(u.buffer),n.delete(l))}function c(l,u){if(l.isGLBufferAttribute){const f=n.get(l);(!f||f.version<l.version)&&n.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);const h=n.get(l);h===void 0?n.set(l,i(l,u)):h.version<l.version&&(r(h.buffer,l,u),h.version=l.version)}return{get:o,remove:a,update:c}}class yr extends Tn{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(i),l=a+1,u=c+1,h=e/a,f=t/c,g=[],v=[],m=[],d=[];for(let M=0;M<u;M++){const C=M*f-o;for(let w=0;w<l;w++){const T=w*h-r;v.push(T,-C,0),m.push(0,0,1),d.push(w/a),d.push(1-M/c)}}for(let M=0;M<c;M++)for(let C=0;C<a;C++){const w=C+l*M,T=C+l*(M+1),E=C+1+l*(M+1),N=C+1+l*M;g.push(w,T,N),g.push(T,E,N)}this.setIndex(g),this.setAttribute("position",new Xn(v,3)),this.setAttribute("normal",new Xn(m,3)),this.setAttribute("uv",new Xn(d,2))}static fromJSON(e){return new yr(e.width,e.height,e.widthSegments,e.heightSegments)}}var ec=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
#endif`,tc=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,nc=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,ic=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,rc=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,sc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ac="vec3 transformed = vec3( position );",oc=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,lc=`vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float roughness ) {
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
	float D = D_GGX( alpha, dotNH );
	return F * ( V * D );
}
#ifdef USE_IRIDESCENCE
	vec3 BRDF_GGX_Iridescence( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float iridescence, const in vec3 iridescenceFresnel, const in float roughness ) {
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = mix( F_Schlick( f0, f90, dotVH ), iridescenceFresnel, iridescence );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif`,cc=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			 return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float R21 = R12;
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,uc=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vUv );
		vec2 dSTdy = dFdy( vUv );
		float Hll = bumpScale * texture2D( bumpMap, vUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = dFdx( surf_pos.xyz );
		vec3 vSigmaY = dFdy( surf_pos.xyz );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,hc=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,dc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,fc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,pc=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,mc=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,gc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,_c=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,xc=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,vc=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal;
#endif
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}`,Sc=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_v0 0.339
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_v1 0.276
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_v4 0.046
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_v5 0.016
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_v6 0.0038
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Mc=`vec3 transformedNormal = objectNormal;
#ifdef USE_INSTANCING
	mat3 m = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	transformedNormal = m * transformedNormal;
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,yc=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,bc=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );
#endif`,wc=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Tc=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ec="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ac=`vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Cc=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Rc=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Lc=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Pc=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Dc=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ic=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Nc=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Fc=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Oc=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Uc=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,zc=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vUv2 );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Bc=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,kc=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Gc=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Hc=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
uniform vec3 lightProbe[ 9 ];
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( PHYSICALLY_CORRECT_LIGHTS )
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#else
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometry.position;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometry.position;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Vc=`#if defined( USE_ENVMAP )
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
#endif`,Wc=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Xc=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,qc=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Yc=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zc=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULARINTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vUv ).a;
		#endif
		#ifdef USE_SPECULARCOLORMAP
			specularColorFactor *= texture2D( specularColorMap, vUv ).rgb;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEENCOLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEENROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vUv ).a;
	#endif
#endif`,jc=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
};
vec3 clearcoatSpecular = vec3( 0.0 );
vec3 sheenSpecular = vec3( 0.0 );
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometry.normal;
		vec3 viewDir = geometry.viewDir;
		vec3 position = geometry.position;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometry.clearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecular += ccIrradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.clearcoatNormal, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * BRDF_Sheen( directLight.direction, geometry.viewDir, geometry.normal, material.sheenColor, material.sheenRoughness );
	#endif
	#ifdef USE_IRIDESCENCE
		reflectedLight.directSpecular += irradiance * BRDF_GGX_Iridescence( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness );
	#else
		reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularF90, material.roughness );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecular += clearcoatRadiance * EnvironmentBRDF( geometry.clearcoatNormal, geometry.viewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * material.sheenColor * IBLSheenBRDF( geometry.normal, geometry.viewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,$c=`
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
#ifdef USE_CLEARCOAT
	geometry.clearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometry.viewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometry, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Kc=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometry.normal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Jc=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`,Qc=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,eu=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,tu=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,nu=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,iu=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ru=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,su=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,au=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	uniform mat3 uvTransform;
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ou=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vUv );
	metalnessFactor *= texelMetalness.b;
#endif`,lu=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,cu=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,uu=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,hu=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,du=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,fu=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	#ifdef USE_TANGENT
		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );
		#ifdef DOUBLE_SIDED
			tangent = tangent * faceDirection;
			bitangent = bitangent * faceDirection;
		#endif
		#if defined( TANGENTSPACE_NORMALMAP ) || defined( USE_CLEARCOAT_NORMALMAP )
			mat3 vTBN = mat3( tangent, bitangent, normal );
		#endif
	#endif
#endif
vec3 geometryNormal = normal;`,pu=`#ifdef OBJECTSPACE_NORMALMAP
	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( TANGENTSPACE_NORMALMAP )
	vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	#ifdef USE_TANGENT
		normal = normalize( vTBN * mapN );
	#else
		normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
	#endif
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,mu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_u=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,xu=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef OBJECTSPACE_NORMALMAP
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( TANGENTSPACE_NORMALMAP ) || defined ( USE_CLEARCOAT_NORMALMAP ) )
	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( vUv.st );
		vec2 st1 = dFdy( vUv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );
		return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );
	}
#endif`,vu=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`,Su=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	#ifdef USE_TANGENT
		clearcoatNormal = normalize( vTBN * clearcoatMapN );
	#else
		clearcoatNormal = perturbNormal2Arb( - vViewPosition, clearcoatNormal, clearcoatMapN, faceDirection );
	#endif
#endif`,Mu=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif`,yu=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,bu=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,wu=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
	return linearClipZ * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * invClipZ - far );
}`,Tu=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Eu=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Au=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Cu=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ru=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Lu=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Pu=`#if NUM_SPOT_LIGHT_COORDS > 0
  varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
  uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,Du=`#if NUM_SPOT_LIGHT_COORDS > 0
  uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
  varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Iu=`#if defined( USE_SHADOWMAP ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#if NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SPOT_LIGHT_COORDS > 0 || NUM_POINT_LIGHT_SHADOWS > 0
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		vec4 shadowWorldPosition;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
		vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
		vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
	#endif
#endif`,Nu=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Fu=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ou=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	uniform int boneTextureSize;
	mat4 getBoneMatrix( const in float i ) {
		float j = i * 4.0;
		float x = mod( j, float( boneTextureSize ) );
		float y = floor( j / float( boneTextureSize ) );
		float dx = 1.0 / float( boneTextureSize );
		float dy = 1.0 / float( boneTextureSize );
		y = dy * ( y + 0.5 );
		vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
		vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
		vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
		vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
		mat4 bone = mat4( v1, v2, v3, v4 );
		return bone;
	}
#endif`,Uu=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,zu=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Bu=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ku=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Gu=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Hu=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return toneMappingExposure * color;
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Vu=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmission = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmission.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmission.rgb, material.transmission );
#endif`,Wu=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float framebufferLod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		#ifdef texture2DLodEXT
			return texture2DLodEXT( transmissionSamplerMap, fragCoord.xy, framebufferLod );
		#else
			return texture2D( transmissionSamplerMap, fragCoord.xy, framebufferLod );
		#endif
	}
	vec3 applyVolumeAttenuation( const in vec3 radiance, const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return radiance;
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance * radiance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 attenuatedColor = applyVolumeAttenuation( transmittedLight.rgb, length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		return vec4( ( 1.0 - F ) * attenuatedColor * diffuseColor, transmittedLight.a );
	}
#endif`,Xu=`#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	varying vec2 vUv;
#endif`,qu=`#ifdef USE_UV
	#ifdef UVS_VERTEX_ONLY
		vec2 vUv;
	#else
		varying vec2 vUv;
	#endif
	uniform mat3 uvTransform;
#endif`,Yu=`#ifdef USE_UV
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
#endif`,Zu=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	varying vec2 vUv2;
#endif`,ju=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	attribute vec2 uv2;
	varying vec2 vUv2;
	uniform mat3 uv2Transform;
#endif`,$u=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
#endif`,Ku=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Ju=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Qu=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,eh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,th=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,nh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ih=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,rh=`#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,sh=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,ah=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,oh=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,lh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ch=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,uh=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,hh=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,dh=`#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,fh=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ph=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mh=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gh=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,_h=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xh=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	vViewPosition = - mvPosition.xyz;
#endif
}`,vh=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Sh=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Mh=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yh=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,bh=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULARINTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
	#ifdef USE_SPECULARCOLORMAP
		uniform sampler2D specularColorMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEENCOLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEENROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wh=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Th=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Eh=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Ah=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ch=`#include <common>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rh=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,Lh=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ph=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,Xe={alphamap_fragment:ec,alphamap_pars_fragment:tc,alphatest_fragment:nc,alphatest_pars_fragment:ic,aomap_fragment:rc,aomap_pars_fragment:sc,begin_vertex:ac,beginnormal_vertex:oc,bsdfs:lc,iridescence_fragment:cc,bumpmap_pars_fragment:uc,clipping_planes_fragment:hc,clipping_planes_pars_fragment:dc,clipping_planes_pars_vertex:fc,clipping_planes_vertex:pc,color_fragment:mc,color_pars_fragment:gc,color_pars_vertex:_c,color_vertex:xc,common:vc,cube_uv_reflection_fragment:Sc,defaultnormal_vertex:Mc,displacementmap_pars_vertex:yc,displacementmap_vertex:bc,emissivemap_fragment:wc,emissivemap_pars_fragment:Tc,encodings_fragment:Ec,encodings_pars_fragment:Ac,envmap_fragment:Cc,envmap_common_pars_fragment:Rc,envmap_pars_fragment:Lc,envmap_pars_vertex:Pc,envmap_physical_pars_fragment:Vc,envmap_vertex:Dc,fog_vertex:Ic,fog_pars_vertex:Nc,fog_fragment:Fc,fog_pars_fragment:Oc,gradientmap_pars_fragment:Uc,lightmap_fragment:zc,lightmap_pars_fragment:Bc,lights_lambert_fragment:kc,lights_lambert_pars_fragment:Gc,lights_pars_begin:Hc,lights_toon_fragment:Wc,lights_toon_pars_fragment:Xc,lights_phong_fragment:qc,lights_phong_pars_fragment:Yc,lights_physical_fragment:Zc,lights_physical_pars_fragment:jc,lights_fragment_begin:$c,lights_fragment_maps:Kc,lights_fragment_end:Jc,logdepthbuf_fragment:Qc,logdepthbuf_pars_fragment:eu,logdepthbuf_pars_vertex:tu,logdepthbuf_vertex:nu,map_fragment:iu,map_pars_fragment:ru,map_particle_fragment:su,map_particle_pars_fragment:au,metalnessmap_fragment:ou,metalnessmap_pars_fragment:lu,morphcolor_vertex:cu,morphnormal_vertex:uu,morphtarget_pars_vertex:hu,morphtarget_vertex:du,normal_fragment_begin:fu,normal_fragment_maps:pu,normal_pars_fragment:mu,normal_pars_vertex:gu,normal_vertex:_u,normalmap_pars_fragment:xu,clearcoat_normal_fragment_begin:vu,clearcoat_normal_fragment_maps:Su,clearcoat_pars_fragment:Mu,iridescence_pars_fragment:yu,output_fragment:bu,packing:wu,premultiplied_alpha_fragment:Tu,project_vertex:Eu,dithering_fragment:Au,dithering_pars_fragment:Cu,roughnessmap_fragment:Ru,roughnessmap_pars_fragment:Lu,shadowmap_pars_fragment:Pu,shadowmap_pars_vertex:Du,shadowmap_vertex:Iu,shadowmask_pars_fragment:Nu,skinbase_vertex:Fu,skinning_pars_vertex:Ou,skinning_vertex:Uu,skinnormal_vertex:zu,specularmap_fragment:Bu,specularmap_pars_fragment:ku,tonemapping_fragment:Gu,tonemapping_pars_fragment:Hu,transmission_fragment:Vu,transmission_pars_fragment:Wu,uv_pars_fragment:Xu,uv_pars_vertex:qu,uv_vertex:Yu,uv2_pars_fragment:Zu,uv2_pars_vertex:ju,uv2_vertex:$u,worldpos_vertex:Ku,background_vert:Ju,background_frag:Qu,backgroundCube_vert:eh,backgroundCube_frag:th,cube_vert:nh,cube_frag:ih,depth_vert:rh,depth_frag:sh,distanceRGBA_vert:ah,distanceRGBA_frag:oh,equirect_vert:lh,equirect_frag:ch,linedashed_vert:uh,linedashed_frag:hh,meshbasic_vert:dh,meshbasic_frag:fh,meshlambert_vert:ph,meshlambert_frag:mh,meshmatcap_vert:gh,meshmatcap_frag:_h,meshnormal_vert:xh,meshnormal_frag:vh,meshphong_vert:Sh,meshphong_frag:Mh,meshphysical_vert:yh,meshphysical_frag:bh,meshtoon_vert:wh,meshtoon_frag:Th,points_vert:Eh,points_frag:Ah,shadow_vert:Ch,shadow_frag:Rh,sprite_vert:Lh,sprite_frag:Ph},Me={common:{diffuse:{value:new je(16777215)},opacity:{value:1},map:{value:null},uvTransform:{value:new Vt},uv2Transform:{value:new Vt},alphaMap:{value:null},alphaTest:{value:0}},specularmap:{specularMap:{value:null}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1}},emissivemap:{emissiveMap:{value:null}},bumpmap:{bumpMap:{value:null},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalScale:{value:new We(1,1)}},displacementmap:{displacementMap:{value:null},displacementScale:{value:1},displacementBias:{value:0}},roughnessmap:{roughnessMap:{value:null}},metalnessmap:{metalnessMap:{value:null}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new je(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new je(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new je(16777215)},opacity:{value:1},center:{value:new We(.5,.5)},rotation:{value:0},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Vt}}},cn={basic:{uniforms:Rt([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.fog]),vertexShader:Xe.meshbasic_vert,fragmentShader:Xe.meshbasic_frag},lambert:{uniforms:Rt([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new je(0)}}]),vertexShader:Xe.meshlambert_vert,fragmentShader:Xe.meshlambert_frag},phong:{uniforms:Rt([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new je(0)},specular:{value:new je(1118481)},shininess:{value:30}}]),vertexShader:Xe.meshphong_vert,fragmentShader:Xe.meshphong_frag},standard:{uniforms:Rt([Me.common,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.roughnessmap,Me.metalnessmap,Me.fog,Me.lights,{emissive:{value:new je(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Xe.meshphysical_vert,fragmentShader:Xe.meshphysical_frag},toon:{uniforms:Rt([Me.common,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.gradientmap,Me.fog,Me.lights,{emissive:{value:new je(0)}}]),vertexShader:Xe.meshtoon_vert,fragmentShader:Xe.meshtoon_frag},matcap:{uniforms:Rt([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,{matcap:{value:null}}]),vertexShader:Xe.meshmatcap_vert,fragmentShader:Xe.meshmatcap_frag},points:{uniforms:Rt([Me.points,Me.fog]),vertexShader:Xe.points_vert,fragmentShader:Xe.points_frag},dashed:{uniforms:Rt([Me.common,Me.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Xe.linedashed_vert,fragmentShader:Xe.linedashed_frag},depth:{uniforms:Rt([Me.common,Me.displacementmap]),vertexShader:Xe.depth_vert,fragmentShader:Xe.depth_frag},normal:{uniforms:Rt([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,{opacity:{value:1}}]),vertexShader:Xe.meshnormal_vert,fragmentShader:Xe.meshnormal_frag},sprite:{uniforms:Rt([Me.sprite,Me.fog]),vertexShader:Xe.sprite_vert,fragmentShader:Xe.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Xe.background_vert,fragmentShader:Xe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Xe.backgroundCube_vert,fragmentShader:Xe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Xe.cube_vert,fragmentShader:Xe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Xe.equirect_vert,fragmentShader:Xe.equirect_frag},distanceRGBA:{uniforms:Rt([Me.common,Me.displacementmap,{referencePosition:{value:new W},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Xe.distanceRGBA_vert,fragmentShader:Xe.distanceRGBA_frag},shadow:{uniforms:Rt([Me.lights,Me.fog,{color:{value:new je(0)},opacity:{value:1}}]),vertexShader:Xe.shadow_vert,fragmentShader:Xe.shadow_frag}};cn.physical={uniforms:Rt([cn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatNormalScale:{value:new We(1,1)},clearcoatNormalMap:{value:null},iridescence:{value:0},iridescenceMap:{value:null},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},sheen:{value:0},sheenColor:{value:new je(0)},sheenColorMap:{value:null},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},transmission:{value:0},transmissionMap:{value:null},transmissionSamplerSize:{value:new We},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},attenuationDistance:{value:0},attenuationColor:{value:new je(0)},specularIntensity:{value:1},specularIntensityMap:{value:null},specularColor:{value:new je(1,1,1)},specularColorMap:{value:null}}]),vertexShader:Xe.meshphysical_vert,fragmentShader:Xe.meshphysical_frag};const dr={r:0,b:0,g:0};function Dh(s,e,t,n,i,r,o){const a=new je(0);let c=r===!0?0:1,l,u,h=null,f=0,g=null;function v(d,M){let C=!1,w=M.isScene===!0?M.background:null;w&&w.isTexture&&(w=(M.backgroundBlurriness>0?t:e).get(w));const T=s.xr,E=T.getSession&&T.getSession();E&&E.environmentBlendMode==="additive"&&(w=null),w===null?m(a,c):w&&w.isColor&&(m(w,1),C=!0),(s.autoClear||C)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),w&&(w.isCubeTexture||w.mapping===Sr)?(u===void 0&&(u=new sn(new Wi(1,1,1),new un({name:"BackgroundCubeMaterial",uniforms:wi(cn.backgroundCube.uniforms),vertexShader:cn.backgroundCube.vertexShader,fragmentShader:cn.backgroundCube.fragmentShader,side:jt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(N,B,x){this.matrixWorld.copyPosition(x.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),u.material.uniforms.envMap.value=w,u.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.toneMapped=w.encoding!==rt,(h!==w||f!==w.version||g!==s.toneMapping)&&(u.material.needsUpdate=!0,h=w,f=w.version,g=s.toneMapping),u.layers.enableAll(),d.unshift(u,u.geometry,u.material,0,0,null)):w&&w.isTexture&&(l===void 0&&(l=new sn(new yr(2,2),new un({name:"BackgroundMaterial",uniforms:wi(cn.background.uniforms),vertexShader:cn.background.vertexShader,fragmentShader:cn.background.fragmentShader,side:qn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=w,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=w.encoding!==rt,w.matrixAutoUpdate===!0&&w.updateMatrix(),l.material.uniforms.uvTransform.value.copy(w.matrix),(h!==w||f!==w.version||g!==s.toneMapping)&&(l.material.needsUpdate=!0,h=w,f=w.version,g=s.toneMapping),l.layers.enableAll(),d.unshift(l,l.geometry,l.material,0,0,null))}function m(d,M){d.getRGB(dr,ho(s)),n.buffers.color.setClear(dr.r,dr.g,dr.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(d,M=1){a.set(d),c=M,m(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(d){c=d,m(a,c)},render:v}}function Ih(s,e,t,n){const i=s.getParameter(34921),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),o=n.isWebGL2||r!==null,a={},c=d(null);let l=c,u=!1;function h(F,ee,oe,he,te){let _e=!1;if(o){const re=m(he,oe,ee);l!==re&&(l=re,g(l.object)),_e=M(F,he,oe,te),_e&&C(F,he,oe,te)}else{const re=ee.wireframe===!0;(l.geometry!==he.id||l.program!==oe.id||l.wireframe!==re)&&(l.geometry=he.id,l.program=oe.id,l.wireframe=re,_e=!0)}te!==null&&t.update(te,34963),(_e||u)&&(u=!1,x(F,ee,oe,he),te!==null&&s.bindBuffer(34963,t.get(te).buffer))}function f(){return n.isWebGL2?s.createVertexArray():r.createVertexArrayOES()}function g(F){return n.isWebGL2?s.bindVertexArray(F):r.bindVertexArrayOES(F)}function v(F){return n.isWebGL2?s.deleteVertexArray(F):r.deleteVertexArrayOES(F)}function m(F,ee,oe){const he=oe.wireframe===!0;let te=a[F.id];te===void 0&&(te={},a[F.id]=te);let _e=te[ee.id];_e===void 0&&(_e={},te[ee.id]=_e);let re=_e[he];return re===void 0&&(re=d(f()),_e[he]=re),re}function d(F){const ee=[],oe=[],he=[];for(let te=0;te<i;te++)ee[te]=0,oe[te]=0,he[te]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:ee,enabledAttributes:oe,attributeDivisors:he,object:F,attributes:{},index:null}}function M(F,ee,oe,he){const te=l.attributes,_e=ee.attributes;let re=0;const Z=oe.getAttributes();for(const q in Z)if(Z[q].location>=0){const ge=te[q];let Se=_e[q];if(Se===void 0&&(q==="instanceMatrix"&&F.instanceMatrix&&(Se=F.instanceMatrix),q==="instanceColor"&&F.instanceColor&&(Se=F.instanceColor)),ge===void 0||ge.attribute!==Se||Se&&ge.data!==Se.data)return!0;re++}return l.attributesNum!==re||l.index!==he}function C(F,ee,oe,he){const te={},_e=ee.attributes;let re=0;const Z=oe.getAttributes();for(const q in Z)if(Z[q].location>=0){let ge=_e[q];ge===void 0&&(q==="instanceMatrix"&&F.instanceMatrix&&(ge=F.instanceMatrix),q==="instanceColor"&&F.instanceColor&&(ge=F.instanceColor));const Se={};Se.attribute=ge,ge&&ge.data&&(Se.data=ge.data),te[q]=Se,re++}l.attributes=te,l.attributesNum=re,l.index=he}function w(){const F=l.newAttributes;for(let ee=0,oe=F.length;ee<oe;ee++)F[ee]=0}function T(F){E(F,0)}function E(F,ee){const oe=l.newAttributes,he=l.enabledAttributes,te=l.attributeDivisors;oe[F]=1,he[F]===0&&(s.enableVertexAttribArray(F),he[F]=1),te[F]!==ee&&((n.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](F,ee),te[F]=ee)}function N(){const F=l.newAttributes,ee=l.enabledAttributes;for(let oe=0,he=ee.length;oe<he;oe++)ee[oe]!==F[oe]&&(s.disableVertexAttribArray(oe),ee[oe]=0)}function B(F,ee,oe,he,te,_e){n.isWebGL2===!0&&(oe===5124||oe===5125)?s.vertexAttribIPointer(F,ee,oe,te,_e):s.vertexAttribPointer(F,ee,oe,he,te,_e)}function x(F,ee,oe,he){if(n.isWebGL2===!1&&(F.isInstancedMesh||he.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;w();const te=he.attributes,_e=oe.getAttributes(),re=ee.defaultAttributeValues;for(const Z in _e){const q=_e[Z];if(q.location>=0){let le=te[Z];if(le===void 0&&(Z==="instanceMatrix"&&F.instanceMatrix&&(le=F.instanceMatrix),Z==="instanceColor"&&F.instanceColor&&(le=F.instanceColor)),le!==void 0){const ge=le.normalized,Se=le.itemSize,X=t.get(le);if(X===void 0)continue;const Ge=X.buffer,be=X.type,Ue=X.bytesPerElement;if(le.isInterleavedBufferAttribute){const Re=le.data,$e=Re.stride,Ve=le.offset;if(Re.isInstancedInterleavedBuffer){for(let Oe=0;Oe<q.locationSize;Oe++)E(q.location+Oe,Re.meshPerAttribute);F.isInstancedMesh!==!0&&he._maxInstanceCount===void 0&&(he._maxInstanceCount=Re.meshPerAttribute*Re.count)}else for(let Oe=0;Oe<q.locationSize;Oe++)T(q.location+Oe);s.bindBuffer(34962,Ge);for(let Oe=0;Oe<q.locationSize;Oe++)B(q.location+Oe,Se/q.locationSize,be,ge,$e*Ue,(Ve+Se/q.locationSize*Oe)*Ue)}else{if(le.isInstancedBufferAttribute){for(let Re=0;Re<q.locationSize;Re++)E(q.location+Re,le.meshPerAttribute);F.isInstancedMesh!==!0&&he._maxInstanceCount===void 0&&(he._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Re=0;Re<q.locationSize;Re++)T(q.location+Re);s.bindBuffer(34962,Ge);for(let Re=0;Re<q.locationSize;Re++)B(q.location+Re,Se/q.locationSize,be,ge,Se*Ue,Se/q.locationSize*Re*Ue)}}else if(re!==void 0){const ge=re[Z];if(ge!==void 0)switch(ge.length){case 2:s.vertexAttrib2fv(q.location,ge);break;case 3:s.vertexAttrib3fv(q.location,ge);break;case 4:s.vertexAttrib4fv(q.location,ge);break;default:s.vertexAttrib1fv(q.location,ge)}}}}N()}function R(){ae();for(const F in a){const ee=a[F];for(const oe in ee){const he=ee[oe];for(const te in he)v(he[te].object),delete he[te];delete ee[oe]}delete a[F]}}function H(F){if(a[F.id]===void 0)return;const ee=a[F.id];for(const oe in ee){const he=ee[oe];for(const te in he)v(he[te].object),delete he[te];delete ee[oe]}delete a[F.id]}function ne(F){for(const ee in a){const oe=a[ee];if(oe[F.id]===void 0)continue;const he=oe[F.id];for(const te in he)v(he[te].object),delete he[te];delete oe[F.id]}}function ae(){z(),u=!0,l!==c&&(l=c,g(l.object))}function z(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:h,reset:ae,resetDefaultState:z,dispose:R,releaseStatesOfGeometry:H,releaseStatesOfProgram:ne,initAttributes:w,enableAttribute:T,disableUnusedAttributes:N}}function Nh(s,e,t,n){const i=n.isWebGL2;let r;function o(l){r=l}function a(l,u){s.drawArrays(r,l,u),t.update(u,r,1)}function c(l,u,h){if(h===0)return;let f,g;if(i)f=s,g="drawArraysInstanced";else if(f=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",f===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}f[g](r,l,u,h),t.update(u,r,h)}this.setMode=o,this.render=a,this.renderInstances=c}function Fh(s,e,t){let n;function i(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const B=e.get("EXT_texture_filter_anisotropic");n=s.getParameter(B.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(B){if(B==="highp"){if(s.getShaderPrecisionFormat(35633,36338).precision>0&&s.getShaderPrecisionFormat(35632,36338).precision>0)return"highp";B="mediump"}return B==="mediump"&&s.getShaderPrecisionFormat(35633,36337).precision>0&&s.getShaderPrecisionFormat(35632,36337).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&s instanceof WebGL2RenderingContext||typeof WebGL2ComputeRenderingContext<"u"&&s instanceof WebGL2ComputeRenderingContext;let a=t.precision!==void 0?t.precision:"highp";const c=r(a);c!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",c,"instead."),a=c);const l=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=s.getParameter(34930),f=s.getParameter(35660),g=s.getParameter(3379),v=s.getParameter(34076),m=s.getParameter(34921),d=s.getParameter(36347),M=s.getParameter(36348),C=s.getParameter(36349),w=f>0,T=o||e.has("OES_texture_float"),E=w&&T,N=o?s.getParameter(36183):0;return{isWebGL2:o,drawBuffers:l,getMaxAnisotropy:i,getMaxPrecision:r,precision:a,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:f,maxTextureSize:g,maxCubemapSize:v,maxAttributes:m,maxVertexUniforms:d,maxVaryings:M,maxFragmentUniforms:C,vertexTextures:w,floatFragmentTextures:T,floatVertexTextures:E,maxSamples:N}}function Oh(s){const e=this;let t=null,n=0,i=!1,r=!1;const o=new zn,a=new Vt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f,g){const v=h.length!==0||f||n!==0||i;return i=f,t=u(h,g,0),n=h.length,v},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1,l()},this.setState=function(h,f,g){const v=h.clippingPlanes,m=h.clipIntersection,d=h.clipShadows,M=s.get(h);if(!i||v===null||v.length===0||r&&!d)r?u(null):l();else{const C=r?0:n,w=C*4;let T=M.clippingState||null;c.value=T,T=u(v,f,w,g);for(let E=0;E!==w;++E)T[E]=t[E];M.clippingState=T,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=C}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,f,g,v){const m=h!==null?h.length:0;let d=null;if(m!==0){if(d=c.value,v!==!0||d===null){const M=g+m*4,C=f.matrixWorldInverse;a.getNormalMatrix(C),(d===null||d.length<M)&&(d=new Float32Array(M));for(let w=0,T=g;w!==m;++w,T+=4)o.copy(h[w]).applyMatrix4(C,a),o.normal.toArray(d,T),d[T+3]=o.constant}c.value=d,c.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,d}}function Uh(s){let e=new WeakMap;function t(o,a){return a===us?o.mapping=Si:a===hs&&(o.mapping=Mi),o}function n(o){if(o&&o.isTexture&&o.isRenderTargetTexture===!1){const a=o.mapping;if(a===us||a===hs)if(e.has(o)){const c=e.get(o).texture;return t(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new $l(c.height/2);return l.fromEquirectangularTexture(s,o),e.set(o,l),o.addEventListener("dispose",i),t(l.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}class _o extends fo{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,o=n+e,a=i+t,c=i-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const _i=4,ha=[.125,.215,.35,.446,.526,.582],kn=20,es=new _o,da=new je;let ts=null;const Bn=(1+Math.sqrt(5))/2,fi=1/Bn,fa=[new W(1,1,1),new W(-1,1,1),new W(1,1,-1),new W(-1,1,-1),new W(0,Bn,fi),new W(0,Bn,-fi),new W(fi,0,Bn),new W(-fi,0,Bn),new W(Bn,fi,0),new W(-Bn,fi,0)];class pa{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){ts=this._renderer.getRenderTarget(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=_a(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ga(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ts),e.scissorTest=!1,fr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Si||e.mapping===Mi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ts=this._renderer.getRenderTarget();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:bt,minFilter:bt,generateMipmaps:!1,type:yn,format:Ht,encoding:wn,depthBuffer:!1},i=ma(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ma(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=zh(r)),this._blurMaterial=Bh(r,e,t)}return i}_compileMaterial(e){const t=new sn(this._lodPlanes[0],e);this._renderer.compile(t,es)}_sceneToCubeUV(e,t,n,i){const a=new nn(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,f=u.toneMapping;u.getClearColor(da),u.toneMapping=bn,u.autoClear=!1;const g=new lo({name:"PMREM.Background",side:jt,depthWrite:!1,depthTest:!1}),v=new sn(new Wi,g);let m=!1;const d=e.background;d?d.isColor&&(g.color.copy(d),e.background=null,m=!0):(g.color.copy(da),m=!0);for(let M=0;M<6;M++){const C=M%3;C===0?(a.up.set(0,c[M],0),a.lookAt(l[M],0,0)):C===1?(a.up.set(0,0,c[M]),a.lookAt(0,l[M],0)):(a.up.set(0,c[M],0),a.lookAt(0,0,l[M]));const w=this._cubeSize;fr(i,C*w,M>2?w:0,w,w),u.setRenderTarget(i),m&&u.render(v,a),u.render(e,a)}v.geometry.dispose(),v.material.dispose(),u.toneMapping=f,u.autoClear=h,e.background=d}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===Si||e.mapping===Mi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=_a()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ga());const r=i?this._cubemapMaterial:this._equirectMaterial,o=new sn(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;const c=this._cubeSize;fr(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,es)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){const r=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),o=fa[(i-1)%fa.length];this._blur(e,i-1,i,r,o)}t.autoClear=n}_blur(e,t,n,i,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new sn(this._lodPlanes[i],l),f=l.uniforms,g=this._sizeLods[n]-1,v=isFinite(r)?Math.PI/(2*g):2*Math.PI/(2*kn-1),m=r/v,d=isFinite(r)?1+Math.floor(u*m):kn;d>kn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${d} samples when the maximum is set to ${kn}`);const M=[];let C=0;for(let B=0;B<kn;++B){const x=B/m,R=Math.exp(-x*x/2);M.push(R),B===0?C+=R:B<d&&(C+=2*R)}for(let B=0;B<M.length;B++)M[B]=M[B]/C;f.envMap.value=e.texture,f.samples.value=d,f.weights.value=M,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:w}=this;f.dTheta.value=v,f.mipInt.value=w-n;const T=this._sizeLods[i],E=3*T*(i>w-_i?i-w+_i:0),N=4*(this._cubeSize-T);fr(t,E,N,3*T,2*T),c.setRenderTarget(t),c.render(h,es)}}function zh(s){const e=[],t=[],n=[];let i=s;const r=s-_i+1+ha.length;for(let o=0;o<r;o++){const a=Math.pow(2,i);t.push(a);let c=1/a;o>s-_i?c=ha[o-s+_i-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),u=-l,h=1+l,f=[u,u,h,u,h,h,u,u,h,h,u,h],g=6,v=6,m=3,d=2,M=1,C=new Float32Array(m*v*g),w=new Float32Array(d*v*g),T=new Float32Array(M*v*g);for(let N=0;N<g;N++){const B=N%3*2/3-1,x=N>2?0:-1,R=[B,x,0,B+2/3,x,0,B+2/3,x+1,0,B,x,0,B+2/3,x+1,0,B,x+1,0];C.set(R,m*v*N),w.set(f,d*v*N);const H=[N,N,N,N,N,N];T.set(H,M*v*N)}const E=new Tn;E.setAttribute("position",new Wt(C,m)),E.setAttribute("uv",new Wt(w,d)),E.setAttribute("faceIndex",new Wt(T,M)),e.push(E),i>_i&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function ma(s,e,t){const n=new Zn(s,e,t);return n.texture.mapping=Sr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function fr(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function Bh(s,e,t){const n=new Float32Array(kn),i=new W(0,1,0);return new un({name:"SphericalGaussianBlur",defines:{n:kn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:ys(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function ga(){return new un({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ys(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function _a(){return new un({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ys(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function ys(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function kh(s){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===us||c===hs,u=c===Si||c===Mi;if(l||u)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let h=e.get(a);return t===null&&(t=new pa(s)),h=l?t.fromEquirectangular(a,h):t.fromCubemap(a,h),e.set(a,h),h.texture}else{if(e.has(a))return e.get(a).texture;{const h=a.image;if(l&&h&&h.height>0||u&&h&&i(h)){t===null&&(t=new pa(s));const f=l?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,f),a.addEventListener("dispose",r),f.texture}else return null}}}return a}function i(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function Gh(s){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?t("EXT_color_buffer_float"):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Hh(s,e,t,n){const i={},r=new WeakMap;function o(h){const f=h.target;f.index!==null&&e.remove(f.index);for(const v in f.attributes)e.remove(f.attributes[v]);f.removeEventListener("dispose",o),delete i[f.id];const g=r.get(f);g&&(e.remove(g),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(h,f){return i[f.id]===!0||(f.addEventListener("dispose",o),i[f.id]=!0,t.memory.geometries++),f}function c(h){const f=h.attributes;for(const v in f)e.update(f[v],34962);const g=h.morphAttributes;for(const v in g){const m=g[v];for(let d=0,M=m.length;d<M;d++)e.update(m[d],34962)}}function l(h){const f=[],g=h.index,v=h.attributes.position;let m=0;if(g!==null){const C=g.array;m=g.version;for(let w=0,T=C.length;w<T;w+=3){const E=C[w+0],N=C[w+1],B=C[w+2];f.push(E,N,N,B,B,E)}}else{const C=v.array;m=v.version;for(let w=0,T=C.length/3-1;w<T;w+=3){const E=w+0,N=w+1,B=w+2;f.push(E,N,N,B,B,E)}}const d=new(no(f)?uo:co)(f,1);d.version=m;const M=r.get(h);M&&e.remove(M),r.set(h,d)}function u(h){const f=r.get(h);if(f){const g=h.index;g!==null&&f.version<g.version&&l(h)}else l(h);return r.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function Vh(s,e,t,n){const i=n.isWebGL2;let r;function o(f){r=f}let a,c;function l(f){a=f.type,c=f.bytesPerElement}function u(f,g){s.drawElements(r,g,a,f*c),t.update(g,r,1)}function h(f,g,v){if(v===0)return;let m,d;if(i)m=s,d="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[d](r,g,a,f*c,v),t.update(g,r,v)}this.setMode=o,this.setIndex=l,this.render=u,this.renderInstances=h}function Wh(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case 4:t.triangles+=a*(r/3);break;case 1:t.lines+=a*(r/2);break;case 3:t.lines+=a*(r-1);break;case 2:t.lines+=a*r;break;case 0:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.frame++,t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Xh(s,e){return s[0]-e[0]}function qh(s,e){return Math.abs(e[1])-Math.abs(s[1])}function Yh(s,e,t){const n={},i=new Float32Array(8),r=new WeakMap,o=new gt,a=[];for(let l=0;l<8;l++)a[l]=[l,0];function c(l,u,h,f){const g=l.morphTargetInfluences;if(e.isWebGL2===!0){const m=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,d=m!==void 0?m.length:0;let M=r.get(u);if(M===void 0||M.count!==d){let oe=function(){F.dispose(),r.delete(u),u.removeEventListener("dispose",oe)};var v=oe;M!==void 0&&M.texture.dispose();const T=u.morphAttributes.position!==void 0,E=u.morphAttributes.normal!==void 0,N=u.morphAttributes.color!==void 0,B=u.morphAttributes.position||[],x=u.morphAttributes.normal||[],R=u.morphAttributes.color||[];let H=0;T===!0&&(H=1),E===!0&&(H=2),N===!0&&(H=3);let ne=u.attributes.position.count*H,ae=1;ne>e.maxTextureSize&&(ae=Math.ceil(ne/e.maxTextureSize),ne=e.maxTextureSize);const z=new Float32Array(ne*ae*4*d),F=new ao(z,ne,ae,d);F.type=rn,F.needsUpdate=!0;const ee=H*4;for(let he=0;he<d;he++){const te=B[he],_e=x[he],re=R[he],Z=ne*ae*4*he;for(let q=0;q<te.count;q++){const le=q*ee;T===!0&&(o.fromBufferAttribute(te,q),z[Z+le+0]=o.x,z[Z+le+1]=o.y,z[Z+le+2]=o.z,z[Z+le+3]=0),E===!0&&(o.fromBufferAttribute(_e,q),z[Z+le+4]=o.x,z[Z+le+5]=o.y,z[Z+le+6]=o.z,z[Z+le+7]=0),N===!0&&(o.fromBufferAttribute(re,q),z[Z+le+8]=o.x,z[Z+le+9]=o.y,z[Z+le+10]=o.z,z[Z+le+11]=re.itemSize===4?o.w:1)}}M={count:d,texture:F,size:new We(ne,ae)},r.set(u,M),u.addEventListener("dispose",oe)}let C=0;for(let T=0;T<g.length;T++)C+=g[T];const w=u.morphTargetsRelative?1:1-C;f.getUniforms().setValue(s,"morphTargetBaseInfluence",w),f.getUniforms().setValue(s,"morphTargetInfluences",g),f.getUniforms().setValue(s,"morphTargetsTexture",M.texture,t),f.getUniforms().setValue(s,"morphTargetsTextureSize",M.size)}else{const m=g===void 0?0:g.length;let d=n[u.id];if(d===void 0||d.length!==m){d=[];for(let E=0;E<m;E++)d[E]=[E,0];n[u.id]=d}for(let E=0;E<m;E++){const N=d[E];N[0]=E,N[1]=g[E]}d.sort(qh);for(let E=0;E<8;E++)E<m&&d[E][1]?(a[E][0]=d[E][0],a[E][1]=d[E][1]):(a[E][0]=Number.MAX_SAFE_INTEGER,a[E][1]=0);a.sort(Xh);const M=u.morphAttributes.position,C=u.morphAttributes.normal;let w=0;for(let E=0;E<8;E++){const N=a[E],B=N[0],x=N[1];B!==Number.MAX_SAFE_INTEGER&&x?(M&&u.getAttribute("morphTarget"+E)!==M[B]&&u.setAttribute("morphTarget"+E,M[B]),C&&u.getAttribute("morphNormal"+E)!==C[B]&&u.setAttribute("morphNormal"+E,C[B]),i[E]=x,w+=x):(M&&u.hasAttribute("morphTarget"+E)===!0&&u.deleteAttribute("morphTarget"+E),C&&u.hasAttribute("morphNormal"+E)===!0&&u.deleteAttribute("morphNormal"+E),i[E]=0)}const T=u.morphTargetsRelative?1:1-w;f.getUniforms().setValue(s,"morphTargetBaseInfluence",T),f.getUniforms().setValue(s,"morphTargetInfluences",i)}}return{update:c}}function Zh(s,e,t,n){let i=new WeakMap;function r(c){const l=n.render.frame,u=c.geometry,h=e.get(c,u);return i.get(h)!==l&&(e.update(h),i.set(h,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),t.update(c.instanceMatrix,34962),c.instanceColor!==null&&t.update(c.instanceColor,34962)),h}function o(){i=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}const xo=new Ut,vo=new ao,So=new Il,Mo=new po,xa=[],va=[],Sa=new Float32Array(16),Ma=new Float32Array(9),ya=new Float32Array(4);function Ti(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=xa[i];if(r===void 0&&(r=new Float32Array(i),xa[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function _t(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function xt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function br(s,e){let t=va[e];t===void 0&&(t=new Int32Array(e),va[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function jh(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function $h(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;s.uniform2fv(this.addr,e),xt(t,e)}}function Kh(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(_t(t,e))return;s.uniform3fv(this.addr,e),xt(t,e)}}function Jh(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;s.uniform4fv(this.addr,e),xt(t,e)}}function Qh(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,n))return;ya.set(n),s.uniformMatrix2fv(this.addr,!1,ya),xt(t,n)}}function ed(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,n))return;Ma.set(n),s.uniformMatrix3fv(this.addr,!1,Ma),xt(t,n)}}function td(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,n))return;Sa.set(n),s.uniformMatrix4fv(this.addr,!1,Sa),xt(t,n)}}function nd(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function id(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;s.uniform2iv(this.addr,e),xt(t,e)}}function rd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;s.uniform3iv(this.addr,e),xt(t,e)}}function sd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;s.uniform4iv(this.addr,e),xt(t,e)}}function ad(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function od(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;s.uniform2uiv(this.addr,e),xt(t,e)}}function ld(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;s.uniform3uiv(this.addr,e),xt(t,e)}}function cd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;s.uniform4uiv(this.addr,e),xt(t,e)}}function ud(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2D(e||xo,i)}function hd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||So,i)}function dd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Mo,i)}function fd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||vo,i)}function pd(s){switch(s){case 5126:return jh;case 35664:return $h;case 35665:return Kh;case 35666:return Jh;case 35674:return Qh;case 35675:return ed;case 35676:return td;case 5124:case 35670:return nd;case 35667:case 35671:return id;case 35668:case 35672:return rd;case 35669:case 35673:return sd;case 5125:return ad;case 36294:return od;case 36295:return ld;case 36296:return cd;case 35678:case 36198:case 36298:case 36306:case 35682:return ud;case 35679:case 36299:case 36307:return hd;case 35680:case 36300:case 36308:case 36293:return dd;case 36289:case 36303:case 36311:case 36292:return fd}}function md(s,e){s.uniform1fv(this.addr,e)}function gd(s,e){const t=Ti(e,this.size,2);s.uniform2fv(this.addr,t)}function _d(s,e){const t=Ti(e,this.size,3);s.uniform3fv(this.addr,t)}function xd(s,e){const t=Ti(e,this.size,4);s.uniform4fv(this.addr,t)}function vd(s,e){const t=Ti(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function Sd(s,e){const t=Ti(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function Md(s,e){const t=Ti(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function yd(s,e){s.uniform1iv(this.addr,e)}function bd(s,e){s.uniform2iv(this.addr,e)}function wd(s,e){s.uniform3iv(this.addr,e)}function Td(s,e){s.uniform4iv(this.addr,e)}function Ed(s,e){s.uniform1uiv(this.addr,e)}function Ad(s,e){s.uniform2uiv(this.addr,e)}function Cd(s,e){s.uniform3uiv(this.addr,e)}function Rd(s,e){s.uniform4uiv(this.addr,e)}function Ld(s,e,t){const n=this.cache,i=e.length,r=br(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||xo,r[o])}function Pd(s,e,t){const n=this.cache,i=e.length,r=br(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||So,r[o])}function Dd(s,e,t){const n=this.cache,i=e.length,r=br(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||Mo,r[o])}function Id(s,e,t){const n=this.cache,i=e.length,r=br(t,i);_t(n,r)||(s.uniform1iv(this.addr,r),xt(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||vo,r[o])}function Nd(s){switch(s){case 5126:return md;case 35664:return gd;case 35665:return _d;case 35666:return xd;case 35674:return vd;case 35675:return Sd;case 35676:return Md;case 5124:case 35670:return yd;case 35667:case 35671:return bd;case 35668:case 35672:return wd;case 35669:case 35673:return Td;case 5125:return Ed;case 36294:return Ad;case 36295:return Cd;case 36296:return Rd;case 35678:case 36198:case 36298:case 36306:case 35682:return Ld;case 35679:case 36299:case 36307:return Pd;case 35680:case 36300:case 36308:case 36293:return Dd;case 36289:case 36303:case 36311:case 36292:return Id}}class Fd{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.setValue=pd(t.type)}}class Od{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.size=t.size,this.setValue=Nd(t.type)}}class Ud{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,o=i.length;r!==o;++r){const a=i[r];a.setValue(e,t[a.id],n)}}}const ns=/(\w+)(\])?(\[|\.)?/g;function ba(s,e){s.seq.push(e),s.map[e.id]=e}function zd(s,e,t){const n=s.name,i=n.length;for(ns.lastIndex=0;;){const r=ns.exec(n),o=ns.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){ba(t,l===void 0?new Fd(a,s,e):new Od(a,s,e));break}else{let h=t.map[a];h===void 0&&(h=new Ud(a),ba(t,h)),t=h}}}class xr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,35718);for(let i=0;i<n;++i){const r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);zd(r,o,this)}}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){const a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const o=e[i];o.id in t&&n.push(o)}return n}}function wa(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}let Bd=0;function kd(s,e){const t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}function Gd(s){switch(s){case wn:return["Linear","( value )"];case rt:return["sRGB","( value )"];default:return console.warn("THREE.WebGLProgram: Unsupported encoding:",s),["Linear","( value )"]}}function Ta(s,e,t){const n=s.getShaderParameter(e,35713),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+kd(s.getShaderSource(e),o)}else return i}function Hd(s,e){const t=Gd(e);return"vec4 "+s+"( vec4 value ) { return LinearTo"+t[0]+t[1]+"; }"}function Vd(s,e){let t;switch(e){case al:t="Linear";break;case ol:t="Reinhard";break;case ll:t="OptimizedCineon";break;case cl:t="ACESFilmic";break;case ul:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Wd(s){return[s.extensionDerivatives||s.envMapCubeUVHeight||s.bumpMap||s.tangentSpaceNormalMap||s.clearcoatNormalMap||s.flatShading||s.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(s.extensionFragDepth||s.logarithmicDepthBuffer)&&s.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",s.extensionDrawBuffers&&s.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(s.extensionShaderTextureLOD||s.envMap||s.transmission)&&s.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Oi).join(`
`)}function Xd(s){const e=[];for(const t in s){const n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function qd(s,e){const t={},n=s.getProgramParameter(e,35721);for(let i=0;i<n;i++){const r=s.getActiveAttrib(e,i),o=r.name;let a=1;r.type===35674&&(a=2),r.type===35675&&(a=3),r.type===35676&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function Oi(s){return s!==""}function Ea(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Aa(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Yd=/^[ \t]*#include +<([\w\d./]+)>/gm;function gs(s){return s.replace(Yd,Zd)}function Zd(s,e){const t=Xe[e];if(t===void 0)throw new Error("Can not resolve #include <"+e+">");return gs(t)}const jd=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ca(s){return s.replace(jd,$d)}function $d(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Ra(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Kd(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===ja?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===zo?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===Fi&&(e="SHADOWMAP_TYPE_VSM"),e}function Jd(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case Si:case Mi:e="ENVMAP_TYPE_CUBE";break;case Sr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Qd(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case Mi:e="ENVMAP_MODE_REFRACTION";break}return e}function ef(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case Ja:e="ENVMAP_BLENDING_MULTIPLY";break;case rl:e="ENVMAP_BLENDING_MIX";break;case sl:e="ENVMAP_BLENDING_ADD";break}return e}function tf(s){const e=s.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function nf(s,e,t,n){const i=s.getContext(),r=t.defines;let o=t.vertexShader,a=t.fragmentShader;const c=Kd(t),l=Jd(t),u=Qd(t),h=ef(t),f=tf(t),g=t.isWebGL2?"":Wd(t),v=Xd(r),m=i.createProgram();let d,M,C=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(d=[v].filter(Oi).join(`
`),d.length>0&&(d+=`
`),M=[g,v].filter(Oi).join(`
`),M.length>0&&(M+=`
`)):(d=[Ra(t),"#define SHADER_NAME "+t.shaderName,v,t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.supportsVertexTextures?"#define VERTEX_TEXTURES":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.displacementMap&&t.supportsVertexTextures?"#define USE_DISPLACEMENTMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Oi).join(`
`),M=[g,Ra(t),"#define SHADER_NAME "+t.shaderName,v,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.physicallyCorrectLights?"#define PHYSICALLY_CORRECT_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==bn?"#define TONE_MAPPING":"",t.toneMapping!==bn?Xe.tonemapping_pars_fragment:"",t.toneMapping!==bn?Vd("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Xe.encodings_pars_fragment,Hd("linearToOutputTexel",t.outputEncoding),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Oi).join(`
`)),o=gs(o),o=Ea(o,t),o=Aa(o,t),a=gs(a),a=Ea(a,t),a=Aa(a,t),o=Ca(o),a=Ca(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(C=`#version 300 es
`,d=["precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,M=["#define varying in",t.glslVersion===Js?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Js?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+M);const w=C+d+o,T=C+M+a,E=wa(i,35633,w),N=wa(i,35632,T);if(i.attachShader(m,E),i.attachShader(m,N),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m),s.debug.checkShaderErrors){const R=i.getProgramInfoLog(m).trim(),H=i.getShaderInfoLog(E).trim(),ne=i.getShaderInfoLog(N).trim();let ae=!0,z=!0;if(i.getProgramParameter(m,35714)===!1){ae=!1;const F=Ta(i,E,"vertex"),ee=Ta(i,N,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,35715)+`

Program Info Log: `+R+`
`+F+`
`+ee)}else R!==""?console.warn("THREE.WebGLProgram: Program Info Log:",R):(H===""||ne==="")&&(z=!1);z&&(this.diagnostics={runnable:ae,programLog:R,vertexShader:{log:H,prefix:d},fragmentShader:{log:ne,prefix:M}})}i.deleteShader(E),i.deleteShader(N);let B;this.getUniforms=function(){return B===void 0&&(B=new xr(i,m)),B};let x;return this.getAttributes=function(){return x===void 0&&(x=qd(i,m)),x},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.name=t.shaderName,this.id=Bd++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=E,this.fragmentShader=N,this}let rf=0;class sf{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new af(e),t.set(e,n)),n}}class af{constructor(e){this.id=rf++,this.code=e,this.usedTimes=0}}function of(s,e,t,n,i,r,o){const a=new oo,c=new sf,l=[],u=i.isWebGL2,h=i.logarithmicDepthBuffer,f=i.vertexTextures;let g=i.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(x,R,H,ne,ae){const z=ne.fog,F=ae.geometry,ee=x.isMeshStandardMaterial?ne.environment:null,oe=(x.isMeshStandardMaterial?t:e).get(x.envMap||ee),he=oe&&oe.mapping===Sr?oe.image.height:null,te=v[x.type];x.precision!==null&&(g=i.getMaxPrecision(x.precision),g!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",g,"instead."));const _e=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,re=_e!==void 0?_e.length:0;let Z=0;F.morphAttributes.position!==void 0&&(Z=1),F.morphAttributes.normal!==void 0&&(Z=2),F.morphAttributes.color!==void 0&&(Z=3);let q,le,ge,Se;if(te){const $e=cn[te];q=$e.vertexShader,le=$e.fragmentShader}else q=x.vertexShader,le=x.fragmentShader,c.update(x),ge=c.getVertexShaderID(x),Se=c.getFragmentShaderID(x);const X=s.getRenderTarget(),Ge=x.alphaTest>0,be=x.clearcoat>0,Ue=x.iridescence>0;return{isWebGL2:u,shaderID:te,shaderName:x.type,vertexShader:q,fragmentShader:le,defines:x.defines,customVertexShaderID:ge,customFragmentShaderID:Se,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:g,instancing:ae.isInstancedMesh===!0,instancingColor:ae.isInstancedMesh===!0&&ae.instanceColor!==null,supportsVertexTextures:f,outputEncoding:X===null?s.outputEncoding:X.isXRRenderTarget===!0?X.texture.encoding:wn,map:!!x.map,matcap:!!x.matcap,envMap:!!oe,envMapMode:oe&&oe.mapping,envMapCubeUVHeight:he,lightMap:!!x.lightMap,aoMap:!!x.aoMap,emissiveMap:!!x.emissiveMap,bumpMap:!!x.bumpMap,normalMap:!!x.normalMap,objectSpaceNormalMap:x.normalMapType===Rl,tangentSpaceNormalMap:x.normalMapType===Cl,decodeVideoTexture:!!x.map&&x.map.isVideoTexture===!0&&x.map.encoding===rt,clearcoat:be,clearcoatMap:be&&!!x.clearcoatMap,clearcoatRoughnessMap:be&&!!x.clearcoatRoughnessMap,clearcoatNormalMap:be&&!!x.clearcoatNormalMap,iridescence:Ue,iridescenceMap:Ue&&!!x.iridescenceMap,iridescenceThicknessMap:Ue&&!!x.iridescenceThicknessMap,displacementMap:!!x.displacementMap,roughnessMap:!!x.roughnessMap,metalnessMap:!!x.metalnessMap,specularMap:!!x.specularMap,specularIntensityMap:!!x.specularIntensityMap,specularColorMap:!!x.specularColorMap,opaque:x.transparent===!1&&x.blending===xi,alphaMap:!!x.alphaMap,alphaTest:Ge,gradientMap:!!x.gradientMap,sheen:x.sheen>0,sheenColorMap:!!x.sheenColorMap,sheenRoughnessMap:!!x.sheenRoughnessMap,transmission:x.transmission>0,transmissionMap:!!x.transmissionMap,thicknessMap:!!x.thicknessMap,combine:x.combine,vertexTangents:!!x.normalMap&&!!F.attributes.tangent,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,vertexUvs:!!x.map||!!x.bumpMap||!!x.normalMap||!!x.specularMap||!!x.alphaMap||!!x.emissiveMap||!!x.roughnessMap||!!x.metalnessMap||!!x.clearcoatMap||!!x.clearcoatRoughnessMap||!!x.clearcoatNormalMap||!!x.iridescenceMap||!!x.iridescenceThicknessMap||!!x.displacementMap||!!x.transmissionMap||!!x.thicknessMap||!!x.specularIntensityMap||!!x.specularColorMap||!!x.sheenColorMap||!!x.sheenRoughnessMap,uvsVertexOnly:!(x.map||x.bumpMap||x.normalMap||x.specularMap||x.alphaMap||x.emissiveMap||x.roughnessMap||x.metalnessMap||x.clearcoatNormalMap||x.iridescenceMap||x.iridescenceThicknessMap||x.transmission>0||x.transmissionMap||x.thicknessMap||x.specularIntensityMap||x.specularColorMap||x.sheen>0||x.sheenColorMap||x.sheenRoughnessMap)&&!!x.displacementMap,fog:!!z,useFog:x.fog===!0,fogExp2:z&&z.isFogExp2,flatShading:!!x.flatShading,sizeAttenuation:x.sizeAttenuation,logarithmicDepthBuffer:h,skinning:ae.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:re,morphTextureStride:Z,numDirLights:R.directional.length,numPointLights:R.point.length,numSpotLights:R.spot.length,numSpotLightMaps:R.spotLightMap.length,numRectAreaLights:R.rectArea.length,numHemiLights:R.hemi.length,numDirLightShadows:R.directionalShadowMap.length,numPointLightShadows:R.pointShadowMap.length,numSpotLightShadows:R.spotShadowMap.length,numSpotLightShadowsWithMaps:R.numSpotLightShadowsWithMaps,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:x.dithering,shadowMapEnabled:s.shadowMap.enabled&&H.length>0,shadowMapType:s.shadowMap.type,toneMapping:x.toneMapped?s.toneMapping:bn,physicallyCorrectLights:s.physicallyCorrectLights,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Ss,flipSided:x.side===jt,useDepthPacking:!!x.depthPacking,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionDerivatives:x.extensions&&x.extensions.derivatives,extensionFragDepth:x.extensions&&x.extensions.fragDepth,extensionDrawBuffers:x.extensions&&x.extensions.drawBuffers,extensionShaderTextureLOD:x.extensions&&x.extensions.shaderTextureLOD,rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),customProgramCacheKey:x.customProgramCacheKey()}}function d(x){const R=[];if(x.shaderID?R.push(x.shaderID):(R.push(x.customVertexShaderID),R.push(x.customFragmentShaderID)),x.defines!==void 0)for(const H in x.defines)R.push(H),R.push(x.defines[H]);return x.isRawShaderMaterial===!1&&(M(R,x),C(R,x),R.push(s.outputEncoding)),R.push(x.customProgramCacheKey),R.join()}function M(x,R){x.push(R.precision),x.push(R.outputEncoding),x.push(R.envMapMode),x.push(R.envMapCubeUVHeight),x.push(R.combine),x.push(R.vertexUvs),x.push(R.fogExp2),x.push(R.sizeAttenuation),x.push(R.morphTargetsCount),x.push(R.morphAttributeCount),x.push(R.numDirLights),x.push(R.numPointLights),x.push(R.numSpotLights),x.push(R.numSpotLightMaps),x.push(R.numHemiLights),x.push(R.numRectAreaLights),x.push(R.numDirLightShadows),x.push(R.numPointLightShadows),x.push(R.numSpotLightShadows),x.push(R.numSpotLightShadowsWithMaps),x.push(R.shadowMapType),x.push(R.toneMapping),x.push(R.numClippingPlanes),x.push(R.numClipIntersection),x.push(R.depthPacking)}function C(x,R){a.disableAll(),R.isWebGL2&&a.enable(0),R.supportsVertexTextures&&a.enable(1),R.instancing&&a.enable(2),R.instancingColor&&a.enable(3),R.map&&a.enable(4),R.matcap&&a.enable(5),R.envMap&&a.enable(6),R.lightMap&&a.enable(7),R.aoMap&&a.enable(8),R.emissiveMap&&a.enable(9),R.bumpMap&&a.enable(10),R.normalMap&&a.enable(11),R.objectSpaceNormalMap&&a.enable(12),R.tangentSpaceNormalMap&&a.enable(13),R.clearcoat&&a.enable(14),R.clearcoatMap&&a.enable(15),R.clearcoatRoughnessMap&&a.enable(16),R.clearcoatNormalMap&&a.enable(17),R.iridescence&&a.enable(18),R.iridescenceMap&&a.enable(19),R.iridescenceThicknessMap&&a.enable(20),R.displacementMap&&a.enable(21),R.specularMap&&a.enable(22),R.roughnessMap&&a.enable(23),R.metalnessMap&&a.enable(24),R.gradientMap&&a.enable(25),R.alphaMap&&a.enable(26),R.alphaTest&&a.enable(27),R.vertexColors&&a.enable(28),R.vertexAlphas&&a.enable(29),R.vertexUvs&&a.enable(30),R.vertexTangents&&a.enable(31),R.uvsVertexOnly&&a.enable(32),x.push(a.mask),a.disableAll(),R.fog&&a.enable(0),R.useFog&&a.enable(1),R.flatShading&&a.enable(2),R.logarithmicDepthBuffer&&a.enable(3),R.skinning&&a.enable(4),R.morphTargets&&a.enable(5),R.morphNormals&&a.enable(6),R.morphColors&&a.enable(7),R.premultipliedAlpha&&a.enable(8),R.shadowMapEnabled&&a.enable(9),R.physicallyCorrectLights&&a.enable(10),R.doubleSided&&a.enable(11),R.flipSided&&a.enable(12),R.useDepthPacking&&a.enable(13),R.dithering&&a.enable(14),R.specularIntensityMap&&a.enable(15),R.specularColorMap&&a.enable(16),R.transmission&&a.enable(17),R.transmissionMap&&a.enable(18),R.thicknessMap&&a.enable(19),R.sheen&&a.enable(20),R.sheenColorMap&&a.enable(21),R.sheenRoughnessMap&&a.enable(22),R.decodeVideoTexture&&a.enable(23),R.opaque&&a.enable(24),x.push(a.mask)}function w(x){const R=v[x.type];let H;if(R){const ne=cn[R];H=ql.clone(ne.uniforms)}else H=x.uniforms;return H}function T(x,R){let H;for(let ne=0,ae=l.length;ne<ae;ne++){const z=l[ne];if(z.cacheKey===R){H=z,++H.usedTimes;break}}return H===void 0&&(H=new nf(s,R,x,r),l.push(H)),H}function E(x){if(--x.usedTimes===0){const R=l.indexOf(x);l[R]=l[l.length-1],l.pop(),x.destroy()}}function N(x){c.remove(x)}function B(){c.dispose()}return{getParameters:m,getProgramCacheKey:d,getUniforms:w,acquireProgram:T,releaseProgram:E,releaseShaderCache:N,programs:l,dispose:B}}function lf(){let s=new WeakMap;function e(r){let o=s.get(r);return o===void 0&&(o={},s.set(r,o)),o}function t(r){s.delete(r)}function n(r,o,a){s.get(r)[o]=a}function i(){s=new WeakMap}return{get:e,remove:t,update:n,dispose:i}}function cf(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function La(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function Pa(){const s=[];let e=0;const t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(h,f,g,v,m,d){let M=s[e];return M===void 0?(M={id:h.id,object:h,geometry:f,material:g,groupOrder:v,renderOrder:h.renderOrder,z:m,group:d},s[e]=M):(M.id=h.id,M.object=h,M.geometry=f,M.material=g,M.groupOrder=v,M.renderOrder=h.renderOrder,M.z=m,M.group=d),e++,M}function a(h,f,g,v,m,d){const M=o(h,f,g,v,m,d);g.transmission>0?n.push(M):g.transparent===!0?i.push(M):t.push(M)}function c(h,f,g,v,m,d){const M=o(h,f,g,v,m,d);g.transmission>0?n.unshift(M):g.transparent===!0?i.unshift(M):t.unshift(M)}function l(h,f){t.length>1&&t.sort(h||cf),n.length>1&&n.sort(f||La),i.length>1&&i.sort(f||La)}function u(){for(let h=e,f=s.length;h<f;h++){const g=s[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:a,unshift:c,finish:u,sort:l}}function uf(){let s=new WeakMap;function e(n,i){const r=s.get(n);let o;return r===void 0?(o=new Pa,s.set(n,[o])):i>=r.length?(o=new Pa,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function hf(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new W,color:new je};break;case"SpotLight":t={position:new W,direction:new W,color:new je,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new W,color:new je,distance:0,decay:0};break;case"HemisphereLight":t={direction:new W,skyColor:new je,groundColor:new je};break;case"RectAreaLight":t={color:new je,position:new W,halfWidth:new W,halfHeight:new W};break}return s[e.id]=t,t}}}function df(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new We,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let ff=0;function pf(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function mf(s,e){const t=new hf,n=df(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0};for(let u=0;u<9;u++)i.probe.push(new W);const r=new W,o=new wt,a=new wt;function c(u,h){let f=0,g=0,v=0;for(let ne=0;ne<9;ne++)i.probe[ne].set(0,0,0);let m=0,d=0,M=0,C=0,w=0,T=0,E=0,N=0,B=0,x=0;u.sort(pf);const R=h!==!0?Math.PI:1;for(let ne=0,ae=u.length;ne<ae;ne++){const z=u[ne],F=z.color,ee=z.intensity,oe=z.distance,he=z.shadow&&z.shadow.map?z.shadow.map.texture:null;if(z.isAmbientLight)f+=F.r*ee*R,g+=F.g*ee*R,v+=F.b*ee*R;else if(z.isLightProbe)for(let te=0;te<9;te++)i.probe[te].addScaledVector(z.sh.coefficients[te],ee);else if(z.isDirectionalLight){const te=t.get(z);if(te.color.copy(z.color).multiplyScalar(z.intensity*R),z.castShadow){const _e=z.shadow,re=n.get(z);re.shadowBias=_e.bias,re.shadowNormalBias=_e.normalBias,re.shadowRadius=_e.radius,re.shadowMapSize=_e.mapSize,i.directionalShadow[m]=re,i.directionalShadowMap[m]=he,i.directionalShadowMatrix[m]=z.shadow.matrix,T++}i.directional[m]=te,m++}else if(z.isSpotLight){const te=t.get(z);te.position.setFromMatrixPosition(z.matrixWorld),te.color.copy(F).multiplyScalar(ee*R),te.distance=oe,te.coneCos=Math.cos(z.angle),te.penumbraCos=Math.cos(z.angle*(1-z.penumbra)),te.decay=z.decay,i.spot[M]=te;const _e=z.shadow;if(z.map&&(i.spotLightMap[B]=z.map,B++,_e.updateMatrices(z),z.castShadow&&x++),i.spotLightMatrix[M]=_e.matrix,z.castShadow){const re=n.get(z);re.shadowBias=_e.bias,re.shadowNormalBias=_e.normalBias,re.shadowRadius=_e.radius,re.shadowMapSize=_e.mapSize,i.spotShadow[M]=re,i.spotShadowMap[M]=he,N++}M++}else if(z.isRectAreaLight){const te=t.get(z);te.color.copy(F).multiplyScalar(ee),te.halfWidth.set(z.width*.5,0,0),te.halfHeight.set(0,z.height*.5,0),i.rectArea[C]=te,C++}else if(z.isPointLight){const te=t.get(z);if(te.color.copy(z.color).multiplyScalar(z.intensity*R),te.distance=z.distance,te.decay=z.decay,z.castShadow){const _e=z.shadow,re=n.get(z);re.shadowBias=_e.bias,re.shadowNormalBias=_e.normalBias,re.shadowRadius=_e.radius,re.shadowMapSize=_e.mapSize,re.shadowCameraNear=_e.camera.near,re.shadowCameraFar=_e.camera.far,i.pointShadow[d]=re,i.pointShadowMap[d]=he,i.pointShadowMatrix[d]=z.shadow.matrix,E++}i.point[d]=te,d++}else if(z.isHemisphereLight){const te=t.get(z);te.skyColor.copy(z.color).multiplyScalar(ee*R),te.groundColor.copy(z.groundColor).multiplyScalar(ee*R),i.hemi[w]=te,w++}}C>0&&(e.isWebGL2||s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Me.LTC_FLOAT_1,i.rectAreaLTC2=Me.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=Me.LTC_HALF_1,i.rectAreaLTC2=Me.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=f,i.ambient[1]=g,i.ambient[2]=v;const H=i.hash;(H.directionalLength!==m||H.pointLength!==d||H.spotLength!==M||H.rectAreaLength!==C||H.hemiLength!==w||H.numDirectionalShadows!==T||H.numPointShadows!==E||H.numSpotShadows!==N||H.numSpotMaps!==B)&&(i.directional.length=m,i.spot.length=M,i.rectArea.length=C,i.point.length=d,i.hemi.length=w,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.pointShadow.length=E,i.pointShadowMap.length=E,i.spotShadow.length=N,i.spotShadowMap.length=N,i.directionalShadowMatrix.length=T,i.pointShadowMatrix.length=E,i.spotLightMatrix.length=N+B-x,i.spotLightMap.length=B,i.numSpotLightShadowsWithMaps=x,H.directionalLength=m,H.pointLength=d,H.spotLength=M,H.rectAreaLength=C,H.hemiLength=w,H.numDirectionalShadows=T,H.numPointShadows=E,H.numSpotShadows=N,H.numSpotMaps=B,i.version=ff++)}function l(u,h){let f=0,g=0,v=0,m=0,d=0;const M=h.matrixWorldInverse;for(let C=0,w=u.length;C<w;C++){const T=u[C];if(T.isDirectionalLight){const E=i.directional[f];E.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(M),f++}else if(T.isSpotLight){const E=i.spot[v];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),E.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(M),v++}else if(T.isRectAreaLight){const E=i.rectArea[m];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),a.identity(),o.copy(T.matrixWorld),o.premultiply(M),a.extractRotation(o),E.halfWidth.set(T.width*.5,0,0),E.halfHeight.set(0,T.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),m++}else if(T.isPointLight){const E=i.point[g];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),g++}else if(T.isHemisphereLight){const E=i.hemi[d];E.direction.setFromMatrixPosition(T.matrixWorld),E.direction.transformDirection(M),d++}}}return{setup:c,setupView:l,state:i}}function Da(s,e){const t=new mf(s,e),n=[],i=[];function r(){n.length=0,i.length=0}function o(h){n.push(h)}function a(h){i.push(h)}function c(h){t.setup(n,h)}function l(h){t.setupView(n,h)}return{init:r,state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:c,setupLightsView:l,pushLight:o,pushShadow:a}}function gf(s,e){let t=new WeakMap;function n(r,o=0){const a=t.get(r);let c;return a===void 0?(c=new Da(s,e),t.set(r,[c])):o>=a.length?(c=new Da(s,e),a.push(c)):c=a[o],c}function i(){t=new WeakMap}return{get:n,dispose:i}}class _f extends Mr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=El,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class xf extends Mr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.referencePosition=new W,this.nearDistance=1,this.farDistance=1e3,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.referencePosition.copy(e.referencePosition),this.nearDistance=e.nearDistance,this.farDistance=e.farDistance,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const vf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Sf=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Mf(s,e,t){let n=new mo;const i=new We,r=new We,o=new gt,a=new _f({depthPacking:Al}),c=new xf,l={},u=t.maxTextureSize,h={0:jt,1:qn,2:Ss},f=new un({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new We},radius:{value:4}},vertexShader:vf,fragmentShader:Sf}),g=f.clone();g.defines.HORIZONTAL_PASS=1;const v=new Tn;v.setAttribute("position",new Wt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const m=new sn(v,f),d=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ja,this.render=function(T,E,N){if(d.enabled===!1||d.autoUpdate===!1&&d.needsUpdate===!1||T.length===0)return;const B=s.getRenderTarget(),x=s.getActiveCubeFace(),R=s.getActiveMipmapLevel(),H=s.state;H.setBlending(In),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);for(let ne=0,ae=T.length;ne<ae;ne++){const z=T[ne],F=z.shadow;if(F===void 0){console.warn("THREE.WebGLShadowMap:",z,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;i.copy(F.mapSize);const ee=F.getFrameExtents();if(i.multiply(ee),r.copy(F.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/ee.x),i.x=r.x*ee.x,F.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/ee.y),i.y=r.y*ee.y,F.mapSize.y=r.y)),F.map===null){const he=this.type!==Fi?{minFilter:yt,magFilter:yt}:{};F.map=new Zn(i.x,i.y,he),F.map.texture.name=z.name+".shadowMap",F.camera.updateProjectionMatrix()}s.setRenderTarget(F.map),s.clear();const oe=F.getViewportCount();for(let he=0;he<oe;he++){const te=F.getViewport(he);o.set(r.x*te.x,r.y*te.y,r.x*te.z,r.y*te.w),H.viewport(o),F.updateMatrices(z,he),n=F.getFrustum(),w(E,N,F.camera,z,this.type)}F.isPointLightShadow!==!0&&this.type===Fi&&M(F,N),F.needsUpdate=!1}d.needsUpdate=!1,s.setRenderTarget(B,x,R)};function M(T,E){const N=e.update(m);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,g.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,g.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Zn(i.x,i.y)),f.uniforms.shadow_pass.value=T.map.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,s.setRenderTarget(T.mapPass),s.clear(),s.renderBufferDirect(E,null,N,f,m,null),g.uniforms.shadow_pass.value=T.mapPass.texture,g.uniforms.resolution.value=T.mapSize,g.uniforms.radius.value=T.radius,s.setRenderTarget(T.map),s.clear(),s.renderBufferDirect(E,null,N,g,m,null)}function C(T,E,N,B,x,R){let H=null;const ne=N.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(ne!==void 0)H=ne;else if(H=N.isPointLight===!0?c:a,s.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){const ae=H.uuid,z=E.uuid;let F=l[ae];F===void 0&&(F={},l[ae]=F);let ee=F[z];ee===void 0&&(ee=H.clone(),F[z]=ee),H=ee}return H.visible=E.visible,H.wireframe=E.wireframe,R===Fi?H.side=E.shadowSide!==null?E.shadowSide:E.side:H.side=E.shadowSide!==null?E.shadowSide:h[E.side],H.alphaMap=E.alphaMap,H.alphaTest=E.alphaTest,H.map=E.map,H.clipShadows=E.clipShadows,H.clippingPlanes=E.clippingPlanes,H.clipIntersection=E.clipIntersection,H.displacementMap=E.displacementMap,H.displacementScale=E.displacementScale,H.displacementBias=E.displacementBias,H.wireframeLinewidth=E.wireframeLinewidth,H.linewidth=E.linewidth,N.isPointLight===!0&&H.isMeshDistanceMaterial===!0&&(H.referencePosition.setFromMatrixPosition(N.matrixWorld),H.nearDistance=B,H.farDistance=x),H}function w(T,E,N,B,x){if(T.visible===!1)return;if(T.layers.test(E.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&x===Fi)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,T.matrixWorld);const ne=e.update(T),ae=T.material;if(Array.isArray(ae)){const z=ne.groups;for(let F=0,ee=z.length;F<ee;F++){const oe=z[F],he=ae[oe.materialIndex];if(he&&he.visible){const te=C(T,he,B,N.near,N.far,x);s.renderBufferDirect(N,null,ne,te,T,oe)}}}else if(ae.visible){const z=C(T,ae,B,N.near,N.far,x);s.renderBufferDirect(N,null,ne,z,T,null)}}const H=T.children;for(let ne=0,ae=H.length;ne<ae;ne++)w(H[ne],E,N,B,x)}}function yf(s,e,t){const n=t.isWebGL2;function i(){let I=!1;const D=new gt;let de=null;const Ae=new gt(0,0,0,0);return{setMask:function(Ie){de!==Ie&&!I&&(s.colorMask(Ie,Ie,Ie,Ie),de=Ie)},setLocked:function(Ie){I=Ie},setClear:function(Ie,Je,ft,vt,hn){hn===!0&&(Ie*=vt,Je*=vt,ft*=vt),D.set(Ie,Je,ft,vt),Ae.equals(D)===!1&&(s.clearColor(Ie,Je,ft,vt),Ae.copy(D))},reset:function(){I=!1,de=null,Ae.set(-1,0,0,0)}}}function r(){let I=!1,D=null,de=null,Ae=null;return{setTest:function(Ie){Ie?Ge(2929):be(2929)},setMask:function(Ie){D!==Ie&&!I&&(s.depthMask(Ie),D=Ie)},setFunc:function(Ie){if(de!==Ie){switch(Ie){case Ko:s.depthFunc(512);break;case Jo:s.depthFunc(519);break;case Qo:s.depthFunc(513);break;case cs:s.depthFunc(515);break;case el:s.depthFunc(514);break;case tl:s.depthFunc(518);break;case nl:s.depthFunc(516);break;case il:s.depthFunc(517);break;default:s.depthFunc(515)}de=Ie}},setLocked:function(Ie){I=Ie},setClear:function(Ie){Ae!==Ie&&(s.clearDepth(Ie),Ae=Ie)},reset:function(){I=!1,D=null,de=null,Ae=null}}}function o(){let I=!1,D=null,de=null,Ae=null,Ie=null,Je=null,ft=null,vt=null,hn=null;return{setTest:function(tt){I||(tt?Ge(2960):be(2960))},setMask:function(tt){D!==tt&&!I&&(s.stencilMask(tt),D=tt)},setFunc:function(tt,$t,Nt){(de!==tt||Ae!==$t||Ie!==Nt)&&(s.stencilFunc(tt,$t,Nt),de=tt,Ae=$t,Ie=Nt)},setOp:function(tt,$t,Nt){(Je!==tt||ft!==$t||vt!==Nt)&&(s.stencilOp(tt,$t,Nt),Je=tt,ft=$t,vt=Nt)},setLocked:function(tt){I=tt},setClear:function(tt){hn!==tt&&(s.clearStencil(tt),hn=tt)},reset:function(){I=!1,D=null,de=null,Ae=null,Ie=null,Je=null,ft=null,vt=null,hn=null}}}const a=new i,c=new r,l=new o,u=new WeakMap,h=new WeakMap;let f={},g={},v=new WeakMap,m=[],d=null,M=!1,C=null,w=null,T=null,E=null,N=null,B=null,x=null,R=!1,H=null,ne=null,ae=null,z=null,F=null;const ee=s.getParameter(35661);let oe=!1,he=0;const te=s.getParameter(7938);te.indexOf("WebGL")!==-1?(he=parseFloat(/^WebGL (\d)/.exec(te)[1]),oe=he>=1):te.indexOf("OpenGL ES")!==-1&&(he=parseFloat(/^OpenGL ES (\d)/.exec(te)[1]),oe=he>=2);let _e=null,re={};const Z=s.getParameter(3088),q=s.getParameter(2978),le=new gt().fromArray(Z),ge=new gt().fromArray(q);function Se(I,D,de){const Ae=new Uint8Array(4),Ie=s.createTexture();s.bindTexture(I,Ie),s.texParameteri(I,10241,9728),s.texParameteri(I,10240,9728);for(let Je=0;Je<de;Je++)s.texImage2D(D+Je,0,6408,1,1,0,6408,5121,Ae);return Ie}const X={};X[3553]=Se(3553,3553,1),X[34067]=Se(34067,34069,6),a.setClear(0,0,0,1),c.setClear(1),l.setClear(0),Ge(2929),c.setFunc(cs),dt(!1),Tt(bs),Ge(2884),lt(In);function Ge(I){f[I]!==!0&&(s.enable(I),f[I]=!0)}function be(I){f[I]!==!1&&(s.disable(I),f[I]=!1)}function Ue(I,D){return g[I]!==D?(s.bindFramebuffer(I,D),g[I]=D,n&&(I===36009&&(g[36160]=D),I===36160&&(g[36009]=D)),!0):!1}function Re(I,D){let de=m,Ae=!1;if(I)if(de=v.get(D),de===void 0&&(de=[],v.set(D,de)),I.isWebGLMultipleRenderTargets){const Ie=I.texture;if(de.length!==Ie.length||de[0]!==36064){for(let Je=0,ft=Ie.length;Je<ft;Je++)de[Je]=36064+Je;de.length=Ie.length,Ae=!0}}else de[0]!==36064&&(de[0]=36064,Ae=!0);else de[0]!==1029&&(de[0]=1029,Ae=!0);Ae&&(t.isWebGL2?s.drawBuffers(de):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(de))}function $e(I){return d!==I?(s.useProgram(I),d=I,!0):!1}const Ve={[gi]:32774,[ko]:32778,[Go]:32779};if(n)Ve[As]=32775,Ve[Cs]=32776;else{const I=e.get("EXT_blend_minmax");I!==null&&(Ve[As]=I.MIN_EXT,Ve[Cs]=I.MAX_EXT)}const Oe={[Ho]:0,[Vo]:1,[Wo]:768,[$a]:770,[$o]:776,[Zo]:774,[qo]:772,[Xo]:769,[Ka]:771,[jo]:775,[Yo]:773};function lt(I,D,de,Ae,Ie,Je,ft,vt){if(I===In){M===!0&&(be(3042),M=!1);return}if(M===!1&&(Ge(3042),M=!0),I!==Bo){if(I!==C||vt!==R){if((w!==gi||N!==gi)&&(s.blendEquation(32774),w=gi,N=gi),vt)switch(I){case xi:s.blendFuncSeparate(1,771,1,771);break;case ws:s.blendFunc(1,1);break;case Ts:s.blendFuncSeparate(0,769,0,1);break;case Es:s.blendFuncSeparate(0,768,0,770);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case xi:s.blendFuncSeparate(770,771,1,771);break;case ws:s.blendFunc(770,1);break;case Ts:s.blendFuncSeparate(0,769,0,1);break;case Es:s.blendFunc(0,768);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}T=null,E=null,B=null,x=null,C=I,R=vt}return}Ie=Ie||D,Je=Je||de,ft=ft||Ae,(D!==w||Ie!==N)&&(s.blendEquationSeparate(Ve[D],Ve[Ie]),w=D,N=Ie),(de!==T||Ae!==E||Je!==B||ft!==x)&&(s.blendFuncSeparate(Oe[de],Oe[Ae],Oe[Je],Oe[ft]),T=de,E=Ae,B=Je,x=ft),C=I,R=!1}function ct(I,D){I.side===Ss?be(2884):Ge(2884);let de=I.side===jt;D&&(de=!de),dt(de),I.blending===xi&&I.transparent===!1?lt(In):lt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.premultipliedAlpha),c.setFunc(I.depthFunc),c.setTest(I.depthTest),c.setMask(I.depthWrite),a.setMask(I.colorWrite);const Ae=I.stencilWrite;l.setTest(Ae),Ae&&(l.setMask(I.stencilWriteMask),l.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),l.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),Ke(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?Ge(32926):be(32926)}function dt(I){H!==I&&(I?s.frontFace(2304):s.frontFace(2305),H=I)}function Tt(I){I!==Oo?(Ge(2884),I!==ne&&(I===bs?s.cullFace(1029):I===Uo?s.cullFace(1028):s.cullFace(1032))):be(2884),ne=I}function at(I){I!==ae&&(oe&&s.lineWidth(I),ae=I)}function Ke(I,D,de){I?(Ge(32823),(z!==D||F!==de)&&(s.polygonOffset(D,de),z=D,F=de)):be(32823)}function It(I){I?Ge(3089):be(3089)}function At(I){I===void 0&&(I=33984+ee-1),_e!==I&&(s.activeTexture(I),_e=I)}function A(I,D,de){de===void 0&&(_e===null?de=33984+ee-1:de=_e);let Ae=re[de];Ae===void 0&&(Ae={type:void 0,texture:void 0},re[de]=Ae),(Ae.type!==I||Ae.texture!==D)&&(_e!==de&&(s.activeTexture(de),_e=de),s.bindTexture(I,D||X[I]),Ae.type=I,Ae.texture=D)}function S(){const I=re[_e];I!==void 0&&I.type!==void 0&&(s.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function $(){try{s.compressedTexImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function fe(){try{s.compressedTexImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function xe(){try{s.texSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ye(){try{s.texSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function P(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function K(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Y(){try{s.texStorage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Te(){try{s.texStorage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Le(){try{s.texImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function we(){try{s.texImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ee(I){le.equals(I)===!1&&(s.scissor(I.x,I.y,I.z,I.w),le.copy(I))}function De(I){ge.equals(I)===!1&&(s.viewport(I.x,I.y,I.z,I.w),ge.copy(I))}function ze(I,D){let de=h.get(D);de===void 0&&(de=new WeakMap,h.set(D,de));let Ae=de.get(I);Ae===void 0&&(Ae=s.getUniformBlockIndex(D,I.name),de.set(I,Ae))}function Be(I,D){const Ae=h.get(D).get(I);u.get(D)!==Ae&&(s.uniformBlockBinding(D,Ae,I.__bindingPointIndex),u.set(D,Ae))}function qe(){s.disable(3042),s.disable(2884),s.disable(2929),s.disable(32823),s.disable(3089),s.disable(2960),s.disable(32926),s.blendEquation(32774),s.blendFunc(1,0),s.blendFuncSeparate(1,0,1,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(513),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(519,0,4294967295),s.stencilOp(7680,7680,7680),s.clearStencil(0),s.cullFace(1029),s.frontFace(2305),s.polygonOffset(0,0),s.activeTexture(33984),s.bindFramebuffer(36160,null),n===!0&&(s.bindFramebuffer(36009,null),s.bindFramebuffer(36008,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),f={},_e=null,re={},g={},v=new WeakMap,m=[],d=null,M=!1,C=null,w=null,T=null,E=null,N=null,B=null,x=null,R=!1,H=null,ne=null,ae=null,z=null,F=null,le.set(0,0,s.canvas.width,s.canvas.height),ge.set(0,0,s.canvas.width,s.canvas.height),a.reset(),c.reset(),l.reset()}return{buffers:{color:a,depth:c,stencil:l},enable:Ge,disable:be,bindFramebuffer:Ue,drawBuffers:Re,useProgram:$e,setBlending:lt,setMaterial:ct,setFlipSided:dt,setCullFace:Tt,setLineWidth:at,setPolygonOffset:Ke,setScissorTest:It,activeTexture:At,bindTexture:A,unbindTexture:S,compressedTexImage2D:$,compressedTexImage3D:fe,texImage2D:Le,texImage3D:we,updateUBOMapping:ze,uniformBlockBinding:Be,texStorage2D:Y,texStorage3D:Te,texSubImage2D:xe,texSubImage3D:ye,compressedTexSubImage2D:P,compressedTexSubImage3D:K,scissor:Ee,viewport:De,reset:qe}}function bf(s,e,t,n,i,r,o){const a=i.isWebGL2,c=i.maxTextures,l=i.maxCubemapSize,u=i.maxTextureSize,h=i.maxSamples,f=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,g=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),v=new WeakMap;let m;const d=new WeakMap;let M=!1;try{M=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function C(A,S){return M?new OffscreenCanvas(A,S):vr("canvas")}function w(A,S,$,fe){let xe=1;if((A.width>fe||A.height>fe)&&(xe=fe/Math.max(A.width,A.height)),xe<1||S===!0)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){const ye=S?ms:Math.floor,P=ye(xe*A.width),K=ye(xe*A.height);m===void 0&&(m=C(P,K));const Y=$?C(P,K):m;return Y.width=P,Y.height=K,Y.getContext("2d").drawImage(A,0,0,P,K),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+A.width+"x"+A.height+") to ("+P+"x"+K+")."),Y}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+A.width+"x"+A.height+")."),A;return A}function T(A){return ea(A.width)&&ea(A.height)}function E(A){return a?!1:A.wrapS!==Gt||A.wrapT!==Gt||A.minFilter!==yt&&A.minFilter!==bt}function N(A,S){return A.generateMipmaps&&S&&A.minFilter!==yt&&A.minFilter!==bt}function B(A){s.generateMipmap(A)}function x(A,S,$,fe,xe=!1){if(a===!1)return S;if(A!==null){if(s[A]!==void 0)return s[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ye=S;return S===6403&&($===5126&&(ye=33326),$===5131&&(ye=33325),$===5121&&(ye=33321)),S===33319&&($===5126&&(ye=33328),$===5131&&(ye=33327),$===5121&&(ye=33323)),S===6408&&($===5126&&(ye=34836),$===5131&&(ye=34842),$===5121&&(ye=fe===rt&&xe===!1?35907:32856),$===32819&&(ye=32854),$===32820&&(ye=32855)),(ye===33325||ye===33326||ye===33327||ye===33328||ye===34842||ye===34836)&&e.get("EXT_color_buffer_float"),ye}function R(A,S,$){return N(A,$)===!0||A.isFramebufferTexture&&A.minFilter!==yt&&A.minFilter!==bt?Math.log2(Math.max(S.width,S.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?S.mipmaps.length:1}function H(A){return A===yt||A===Rs||A===Er?9728:9729}function ne(A){const S=A.target;S.removeEventListener("dispose",ne),z(S),S.isVideoTexture&&v.delete(S)}function ae(A){const S=A.target;S.removeEventListener("dispose",ae),ee(S)}function z(A){const S=n.get(A);if(S.__webglInit===void 0)return;const $=A.source,fe=d.get($);if(fe){const xe=fe[S.__cacheKey];xe.usedTimes--,xe.usedTimes===0&&F(A),Object.keys(fe).length===0&&d.delete($)}n.remove(A)}function F(A){const S=n.get(A);s.deleteTexture(S.__webglTexture);const $=A.source,fe=d.get($);delete fe[S.__cacheKey],o.memory.textures--}function ee(A){const S=A.texture,$=n.get(A),fe=n.get(S);if(fe.__webglTexture!==void 0&&(s.deleteTexture(fe.__webglTexture),o.memory.textures--),A.depthTexture&&A.depthTexture.dispose(),A.isWebGLCubeRenderTarget)for(let xe=0;xe<6;xe++)s.deleteFramebuffer($.__webglFramebuffer[xe]),$.__webglDepthbuffer&&s.deleteRenderbuffer($.__webglDepthbuffer[xe]);else{if(s.deleteFramebuffer($.__webglFramebuffer),$.__webglDepthbuffer&&s.deleteRenderbuffer($.__webglDepthbuffer),$.__webglMultisampledFramebuffer&&s.deleteFramebuffer($.__webglMultisampledFramebuffer),$.__webglColorRenderbuffer)for(let xe=0;xe<$.__webglColorRenderbuffer.length;xe++)$.__webglColorRenderbuffer[xe]&&s.deleteRenderbuffer($.__webglColorRenderbuffer[xe]);$.__webglDepthRenderbuffer&&s.deleteRenderbuffer($.__webglDepthRenderbuffer)}if(A.isWebGLMultipleRenderTargets)for(let xe=0,ye=S.length;xe<ye;xe++){const P=n.get(S[xe]);P.__webglTexture&&(s.deleteTexture(P.__webglTexture),o.memory.textures--),n.remove(S[xe])}n.remove(S),n.remove(A)}let oe=0;function he(){oe=0}function te(){const A=oe;return A>=c&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+c),oe+=1,A}function _e(A){const S=[];return S.push(A.wrapS),S.push(A.wrapT),S.push(A.wrapR||0),S.push(A.magFilter),S.push(A.minFilter),S.push(A.anisotropy),S.push(A.internalFormat),S.push(A.format),S.push(A.type),S.push(A.generateMipmaps),S.push(A.premultiplyAlpha),S.push(A.flipY),S.push(A.unpackAlignment),S.push(A.encoding),S.join()}function re(A,S){const $=n.get(A);if(A.isVideoTexture&&It(A),A.isRenderTargetTexture===!1&&A.version>0&&$.__version!==A.version){const fe=A.image;if(fe===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(fe.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{be($,A,S);return}}t.bindTexture(3553,$.__webglTexture,33984+S)}function Z(A,S){const $=n.get(A);if(A.version>0&&$.__version!==A.version){be($,A,S);return}t.bindTexture(35866,$.__webglTexture,33984+S)}function q(A,S){const $=n.get(A);if(A.version>0&&$.__version!==A.version){be($,A,S);return}t.bindTexture(32879,$.__webglTexture,33984+S)}function le(A,S){const $=n.get(A);if(A.version>0&&$.__version!==A.version){Ue($,A,S);return}t.bindTexture(34067,$.__webglTexture,33984+S)}const ge={[ds]:10497,[Gt]:33071,[fs]:33648},Se={[yt]:9728,[Rs]:9984,[Er]:9986,[bt]:9729,[hl]:9985,[yi]:9987};function X(A,S,$){if($?(s.texParameteri(A,10242,ge[S.wrapS]),s.texParameteri(A,10243,ge[S.wrapT]),(A===32879||A===35866)&&s.texParameteri(A,32882,ge[S.wrapR]),s.texParameteri(A,10240,Se[S.magFilter]),s.texParameteri(A,10241,Se[S.minFilter])):(s.texParameteri(A,10242,33071),s.texParameteri(A,10243,33071),(A===32879||A===35866)&&s.texParameteri(A,32882,33071),(S.wrapS!==Gt||S.wrapT!==Gt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),s.texParameteri(A,10240,H(S.magFilter)),s.texParameteri(A,10241,H(S.minFilter)),S.minFilter!==yt&&S.minFilter!==bt&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),e.has("EXT_texture_filter_anisotropic")===!0){const fe=e.get("EXT_texture_filter_anisotropic");if(S.magFilter===yt||S.minFilter!==Er&&S.minFilter!==yi||S.type===rn&&e.has("OES_texture_float_linear")===!1||a===!1&&S.type===yn&&e.has("OES_texture_half_float_linear")===!1)return;(S.anisotropy>1||n.get(S).__currentAnisotropy)&&(s.texParameterf(A,fe.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy)}}function Ge(A,S){let $=!1;A.__webglInit===void 0&&(A.__webglInit=!0,S.addEventListener("dispose",ne));const fe=S.source;let xe=d.get(fe);xe===void 0&&(xe={},d.set(fe,xe));const ye=_e(S);if(ye!==A.__cacheKey){xe[ye]===void 0&&(xe[ye]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,$=!0),xe[ye].usedTimes++;const P=xe[A.__cacheKey];P!==void 0&&(xe[A.__cacheKey].usedTimes--,P.usedTimes===0&&F(S)),A.__cacheKey=ye,A.__webglTexture=xe[ye].texture}return $}function be(A,S,$){let fe=3553;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(fe=35866),S.isData3DTexture&&(fe=32879);const xe=Ge(A,S),ye=S.source;t.bindTexture(fe,A.__webglTexture,33984+$);const P=n.get(ye);if(ye.version!==P.__version||xe===!0){t.activeTexture(33984+$),s.pixelStorei(37440,S.flipY),s.pixelStorei(37441,S.premultiplyAlpha),s.pixelStorei(3317,S.unpackAlignment),s.pixelStorei(37443,0);const K=E(S)&&T(S.image)===!1;let Y=w(S.image,K,!1,u);Y=At(S,Y);const Te=T(Y)||a,Le=r.convert(S.format,S.encoding);let we=r.convert(S.type),Ee=x(S.internalFormat,Le,we,S.encoding,S.isVideoTexture);X(fe,S,Te);let De;const ze=S.mipmaps,Be=a&&S.isVideoTexture!==!0,qe=P.__version===void 0||xe===!0,I=R(S,Y,Te);if(S.isDepthTexture)Ee=6402,a?S.type===rn?Ee=36012:S.type===Gn?Ee=33190:S.type===vi?Ee=35056:Ee=33189:S.type===rn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),S.format===Vn&&Ee===6402&&S.type!==eo&&S.type!==Gn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),S.type=Gn,we=r.convert(S.type)),S.format===bi&&Ee===6402&&(Ee=34041,S.type!==vi&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),S.type=vi,we=r.convert(S.type))),qe&&(Be?t.texStorage2D(3553,1,Ee,Y.width,Y.height):t.texImage2D(3553,0,Ee,Y.width,Y.height,0,Le,we,null));else if(S.isDataTexture)if(ze.length>0&&Te){Be&&qe&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let D=0,de=ze.length;D<de;D++)De=ze[D],Be?t.texSubImage2D(3553,D,0,0,De.width,De.height,Le,we,De.data):t.texImage2D(3553,D,Ee,De.width,De.height,0,Le,we,De.data);S.generateMipmaps=!1}else Be?(qe&&t.texStorage2D(3553,I,Ee,Y.width,Y.height),t.texSubImage2D(3553,0,0,0,Y.width,Y.height,Le,we,Y.data)):t.texImage2D(3553,0,Ee,Y.width,Y.height,0,Le,we,Y.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Be&&qe&&t.texStorage3D(35866,I,Ee,ze[0].width,ze[0].height,Y.depth);for(let D=0,de=ze.length;D<de;D++)De=ze[D],S.format!==Ht?Le!==null?Be?t.compressedTexSubImage3D(35866,D,0,0,0,De.width,De.height,Y.depth,Le,De.data,0,0):t.compressedTexImage3D(35866,D,Ee,De.width,De.height,Y.depth,0,De.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?t.texSubImage3D(35866,D,0,0,0,De.width,De.height,Y.depth,Le,we,De.data):t.texImage3D(35866,D,Ee,De.width,De.height,Y.depth,0,Le,we,De.data)}else{Be&&qe&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let D=0,de=ze.length;D<de;D++)De=ze[D],S.format!==Ht?Le!==null?Be?t.compressedTexSubImage2D(3553,D,0,0,De.width,De.height,Le,De.data):t.compressedTexImage2D(3553,D,Ee,De.width,De.height,0,De.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?t.texSubImage2D(3553,D,0,0,De.width,De.height,Le,we,De.data):t.texImage2D(3553,D,Ee,De.width,De.height,0,Le,we,De.data)}else if(S.isDataArrayTexture)Be?(qe&&t.texStorage3D(35866,I,Ee,Y.width,Y.height,Y.depth),t.texSubImage3D(35866,0,0,0,0,Y.width,Y.height,Y.depth,Le,we,Y.data)):t.texImage3D(35866,0,Ee,Y.width,Y.height,Y.depth,0,Le,we,Y.data);else if(S.isData3DTexture)Be?(qe&&t.texStorage3D(32879,I,Ee,Y.width,Y.height,Y.depth),t.texSubImage3D(32879,0,0,0,0,Y.width,Y.height,Y.depth,Le,we,Y.data)):t.texImage3D(32879,0,Ee,Y.width,Y.height,Y.depth,0,Le,we,Y.data);else if(S.isFramebufferTexture){if(qe)if(Be)t.texStorage2D(3553,I,Ee,Y.width,Y.height);else{let D=Y.width,de=Y.height;for(let Ae=0;Ae<I;Ae++)t.texImage2D(3553,Ae,Ee,D,de,0,Le,we,null),D>>=1,de>>=1}}else if(ze.length>0&&Te){Be&&qe&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let D=0,de=ze.length;D<de;D++)De=ze[D],Be?t.texSubImage2D(3553,D,0,0,Le,we,De):t.texImage2D(3553,D,Ee,Le,we,De);S.generateMipmaps=!1}else Be?(qe&&t.texStorage2D(3553,I,Ee,Y.width,Y.height),t.texSubImage2D(3553,0,0,0,Le,we,Y)):t.texImage2D(3553,0,Ee,Le,we,Y);N(S,Te)&&B(fe),P.__version=ye.version,S.onUpdate&&S.onUpdate(S)}A.__version=S.version}function Ue(A,S,$){if(S.image.length!==6)return;const fe=Ge(A,S),xe=S.source;t.bindTexture(34067,A.__webglTexture,33984+$);const ye=n.get(xe);if(xe.version!==ye.__version||fe===!0){t.activeTexture(33984+$),s.pixelStorei(37440,S.flipY),s.pixelStorei(37441,S.premultiplyAlpha),s.pixelStorei(3317,S.unpackAlignment),s.pixelStorei(37443,0);const P=S.isCompressedTexture||S.image[0].isCompressedTexture,K=S.image[0]&&S.image[0].isDataTexture,Y=[];for(let D=0;D<6;D++)!P&&!K?Y[D]=w(S.image[D],!1,!0,l):Y[D]=K?S.image[D].image:S.image[D],Y[D]=At(S,Y[D]);const Te=Y[0],Le=T(Te)||a,we=r.convert(S.format,S.encoding),Ee=r.convert(S.type),De=x(S.internalFormat,we,Ee,S.encoding),ze=a&&S.isVideoTexture!==!0,Be=ye.__version===void 0||fe===!0;let qe=R(S,Te,Le);X(34067,S,Le);let I;if(P){ze&&Be&&t.texStorage2D(34067,qe,De,Te.width,Te.height);for(let D=0;D<6;D++){I=Y[D].mipmaps;for(let de=0;de<I.length;de++){const Ae=I[de];S.format!==Ht?we!==null?ze?t.compressedTexSubImage2D(34069+D,de,0,0,Ae.width,Ae.height,we,Ae.data):t.compressedTexImage2D(34069+D,de,De,Ae.width,Ae.height,0,Ae.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ze?t.texSubImage2D(34069+D,de,0,0,Ae.width,Ae.height,we,Ee,Ae.data):t.texImage2D(34069+D,de,De,Ae.width,Ae.height,0,we,Ee,Ae.data)}}}else{I=S.mipmaps,ze&&Be&&(I.length>0&&qe++,t.texStorage2D(34067,qe,De,Y[0].width,Y[0].height));for(let D=0;D<6;D++)if(K){ze?t.texSubImage2D(34069+D,0,0,0,Y[D].width,Y[D].height,we,Ee,Y[D].data):t.texImage2D(34069+D,0,De,Y[D].width,Y[D].height,0,we,Ee,Y[D].data);for(let de=0;de<I.length;de++){const Ie=I[de].image[D].image;ze?t.texSubImage2D(34069+D,de+1,0,0,Ie.width,Ie.height,we,Ee,Ie.data):t.texImage2D(34069+D,de+1,De,Ie.width,Ie.height,0,we,Ee,Ie.data)}}else{ze?t.texSubImage2D(34069+D,0,0,0,we,Ee,Y[D]):t.texImage2D(34069+D,0,De,we,Ee,Y[D]);for(let de=0;de<I.length;de++){const Ae=I[de];ze?t.texSubImage2D(34069+D,de+1,0,0,we,Ee,Ae.image[D]):t.texImage2D(34069+D,de+1,De,we,Ee,Ae.image[D])}}}N(S,Le)&&B(34067),ye.__version=xe.version,S.onUpdate&&S.onUpdate(S)}A.__version=S.version}function Re(A,S,$,fe,xe){const ye=r.convert($.format,$.encoding),P=r.convert($.type),K=x($.internalFormat,ye,P,$.encoding);n.get(S).__hasExternalTextures||(xe===32879||xe===35866?t.texImage3D(xe,0,K,S.width,S.height,S.depth,0,ye,P,null):t.texImage2D(xe,0,K,S.width,S.height,0,ye,P,null)),t.bindFramebuffer(36160,A),Ke(S)?f.framebufferTexture2DMultisampleEXT(36160,fe,xe,n.get($).__webglTexture,0,at(S)):(xe===3553||xe>=34069&&xe<=34074)&&s.framebufferTexture2D(36160,fe,xe,n.get($).__webglTexture,0),t.bindFramebuffer(36160,null)}function $e(A,S,$){if(s.bindRenderbuffer(36161,A),S.depthBuffer&&!S.stencilBuffer){let fe=33189;if($||Ke(S)){const xe=S.depthTexture;xe&&xe.isDepthTexture&&(xe.type===rn?fe=36012:xe.type===Gn&&(fe=33190));const ye=at(S);Ke(S)?f.renderbufferStorageMultisampleEXT(36161,ye,fe,S.width,S.height):s.renderbufferStorageMultisample(36161,ye,fe,S.width,S.height)}else s.renderbufferStorage(36161,fe,S.width,S.height);s.framebufferRenderbuffer(36160,36096,36161,A)}else if(S.depthBuffer&&S.stencilBuffer){const fe=at(S);$&&Ke(S)===!1?s.renderbufferStorageMultisample(36161,fe,35056,S.width,S.height):Ke(S)?f.renderbufferStorageMultisampleEXT(36161,fe,35056,S.width,S.height):s.renderbufferStorage(36161,34041,S.width,S.height),s.framebufferRenderbuffer(36160,33306,36161,A)}else{const fe=S.isWebGLMultipleRenderTargets===!0?S.texture:[S.texture];for(let xe=0;xe<fe.length;xe++){const ye=fe[xe],P=r.convert(ye.format,ye.encoding),K=r.convert(ye.type),Y=x(ye.internalFormat,P,K,ye.encoding),Te=at(S);$&&Ke(S)===!1?s.renderbufferStorageMultisample(36161,Te,Y,S.width,S.height):Ke(S)?f.renderbufferStorageMultisampleEXT(36161,Te,Y,S.width,S.height):s.renderbufferStorage(36161,Y,S.width,S.height)}}s.bindRenderbuffer(36161,null)}function Ve(A,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(36160,A),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(S.depthTexture).__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),re(S.depthTexture,0);const fe=n.get(S.depthTexture).__webglTexture,xe=at(S);if(S.depthTexture.format===Vn)Ke(S)?f.framebufferTexture2DMultisampleEXT(36160,36096,3553,fe,0,xe):s.framebufferTexture2D(36160,36096,3553,fe,0);else if(S.depthTexture.format===bi)Ke(S)?f.framebufferTexture2DMultisampleEXT(36160,33306,3553,fe,0,xe):s.framebufferTexture2D(36160,33306,3553,fe,0);else throw new Error("Unknown depthTexture format")}function Oe(A){const S=n.get(A),$=A.isWebGLCubeRenderTarget===!0;if(A.depthTexture&&!S.__autoAllocateDepthBuffer){if($)throw new Error("target.depthTexture not supported in Cube render targets");Ve(S.__webglFramebuffer,A)}else if($){S.__webglDepthbuffer=[];for(let fe=0;fe<6;fe++)t.bindFramebuffer(36160,S.__webglFramebuffer[fe]),S.__webglDepthbuffer[fe]=s.createRenderbuffer(),$e(S.__webglDepthbuffer[fe],A,!1)}else t.bindFramebuffer(36160,S.__webglFramebuffer),S.__webglDepthbuffer=s.createRenderbuffer(),$e(S.__webglDepthbuffer,A,!1);t.bindFramebuffer(36160,null)}function lt(A,S,$){const fe=n.get(A);S!==void 0&&Re(fe.__webglFramebuffer,A,A.texture,36064,3553),$!==void 0&&Oe(A)}function ct(A){const S=A.texture,$=n.get(A),fe=n.get(S);A.addEventListener("dispose",ae),A.isWebGLMultipleRenderTargets!==!0&&(fe.__webglTexture===void 0&&(fe.__webglTexture=s.createTexture()),fe.__version=S.version,o.memory.textures++);const xe=A.isWebGLCubeRenderTarget===!0,ye=A.isWebGLMultipleRenderTargets===!0,P=T(A)||a;if(xe){$.__webglFramebuffer=[];for(let K=0;K<6;K++)$.__webglFramebuffer[K]=s.createFramebuffer()}else{if($.__webglFramebuffer=s.createFramebuffer(),ye)if(i.drawBuffers){const K=A.texture;for(let Y=0,Te=K.length;Y<Te;Y++){const Le=n.get(K[Y]);Le.__webglTexture===void 0&&(Le.__webglTexture=s.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&A.samples>0&&Ke(A)===!1){const K=ye?S:[S];$.__webglMultisampledFramebuffer=s.createFramebuffer(),$.__webglColorRenderbuffer=[],t.bindFramebuffer(36160,$.__webglMultisampledFramebuffer);for(let Y=0;Y<K.length;Y++){const Te=K[Y];$.__webglColorRenderbuffer[Y]=s.createRenderbuffer(),s.bindRenderbuffer(36161,$.__webglColorRenderbuffer[Y]);const Le=r.convert(Te.format,Te.encoding),we=r.convert(Te.type),Ee=x(Te.internalFormat,Le,we,Te.encoding,A.isXRRenderTarget===!0),De=at(A);s.renderbufferStorageMultisample(36161,De,Ee,A.width,A.height),s.framebufferRenderbuffer(36160,36064+Y,36161,$.__webglColorRenderbuffer[Y])}s.bindRenderbuffer(36161,null),A.depthBuffer&&($.__webglDepthRenderbuffer=s.createRenderbuffer(),$e($.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(36160,null)}}if(xe){t.bindTexture(34067,fe.__webglTexture),X(34067,S,P);for(let K=0;K<6;K++)Re($.__webglFramebuffer[K],A,S,36064,34069+K);N(S,P)&&B(34067),t.unbindTexture()}else if(ye){const K=A.texture;for(let Y=0,Te=K.length;Y<Te;Y++){const Le=K[Y],we=n.get(Le);t.bindTexture(3553,we.__webglTexture),X(3553,Le,P),Re($.__webglFramebuffer,A,Le,36064+Y,3553),N(Le,P)&&B(3553)}t.unbindTexture()}else{let K=3553;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(a?K=A.isWebGL3DRenderTarget?32879:35866:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(K,fe.__webglTexture),X(K,S,P),Re($.__webglFramebuffer,A,S,36064,K),N(S,P)&&B(K),t.unbindTexture()}A.depthBuffer&&Oe(A)}function dt(A){const S=T(A)||a,$=A.isWebGLMultipleRenderTargets===!0?A.texture:[A.texture];for(let fe=0,xe=$.length;fe<xe;fe++){const ye=$[fe];if(N(ye,S)){const P=A.isWebGLCubeRenderTarget?34067:3553,K=n.get(ye).__webglTexture;t.bindTexture(P,K),B(P),t.unbindTexture()}}}function Tt(A){if(a&&A.samples>0&&Ke(A)===!1){const S=A.isWebGLMultipleRenderTargets?A.texture:[A.texture],$=A.width,fe=A.height;let xe=16384;const ye=[],P=A.stencilBuffer?33306:36096,K=n.get(A),Y=A.isWebGLMultipleRenderTargets===!0;if(Y)for(let Te=0;Te<S.length;Te++)t.bindFramebuffer(36160,K.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Te,36161,null),t.bindFramebuffer(36160,K.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Te,3553,null,0);t.bindFramebuffer(36008,K.__webglMultisampledFramebuffer),t.bindFramebuffer(36009,K.__webglFramebuffer);for(let Te=0;Te<S.length;Te++){ye.push(36064+Te),A.depthBuffer&&ye.push(P);const Le=K.__ignoreDepthValues!==void 0?K.__ignoreDepthValues:!1;if(Le===!1&&(A.depthBuffer&&(xe|=256),A.stencilBuffer&&(xe|=1024)),Y&&s.framebufferRenderbuffer(36008,36064,36161,K.__webglColorRenderbuffer[Te]),Le===!0&&(s.invalidateFramebuffer(36008,[P]),s.invalidateFramebuffer(36009,[P])),Y){const we=n.get(S[Te]).__webglTexture;s.framebufferTexture2D(36009,36064,3553,we,0)}s.blitFramebuffer(0,0,$,fe,0,0,$,fe,xe,9728),g&&s.invalidateFramebuffer(36008,ye)}if(t.bindFramebuffer(36008,null),t.bindFramebuffer(36009,null),Y)for(let Te=0;Te<S.length;Te++){t.bindFramebuffer(36160,K.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Te,36161,K.__webglColorRenderbuffer[Te]);const Le=n.get(S[Te]).__webglTexture;t.bindFramebuffer(36160,K.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Te,3553,Le,0)}t.bindFramebuffer(36009,K.__webglMultisampledFramebuffer)}}function at(A){return Math.min(h,A.samples)}function Ke(A){const S=n.get(A);return a&&A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function It(A){const S=o.render.frame;v.get(A)!==S&&(v.set(A,S),A.update())}function At(A,S){const $=A.encoding,fe=A.format,xe=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||A.format===ps||$!==wn&&($===rt?a===!1?e.has("EXT_sRGB")===!0&&fe===Ht?(A.format=ps,A.minFilter=bt,A.generateMipmaps=!1):S=ro.sRGBToLinear(S):(fe!==Ht||xe!==Yn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture encoding:",$)),S}this.allocateTextureUnit=te,this.resetTextureUnits=he,this.setTexture2D=re,this.setTexture2DArray=Z,this.setTexture3D=q,this.setTextureCube=le,this.rebindTextures=lt,this.setupRenderTarget=ct,this.updateRenderTargetMipmap=dt,this.updateMultisampleRenderTarget=Tt,this.setupDepthRenderbuffer=Oe,this.setupFrameBufferTexture=Re,this.useMultisampledRTT=Ke}function wf(s,e,t){const n=t.isWebGL2;function i(r,o=null){let a;if(r===Yn)return 5121;if(r===ml)return 32819;if(r===gl)return 32820;if(r===dl)return 5120;if(r===fl)return 5122;if(r===eo)return 5123;if(r===pl)return 5124;if(r===Gn)return 5125;if(r===rn)return 5126;if(r===yn)return n?5131:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(r===_l)return 6406;if(r===Ht)return 6408;if(r===vl)return 6409;if(r===Sl)return 6410;if(r===Vn)return 6402;if(r===bi)return 34041;if(r===xl)return console.warn("THREE.WebGLRenderer: THREE.RGBFormat has been removed. Use THREE.RGBAFormat instead. https://github.com/mrdoob/three.js/pull/23228"),6408;if(r===ps)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(r===to)return 6403;if(r===Ml)return 36244;if(r===yl)return 33319;if(r===bl)return 33320;if(r===wl)return 36249;if(r===Ar||r===Cr||r===Rr||r===Lr)if(o===rt)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(r===Ar)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===Cr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===Rr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===Lr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(r===Ar)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===Cr)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===Rr)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===Lr)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Ls||r===Ps||r===Ds||r===Is)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(r===Ls)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Ps)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===Ds)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Is)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Tl)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===Ns||r===Fs)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(r===Ns)return o===rt?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(r===Fs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===Os||r===Us||r===zs||r===Bs||r===ks||r===Gs||r===Hs||r===Vs||r===Ws||r===Xs||r===qs||r===Ys||r===Zs||r===js)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(r===Os)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===Us)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===zs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===Bs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===ks)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===Gs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===Hs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===Vs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===Ws)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===Xs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===qs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===Ys)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===Zs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===js)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===$s)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(r===$s)return o===rt?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT}else return null;return r===vi?n?34042:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):s[r]!==void 0?s[r]:null}return{convert:i}}class Tf extends nn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class pr extends Dt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Ef={type:"move"};class is{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new W,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new W),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new W,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new W),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(const m of e.hand.values()){const d=t.getJointPose(m,n),M=this._getHandJoint(l,m);d!==null&&(M.matrix.fromArray(d.transform.matrix),M.matrix.decompose(M.position,M.rotation,M.scale),M.jointRadius=d.radius),M.visible=d!==null}const u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],f=u.position.distanceTo(h.position),g=.02,v=.005;l.inputState.pinching&&f>g+v?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&f<=g-v&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Ef)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new pr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Af extends Ut{constructor(e,t,n,i,r,o,a,c,l,u){if(u=u!==void 0?u:Vn,u!==Vn&&u!==bi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Vn&&(n=Gn),n===void 0&&u===bi&&(n=vi),super(null,i,r,o,a,c,u,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:yt,this.minFilter=c!==void 0?c:yt,this.flipY=!1,this.generateMipmaps=!1}}class Cf extends jn{constructor(e,t){super();const n=this;let i=null,r=1,o=null,a="local-floor",c=null,l=null,u=null,h=null,f=null,g=null;const v=t.getContextAttributes();let m=null,d=null;const M=[],C=[],w=new Set,T=new Map,E=new nn;E.layers.enable(1),E.viewport=new gt;const N=new nn;N.layers.enable(2),N.viewport=new gt;const B=[E,N],x=new Tf;x.layers.enable(1),x.layers.enable(2);let R=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let q=M[Z];return q===void 0&&(q=new is,M[Z]=q),q.getTargetRaySpace()},this.getControllerGrip=function(Z){let q=M[Z];return q===void 0&&(q=new is,M[Z]=q),q.getGripSpace()},this.getHand=function(Z){let q=M[Z];return q===void 0&&(q=new is,M[Z]=q),q.getHandSpace()};function ne(Z){const q=C.indexOf(Z.inputSource);if(q===-1)return;const le=M[q];le!==void 0&&le.dispatchEvent({type:Z.type,data:Z.inputSource})}function ae(){i.removeEventListener("select",ne),i.removeEventListener("selectstart",ne),i.removeEventListener("selectend",ne),i.removeEventListener("squeeze",ne),i.removeEventListener("squeezestart",ne),i.removeEventListener("squeezeend",ne),i.removeEventListener("end",ae),i.removeEventListener("inputsourceschange",z);for(let Z=0;Z<M.length;Z++){const q=C[Z];q!==null&&(C[Z]=null,M[Z].disconnect(q))}R=null,H=null,e.setRenderTarget(m),f=null,h=null,u=null,i=null,d=null,re.stop(),n.isPresenting=!1,n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){a=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",ne),i.addEventListener("selectstart",ne),i.addEventListener("selectend",ne),i.addEventListener("squeeze",ne),i.addEventListener("squeezestart",ne),i.addEventListener("squeezeend",ne),i.addEventListener("end",ae),i.addEventListener("inputsourceschange",z),v.xrCompatible!==!0&&await t.makeXRCompatible(),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const q={antialias:i.renderState.layers===void 0?v.antialias:!0,alpha:v.alpha,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,q),i.updateRenderState({baseLayer:f}),d=new Zn(f.framebufferWidth,f.framebufferHeight,{format:Ht,type:Yn,encoding:e.outputEncoding,stencilBuffer:v.stencil})}else{let q=null,le=null,ge=null;v.depth&&(ge=v.stencil?35056:33190,q=v.stencil?bi:Vn,le=v.stencil?vi:Gn);const Se={colorFormat:32856,depthFormat:ge,scaleFactor:r};u=new XRWebGLBinding(i,t),h=u.createProjectionLayer(Se),i.updateRenderState({layers:[h]}),d=new Zn(h.textureWidth,h.textureHeight,{format:Ht,type:Yn,depthTexture:new Af(h.textureWidth,h.textureHeight,le,void 0,void 0,void 0,void 0,void 0,void 0,q),stencilBuffer:v.stencil,encoding:e.outputEncoding,samples:v.antialias?4:0});const X=e.properties.get(d);X.__ignoreDepthValues=h.ignoreDepthValues}d.isXRRenderTarget=!0,this.setFoveation(1),c=null,o=await i.requestReferenceSpace(a),re.setContext(i),re.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}};function z(Z){for(let q=0;q<Z.removed.length;q++){const le=Z.removed[q],ge=C.indexOf(le);ge>=0&&(C[ge]=null,M[ge].disconnect(le))}for(let q=0;q<Z.added.length;q++){const le=Z.added[q];let ge=C.indexOf(le);if(ge===-1){for(let X=0;X<M.length;X++)if(X>=C.length){C.push(le),ge=X;break}else if(C[X]===null){C[X]=le,ge=X;break}if(ge===-1)break}const Se=M[ge];Se&&Se.connect(le)}}const F=new W,ee=new W;function oe(Z,q,le){F.setFromMatrixPosition(q.matrixWorld),ee.setFromMatrixPosition(le.matrixWorld);const ge=F.distanceTo(ee),Se=q.projectionMatrix.elements,X=le.projectionMatrix.elements,Ge=Se[14]/(Se[10]-1),be=Se[14]/(Se[10]+1),Ue=(Se[9]+1)/Se[5],Re=(Se[9]-1)/Se[5],$e=(Se[8]-1)/Se[0],Ve=(X[8]+1)/X[0],Oe=Ge*$e,lt=Ge*Ve,ct=ge/(-$e+Ve),dt=ct*-$e;q.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(dt),Z.translateZ(ct),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert();const Tt=Ge+ct,at=be+ct,Ke=Oe-dt,It=lt+(ge-dt),At=Ue*be/at*Tt,A=Re*be/at*Tt;Z.projectionMatrix.makePerspective(Ke,It,At,A,Tt,at)}function he(Z,q){q===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(q.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;x.near=N.near=E.near=Z.near,x.far=N.far=E.far=Z.far,(R!==x.near||H!==x.far)&&(i.updateRenderState({depthNear:x.near,depthFar:x.far}),R=x.near,H=x.far);const q=Z.parent,le=x.cameras;he(x,q);for(let Se=0;Se<le.length;Se++)he(le[Se],q);x.matrixWorld.decompose(x.position,x.quaternion,x.scale),Z.matrix.copy(x.matrix),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale);const ge=Z.children;for(let Se=0,X=ge.length;Se<X;Se++)ge[Se].updateMatrixWorld(!0);le.length===2?oe(x,E,N):x.projectionMatrix.copy(E.projectionMatrix)},this.getCamera=function(){return x},this.getFoveation=function(){if(h!==null)return h.fixedFoveation;if(f!==null)return f.fixedFoveation},this.setFoveation=function(Z){h!==null&&(h.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.getPlanes=function(){return w};let te=null;function _e(Z,q){if(l=q.getViewerPose(c||o),g=q,l!==null){const le=l.views;f!==null&&(e.setRenderTargetFramebuffer(d,f.framebuffer),e.setRenderTarget(d));let ge=!1;le.length!==x.cameras.length&&(x.cameras.length=0,ge=!0);for(let Se=0;Se<le.length;Se++){const X=le[Se];let Ge=null;if(f!==null)Ge=f.getViewport(X);else{const Ue=u.getViewSubImage(h,X);Ge=Ue.viewport,Se===0&&(e.setRenderTargetTextures(d,Ue.colorTexture,h.ignoreDepthValues?void 0:Ue.depthStencilTexture),e.setRenderTarget(d))}let be=B[Se];be===void 0&&(be=new nn,be.layers.enable(Se),be.viewport=new gt,B[Se]=be),be.matrix.fromArray(X.transform.matrix),be.projectionMatrix.fromArray(X.projectionMatrix),be.viewport.set(Ge.x,Ge.y,Ge.width,Ge.height),Se===0&&x.matrix.copy(be.matrix),ge===!0&&x.cameras.push(be)}}for(let le=0;le<M.length;le++){const ge=C[le],Se=M[le];ge!==null&&Se!==void 0&&Se.update(ge,q,c||o)}if(te&&te(Z,q),q.detectedPlanes){n.dispatchEvent({type:"planesdetected",data:q.detectedPlanes});let le=null;for(const ge of w)q.detectedPlanes.has(ge)||(le===null&&(le=[]),le.push(ge));if(le!==null)for(const ge of le)w.delete(ge),T.delete(ge),n.dispatchEvent({type:"planeremoved",data:ge});for(const ge of q.detectedPlanes)if(!w.has(ge))w.add(ge),T.set(ge,q.lastChangedTime),n.dispatchEvent({type:"planeadded",data:ge});else{const Se=T.get(ge);ge.lastChangedTime>Se&&(T.set(ge,ge.lastChangedTime),n.dispatchEvent({type:"planechanged",data:ge}))}}g=null}const re=new go;re.setAnimationLoop(_e),this.setAnimationLoop=function(Z){te=Z},this.dispose=function(){}}}function Rf(s,e){function t(m,d){d.color.getRGB(m.fogColor.value,ho(s)),d.isFog?(m.fogNear.value=d.near,m.fogFar.value=d.far):d.isFogExp2&&(m.fogDensity.value=d.density)}function n(m,d,M,C,w){d.isMeshBasicMaterial||d.isMeshLambertMaterial?i(m,d):d.isMeshToonMaterial?(i(m,d),u(m,d)):d.isMeshPhongMaterial?(i(m,d),l(m,d)):d.isMeshStandardMaterial?(i(m,d),h(m,d),d.isMeshPhysicalMaterial&&f(m,d,w)):d.isMeshMatcapMaterial?(i(m,d),g(m,d)):d.isMeshDepthMaterial?i(m,d):d.isMeshDistanceMaterial?(i(m,d),v(m,d)):d.isMeshNormalMaterial?i(m,d):d.isLineBasicMaterial?(r(m,d),d.isLineDashedMaterial&&o(m,d)):d.isPointsMaterial?a(m,d,M,C):d.isSpriteMaterial?c(m,d):d.isShadowMaterial?(m.color.value.copy(d.color),m.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function i(m,d){m.opacity.value=d.opacity,d.color&&m.diffuse.value.copy(d.color),d.emissive&&m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(m.map.value=d.map),d.alphaMap&&(m.alphaMap.value=d.alphaMap),d.bumpMap&&(m.bumpMap.value=d.bumpMap,m.bumpScale.value=d.bumpScale,d.side===jt&&(m.bumpScale.value*=-1)),d.displacementMap&&(m.displacementMap.value=d.displacementMap,m.displacementScale.value=d.displacementScale,m.displacementBias.value=d.displacementBias),d.emissiveMap&&(m.emissiveMap.value=d.emissiveMap),d.normalMap&&(m.normalMap.value=d.normalMap,m.normalScale.value.copy(d.normalScale),d.side===jt&&m.normalScale.value.negate()),d.specularMap&&(m.specularMap.value=d.specularMap),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);const M=e.get(d).envMap;if(M&&(m.envMap.value=M,m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=d.reflectivity,m.ior.value=d.ior,m.refractionRatio.value=d.refractionRatio),d.lightMap){m.lightMap.value=d.lightMap;const T=s.physicallyCorrectLights!==!0?Math.PI:1;m.lightMapIntensity.value=d.lightMapIntensity*T}d.aoMap&&(m.aoMap.value=d.aoMap,m.aoMapIntensity.value=d.aoMapIntensity);let C;d.map?C=d.map:d.specularMap?C=d.specularMap:d.displacementMap?C=d.displacementMap:d.normalMap?C=d.normalMap:d.bumpMap?C=d.bumpMap:d.roughnessMap?C=d.roughnessMap:d.metalnessMap?C=d.metalnessMap:d.alphaMap?C=d.alphaMap:d.emissiveMap?C=d.emissiveMap:d.clearcoatMap?C=d.clearcoatMap:d.clearcoatNormalMap?C=d.clearcoatNormalMap:d.clearcoatRoughnessMap?C=d.clearcoatRoughnessMap:d.iridescenceMap?C=d.iridescenceMap:d.iridescenceThicknessMap?C=d.iridescenceThicknessMap:d.specularIntensityMap?C=d.specularIntensityMap:d.specularColorMap?C=d.specularColorMap:d.transmissionMap?C=d.transmissionMap:d.thicknessMap?C=d.thicknessMap:d.sheenColorMap?C=d.sheenColorMap:d.sheenRoughnessMap&&(C=d.sheenRoughnessMap),C!==void 0&&(C.isWebGLRenderTarget&&(C=C.texture),C.matrixAutoUpdate===!0&&C.updateMatrix(),m.uvTransform.value.copy(C.matrix));let w;d.aoMap?w=d.aoMap:d.lightMap&&(w=d.lightMap),w!==void 0&&(w.isWebGLRenderTarget&&(w=w.texture),w.matrixAutoUpdate===!0&&w.updateMatrix(),m.uv2Transform.value.copy(w.matrix))}function r(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity}function o(m,d){m.dashSize.value=d.dashSize,m.totalSize.value=d.dashSize+d.gapSize,m.scale.value=d.scale}function a(m,d,M,C){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.size.value=d.size*M,m.scale.value=C*.5,d.map&&(m.map.value=d.map),d.alphaMap&&(m.alphaMap.value=d.alphaMap),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);let w;d.map?w=d.map:d.alphaMap&&(w=d.alphaMap),w!==void 0&&(w.matrixAutoUpdate===!0&&w.updateMatrix(),m.uvTransform.value.copy(w.matrix))}function c(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.rotation.value=d.rotation,d.map&&(m.map.value=d.map),d.alphaMap&&(m.alphaMap.value=d.alphaMap),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);let M;d.map?M=d.map:d.alphaMap&&(M=d.alphaMap),M!==void 0&&(M.matrixAutoUpdate===!0&&M.updateMatrix(),m.uvTransform.value.copy(M.matrix))}function l(m,d){m.specular.value.copy(d.specular),m.shininess.value=Math.max(d.shininess,1e-4)}function u(m,d){d.gradientMap&&(m.gradientMap.value=d.gradientMap)}function h(m,d){m.roughness.value=d.roughness,m.metalness.value=d.metalness,d.roughnessMap&&(m.roughnessMap.value=d.roughnessMap),d.metalnessMap&&(m.metalnessMap.value=d.metalnessMap),e.get(d).envMap&&(m.envMapIntensity.value=d.envMapIntensity)}function f(m,d,M){m.ior.value=d.ior,d.sheen>0&&(m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),m.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(m.sheenColorMap.value=d.sheenColorMap),d.sheenRoughnessMap&&(m.sheenRoughnessMap.value=d.sheenRoughnessMap)),d.clearcoat>0&&(m.clearcoat.value=d.clearcoat,m.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(m.clearcoatMap.value=d.clearcoatMap),d.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap),d.clearcoatNormalMap&&(m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),m.clearcoatNormalMap.value=d.clearcoatNormalMap,d.side===jt&&m.clearcoatNormalScale.value.negate())),d.iridescence>0&&(m.iridescence.value=d.iridescence,m.iridescenceIOR.value=d.iridescenceIOR,m.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(m.iridescenceMap.value=d.iridescenceMap),d.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=d.iridescenceThicknessMap)),d.transmission>0&&(m.transmission.value=d.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),d.transmissionMap&&(m.transmissionMap.value=d.transmissionMap),m.thickness.value=d.thickness,d.thicknessMap&&(m.thicknessMap.value=d.thicknessMap),m.attenuationDistance.value=d.attenuationDistance,m.attenuationColor.value.copy(d.attenuationColor)),m.specularIntensity.value=d.specularIntensity,m.specularColor.value.copy(d.specularColor),d.specularIntensityMap&&(m.specularIntensityMap.value=d.specularIntensityMap),d.specularColorMap&&(m.specularColorMap.value=d.specularColorMap)}function g(m,d){d.matcap&&(m.matcap.value=d.matcap)}function v(m,d){m.referencePosition.value.copy(d.referencePosition),m.nearDistance.value=d.nearDistance,m.farDistance.value=d.farDistance}return{refreshFogUniforms:t,refreshMaterialUniforms:n}}function Lf(s,e,t,n){let i={},r={},o=[];const a=t.isWebGL2?s.getParameter(35375):0;function c(C,w){const T=w.program;n.uniformBlockBinding(C,T)}function l(C,w){let T=i[C.id];T===void 0&&(v(C),T=u(C),i[C.id]=T,C.addEventListener("dispose",d));const E=w.program;n.updateUBOMapping(C,E);const N=e.render.frame;r[C.id]!==N&&(f(C),r[C.id]=N)}function u(C){const w=h();C.__bindingPointIndex=w;const T=s.createBuffer(),E=C.__size,N=C.usage;return s.bindBuffer(35345,T),s.bufferData(35345,E,N),s.bindBuffer(35345,null),s.bindBufferBase(35345,w,T),T}function h(){for(let C=0;C<a;C++)if(o.indexOf(C)===-1)return o.push(C),C;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(C){const w=i[C.id],T=C.uniforms,E=C.__cache;s.bindBuffer(35345,w);for(let N=0,B=T.length;N<B;N++){const x=T[N];if(g(x,N,E)===!0){const R=x.__offset,H=Array.isArray(x.value)?x.value:[x.value];let ne=0;for(let ae=0;ae<H.length;ae++){const z=H[ae],F=m(z);typeof z=="number"?(x.__data[0]=z,s.bufferSubData(35345,R+ne,x.__data)):z.isMatrix3?(x.__data[0]=z.elements[0],x.__data[1]=z.elements[1],x.__data[2]=z.elements[2],x.__data[3]=z.elements[0],x.__data[4]=z.elements[3],x.__data[5]=z.elements[4],x.__data[6]=z.elements[5],x.__data[7]=z.elements[0],x.__data[8]=z.elements[6],x.__data[9]=z.elements[7],x.__data[10]=z.elements[8],x.__data[11]=z.elements[0]):(z.toArray(x.__data,ne),ne+=F.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(35345,R,x.__data)}}s.bindBuffer(35345,null)}function g(C,w,T){const E=C.value;if(T[w]===void 0){if(typeof E=="number")T[w]=E;else{const N=Array.isArray(E)?E:[E],B=[];for(let x=0;x<N.length;x++)B.push(N[x].clone());T[w]=B}return!0}else if(typeof E=="number"){if(T[w]!==E)return T[w]=E,!0}else{const N=Array.isArray(T[w])?T[w]:[T[w]],B=Array.isArray(E)?E:[E];for(let x=0;x<N.length;x++){const R=N[x];if(R.equals(B[x])===!1)return R.copy(B[x]),!0}}return!1}function v(C){const w=C.uniforms;let T=0;const E=16;let N=0;for(let B=0,x=w.length;B<x;B++){const R=w[B],H={boundary:0,storage:0},ne=Array.isArray(R.value)?R.value:[R.value];for(let ae=0,z=ne.length;ae<z;ae++){const F=ne[ae],ee=m(F);H.boundary+=ee.boundary,H.storage+=ee.storage}if(R.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),R.__offset=T,B>0){N=T%E;const ae=E-N;N!==0&&ae-H.boundary<0&&(T+=E-N,R.__offset=T)}T+=H.storage}return N=T%E,N>0&&(T+=E-N),C.__size=T,C.__cache={},this}function m(C){const w={boundary:0,storage:0};return typeof C=="number"?(w.boundary=4,w.storage=4):C.isVector2?(w.boundary=8,w.storage=8):C.isVector3||C.isColor?(w.boundary=16,w.storage=12):C.isVector4?(w.boundary=16,w.storage=16):C.isMatrix3?(w.boundary=48,w.storage=48):C.isMatrix4?(w.boundary=64,w.storage=64):C.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",C),w}function d(C){const w=C.target;w.removeEventListener("dispose",d);const T=o.indexOf(w.__bindingPointIndex);o.splice(T,1),s.deleteBuffer(i[w.id]),delete i[w.id],delete r[w.id]}function M(){for(const C in i)s.deleteBuffer(i[C]);o=[],i={},r={}}return{bind:c,update:l,dispose:M}}function Pf(){const s=vr("canvas");return s.style.display="block",s}function yo(s={}){this.isWebGLRenderer=!0;const e=s.canvas!==void 0?s.canvas:Pf(),t=s.context!==void 0?s.context:null,n=s.depth!==void 0?s.depth:!0,i=s.stencil!==void 0?s.stencil:!0,r=s.antialias!==void 0?s.antialias:!1,o=s.premultipliedAlpha!==void 0?s.premultipliedAlpha:!0,a=s.preserveDrawingBuffer!==void 0?s.preserveDrawingBuffer:!1,c=s.powerPreference!==void 0?s.powerPreference:"default",l=s.failIfMajorPerformanceCaveat!==void 0?s.failIfMajorPerformanceCaveat:!1;let u;t!==null?u=t.getContextAttributes().alpha:u=s.alpha!==void 0?s.alpha:!1;let h=null,f=null;const g=[],v=[];this.domElement=e,this.debug={checkShaderErrors:!0},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.outputEncoding=wn,this.physicallyCorrectLights=!1,this.toneMapping=bn,this.toneMappingExposure=1;const m=this;let d=!1,M=0,C=0,w=null,T=-1,E=null;const N=new gt,B=new gt;let x=null,R=e.width,H=e.height,ne=1,ae=null,z=null;const F=new gt(0,0,R,H),ee=new gt(0,0,R,H);let oe=!1;const he=new mo;let te=!1,_e=!1,re=null;const Z=new wt,q=new We,le=new W,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Se(){return w===null?ne:1}let X=t;function Ge(y,G){for(let k=0;k<y.length;k++){const U=y[k],Q=e.getContext(U,G);if(Q!==null)return Q}return null}try{const y={alpha:!0,depth:n,stencil:i,antialias:r,premultipliedAlpha:o,preserveDrawingBuffer:a,powerPreference:c,failIfMajorPerformanceCaveat:l};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${vs}`),e.addEventListener("webglcontextlost",Ee,!1),e.addEventListener("webglcontextrestored",De,!1),e.addEventListener("webglcontextcreationerror",ze,!1),X===null){const G=["webgl2","webgl","experimental-webgl"];if(m.isWebGL1Renderer===!0&&G.shift(),X=Ge(G,y),X===null)throw Ge(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}X.getShaderPrecisionFormat===void 0&&(X.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let be,Ue,Re,$e,Ve,Oe,lt,ct,dt,Tt,at,Ke,It,At,A,S,$,fe,xe,ye,P,K,Y,Te;function Le(){be=new Gh(X),Ue=new Fh(X,be,s),be.init(Ue),K=new wf(X,be,Ue),Re=new yf(X,be,Ue),$e=new Wh,Ve=new lf,Oe=new bf(X,be,Re,Ve,Ue,K,$e),lt=new Uh(m),ct=new kh(m),dt=new Ql(X,Ue),Y=new Ih(X,be,dt,Ue),Tt=new Hh(X,dt,$e,Y),at=new Zh(X,Tt,dt,$e),xe=new Yh(X,Ue,Oe),S=new Oh(Ve),Ke=new of(m,lt,ct,be,Ue,Y,S),It=new Rf(m,Ve),At=new uf,A=new gf(be,Ue),fe=new Dh(m,lt,ct,Re,at,u,o),$=new Mf(m,at,Ue),Te=new Lf(X,$e,Ue,Re),ye=new Nh(X,be,$e,Ue),P=new Vh(X,be,$e,Ue),$e.programs=Ke.programs,m.capabilities=Ue,m.extensions=be,m.properties=Ve,m.renderLists=At,m.shadowMap=$,m.state=Re,m.info=$e}Le();const we=new Cf(m,X);this.xr=we,this.getContext=function(){return X},this.getContextAttributes=function(){return X.getContextAttributes()},this.forceContextLoss=function(){const y=be.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=be.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(y){y!==void 0&&(ne=y,this.setSize(R,H,!1))},this.getSize=function(y){return y.set(R,H)},this.setSize=function(y,G,k){if(we.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}R=y,H=G,e.width=Math.floor(y*ne),e.height=Math.floor(G*ne),k!==!1&&(e.style.width=y+"px",e.style.height=G+"px"),this.setViewport(0,0,y,G)},this.getDrawingBufferSize=function(y){return y.set(R*ne,H*ne).floor()},this.setDrawingBufferSize=function(y,G,k){R=y,H=G,ne=k,e.width=Math.floor(y*k),e.height=Math.floor(G*k),this.setViewport(0,0,y,G)},this.getCurrentViewport=function(y){return y.copy(N)},this.getViewport=function(y){return y.copy(F)},this.setViewport=function(y,G,k,U){y.isVector4?F.set(y.x,y.y,y.z,y.w):F.set(y,G,k,U),Re.viewport(N.copy(F).multiplyScalar(ne).floor())},this.getScissor=function(y){return y.copy(ee)},this.setScissor=function(y,G,k,U){y.isVector4?ee.set(y.x,y.y,y.z,y.w):ee.set(y,G,k,U),Re.scissor(B.copy(ee).multiplyScalar(ne).floor())},this.getScissorTest=function(){return oe},this.setScissorTest=function(y){Re.setScissorTest(oe=y)},this.setOpaqueSort=function(y){ae=y},this.setTransparentSort=function(y){z=y},this.getClearColor=function(y){return y.copy(fe.getClearColor())},this.setClearColor=function(){fe.setClearColor.apply(fe,arguments)},this.getClearAlpha=function(){return fe.getClearAlpha()},this.setClearAlpha=function(){fe.setClearAlpha.apply(fe,arguments)},this.clear=function(y=!0,G=!0,k=!0){let U=0;y&&(U|=16384),G&&(U|=256),k&&(U|=1024),X.clear(U)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Ee,!1),e.removeEventListener("webglcontextrestored",De,!1),e.removeEventListener("webglcontextcreationerror",ze,!1),At.dispose(),A.dispose(),Ve.dispose(),lt.dispose(),ct.dispose(),at.dispose(),Y.dispose(),Te.dispose(),Ke.dispose(),we.dispose(),we.removeEventListener("sessionstart",Ae),we.removeEventListener("sessionend",Ie),re&&(re.dispose(),re=null),Je.stop()};function Ee(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),d=!0}function De(){console.log("THREE.WebGLRenderer: Context Restored."),d=!1;const y=$e.autoReset,G=$.enabled,k=$.autoUpdate,U=$.needsUpdate,Q=$.type;Le(),$e.autoReset=y,$.enabled=G,$.autoUpdate=k,$.needsUpdate=U,$.type=Q}function ze(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Be(y){const G=y.target;G.removeEventListener("dispose",Be),qe(G)}function qe(y){I(y),Ve.remove(y)}function I(y){const G=Ve.get(y).programs;G!==void 0&&(G.forEach(function(k){Ke.releaseProgram(k)}),y.isShaderMaterial&&Ke.releaseShaderCache(y))}this.renderBufferDirect=function(y,G,k,U,Q,p){G===null&&(G=ge);const _=Q.isMesh&&Q.matrixWorld.determinant()<0,b=wr(y,G,k,U,Q);Re.setMaterial(U,_);let L=k.index,V=1;U.wireframe===!0&&(L=Tt.getWireframeAttribute(k),V=2);const O=k.drawRange,j=k.attributes.position;let se=O.start*V,pe=(O.start+O.count)*V;p!==null&&(se=Math.max(se,p.start*V),pe=Math.min(pe,(p.start+p.count)*V)),L!==null?(se=Math.max(se,0),pe=Math.min(pe,L.count)):j!=null&&(se=Math.max(se,0),pe=Math.min(pe,j.count));const ie=pe-se;if(ie<0||ie===1/0)return;Y.setup(Q,U,b,k,L);let me,ve=ye;if(L!==null&&(me=dt.get(L),ve=P,ve.setIndex(me)),Q.isMesh)U.wireframe===!0?(Re.setLineWidth(U.wireframeLinewidth*Se()),ve.setMode(1)):ve.setMode(4);else if(Q.isLine){let ue=U.linewidth;ue===void 0&&(ue=1),Re.setLineWidth(ue*Se()),Q.isLineSegments?ve.setMode(1):Q.isLineLoop?ve.setMode(2):ve.setMode(3)}else Q.isPoints?ve.setMode(0):Q.isSprite&&ve.setMode(4);if(Q.isInstancedMesh)ve.renderInstances(se,ie,Q.count);else if(k.isInstancedBufferGeometry){const ue=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,Fe=Math.min(k.instanceCount,ue);ve.renderInstances(se,ie,Fe)}else ve.render(se,ie)},this.compile=function(y,G){function k(U,Q,p){U.transparent===!0&&U.side===Zi?(U.side=jt,U.needsUpdate=!0,Nt(U,Q,p),U.side=qn,U.needsUpdate=!0,Nt(U,Q,p),U.side=Zi):Nt(U,Q,p)}f=A.get(y),f.init(),v.push(f),y.traverseVisible(function(U){U.isLight&&U.layers.test(G.layers)&&(f.pushLight(U),U.castShadow&&f.pushShadow(U))}),f.setupLights(m.physicallyCorrectLights),y.traverse(function(U){const Q=U.material;if(Q)if(Array.isArray(Q))for(let p=0;p<Q.length;p++){const _=Q[p];k(_,y,U)}else k(Q,y,U)}),v.pop(),f=null};let D=null;function de(y){D&&D(y)}function Ae(){Je.stop()}function Ie(){Je.start()}const Je=new go;Je.setAnimationLoop(de),typeof self<"u"&&Je.setContext(self),this.setAnimationLoop=function(y){D=y,we.setAnimationLoop(y),y===null?Je.stop():Je.start()},we.addEventListener("sessionstart",Ae),we.addEventListener("sessionend",Ie),this.render=function(y,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(d===!0)return;y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),we.enabled===!0&&we.isPresenting===!0&&(we.cameraAutoUpdate===!0&&we.updateCamera(G),G=we.getCamera()),y.isScene===!0&&y.onBeforeRender(m,y,G,w),f=A.get(y,v.length),f.init(),v.push(f),Z.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),he.setFromProjectionMatrix(Z),_e=this.localClippingEnabled,te=S.init(this.clippingPlanes,_e,G),h=At.get(y,g.length),h.init(),g.push(h),ft(y,G,0,m.sortObjects),h.finish(),m.sortObjects===!0&&h.sort(ae,z),te===!0&&S.beginShadows();const k=f.state.shadowsArray;if($.render(k,y,G),te===!0&&S.endShadows(),this.info.autoReset===!0&&this.info.reset(),fe.render(h,y),f.setupLights(m.physicallyCorrectLights),G.isArrayCamera){const U=G.cameras;for(let Q=0,p=U.length;Q<p;Q++){const _=U[Q];vt(h,y,_,_.viewport)}}else vt(h,y,G);w!==null&&(Oe.updateMultisampleRenderTarget(w),Oe.updateRenderTargetMipmap(w)),y.isScene===!0&&y.onAfterRender(m,y,G),Y.resetDefaultState(),T=-1,E=null,v.pop(),v.length>0?f=v[v.length-1]:f=null,g.pop(),g.length>0?h=g[g.length-1]:h=null};function ft(y,G,k,U){if(y.visible===!1)return;if(y.layers.test(G.layers)){if(y.isGroup)k=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(G);else if(y.isLight)f.pushLight(y),y.castShadow&&f.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||he.intersectsSprite(y)){U&&le.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Z);const _=at.update(y),b=y.material;b.visible&&h.push(y,_,b,k,le.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(y.isSkinnedMesh&&y.skeleton.frame!==$e.render.frame&&(y.skeleton.update(),y.skeleton.frame=$e.render.frame),!y.frustumCulled||he.intersectsObject(y))){U&&le.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Z);const _=at.update(y),b=y.material;if(Array.isArray(b)){const L=_.groups;for(let V=0,O=L.length;V<O;V++){const j=L[V],se=b[j.materialIndex];se&&se.visible&&h.push(y,_,se,k,le.z,j)}}else b.visible&&h.push(y,_,b,k,le.z,null)}}const p=y.children;for(let _=0,b=p.length;_<b;_++)ft(p[_],G,k,U)}function vt(y,G,k,U){const Q=y.opaque,p=y.transmissive,_=y.transparent;f.setupLightsView(k),p.length>0&&hn(Q,G,k),U&&Re.viewport(N.copy(U)),Q.length>0&&tt(Q,G,k),p.length>0&&tt(p,G,k),_.length>0&&tt(_,G,k),Re.buffers.depth.setTest(!0),Re.buffers.depth.setMask(!0),Re.buffers.color.setMask(!0),Re.setPolygonOffset(!1)}function hn(y,G,k){const U=Ue.isWebGL2;re===null&&(re=new Zn(1,1,{generateMipmaps:!0,type:be.has("EXT_color_buffer_half_float")?yn:Yn,minFilter:yi,samples:U&&r===!0?4:0})),m.getDrawingBufferSize(q),U?re.setSize(q.x,q.y):re.setSize(ms(q.x),ms(q.y));const Q=m.getRenderTarget();m.setRenderTarget(re),m.clear();const p=m.toneMapping;m.toneMapping=bn,tt(y,G,k),m.toneMapping=p,Oe.updateMultisampleRenderTarget(re),Oe.updateRenderTargetMipmap(re),m.setRenderTarget(Q)}function tt(y,G,k){const U=G.isScene===!0?G.overrideMaterial:null;for(let Q=0,p=y.length;Q<p;Q++){const _=y[Q],b=_.object,L=_.geometry,V=U===null?_.material:U,O=_.group;b.layers.test(k.layers)&&$t(b,G,k,L,V,O)}}function $t(y,G,k,U,Q,p){y.onBeforeRender(m,G,k,U,Q,p),y.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),Q.onBeforeRender(m,G,k,U,y,p),Q.transparent===!0&&Q.side===Zi?(Q.side=jt,Q.needsUpdate=!0,m.renderBufferDirect(k,G,U,Q,y,p),Q.side=qn,Q.needsUpdate=!0,m.renderBufferDirect(k,G,U,Q,y,p),Q.side=Zi):m.renderBufferDirect(k,G,U,Q,y,p),y.onAfterRender(m,G,k,U,Q,p)}function Nt(y,G,k){G.isScene!==!0&&(G=ge);const U=Ve.get(y),Q=f.state.lights,p=f.state.shadowsArray,_=Q.state.version,b=Ke.getParameters(y,Q.state,p,G,k),L=Ke.getProgramCacheKey(b);let V=U.programs;U.environment=y.isMeshStandardMaterial?G.environment:null,U.fog=G.fog,U.envMap=(y.isMeshStandardMaterial?ct:lt).get(y.envMap||U.environment),V===void 0&&(y.addEventListener("dispose",Be),V=new Map,U.programs=V);let O=V.get(L);if(O!==void 0){if(U.currentProgram===O&&U.lightsStateVersion===_)return qi(y,b),O}else b.uniforms=Ke.getUniforms(y),y.onBuild(k,b,m),y.onBeforeCompile(b,m),O=Ke.acquireProgram(b,L),V.set(L,O),U.uniforms=b.uniforms;const j=U.uniforms;(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(j.clippingPlanes=S.uniform),qi(y,b),U.needsLights=Tr(y),U.lightsStateVersion=_,U.needsLights&&(j.ambientLightColor.value=Q.state.ambient,j.lightProbe.value=Q.state.probe,j.directionalLights.value=Q.state.directional,j.directionalLightShadows.value=Q.state.directionalShadow,j.spotLights.value=Q.state.spot,j.spotLightShadows.value=Q.state.spotShadow,j.rectAreaLights.value=Q.state.rectArea,j.ltc_1.value=Q.state.rectAreaLTC1,j.ltc_2.value=Q.state.rectAreaLTC2,j.pointLights.value=Q.state.point,j.pointLightShadows.value=Q.state.pointShadow,j.hemisphereLights.value=Q.state.hemi,j.directionalShadowMap.value=Q.state.directionalShadowMap,j.directionalShadowMatrix.value=Q.state.directionalShadowMatrix,j.spotShadowMap.value=Q.state.spotShadowMap,j.spotLightMatrix.value=Q.state.spotLightMatrix,j.spotLightMap.value=Q.state.spotLightMap,j.pointShadowMap.value=Q.state.pointShadowMap,j.pointShadowMatrix.value=Q.state.pointShadowMatrix);const se=O.getUniforms(),pe=xr.seqWithValue(se.seq,j);return U.currentProgram=O,U.uniformsList=pe,O}function qi(y,G){const k=Ve.get(y);k.outputEncoding=G.outputEncoding,k.instancing=G.instancing,k.skinning=G.skinning,k.morphTargets=G.morphTargets,k.morphNormals=G.morphNormals,k.morphColors=G.morphColors,k.morphTargetsCount=G.morphTargetsCount,k.numClippingPlanes=G.numClippingPlanes,k.numIntersection=G.numClipIntersection,k.vertexAlphas=G.vertexAlphas,k.vertexTangents=G.vertexTangents,k.toneMapping=G.toneMapping}function wr(y,G,k,U,Q){G.isScene!==!0&&(G=ge),Oe.resetTextureUnits();const p=G.fog,_=U.isMeshStandardMaterial?G.environment:null,b=w===null?m.outputEncoding:w.isXRRenderTarget===!0?w.texture.encoding:wn,L=(U.isMeshStandardMaterial?ct:lt).get(U.envMap||_),V=U.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,O=!!U.normalMap&&!!k.attributes.tangent,j=!!k.morphAttributes.position,se=!!k.morphAttributes.normal,pe=!!k.morphAttributes.color,ie=U.toneMapped?m.toneMapping:bn,me=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,ve=me!==void 0?me.length:0,ue=Ve.get(U),Fe=f.state.lights;if(te===!0&&(_e===!0||y!==E)){const ke=y===E&&U.id===T;S.setState(U,y,ke)}let Pe=!1;U.version===ue.__version?(ue.needsLights&&ue.lightsStateVersion!==Fe.state.version||ue.outputEncoding!==b||Q.isInstancedMesh&&ue.instancing===!1||!Q.isInstancedMesh&&ue.instancing===!0||Q.isSkinnedMesh&&ue.skinning===!1||!Q.isSkinnedMesh&&ue.skinning===!0||ue.envMap!==L||U.fog===!0&&ue.fog!==p||ue.numClippingPlanes!==void 0&&(ue.numClippingPlanes!==S.numPlanes||ue.numIntersection!==S.numIntersection)||ue.vertexAlphas!==V||ue.vertexTangents!==O||ue.morphTargets!==j||ue.morphNormals!==se||ue.morphColors!==pe||ue.toneMapping!==ie||Ue.isWebGL2===!0&&ue.morphTargetsCount!==ve)&&(Pe=!0):(Pe=!0,ue.__version=U.version);let Ce=ue.currentProgram;Pe===!0&&(Ce=Nt(U,G,Q));let Ne=!1,He=!1,nt=!1;const Ye=Ce.getUniforms(),ut=ue.uniforms;if(Re.useProgram(Ce.program)&&(Ne=!0,He=!0,nt=!0),U.id!==T&&(T=U.id,He=!0),Ne||E!==y){if(Ye.setValue(X,"projectionMatrix",y.projectionMatrix),Ue.logarithmicDepthBuffer&&Ye.setValue(X,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),E!==y&&(E=y,He=!0,nt=!0),U.isShaderMaterial||U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshStandardMaterial||U.envMap){const ke=Ye.map.cameraPosition;ke!==void 0&&ke.setValue(X,le.setFromMatrixPosition(y.matrixWorld))}(U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshLambertMaterial||U.isMeshBasicMaterial||U.isMeshStandardMaterial||U.isShaderMaterial)&&Ye.setValue(X,"isOrthographic",y.isOrthographicCamera===!0),(U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshLambertMaterial||U.isMeshBasicMaterial||U.isMeshStandardMaterial||U.isShaderMaterial||U.isShadowMaterial||Q.isSkinnedMesh)&&Ye.setValue(X,"viewMatrix",y.matrixWorldInverse)}if(Q.isSkinnedMesh){Ye.setOptional(X,Q,"bindMatrix"),Ye.setOptional(X,Q,"bindMatrixInverse");const ke=Q.skeleton;ke&&(Ue.floatVertexTextures?(ke.boneTexture===null&&ke.computeBoneTexture(),Ye.setValue(X,"boneTexture",ke.boneTexture,Oe),Ye.setValue(X,"boneTextureSize",ke.boneTextureSize)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}const Qe=k.morphAttributes;if((Qe.position!==void 0||Qe.normal!==void 0||Qe.color!==void 0&&Ue.isWebGL2===!0)&&xe.update(Q,k,U,Ce),(He||ue.receiveShadow!==Q.receiveShadow)&&(ue.receiveShadow=Q.receiveShadow,Ye.setValue(X,"receiveShadow",Q.receiveShadow)),U.isMeshGouraudMaterial&&U.envMap!==null&&(ut.envMap.value=L,ut.flipEnvMap.value=L.isCubeTexture&&L.isRenderTargetTexture===!1?-1:1),He&&(Ye.setValue(X,"toneMappingExposure",m.toneMappingExposure),ue.needsLights&&$n(ut,nt),p&&U.fog===!0&&It.refreshFogUniforms(ut,p),It.refreshMaterialUniforms(ut,U,ne,H,re),xr.upload(X,ue.uniformsList,ut,Oe)),U.isShaderMaterial&&U.uniformsNeedUpdate===!0&&(xr.upload(X,ue.uniformsList,ut,Oe),U.uniformsNeedUpdate=!1),U.isSpriteMaterial&&Ye.setValue(X,"center",Q.center),Ye.setValue(X,"modelViewMatrix",Q.modelViewMatrix),Ye.setValue(X,"normalMatrix",Q.normalMatrix),Ye.setValue(X,"modelMatrix",Q.matrixWorld),U.isShaderMaterial||U.isRawShaderMaterial){const ke=U.uniformsGroups;for(let ot=0,Ft=ke.length;ot<Ft;ot++)if(Ue.isWebGL2){const ht=ke[ot];Te.update(ht,Ce),Te.bind(ht,Ce)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Ce}function $n(y,G){y.ambientLightColor.needsUpdate=G,y.lightProbe.needsUpdate=G,y.directionalLights.needsUpdate=G,y.directionalLightShadows.needsUpdate=G,y.pointLights.needsUpdate=G,y.pointLightShadows.needsUpdate=G,y.spotLights.needsUpdate=G,y.spotLightShadows.needsUpdate=G,y.rectAreaLights.needsUpdate=G,y.hemisphereLights.needsUpdate=G}function Tr(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return M},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(y,G,k){Ve.get(y.texture).__webglTexture=G,Ve.get(y.depthTexture).__webglTexture=k;const U=Ve.get(y);U.__hasExternalTextures=!0,U.__hasExternalTextures&&(U.__autoAllocateDepthBuffer=k===void 0,U.__autoAllocateDepthBuffer||be.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),U.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(y,G){const k=Ve.get(y);k.__webglFramebuffer=G,k.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(y,G=0,k=0){w=y,M=G,C=k;let U=!0,Q=null,p=!1,_=!1;if(y){const L=Ve.get(y);L.__useDefaultFramebuffer!==void 0?(Re.bindFramebuffer(36160,null),U=!1):L.__webglFramebuffer===void 0?Oe.setupRenderTarget(y):L.__hasExternalTextures&&Oe.rebindTextures(y,Ve.get(y.texture).__webglTexture,Ve.get(y.depthTexture).__webglTexture);const V=y.texture;(V.isData3DTexture||V.isDataArrayTexture||V.isCompressedArrayTexture)&&(_=!0);const O=Ve.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Q=O[G],p=!0):Ue.isWebGL2&&y.samples>0&&Oe.useMultisampledRTT(y)===!1?Q=Ve.get(y).__webglMultisampledFramebuffer:Q=O,N.copy(y.viewport),B.copy(y.scissor),x=y.scissorTest}else N.copy(F).multiplyScalar(ne).floor(),B.copy(ee).multiplyScalar(ne).floor(),x=oe;if(Re.bindFramebuffer(36160,Q)&&Ue.drawBuffers&&U&&Re.drawBuffers(y,Q),Re.viewport(N),Re.scissor(B),Re.setScissorTest(x),p){const L=Ve.get(y.texture);X.framebufferTexture2D(36160,36064,34069+G,L.__webglTexture,k)}else if(_){const L=Ve.get(y.texture),V=G||0;X.framebufferTextureLayer(36160,36064,L.__webglTexture,k||0,V)}T=-1},this.readRenderTargetPixels=function(y,G,k,U,Q,p,_){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let b=Ve.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&_!==void 0&&(b=b[_]),b){Re.bindFramebuffer(36160,b);try{const L=y.texture,V=L.format,O=L.type;if(V!==Ht&&K.convert(V)!==X.getParameter(35739)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const j=O===yn&&(be.has("EXT_color_buffer_half_float")||Ue.isWebGL2&&be.has("EXT_color_buffer_float"));if(O!==Yn&&K.convert(O)!==X.getParameter(35738)&&!(O===rn&&(Ue.isWebGL2||be.has("OES_texture_float")||be.has("WEBGL_color_buffer_float")))&&!j){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=y.width-U&&k>=0&&k<=y.height-Q&&X.readPixels(G,k,U,Q,K.convert(V),K.convert(O),p)}finally{const L=w!==null?Ve.get(w).__webglFramebuffer:null;Re.bindFramebuffer(36160,L)}}},this.copyFramebufferToTexture=function(y,G,k=0){const U=Math.pow(2,-k),Q=Math.floor(G.image.width*U),p=Math.floor(G.image.height*U);Oe.setTexture2D(G,0),X.copyTexSubImage2D(3553,k,0,0,y.x,y.y,Q,p),Re.unbindTexture()},this.copyTextureToTexture=function(y,G,k,U=0){const Q=G.image.width,p=G.image.height,_=K.convert(k.format),b=K.convert(k.type);Oe.setTexture2D(k,0),X.pixelStorei(37440,k.flipY),X.pixelStorei(37441,k.premultiplyAlpha),X.pixelStorei(3317,k.unpackAlignment),G.isDataTexture?X.texSubImage2D(3553,U,y.x,y.y,Q,p,_,b,G.image.data):G.isCompressedTexture?X.compressedTexSubImage2D(3553,U,y.x,y.y,G.mipmaps[0].width,G.mipmaps[0].height,_,G.mipmaps[0].data):X.texSubImage2D(3553,U,y.x,y.y,_,b,G.image),U===0&&k.generateMipmaps&&X.generateMipmap(3553),Re.unbindTexture()},this.copyTextureToTexture3D=function(y,G,k,U,Q=0){if(m.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const p=y.max.x-y.min.x+1,_=y.max.y-y.min.y+1,b=y.max.z-y.min.z+1,L=K.convert(U.format),V=K.convert(U.type);let O;if(U.isData3DTexture)Oe.setTexture3D(U,0),O=32879;else if(U.isDataArrayTexture)Oe.setTexture2DArray(U,0),O=35866;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}X.pixelStorei(37440,U.flipY),X.pixelStorei(37441,U.premultiplyAlpha),X.pixelStorei(3317,U.unpackAlignment);const j=X.getParameter(3314),se=X.getParameter(32878),pe=X.getParameter(3316),ie=X.getParameter(3315),me=X.getParameter(32877),ve=k.isCompressedTexture?k.mipmaps[0]:k.image;X.pixelStorei(3314,ve.width),X.pixelStorei(32878,ve.height),X.pixelStorei(3316,y.min.x),X.pixelStorei(3315,y.min.y),X.pixelStorei(32877,y.min.z),k.isDataTexture||k.isData3DTexture?X.texSubImage3D(O,Q,G.x,G.y,G.z,p,_,b,L,V,ve.data):k.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),X.compressedTexSubImage3D(O,Q,G.x,G.y,G.z,p,_,b,L,ve.data)):X.texSubImage3D(O,Q,G.x,G.y,G.z,p,_,b,L,V,ve),X.pixelStorei(3314,j),X.pixelStorei(32878,se),X.pixelStorei(3316,pe),X.pixelStorei(3315,ie),X.pixelStorei(32877,me),Q===0&&U.generateMipmaps&&X.generateMipmap(O),Re.unbindTexture()},this.initTexture=function(y){y.isCubeTexture?Oe.setTextureCube(y,0):y.isData3DTexture?Oe.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?Oe.setTexture2DArray(y,0):Oe.setTexture2D(y,0),Re.unbindTexture()},this.resetState=function(){M=0,C=0,w=null,Re.reset(),Y.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}class Df extends yo{}Df.prototype.isWebGL1Renderer=!0;class If extends Dt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.backgroundIntensity=this.backgroundIntensity),t}get autoUpdate(){return console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate}set autoUpdate(e){console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate=e}}class bo extends Ut{constructor(e=null,t=1,n=1,i,r,o,a,c,l=yt,u=yt,h,f){super(null,o,a,c,l,u,i,r,h,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Un extends Wt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Ia={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};class Nf{constructor(e,t,n){const i=this;let r=!1,o=0,a=0,c;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(u){a++,r===!1&&i.onStart!==void 0&&i.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,i.onProgress!==void 0&&i.onProgress(u,o,a),o===a&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){const h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,f=l.length;h<f;h+=2){const g=l[h],v=l[h+1];if(g.global&&(g.lastIndex=0),g.test(u))return v}return null}}}const Ff=new Nf;let wo=class{constructor(e){this.manager=e!==void 0?e:Ff,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};const xn={};class Of extends Error{constructor(e,t){super(e),this.response=t}}class Uf extends wo{constructor(e){super(e)}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=Ia.get(e);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(xn[e]!==void 0){xn[e].push({onLoad:t,onProgress:n,onError:i});return}xn[e]=[],xn[e].push({onLoad:t,onProgress:n,onError:i});const o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const u=xn[e],h=l.body.getReader(),f=l.headers.get("Content-Length")||l.headers.get("X-File-Size"),g=f?parseInt(f):0,v=g!==0;let m=0;const d=new ReadableStream({start(M){C();function C(){h.read().then(({done:w,value:T})=>{if(w)M.close();else{m+=T.byteLength;const E=new ProgressEvent("progress",{lengthComputable:v,loaded:m,total:g});for(let N=0,B=u.length;N<B;N++){const x=u[N];x.onProgress&&x.onProgress(E)}M.enqueue(T),C()}})}}});return new Response(d)}else throw new Of(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return l.json();default:if(a===void 0)return l.text();{const h=/charset="?([^;"\s]*)"?/i.exec(a),f=h&&h[1]?h[1].toLowerCase():void 0,g=new TextDecoder(f);return l.arrayBuffer().then(v=>g.decode(v))}}}).then(l=>{Ia.add(e,l);const u=xn[e];delete xn[e];for(let h=0,f=u.length;h<f;h++){const g=u[h];g.onLoad&&g.onLoad(l)}}).catch(l=>{const u=xn[e];if(u===void 0)throw this.manager.itemError(e),l;delete xn[e];for(let h=0,f=u.length;h<f;h++){const g=u[h];g.onError&&g.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class zf extends wo{constructor(e){super(e)}load(e,t,n,i){const r=this,o=new bo,a=new Uf(this.manager);return a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setPath(this.path),a.setWithCredentials(r.withCredentials),a.load(e,function(c){const l=r.parse(c);l&&(l.image!==void 0?o.image=l.image:l.data!==void 0&&(o.image.width=l.width,o.image.height=l.height,o.image.data=l.data),o.wrapS=l.wrapS!==void 0?l.wrapS:Gt,o.wrapT=l.wrapT!==void 0?l.wrapT:Gt,o.magFilter=l.magFilter!==void 0?l.magFilter:bt,o.minFilter=l.minFilter!==void 0?l.minFilter:bt,o.anisotropy=l.anisotropy!==void 0?l.anisotropy:1,l.encoding!==void 0&&(o.encoding=l.encoding),l.flipY!==void 0&&(o.flipY=l.flipY),l.format!==void 0&&(o.format=l.format),l.type!==void 0&&(o.type=l.type),l.mipmaps!==void 0&&(o.mipmaps=l.mipmaps,o.minFilter=yi),l.mipmapCount===1&&(o.minFilter=bt),l.generateMipmaps!==void 0&&(o.generateMipmaps=l.generateMipmaps),o.needsUpdate=!0,t&&t(o,l))},n,i),o}}class Bf extends Tn{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}class Na{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Pt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Mn=kf();function kf(){const s=new ArrayBuffer(4),e=new Float32Array(s),t=new Uint32Array(s),n=new Uint32Array(512),i=new Uint32Array(512);for(let c=0;c<256;++c){const l=c-127;l<-27?(n[c]=0,n[c|256]=32768,i[c]=24,i[c|256]=24):l<-14?(n[c]=1024>>-l-14,n[c|256]=1024>>-l-14|32768,i[c]=-l-1,i[c|256]=-l-1):l<=15?(n[c]=l+15<<10,n[c|256]=l+15<<10|32768,i[c]=13,i[c|256]=13):l<128?(n[c]=31744,n[c|256]=64512,i[c]=24,i[c|256]=24):(n[c]=31744,n[c|256]=64512,i[c]=13,i[c|256]=13)}const r=new Uint32Array(2048),o=new Uint32Array(64),a=new Uint32Array(64);for(let c=1;c<1024;++c){let l=c<<13,u=0;for(;!(l&8388608);)l<<=1,u-=8388608;l&=-8388609,u+=947912704,r[c]=l|u}for(let c=1024;c<2048;++c)r[c]=939524096+(c-1024<<13);for(let c=1;c<31;++c)o[c]=c<<23;o[31]=1199570944,o[32]=2147483648;for(let c=33;c<63;++c)o[c]=2147483648+(c-32<<23);o[63]=3347054592;for(let c=1;c<64;++c)c!==32&&(a[c]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:i,mantissaTable:r,exponentTable:o,offsetTable:a}}function Gf(s){Math.abs(s)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),s=Pt(s,-65504,65504),Mn.floatView[0]=s;const e=Mn.uint32View[0],t=e>>23&511;return Mn.baseTable[t]+((e&8388607)>>Mn.shiftTable[t])}function Hf(s){const e=s>>10;return Mn.uint32View[0]=Mn.mantissaTable[Mn.offsetTable[e]+(s&1023)]+Mn.exponentTable[e],Mn.floatView[0]}var Fa=Object.freeze({__proto__:null,toHalfFloat:Gf,fromHalfFloat:Hf});typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:vs}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=vs);const Ze={NOT_STARTED:"not-started",STARTED:"started",FREE:"free",RESULT:"result",RESULT_ANIMATION:"result_animation",RESTART_ANIMATION:"restart_animation",RESTART:"restart"},mr=[Ze.NOT_STARTED,Ze.STARTED,Ze.FREE,Ze.RESULT,Ze.RESULT_ANIMATION,Ze.RESTART_ANIMATION,Ze.RESTART],vn={NONE:"none",PAUSE:"pause",COMPLETED:"completed",FAILED:"failed"};class Vf{constructor(){J(this,"time",0);J(this,"deltaTime",0);J(this,"width",0);J(this,"height",0);J(this,"viewportWidth",0);J(this,"viewportHeight",0);J(this,"renderer",null);J(this,"scene",null);J(this,"camera",null);J(this,"orbitControls",null);J(this,"orbitCamera",null);J(this,"postprocessing",null);J(this,"resolution",new We);J(this,"viewportResolution",new We);J(this,"bgColor",new je("#d0d0d0"));J(this,"debugAlpha",!1);J(this,"skipProfileUpdate",!1);J(this,"canvas",null);J(this,"sharedUniforms",{u_time:{value:0},u_deltaTime:{value:1},u_resolution:{value:this.resolution},u_viewportResolution:{value:this.viewportResolution},u_bgColor:{value:this.bgColor}});J(this,"loadList",[]);J(this,"animationSpeed",1);J(this,"startColor","#1E90FF");J(this,"endColor","#30ff2A");J(this,"errorColor","#FF006A");J(this,"defaultColor","#FFF5Ea");J(this,"freeAnimationSpeed",1);J(this,"resultAnimationSpeed",4);J(this,"stateSignal",new Ai);J(this,"resultSignal",new Ai);J(this,"endCycleSignal",new Ai);J(this,"spawnSignal",new Ai);J(this,"gameEndedSignal",new Ai);J(this,"state",Ze.NOT_STARTED);J(this,"pendingState",null);J(this,"result",vn.NONE);J(this,"activeBlocksCount",0);J(this,"maxFreeSpawn",Mt.FREE_BLOCKS_COUNT);J(this,"hasStarted",!1);J(this,"hasNotStarted",!1);J(this,"isFree",!1);J(this,"isResult",!1);J(this,"isResultAnimation",!1);J(this,"isRestartAnimation",!1);J(this,"isRestart",!1);J(this,"isSuccessResult",!1);J(this,"isFailResult",!1);const e=document.getElementById("current-state"),t=document.getElementById("pending-state"),n=()=>{e.innerText=this?.state||{},(this.state===Ze.RESULT||this.pendingState===Ze.RESULT_ANIMATION)&&(e.innerText+=` (${this.result})`),t.innerText=this.pendingState,(this.pendingState===Ze.RESULT||this.pendingState===Ze.RESULT_ANIMATION)&&(t.innerText+=` (${this.result})`)},i=()=>{this.hasStarted=this.state===Ze.STARTED,this.hasNotStarted=this.state===Ze.NOT_STARTED,this.isFree=this.state===Ze.FREE,this.isResult=this.state===Ze.RESULT,this.isResultAnimation=this.state===Ze.RESULT_ANIMATION,this.isRestartAnimation=this.state===Ze.RESTART_ANIMATION,this.isRestart=this.state===Ze.RESTART,this.isSuccessResult=(this.isResult||this.isResultAnimation)&&this.result===vn.COMPLETED,this.isFailResult=(this.isResult||this.isResultAnimation)&&this.result===vn.FAILED,this.isPaused=(this.isResult||this.isResultAnimation)&&this.result===vn.PAUSE};i(),n(),this.endCycleSignal.add(()=>{this.pendingState===Ze.RESULT&&this.result===vn.FAILED&&this.activeBlocksCount<this.maxFreeSpawn||(this.hasStarted&&this.stateSignal.dispatch(Ze.FREE),this.isResult&&(this.result===vn.FAILED||this.result===vn.PAUSE)&&this.stateSignal.dispatch(Ze.RESULT_ANIMATION),this.isRestart&&this.stateSignal.dispatch(Ze.NOT_STARTED),this.pendingState&&(this.state=this.pendingState,this.pendingState=null,n()),i())}),this.stateSignal.add(r=>{const o=mr.indexOf(this.state),a=mr.indexOf(r);o+1!==a&&r!==Ze.NOT_STARTED||(r===Ze.STARTED?(this.state=r,i()):r===Ze.NOT_STARTED?(this.state=r,this.pendingState=null,this.result=vn.NONE,i()):r===Ze.RESTART?(this.state=r,i()):this.pendingState=r,n())}),this.resultSignal.add(r=>{const o=mr.indexOf(this.state),a=mr.indexOf(Ze.RESULT);o+1===a&&(this.pendingState=Ze.RESULT,this.result=r,n())})}handleStatusChange(){}}const ce=new Vf;/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.6.9
*/var Oa=function(s){return URL.createObjectURL(new Blob([s],{type:"text/javascript"}))};try{URL.revokeObjectURL(Oa(""))}catch{Oa=function(e){return"data:application/javascript;charset=UTF-8,"+encodeURI(e)}}var Zt=Uint8Array,Dn=Uint16Array,_s=Uint32Array,To=new Zt([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Eo=new Zt([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Wf=new Zt([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ao=function(s,e){for(var t=new Dn(31),n=0;n<31;++n)t[n]=e+=1<<s[n-1];for(var i=new _s(t[30]),n=1;n<30;++n)for(var r=t[n];r<t[n+1];++r)i[r]=r-t[n]<<5|n;return[t,i]},Co=Ao(To,2),Ro=Co[0],Xf=Co[1];Ro[28]=258,Xf[258]=28;var qf=Ao(Eo,0),Yf=qf[0],xs=new Dn(32768);for(var st=0;st<32768;++st){var Ln=(st&43690)>>>1|(st&21845)<<1;Ln=(Ln&52428)>>>2|(Ln&13107)<<2,Ln=(Ln&61680)>>>4|(Ln&3855)<<4,xs[st]=((Ln&65280)>>>8|(Ln&255)<<8)>>>1}var zi=function(s,e,t){for(var n=s.length,i=0,r=new Dn(e);i<n;++i)++r[s[i]-1];var o=new Dn(e);for(i=0;i<e;++i)o[i]=o[i-1]+r[i-1]<<1;var a;if(t){a=new Dn(1<<e);var c=15-e;for(i=0;i<n;++i)if(s[i])for(var l=i<<4|s[i],u=e-s[i],h=o[s[i]-1]++<<u,f=h|(1<<u)-1;h<=f;++h)a[xs[h]>>>c]=l}else for(a=new Dn(n),i=0;i<n;++i)s[i]&&(a[i]=xs[o[s[i]-1]++]>>>15-s[i]);return a},Xi=new Zt(288);for(var st=0;st<144;++st)Xi[st]=8;for(var st=144;st<256;++st)Xi[st]=9;for(var st=256;st<280;++st)Xi[st]=7;for(var st=280;st<288;++st)Xi[st]=8;var Lo=new Zt(32);for(var st=0;st<32;++st)Lo[st]=5;var Zf=zi(Xi,9,1),jf=zi(Lo,5,1),rs=function(s){for(var e=s[0],t=1;t<s.length;++t)s[t]>e&&(e=s[t]);return e},en=function(s,e,t){var n=e/8|0;return(s[n]|s[n+1]<<8)>>(e&7)&t},ss=function(s,e){var t=e/8|0;return(s[t]|s[t+1]<<8|s[t+2]<<16)>>(e&7)},$f=function(s){return(s/8|0)+(s&7&&1)},Kf=function(s,e,t){(t==null||t>s.length)&&(t=s.length);var n=new(s instanceof Dn?Dn:s instanceof _s?_s:Zt)(t-e);return n.set(s.subarray(e,t)),n},Jf=function(s,e,t){var n=s.length;if(!n||t&&!t.l&&n<5)return e||new Zt(0);var i=!e||t,r=!t||t.i;t||(t={}),e||(e=new Zt(n*3));var o=function(X){var Ge=e.length;if(X>Ge){var be=new Zt(Math.max(Ge*2,X));be.set(e),e=be}},a=t.f||0,c=t.p||0,l=t.b||0,u=t.l,h=t.d,f=t.m,g=t.n,v=n*8;do{if(!u){t.f=a=en(s,c,1);var m=en(s,c+1,3);if(c+=3,m)if(m==1)u=Zf,h=jf,f=9,g=5;else if(m==2){var w=en(s,c,31)+257,T=en(s,c+10,15)+4,E=w+en(s,c+5,31)+1;c+=14;for(var N=new Zt(E),B=new Zt(19),x=0;x<T;++x)B[Wf[x]]=en(s,c+x*3,7);c+=T*3;for(var R=rs(B),H=(1<<R)-1,ne=zi(B,R,1),x=0;x<E;){var ae=ne[en(s,c,H)];c+=ae&15;var d=ae>>>4;if(d<16)N[x++]=d;else{var z=0,F=0;for(d==16?(F=3+en(s,c,3),c+=2,z=N[x-1]):d==17?(F=3+en(s,c,7),c+=3):d==18&&(F=11+en(s,c,127),c+=7);F--;)N[x++]=z}}var ee=N.subarray(0,w),oe=N.subarray(w);f=rs(ee),g=rs(oe),u=zi(ee,f,1),h=zi(oe,g,1)}else throw"invalid block type";else{var d=$f(c)+4,M=s[d-4]|s[d-3]<<8,C=d+M;if(C>n){if(r)throw"unexpected EOF";break}i&&o(l+M),e.set(s.subarray(d,C),l),t.b=l+=M,t.p=c=C*8;continue}if(c>v){if(r)throw"unexpected EOF";break}}i&&o(l+131072);for(var he=(1<<f)-1,te=(1<<g)-1,_e=c;;_e=c){var z=u[ss(s,c)&he],re=z>>>4;if(c+=z&15,c>v){if(r)throw"unexpected EOF";break}if(!z)throw"invalid length/literal";if(re<256)e[l++]=re;else if(re==256){_e=c,u=null;break}else{var Z=re-254;if(re>264){var x=re-257,q=To[x];Z=en(s,c,(1<<q)-1)+Ro[x],c+=q}var le=h[ss(s,c)&te],ge=le>>>4;if(!le)throw"invalid distance";c+=le&15;var oe=Yf[ge];if(ge>3){var q=Eo[ge];oe+=ss(s,c)&(1<<q)-1,c+=q}if(c>v){if(r)throw"unexpected EOF";break}i&&o(l+131072);for(var Se=l+Z;l<Se;l+=4)e[l]=e[l-oe],e[l+1]=e[l+1-oe],e[l+2]=e[l+2-oe],e[l+3]=e[l+3-oe];l=Se}}t.l=u,t.p=_e,t.b=l,u&&(a=1,t.m=f,t.d=h,t.n=g)}while(!a);return l==e.length?e:Kf(e,0,l)},Qf=new Zt(0),ep=function(s){if((s[0]&15)!=8||s[0]>>>4>7||(s[0]<<8|s[1])%31)throw"invalid zlib data";if(s[1]&32)throw"invalid zlib data: preset dictionaries not supported"};function gr(s,e){return Jf((ep(s),s.subarray(2,-4)),e)}var tp=typeof TextDecoder<"u"&&new TextDecoder,np=0;try{tp.decode(Qf,{stream:!0}),np=1}catch{}class ip extends zf{constructor(e){super(e),this.type=yn}parse(e){const R=Math.pow(2.7182818,2.2);function H(p,_){let b=0;for(let V=0;V<65536;++V)(V==0||p[V>>3]&1<<(V&7))&&(_[b++]=V);const L=b-1;for(;b<65536;)_[b++]=0;return L}function ne(p){for(let _=0;_<16384;_++)p[_]={},p[_].len=0,p[_].lit=0,p[_].p=null}const ae={l:0,c:0,lc:0};function z(p,_,b,L,V){for(;b<p;)_=_<<8|De(L,V),b+=8;b-=p,ae.l=_>>b&(1<<p)-1,ae.c=_,ae.lc=b}const F=new Array(59);function ee(p){for(let b=0;b<=58;++b)F[b]=0;for(let b=0;b<65537;++b)F[p[b]]+=1;let _=0;for(let b=58;b>0;--b){const L=_+F[b]>>1;F[b]=_,_=L}for(let b=0;b<65537;++b){const L=p[b];L>0&&(p[b]=L|F[L]++<<6)}}function oe(p,_,b,L,V,O){const j=_;let se=0,pe=0;for(;L<=V;L++){if(j.value-_.value>b)return!1;z(6,se,pe,p,j);const ie=ae.l;if(se=ae.c,pe=ae.lc,O[L]=ie,ie==63){if(j.value-_.value>b)throw new Error("Something wrong with hufUnpackEncTable");z(8,se,pe,p,j);let me=ae.l+6;if(se=ae.c,pe=ae.lc,L+me>V+1)throw new Error("Something wrong with hufUnpackEncTable");for(;me--;)O[L++]=0;L--}else if(ie>=59){let me=ie-59+2;if(L+me>V+1)throw new Error("Something wrong with hufUnpackEncTable");for(;me--;)O[L++]=0;L--}}ee(O)}function he(p){return p&63}function te(p){return p>>6}function _e(p,_,b,L){for(;_<=b;_++){const V=te(p[_]),O=he(p[_]);if(V>>O)throw new Error("Invalid table entry");if(O>14){const j=L[V>>O-14];if(j.len)throw new Error("Invalid table entry");if(j.lit++,j.p){const se=j.p;j.p=new Array(j.lit);for(let pe=0;pe<j.lit-1;++pe)j.p[pe]=se[pe]}else j.p=new Array(1);j.p[j.lit-1]=_}else if(O){let j=0;for(let se=1<<14-O;se>0;se--){const pe=L[(V<<14-O)+j];if(pe.len||pe.p)throw new Error("Invalid table entry");pe.len=O,pe.lit=_,j++}}}return!0}const re={c:0,lc:0};function Z(p,_,b,L){p=p<<8|De(b,L),_+=8,re.c=p,re.lc=_}const q={c:0,lc:0};function le(p,_,b,L,V,O,j,se,pe){if(p==_){L<8&&(Z(b,L,V,O),b=re.c,L=re.lc),L-=8;let ie=b>>L;if(ie=new Uint8Array([ie])[0],se.value+ie>pe)return!1;const me=j[se.value-1];for(;ie-- >0;)j[se.value++]=me}else if(se.value<pe)j[se.value++]=p;else return!1;q.c=b,q.lc=L}function ge(p){return p&65535}function Se(p){const _=ge(p);return _>32767?_-65536:_}const X={a:0,b:0};function Ge(p,_){const b=Se(p),V=Se(_),O=b+(V&1)+(V>>1),j=O,se=O-V;X.a=j,X.b=se}function be(p,_){const b=ge(p),L=ge(_),V=b-(L>>1)&65535,O=L+V-32768&65535;X.a=O,X.b=V}function Ue(p,_,b,L,V,O,j){const se=j<16384,pe=b>V?V:b;let ie=1,me,ve;for(;ie<=pe;)ie<<=1;for(ie>>=1,me=ie,ie>>=1;ie>=1;){ve=0;const ue=ve+O*(V-me),Fe=O*ie,Pe=O*me,Ce=L*ie,Ne=L*me;let He,nt,Ye,ut;for(;ve<=ue;ve+=Pe){let Qe=ve;const ke=ve+L*(b-me);for(;Qe<=ke;Qe+=Ne){const ot=Qe+Ce,Ft=Qe+Fe,ht=Ft+Ce;se?(Ge(p[Qe+_],p[Ft+_]),He=X.a,Ye=X.b,Ge(p[ot+_],p[ht+_]),nt=X.a,ut=X.b,Ge(He,nt),p[Qe+_]=X.a,p[ot+_]=X.b,Ge(Ye,ut),p[Ft+_]=X.a,p[ht+_]=X.b):(be(p[Qe+_],p[Ft+_]),He=X.a,Ye=X.b,be(p[ot+_],p[ht+_]),nt=X.a,ut=X.b,be(He,nt),p[Qe+_]=X.a,p[ot+_]=X.b,be(Ye,ut),p[Ft+_]=X.a,p[ht+_]=X.b)}if(b&ie){const ot=Qe+Fe;se?Ge(p[Qe+_],p[ot+_]):be(p[Qe+_],p[ot+_]),He=X.a,p[ot+_]=X.b,p[Qe+_]=He}}if(V&ie){let Qe=ve;const ke=ve+L*(b-me);for(;Qe<=ke;Qe+=Ne){const ot=Qe+Ce;se?Ge(p[Qe+_],p[ot+_]):be(p[Qe+_],p[ot+_]),He=X.a,p[ot+_]=X.b,p[Qe+_]=He}}me=ie,ie>>=1}return ve}function Re(p,_,b,L,V,O,j,se,pe){let ie=0,me=0;const ve=j,ue=Math.trunc(L.value+(V+7)/8);for(;L.value<ue;)for(Z(ie,me,b,L),ie=re.c,me=re.lc;me>=14;){const Pe=ie>>me-14&16383,Ce=_[Pe];if(Ce.len)me-=Ce.len,le(Ce.lit,O,ie,me,b,L,se,pe,ve),ie=q.c,me=q.lc;else{if(!Ce.p)throw new Error("hufDecode issues");let Ne;for(Ne=0;Ne<Ce.lit;Ne++){const He=he(p[Ce.p[Ne]]);for(;me<He&&L.value<ue;)Z(ie,me,b,L),ie=re.c,me=re.lc;if(me>=He&&te(p[Ce.p[Ne]])==(ie>>me-He&(1<<He)-1)){me-=He,le(Ce.p[Ne],O,ie,me,b,L,se,pe,ve),ie=q.c,me=q.lc;break}}if(Ne==Ce.lit)throw new Error("hufDecode issues")}}const Fe=8-V&7;for(ie>>=Fe,me-=Fe;me>0;){const Pe=_[ie<<14-me&16383];if(Pe.len)me-=Pe.len,le(Pe.lit,O,ie,me,b,L,se,pe,ve),ie=q.c,me=q.lc;else throw new Error("hufDecode issues")}return!0}function $e(p,_,b,L,V,O){const j={value:0},se=b.value,pe=Ee(_,b),ie=Ee(_,b);b.value+=4;const me=Ee(_,b);if(b.value+=4,pe<0||pe>=65537||ie<0||ie>=65537)throw new Error("Something wrong with HUF_ENCSIZE");const ve=new Array(65537),ue=new Array(16384);ne(ue);const Fe=L-(b.value-se);if(oe(p,b,Fe,pe,ie,ve),me>8*(L-(b.value-se)))throw new Error("Something wrong with hufUncompress");_e(ve,pe,ie,ue),Re(ve,ue,p,b,me,ie,O,V,j)}function Ve(p,_,b){for(let L=0;L<b;++L)_[L]=p[_[L]]}function Oe(p){for(let _=1;_<p.length;_++){const b=p[_-1]+p[_]-128;p[_]=b}}function lt(p,_){let b=0,L=Math.floor((p.length+1)/2),V=0;const O=p.length-1;for(;!(V>O||(_[V++]=p[b++],V>O));)_[V++]=p[L++]}function ct(p){let _=p.byteLength;const b=new Array;let L=0;const V=new DataView(p);for(;_>0;){const O=V.getInt8(L++);if(O<0){const j=-O;_-=j+1;for(let se=0;se<j;se++)b.push(V.getUint8(L++))}else{const j=O;_-=2;const se=V.getUint8(L++);for(let pe=0;pe<j+1;pe++)b.push(se)}}return b}function dt(p,_,b,L,V,O){let j=new DataView(O.buffer);const se=b[p.idx[0]].width,pe=b[p.idx[0]].height,ie=3,me=Math.floor(se/8),ve=Math.ceil(se/8),ue=Math.ceil(pe/8),Fe=se-(ve-1)*8,Pe=pe-(ue-1)*8,Ce={value:0},Ne=new Array(ie),He=new Array(ie),nt=new Array(ie),Ye=new Array(ie),ut=new Array(ie);for(let ke=0;ke<ie;++ke)ut[ke]=_[p.idx[ke]],Ne[ke]=ke<1?0:Ne[ke-1]+ve*ue,He[ke]=new Float32Array(64),nt[ke]=new Uint16Array(64),Ye[ke]=new Uint16Array(ve*64);for(let ke=0;ke<ue;++ke){let ot=8;ke==ue-1&&(ot=Pe);let Ft=8;for(let et=0;et<ve;++et){et==ve-1&&(Ft=Fe);for(let it=0;it<ie;++it)nt[it].fill(0),nt[it][0]=V[Ne[it]++],Tt(Ce,L,nt[it]),at(nt[it],He[it]),Ke(He[it]);It(He);for(let it=0;it<ie;++it)At(He[it],Ye[it],et*64)}let ht=0;for(let et=0;et<ie;++et){const it=b[p.idx[et]].type;for(let dn=8*ke;dn<8*ke+ot;++dn){ht=ut[et][dn];for(let Ei=0;Ei<me;++Ei){const on=Ei*64+(dn&7)*8;j.setUint16(ht+0*2*it,Ye[et][on+0],!0),j.setUint16(ht+1*2*it,Ye[et][on+1],!0),j.setUint16(ht+2*2*it,Ye[et][on+2],!0),j.setUint16(ht+3*2*it,Ye[et][on+3],!0),j.setUint16(ht+4*2*it,Ye[et][on+4],!0),j.setUint16(ht+5*2*it,Ye[et][on+5],!0),j.setUint16(ht+6*2*it,Ye[et][on+6],!0),j.setUint16(ht+7*2*it,Ye[et][on+7],!0),ht+=8*2*it}}if(me!=ve)for(let dn=8*ke;dn<8*ke+ot;++dn){const Ei=ut[et][dn]+8*me*2*it,on=me*64+(dn&7)*8;for(let Yi=0;Yi<Ft;++Yi)j.setUint16(Ei+Yi*2*it,Ye[et][on+Yi],!0)}}}const Qe=new Uint16Array(se);j=new DataView(O.buffer);for(let ke=0;ke<ie;++ke){b[p.idx[ke]].decoded=!0;const ot=b[p.idx[ke]].type;if(b[ke].type==2)for(let Ft=0;Ft<pe;++Ft){const ht=ut[ke][Ft];for(let et=0;et<se;++et)Qe[et]=j.getUint16(ht+et*2*ot,!0);for(let et=0;et<se;++et)j.setFloat32(ht+et*2*ot,D(Qe[et]),!0)}}}function Tt(p,_,b){let L,V=1;for(;V<64;)L=_[p.value],L==65280?V=64:L>>8==255?V+=L&255:(b[V]=L,V++),p.value++}function at(p,_){_[0]=D(p[0]),_[1]=D(p[1]),_[2]=D(p[5]),_[3]=D(p[6]),_[4]=D(p[14]),_[5]=D(p[15]),_[6]=D(p[27]),_[7]=D(p[28]),_[8]=D(p[2]),_[9]=D(p[4]),_[10]=D(p[7]),_[11]=D(p[13]),_[12]=D(p[16]),_[13]=D(p[26]),_[14]=D(p[29]),_[15]=D(p[42]),_[16]=D(p[3]),_[17]=D(p[8]),_[18]=D(p[12]),_[19]=D(p[17]),_[20]=D(p[25]),_[21]=D(p[30]),_[22]=D(p[41]),_[23]=D(p[43]),_[24]=D(p[9]),_[25]=D(p[11]),_[26]=D(p[18]),_[27]=D(p[24]),_[28]=D(p[31]),_[29]=D(p[40]),_[30]=D(p[44]),_[31]=D(p[53]),_[32]=D(p[10]),_[33]=D(p[19]),_[34]=D(p[23]),_[35]=D(p[32]),_[36]=D(p[39]),_[37]=D(p[45]),_[38]=D(p[52]),_[39]=D(p[54]),_[40]=D(p[20]),_[41]=D(p[22]),_[42]=D(p[33]),_[43]=D(p[38]),_[44]=D(p[46]),_[45]=D(p[51]),_[46]=D(p[55]),_[47]=D(p[60]),_[48]=D(p[21]),_[49]=D(p[34]),_[50]=D(p[37]),_[51]=D(p[47]),_[52]=D(p[50]),_[53]=D(p[56]),_[54]=D(p[59]),_[55]=D(p[61]),_[56]=D(p[35]),_[57]=D(p[36]),_[58]=D(p[48]),_[59]=D(p[49]),_[60]=D(p[57]),_[61]=D(p[58]),_[62]=D(p[62]),_[63]=D(p[63])}function Ke(p){const _=.5*Math.cos(.7853975),b=.5*Math.cos(3.14159/16),L=.5*Math.cos(3.14159/8),V=.5*Math.cos(3*3.14159/16),O=.5*Math.cos(5*3.14159/16),j=.5*Math.cos(3*3.14159/8),se=.5*Math.cos(7*3.14159/16),pe=new Array(4),ie=new Array(4),me=new Array(4),ve=new Array(4);for(let ue=0;ue<8;++ue){const Fe=ue*8;pe[0]=L*p[Fe+2],pe[1]=j*p[Fe+2],pe[2]=L*p[Fe+6],pe[3]=j*p[Fe+6],ie[0]=b*p[Fe+1]+V*p[Fe+3]+O*p[Fe+5]+se*p[Fe+7],ie[1]=V*p[Fe+1]-se*p[Fe+3]-b*p[Fe+5]-O*p[Fe+7],ie[2]=O*p[Fe+1]-b*p[Fe+3]+se*p[Fe+5]+V*p[Fe+7],ie[3]=se*p[Fe+1]-O*p[Fe+3]+V*p[Fe+5]-b*p[Fe+7],me[0]=_*(p[Fe+0]+p[Fe+4]),me[3]=_*(p[Fe+0]-p[Fe+4]),me[1]=pe[0]+pe[3],me[2]=pe[1]-pe[2],ve[0]=me[0]+me[1],ve[1]=me[3]+me[2],ve[2]=me[3]-me[2],ve[3]=me[0]-me[1],p[Fe+0]=ve[0]+ie[0],p[Fe+1]=ve[1]+ie[1],p[Fe+2]=ve[2]+ie[2],p[Fe+3]=ve[3]+ie[3],p[Fe+4]=ve[3]-ie[3],p[Fe+5]=ve[2]-ie[2],p[Fe+6]=ve[1]-ie[1],p[Fe+7]=ve[0]-ie[0]}for(let ue=0;ue<8;++ue)pe[0]=L*p[16+ue],pe[1]=j*p[16+ue],pe[2]=L*p[48+ue],pe[3]=j*p[48+ue],ie[0]=b*p[8+ue]+V*p[24+ue]+O*p[40+ue]+se*p[56+ue],ie[1]=V*p[8+ue]-se*p[24+ue]-b*p[40+ue]-O*p[56+ue],ie[2]=O*p[8+ue]-b*p[24+ue]+se*p[40+ue]+V*p[56+ue],ie[3]=se*p[8+ue]-O*p[24+ue]+V*p[40+ue]-b*p[56+ue],me[0]=_*(p[ue]+p[32+ue]),me[3]=_*(p[ue]-p[32+ue]),me[1]=pe[0]+pe[3],me[2]=pe[1]-pe[2],ve[0]=me[0]+me[1],ve[1]=me[3]+me[2],ve[2]=me[3]-me[2],ve[3]=me[0]-me[1],p[0+ue]=ve[0]+ie[0],p[8+ue]=ve[1]+ie[1],p[16+ue]=ve[2]+ie[2],p[24+ue]=ve[3]+ie[3],p[32+ue]=ve[3]-ie[3],p[40+ue]=ve[2]-ie[2],p[48+ue]=ve[1]-ie[1],p[56+ue]=ve[0]-ie[0]}function It(p){for(let _=0;_<64;++_){const b=p[0][_],L=p[1][_],V=p[2][_];p[0][_]=b+1.5747*V,p[1][_]=b-.1873*L-.4682*V,p[2][_]=b+1.8556*L}}function At(p,_,b){for(let L=0;L<64;++L)_[b+L]=Fa.toHalfFloat(A(p[L]))}function A(p){return p<=1?Math.sign(p)*Math.pow(Math.abs(p),2.2):Math.sign(p)*Math.pow(R,Math.abs(p)-1)}function S(p){return new DataView(p.array.buffer,p.offset.value,p.size)}function $(p){const _=p.viewer.buffer.slice(p.offset.value,p.offset.value+p.size),b=new Uint8Array(ct(_)),L=new Uint8Array(b.length);return Oe(b),lt(b,L),new DataView(L.buffer)}function fe(p){const _=p.array.slice(p.offset.value,p.offset.value+p.size),b=gr(_),L=new Uint8Array(b.length);return Oe(b),lt(b,L),new DataView(L.buffer)}function xe(p){const _=p.viewer,b={value:p.offset.value},L=new Uint16Array(p.width*p.scanlineBlockSize*(p.channels*p.type)),V=new Uint8Array(8192);let O=0;const j=new Array(p.channels);for(let Pe=0;Pe<p.channels;Pe++)j[Pe]={},j[Pe].start=O,j[Pe].end=j[Pe].start,j[Pe].nx=p.width,j[Pe].ny=p.lines,j[Pe].size=p.type,O+=j[Pe].nx*j[Pe].ny*j[Pe].size;const se=de(_,b),pe=de(_,b);if(pe>=8192)throw new Error("Something is wrong with PIZ_COMPRESSION BITMAP_SIZE");if(se<=pe)for(let Pe=0;Pe<pe-se+1;Pe++)V[Pe+se]=ze(_,b);const ie=new Uint16Array(65536),me=H(V,ie),ve=Ee(_,b);$e(p.array,_,b,ve,L,O);for(let Pe=0;Pe<p.channels;++Pe){const Ce=j[Pe];for(let Ne=0;Ne<j[Pe].size;++Ne)Ue(L,Ce.start+Ne,Ce.nx,Ce.size,Ce.ny,Ce.nx*Ce.size,me)}Ve(ie,L,O);let ue=0;const Fe=new Uint8Array(L.buffer.byteLength);for(let Pe=0;Pe<p.lines;Pe++)for(let Ce=0;Ce<p.channels;Ce++){const Ne=j[Ce],He=Ne.nx*Ne.size,nt=new Uint8Array(L.buffer,Ne.end*2,He*2);Fe.set(nt,ue),ue+=He*2,Ne.end+=He}return new DataView(Fe.buffer)}function ye(p){const _=p.array.slice(p.offset.value,p.offset.value+p.size),b=gr(_),L=p.lines*p.channels*p.width,V=p.type==1?new Uint16Array(L):new Uint32Array(L);let O=0,j=0;const se=new Array(4);for(let pe=0;pe<p.lines;pe++)for(let ie=0;ie<p.channels;ie++){let me=0;switch(p.type){case 1:se[0]=O,se[1]=se[0]+p.width,O=se[1]+p.width;for(let ve=0;ve<p.width;++ve){const ue=b[se[0]++]<<8|b[se[1]++];me+=ue,V[j]=me,j++}break;case 2:se[0]=O,se[1]=se[0]+p.width,se[2]=se[1]+p.width,O=se[2]+p.width;for(let ve=0;ve<p.width;++ve){const ue=b[se[0]++]<<24|b[se[1]++]<<16|b[se[2]++]<<8;me+=ue,V[j]=me,j++}break}}return new DataView(V.buffer)}function P(p){const _=p.viewer,b={value:p.offset.value},L=new Uint8Array(p.width*p.lines*(p.channels*p.type*2)),V={version:Be(_,b),unknownUncompressedSize:Be(_,b),unknownCompressedSize:Be(_,b),acCompressedSize:Be(_,b),dcCompressedSize:Be(_,b),rleCompressedSize:Be(_,b),rleUncompressedSize:Be(_,b),rleRawSize:Be(_,b),totalAcUncompressedCount:Be(_,b),totalDcUncompressedCount:Be(_,b),acCompression:Be(_,b)};if(V.version<2)throw new Error("EXRLoader.parse: "+G.compression+" version "+V.version+" is unsupported");const O=new Array;let j=de(_,b)-2;for(;j>0;){const Ce=K(_.buffer,b),Ne=ze(_,b),He=Ne>>2&3,nt=(Ne>>4)-1,Ye=new Int8Array([nt])[0],ut=ze(_,b);O.push({name:Ce,index:Ye,type:ut,compression:He}),j-=Ce.length+3}const se=G.channels,pe=new Array(p.channels);for(let Ce=0;Ce<p.channels;++Ce){const Ne=pe[Ce]={},He=se[Ce];Ne.name=He.name,Ne.compression=0,Ne.decoded=!1,Ne.type=He.pixelType,Ne.pLinear=He.pLinear,Ne.width=p.width,Ne.height=p.lines}const ie={idx:new Array(3)};for(let Ce=0;Ce<p.channels;++Ce){const Ne=pe[Ce];for(let He=0;He<O.length;++He){const nt=O[He];Ne.name==nt.name&&(Ne.compression=nt.compression,nt.index>=0&&(ie.idx[nt.index]=Ce),Ne.offset=Ce)}}let me,ve,ue;if(V.acCompressedSize>0)switch(V.acCompression){case 0:me=new Uint16Array(V.totalAcUncompressedCount),$e(p.array,_,b,V.acCompressedSize,me,V.totalAcUncompressedCount);break;case 1:const Ce=p.array.slice(b.value,b.value+V.totalAcUncompressedCount),Ne=gr(Ce);me=new Uint16Array(Ne.buffer),b.value+=V.totalAcUncompressedCount;break}if(V.dcCompressedSize>0){const Ce={array:p.array,offset:b,size:V.dcCompressedSize};ve=new Uint16Array(fe(Ce).buffer),b.value+=V.dcCompressedSize}if(V.rleRawSize>0){const Ce=p.array.slice(b.value,b.value+V.rleCompressedSize),Ne=gr(Ce);ue=ct(Ne.buffer),b.value+=V.rleCompressedSize}let Fe=0;const Pe=new Array(pe.length);for(let Ce=0;Ce<Pe.length;++Ce)Pe[Ce]=new Array;for(let Ce=0;Ce<p.lines;++Ce)for(let Ne=0;Ne<pe.length;++Ne)Pe[Ne].push(Fe),Fe+=pe[Ne].width*p.type*2;dt(ie,Pe,pe,me,ve,L);for(let Ce=0;Ce<pe.length;++Ce){const Ne=pe[Ce];if(!Ne.decoded)switch(Ne.compression){case 2:let He=0,nt=0;for(let Ye=0;Ye<p.lines;++Ye){let ut=Pe[Ce][He];for(let Qe=0;Qe<Ne.width;++Qe){for(let ke=0;ke<2*Ne.type;++ke)L[ut++]=ue[nt+ke*Ne.width*Ne.height];nt++}He++}break;case 1:default:throw new Error("EXRLoader.parse: unsupported channel compression")}}return new DataView(L.buffer)}function K(p,_){const b=new Uint8Array(p);let L=0;for(;b[_.value+L]!=0;)L+=1;const V=new TextDecoder().decode(b.slice(_.value,_.value+L));return _.value=_.value+L+1,V}function Y(p,_,b){const L=new TextDecoder().decode(new Uint8Array(p).slice(_.value,_.value+b));return _.value=_.value+b,L}function Te(p,_){const b=we(p,_),L=Ee(p,_);return[b,L]}function Le(p,_){const b=Ee(p,_),L=Ee(p,_);return[b,L]}function we(p,_){const b=p.getInt32(_.value,!0);return _.value=_.value+4,b}function Ee(p,_){const b=p.getUint32(_.value,!0);return _.value=_.value+4,b}function De(p,_){const b=p[_.value];return _.value=_.value+1,b}function ze(p,_){const b=p.getUint8(_.value);return _.value=_.value+1,b}const Be=function(p,_){const b=Number(p.getBigInt64(_.value,!0));return _.value+=8,b};function qe(p,_){const b=p.getFloat32(_.value,!0);return _.value+=4,b}function I(p,_){return Fa.toHalfFloat(qe(p,_))}function D(p){const _=(p&31744)>>10,b=p&1023;return(p>>15?-1:1)*(_?_===31?b?NaN:1/0:Math.pow(2,_-15)*(1+b/1024):6103515625e-14*(b/1024))}function de(p,_){const b=p.getUint16(_.value,!0);return _.value+=2,b}function Ae(p,_){return D(de(p,_))}function Ie(p,_,b,L){const V=b.value,O=[];for(;b.value<V+L-1;){const j=K(_,b),se=we(p,b),pe=ze(p,b);b.value+=3;const ie=we(p,b),me=we(p,b);O.push({name:j,pixelType:se,pLinear:pe,xSampling:ie,ySampling:me})}return b.value+=1,O}function Je(p,_){const b=qe(p,_),L=qe(p,_),V=qe(p,_),O=qe(p,_),j=qe(p,_),se=qe(p,_),pe=qe(p,_),ie=qe(p,_);return{redX:b,redY:L,greenX:V,greenY:O,blueX:j,blueY:se,whiteX:pe,whiteY:ie}}function ft(p,_){const b=["NO_COMPRESSION","RLE_COMPRESSION","ZIPS_COMPRESSION","ZIP_COMPRESSION","PIZ_COMPRESSION","PXR24_COMPRESSION","B44_COMPRESSION","B44A_COMPRESSION","DWAA_COMPRESSION","DWAB_COMPRESSION"],L=ze(p,_);return b[L]}function vt(p,_){const b=Ee(p,_),L=Ee(p,_),V=Ee(p,_),O=Ee(p,_);return{xMin:b,yMin:L,xMax:V,yMax:O}}function hn(p,_){const b=["INCREASING_Y"],L=ze(p,_);return b[L]}function tt(p,_){const b=qe(p,_),L=qe(p,_);return[b,L]}function $t(p,_){const b=qe(p,_),L=qe(p,_),V=qe(p,_);return[b,L,V]}function Nt(p,_,b,L,V){if(L==="string"||L==="stringvector"||L==="iccProfile")return Y(_,b,V);if(L==="chlist")return Ie(p,_,b,V);if(L==="chromaticities")return Je(p,b);if(L==="compression")return ft(p,b);if(L==="box2i")return vt(p,b);if(L==="lineOrder")return hn(p,b);if(L==="float")return qe(p,b);if(L==="v2f")return tt(p,b);if(L==="v3f")return $t(p,b);if(L==="int")return we(p,b);if(L==="rational")return Te(p,b);if(L==="timecode")return Le(p,b);if(L==="preview")return b.value+=V,"skipped";b.value+=V}function qi(p,_,b){const L={};if(p.getUint32(0,!0)!=20000630)throw new Error("THREE.EXRLoader: provided file doesn't appear to be in OpenEXR format.");L.version=p.getUint8(4);const V=p.getUint8(5);L.spec={singleTile:!!(V&2),longName:!!(V&4),deepFormat:!!(V&8),multiPart:!!(V&16)},b.value=8;let O=!0;for(;O;){const j=K(_,b);if(j==0)O=!1;else{const se=K(_,b),pe=Ee(p,b),ie=Nt(p,_,b,se,pe);ie===void 0?console.warn(`EXRLoader.parse: skipped unknown header attribute type '${se}'.`):L[j]=ie}}if(V&-5)throw console.error("EXRHeader:",L),new Error("THREE.EXRLoader: provided file is currently unsupported.");return L}function wr(p,_,b,L,V){const O={size:0,viewer:_,array:b,offset:L,width:p.dataWindow.xMax-p.dataWindow.xMin+1,height:p.dataWindow.yMax-p.dataWindow.yMin+1,channels:p.channels.length,bytesPerLine:null,lines:null,inputSize:null,type:p.channels[0].pixelType,uncompress:null,getter:null,format:null,encoding:null};switch(p.compression){case"NO_COMPRESSION":O.lines=1,O.uncompress=S;break;case"RLE_COMPRESSION":O.lines=1,O.uncompress=$;break;case"ZIPS_COMPRESSION":O.lines=1,O.uncompress=fe;break;case"ZIP_COMPRESSION":O.lines=16,O.uncompress=fe;break;case"PIZ_COMPRESSION":O.lines=32,O.uncompress=xe;break;case"PXR24_COMPRESSION":O.lines=16,O.uncompress=ye;break;case"DWAA_COMPRESSION":O.lines=32,O.uncompress=P;break;case"DWAB_COMPRESSION":O.lines=256,O.uncompress=P;break;default:throw new Error("EXRLoader.parse: "+p.compression+" is unsupported")}if(O.scanlineBlockSize=O.lines,O.type==1)switch(V){case rn:O.getter=Ae,O.inputSize=2;break;case yn:O.getter=de,O.inputSize=2;break}else if(O.type==2)switch(V){case rn:O.getter=qe,O.inputSize=4;break;case yn:O.getter=I,O.inputSize=4}else throw new Error("EXRLoader.parse: unsupported pixelType "+O.type+" for "+p.compression+".");O.blockCount=(p.dataWindow.yMax+1)/O.scanlineBlockSize;for(let se=0;se<O.blockCount;se++)Be(_,L);O.outputChannels=O.channels==3?4:O.channels;const j=O.width*O.height*O.outputChannels;switch(V){case rn:O.byteArray=new Float32Array(j),O.channels<O.outputChannels&&O.byteArray.fill(1,0,j);break;case yn:O.byteArray=new Uint16Array(j),O.channels<O.outputChannels&&O.byteArray.fill(15360,0,j);break;default:console.error("THREE.EXRLoader: unsupported type: ",V);break}return O.bytesPerLine=O.width*O.inputSize*O.channels,O.outputChannels==4?(O.format=Ht,O.encoding=wn):(O.format=to,O.encoding=wn),O}const $n=new DataView(e),Tr=new Uint8Array(e),y={value:0},G=qi($n,e,y),k=wr(G,$n,Tr,y,this.type),U={value:0},Q={R:0,G:1,B:2,A:3,Y:0};for(let p=0;p<k.height/k.scanlineBlockSize;p++){const _=Ee($n,y);k.size=Ee($n,y),k.lines=_+k.scanlineBlockSize>k.height?k.height-_:k.scanlineBlockSize;const L=k.size<k.lines*k.bytesPerLine?k.uncompress(k):S(k);y.value+=k.size;for(let V=0;V<k.scanlineBlockSize;V++){const O=V+p*k.scanlineBlockSize;if(O>=k.height)break;for(let j=0;j<k.channels;j++){const se=Q[G.channels[j].name];for(let pe=0;pe<k.width;pe++){U.value=(V*(k.channels*k.width)+j*k.width+pe)*k.inputSize;const ie=(k.height-1-O)*(k.width*k.outputChannels)+pe*k.outputChannels+se;k.byteArray[ie]=k.getter(L,U)}}}}return{header:G,width:k.width,height:k.height,data:k.byteArray,format:k.format,encoding:k.encoding,type:this.type}}setDataType(e){return this.type=e,this}load(e,t,n,i){function r(o,a){o.encoding=a.encoding,o.minFilter=bt,o.magFilter=bt,o.generateMipmaps=!1,o.flipY=!1,t&&t(o,a)}return super.load(e,r,n,i)}}class rp{constructor(){J(this,"list",[]);J(this,"onLoadCallback")}loadBuf(e,t){this.list.push(()=>{fetch(e).then(n=>n.arrayBuffer()).then(n=>{let i=new Uint32Array(n,0,1)[0],r=JSON.parse(String.fromCharCode.apply(null,new Uint8Array(n,4,i))),o=r.vertexCount,a=r.indexCount,c=4+i,l=new Tn,u=r.attributes;for(let h=0,f=u.length;h<f;h++){let g=u[h],v=g.id,m=v==="indices"?a:o,d=g.componentSize,M=window[g.storageType],C=new M(n,c,m*d),w=M.BYTES_PER_ELEMENT,T;if(g.needsPack){let E=g.packedComponents,N=E.length,B=g.storageType.indexOf("Int")===0,x=1<<w*8,R=B?x*.5:0,H=1/x;T=new Float32Array(m*d);for(let ne=0,ae=0;ne<m;ne++)for(let z=0;z<N;z++){let F=E[z];T[ae]=(C[ae]+R)*H*F.delta+F.from,ae++}}else T=C;v==="indices"?l.setIndex(new Wt(T,1)):l.setAttribute(v,new Wt(T,d)),c+=m*d*w}t&&t(l),this._onLoad()})})}loadExr(e,t){this.list.push(()=>{new ip().load(e,i=>{t&&t(i),this._onLoad()})})}start(e){this.loadedCount=0,this.onLoadCallback=e;for(let t=0;t<this.list.length;t++)this.list[t]()}_onLoad(){this.loadedCount++,this.loadedCount===this.list.length&&(this.list.length=0,this.onLoadCallback&&this.onLoadCallback())}}const Ui=new rp,Ua=`#define GLSLIFY 1
attribute vec3 instancePos;
attribute vec4 instanceOrient;
attribute float instanceShowRatio;
attribute vec3 instanceSpinPivot;
attribute vec4 instanceSpinOrient;
attribute vec3 instanceColor;
attribute float instanceIsActive;

varying float v_clipY;
varying vec3 v_worldPosition;
varying vec3 v_viewPosition;
varying vec3 v_modelPosition;
varying vec3 v_viewNormal;
varying vec3 v_modelNormal;
varying vec3 v_color;
varying vec2 v_uv;
varying float v_isActive;

vec3 qrotate(vec4 q, vec3 v) {
	return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main () {
    vec3 pos = position;
    vec3 nor = normal;

    #ifndef IS_BASE
        pos.y += instanceShowRatio - 1.;
        v_clipY = pos.y + 0.51;

        // local spin
        pos = qrotate(instanceSpinOrient, pos - instanceSpinPivot) + instanceSpinPivot;
        nor = qrotate(instanceSpinOrient, nor);

        // global transform
        pos = qrotate(instanceOrient, pos) + instancePos;
        nor = qrotate(instanceOrient, nor);
    #endif

    vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPos;

    v_viewNormal = normalMatrix * nor;
    v_modelPosition = position;
    v_worldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    v_modelNormal = normal;
    v_viewPosition = -viewPos.xyz;
    v_color = instanceColor;
    v_isActive = instanceIsActive;

    #ifndef IS_BASE
        v_uv = (instancePos.xz + 2.5) / 5.0;
    #else
        v_uv = (position.xz + 2.5) / 5.0;
    #endif
}
`,za=`#define GLSLIFY 1
uniform vec3 u_lightPosition;
uniform sampler2D u_matcap;
uniform sampler2D u_infoTexture;

#ifdef IS_BASE
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor0;
    uniform vec3 u_bgColor1;
    uniform vec3 u_color;
    uniform float u_yDisplacement;
#endif

varying float v_clipY;
varying vec3 v_viewNormal;
varying vec3 v_worldPosition;
varying vec3 v_modelPosition;
varying vec3 v_modelNormal;
varying vec3 v_viewPosition;
varying vec3 v_color;
varying vec2 v_uv;
varying float v_isActive;

vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}

vec3 SRGBtoLinear(vec3 srgb) {
    return pow(srgb, vec3(2.2));
}

vec3 linearToSRGB(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

float linearstep(float edge0, float edge1, float x) {
    return  clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

void main () {
    #ifndef IS_BASE
        if (v_clipY < 0.) discard;
    #endif

    vec4 infoTexture = texture2D(u_infoTexture, vec2(1.0 - v_uv.y, v_uv.x));

	vec3 viewNormal = normalize(v_viewNormal);

    vec3 viewDir = normalize( v_viewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, viewNormal ), dot( y, viewNormal ) ) * 0.4 + 0.5;
    vec3 matcapColor = texture2D( u_matcap, uv ).rgb;
    matcapColor = smoothstep(-0.5, 0.7, matcapColor);

	vec3 N = inverseTransformDirection(viewNormal, viewMatrix); // normal in world space
	vec3 V = normalize(cameraPosition - v_worldPosition); // view direction
	vec3 L = u_lightPosition - v_worldPosition; // light direction
	float lightDistance = length(L);
	L /= lightDistance;

    // basic shading
    float attenuation = 1. / (0.12 * lightDistance + 0.012 * lightDistance * lightDistance);

	float NdV = max(0., dot(N, V));
	float NdH = max(dot(N, normalize(L + V)), 0.0);

    // ao
    float ao = 0.0;
    #ifndef IS_BASE
        float texel = 1.0 / 5.0;
        vec2 infoTextureUv = vec2(1.0 - v_uv.y, v_uv.x);
        vec3 texelVec = vec3(texel, -texel, 0.0);
        float localAo = mix(1.0, infoTexture.x, v_isActive);

        vec4 infoTextureTop = vec4(1.0);
        vec4 infoTextureRight = vec4(1.0);
        vec4 infoTextureBottom = vec4(1.0);
        vec4 infoTextureLeft = vec4(1.0);

        if (v_isActive > 0.5) {
            infoTextureTop = texture2D(u_infoTexture, infoTextureUv + texelVec.xz);
            infoTextureRight = texture2D(u_infoTexture, infoTextureUv + texelVec.zx);
            infoTextureBottom = texture2D(u_infoTexture, infoTextureUv + texelVec.yz);
            infoTextureLeft = texture2D(u_infoTexture, infoTextureUv + texelVec.zy);
        }

        ao += localAo * infoTextureTop.x * (v_uv.y < texel ? 0.0 : 1.0) * clamp(dot(v_modelNormal, vec3(0., 0., -1.)), 0.0, 1.0);
        ao += localAo * infoTextureRight.x * (v_uv.x > 1.0 - texel ? 0.0 : 1.0) * clamp(dot(v_modelNormal, vec3(1., 0., 0.)), 0.0, 1.0);
        ao += localAo * infoTextureBottom.x * (v_uv.y > 1.0 - texel ? 0.0 : 1.0) * clamp(dot(v_modelNormal, vec3(0., 0., 1.)), 0.0, 1.0);
        ao += localAo * infoTextureLeft.x * (v_uv.x < texel ? 0.0 : 1.0) * clamp(dot(v_modelNormal, vec3(-1., 0., 0.)), 0.0, 1.0);

        ao = 1.0 - 0.8 * ao;
        ao *= 1.0 - abs(clamp(N.y, -1.0, 0.0));
    #else
        float aoThreshold = 2.5;
        float depth = 0.045;
        ao = linearstep(aoThreshold - depth, aoThreshold, abs(v_modelPosition.x));
        ao += linearstep(aoThreshold - depth, aoThreshold, abs(v_modelPosition.z));
        aoThreshold = 0.5;
        ao += linearstep(aoThreshold + depth, aoThreshold, -v_modelPosition.y);
        ao = min(1.0, ao);
    #endif

    // final
    #ifdef IS_BASE
        vec3 albedo = SRGBtoLinear(u_color);
    #else
        vec3 albedo = SRGBtoLinear(v_color);
    #endif

	vec3 color = albedo * matcapColor;
	color += clamp(N.y, 0.0, 0.2);
    color += 0.1 * pow(NdH, 2.0);
    color *= attenuation;
    color += 0.3 * (1.0 - NdV);
    color *= 0.5 + 0.5 * ao;

    #ifdef IS_BASE
        color *= 1.0 - 0.25 * infoTexture.x * step(-0.525, v_modelPosition.y);
    #else
    #endif

    gl_FragColor = vec4(linearToSRGB(color), 1.0);

    #ifdef IS_BASE
        vec2 screenUv = gl_FragCoord.xy / u_resolution;
        float alpha = linearstep(-6.0, -3.0, v_modelPosition.y + u_yDisplacement);
        gl_FragColor.rgb = mix(mix(u_bgColor0, u_bgColor1, screenUv.y), gl_FragColor.rgb, alpha);
    #else
        // gl_FragColor = vec4(vec3(ao), 1.0);
    #endif

}
`;let sp=new W,ap=class{constructor(){J(this,"animation",0);J(this,"boardDir",new We(0,0));J(this,"boardPos",new We(0,0));J(this,"pos",new W(0,0,0));J(this,"orient",new an);J(this,"showRatio",0);J(this,"spinPivot",new W(0,0,0));J(this,"spinOrient",new an)}reset(){this.animation=0,this.boardDir.set(0,0),this.boardPos.set(0,0),this.pos.set(0,0,0),this.orient.set(0,0,0,1),this.showRatio=0,this.spinPivot.set(0,0,0),this.spinOrient.set(0,0,0,1)}update(e){this.pos.set(this.boardPos.x,0,-this.boardPos.y),this.spinPivot.set(this.boardDir.x*.5,-.5,-this.boardDir.y*.5),this.spinOrient.setFromAxisAngle(sp.set(-this.boardDir.y,0,-this.boardDir.x),this.animation*Math.PI/2)}};const Ba=(s,e)=>Math.sqrt(Math.pow(s,2)+Math.pow(e,2));class op{constructor(e=0,t=0,n=0){J(this,"id",-1);J(this,"row",0);J(this,"col",0);J(this,"priority",0);J(this,"ringIndex",0);J(this,"isMain",!1);J(this,"isBorder",!1);J(this,"isOccupied",!1);J(this,"willBeOccupied",!1);J(this,"domEl",null);J(this,"neighbours",null);J(this,"reachableNeighbours",null);J(this,"prioritySortedReachableNeighbours",null);J(this,"activeRatio",0);J(this,"MAX_DISTANCE",Ba(Ot,Ot));J(this,"loseAnimationPositionArray",null);J(this,"loseAnimationOrientArray",null);this.id=e,this.row=t,this.col=n,this.distance=Ba(t,n),this.priority=this.MAX_DISTANCE-this.distance,this.ringIndex=Math.floor(this.distance),this.isMain=t===0&&n===0,this.isBorder=Math.abs(t)===2||Math.abs(n)===2}init(){this.reachableNeighbours=this.neighbours.filter(e=>e.row===this.row||e.col===this.col),this.prioritySortedReachableNeighbours=this.reachableNeighbours.toSorted((e,t)=>e.priority-t.priority)}shuffleReachableNeighbours(){let e=this.reachableNeighbours.length;for(;e!=0;){let t=Math.floor(Math.random()*e);e--,[this.reachableNeighbours[e],this.reachableNeighbours[t]]=[this.reachableNeighbours[t],this.reachableNeighbours[e]]}this.prioritySortedReachableNeighbours=this.reachableNeighbours.toSorted((t,n)=>t.priority-n.priority)}reset(){this.isOccupied=!1,this.willBeOccupied=!1,this.activeRatio=0}update(e){this.domEl.style.backgroundColor=`rgba(255, 0, 0, ${this.activeRatio})`}}const Lt=5,Ot=Math.floor(Lt/2),tn=Lt*Lt;class lp{constructor(){J(this,"tiles",new Map);J(this,"mainTile",null)}init(){this.domEl=document.querySelector("#board");let e=0;for(let t=0;t<Lt;t++){const n=document.createElement("div");n.classList.add("row"),this.domEl.appendChild(n);const i=t-Ot,r=new Map;this.tiles.set(i,r);for(let o=0;o<Lt;o++){const a=document.createElement("div");a.classList.add("tile"),n.appendChild(a);const c=o-Ot,l=new op(e,i,c);l.domEl=a,r.set(c,l),e++}}for(let t=0;t<Lt;t++)for(let n=0;n<Lt;n++){const i=this.getTile(t-Ot,n-Ot),r=this.getNeighbouringTiles(t-Ot,n-Ot);i.neighbours=r,i.init()}this.mainTile=this.getTile(0,0)}getTile(e,t){const n=this.tiles.get(e);return n?n.get(t):null}getNeighbouringTiles(e,t){const n=[];for(let i=-1;i<=1;i++)for(let r=-1;r<=1;r++){if(i===0&&r===0)continue;const o=this.getTile(e+i,t+r);o&&n.push(o)}return n}reset(){this.tiles.forEach(e=>{e.forEach(t=>{t.reset()})})}update(e){this.tiles.forEach(t=>{t.forEach(n=>{n.update(e)})})}}const Pn=new lp;class cp{constructor(e){J(this,"id",-1);J(this,"isMoving",!1);J(this,"hasBeenSpawned",!1);J(this,"hasAnimationEnded",!1);J(this,"hasBeenEvaluated",!1);J(this,"currentTile",null);J(this,"targetTile",null);J(this,"moveAnimationRatio",0);J(this,"spawnAnimationRatio",0);J(this,"animationTimeScale",1);this.id=e}init(){}updateTile(){this.currentTile.isOccupied=!0,this.currentTile.willBeOccupied=!1,this.currentTile.domEl.innerHTML=this.id}moveToNextTile(e=!1,t=0){this.moveAnimationRatio=-t;let n;this.currentTile.shuffleReachableNeighbours(),e?n=this.currentTile.reachableNeighbours:n=this.currentTile.prioritySortedReachableNeighbours;let i=n.find(r=>{let o=!r.isOccupied&&!r.willBeOccupied&&!r.isMain;return e||(o=o&&this.currentTile.priority>=r.priority),o});!this.currentTile.isMain&&Math.random()>.8&&(i=null),i?(this.targetTile=i,this.targetTile.willBeOccupied=!0,this.isMoving=!0):this.hasAnimationEnded=!0,this.hasBeenEvaluated=!0}endMove(){this.moveAnimationRatio=1,this.currentTile.domEl.innerHTML="",this.currentTile.isOccupied=!1,this.currentTile=this.targetTile,this.targetTile=null,this.hasAnimationEnded=!0,this.updateTile()}resetAfterCycle(){this.hasBeenEvaluated=!1,this.hasAnimationEnded=!1,this.moveAnimationRatio=0,this.isMoving=!1,this.animationTimeScale=.5+Math.random()*.5}reset(){this.id=-1,this.isMoving=!1,this.hasBeenSpawned=!1,this.hasAnimationEnded=!1,this.hasBeenEvaluated=!1,this.currentTile=null,this.targetTile=null,this.moveAnimationRatio=0,this.spawnAnimationRatio=0,this.animationTimeScale=1}update(e){this.hasBeenSpawned?(this.isMoving&&!this.hasAnimationEnded||ce.isResultAnimation)&&(this.moveAnimationRatio+=this.animationTimeScale*Mt.SIMULATION_SPEED_SCALE*ce.animationSpeed*e,this.moveAnimationRatio=Math.min(1,this.moveAnimationRatio),this.moveAnimationRatio===1&&(ce.isFree||ce.isResult)&&this.endMove()):(this.spawnAnimationRatio+=Mt.SIMULATION_SPEED_SCALE*ce.animationSpeed*e,this.spawnAnimationRatio=Math.min(1,this.spawnAnimationRatio),this.spawnAnimationRatio>=1&&(this.hasBeenSpawned=!0));const t=Math.max(0,Math.min(1,this.moveAnimationRatio));this.currentTile.activeRatio=1-t,this.targetTile&&(this.targetTile.activeRatio=t)}}class up{constructor(){J(this,"blocks",[]);J(this,"lastSpawnedBlock",null);J(this,"cycleIndex",0);J(this,"animationSpeedRatio",0);J(this,"restartAnimationRatio",0)}init(){Pn.init(),this.spawnBlock()}spawnBlock(){if(ce.isFailResult||ce.isPaused||ce.isFree&&this.blocks.length>=ce.maxFreeSpawn)return;if(this.blocks.length>=tn){ce.stateSignal.dispatch(Ze.RESULT_ANIMATION);return}if(Pn.mainTile.isOccupied)return;const e=new cp(this.blocks.length);e.currentTile=Pn.mainTile,this.lastSpawnedBlock=e,ce.spawnSignal.dispatch(),e.init(),e.updateTile()}startNewCycle(){ce.endCycleSignal.dispatch(),!ce.isRestartAnimation&&(ce.isRestart||ce.hasNotStarted||(this.cycleIndex++,this.lastSpawnedBlock&&(this.blocks=[this.lastSpawnedBlock,...this.blocks],this.lastSpawnedBlock=null),ce.activeBlocksCount=this.blocks.length,!ce.isFailResult&&(ce.isPaused||(this.blocks.forEach(e=>{e.resetAfterCycle()}),this.calculatePaths(),this.spawnBlock()))))}calculatePaths(){this.lastSpawnedBlock&&this.lastSpawnedBlock.hasBeenSpawned&&this.lastSpawnedBlock.moveToNextTile(ce.isFree,0),this.blocks.forEach((e,t)=>{e.hasBeenEvaluated||e.moveToNextTile(ce.isFree,t*.2)})}reset(){this.blocks.forEach(e=>{e.reset()}),Hn.reset(),Pn.reset(),this.blocks=[],this.lastSpawnedBlock=null,this.cycleIndex=0,ce.stateSignal.dispatch(Ze.NOT_STARTED),this.animationSpeedRatio=0,this.spawnBlock()}update(e){if(ce.hasNotStarted)return;if(ce.isRestartAnimation){this.restartAnimationRatio=this.restartAnimationRatio+2*e,this.restartAnimationRatio>=1&&(ce.stateSignal.dispatch(Ze.RESTART),ce.gameEndedSignal.dispatch(),this.restartAnimationRatio=0,this.reset(),this.startNewCycle()),Hn.restartAnimationRatio=this.restartAnimationRatio;return}if(ce.isResultAnimation){let n=!0;this.blocks.forEach(i=>{n=n&&Hn.endAnimationRatio===1}),n&&ce.stateSignal.dispatch(Ze.RESTART_ANIMATION)}this.animationSpeedRatio=this.animationSpeedRatio+e*(ce.isResult?1:0),this.animationSpeedRatio=Math.min(1,this.animationSpeedRatio),ce.animationSpeed=ce.freeAnimationSpeed+(ce.resultAnimationSpeed-ce.freeAnimationSpeed)*this.animationSpeedRatio,this.lastSpawnedBlock&&this.lastSpawnedBlock.update(e),this.blocks.forEach(n=>{n.update(e)}),Pn.update(e);let t=!0;this.lastSpawnedBlock&&(t=t&&this.lastSpawnedBlock.hasBeenSpawned),this.blocks.forEach(n=>{t=t&&n.hasBeenEvaluated,t=t&&n.hasAnimationEnded}),t=t||ce.isResultAnimation||ce.isFailResult||ce.isPaused,t&&this.startNewCycle()}}const Yt=new up;class hp{quadIn(e){return e*e}quadOut(e){return e*(2-e)}quadInOut(e){return(e*=2)<1?.5*e*e:-.5*(--e*(e-2)-1)}cubicIn(e){return e*e*e}cubicOut(e){return--e*e*e+1}cubicInOut(e){return(e*=2)<1?.5*e*e*e:.5*((e-=2)*e*e+2)}quartIn(e){return e*e*e*e}quartOut(e){return 1- --e*e*e*e}quartInOut(e){return(e*=2)<1?.5*e*e*e*e:-.5*((e-=2)*e*e*e-2)}quintIn(e){return e*e*e*e*e}quintOut(e){return--e*e*e*e*e+1}quintInOut(e){return(e*=2)<1?.5*e*e*e*e*e:.5*((e-=2)*e*e*e*e+2)}sineIn(e){return 1-Math.cos(e*Math.PI/2)}sineOut(e){return Math.sin(e*Math.PI/2)}sineInOut(e){return .5*(1-Math.cos(Math.PI*e))}expoIn(e){return e===0?0:Math.pow(1024,e-1)}expoOut(e){return e===1?1:1-Math.pow(2,-10*e)}expoInOut(e){return e===0?0:e===1?1:(e*=2)<1?.5*Math.pow(1024,e-1):.5*(-Math.pow(2,-10*(e-1))+2)}circIn(e){return 1-Math.sqrt(1-e*e)}circOut(e){return Math.sqrt(1- --e*e)}circInOut(e){return(e*=2)<1?-.5*(Math.sqrt(1-e*e)-1):.5*(Math.sqrt(1-(e-=2)*e)+1)}elasticIn(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),-(n*Math.pow(2,10*(e-=1))*Math.sin((e-t)*2*Math.PI/i)))}elasticOut(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),n*Math.pow(2,-10*e)*Math.sin((e-t)*2*Math.PI/i)+1)}elasticInOut(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),(e*=2)<1?-.5*n*Math.pow(2,10*(e-=1))*Math.sin((e-t)*2*Math.PI/i):n*Math.pow(2,-10*(e-=1))*Math.sin((e-t)*2*Math.PI/i)*.5+1)}backIn(e){let t=1.70158;return e*e*((t+1)*e-t)}backOut(e){let t=1.70158;return--e*e*((t+1)*e+t)+1}backInOut(e){let t=2.5949095;return(e*=2)<1?.5*e*e*((t+1)*e-t):.5*((e-=2)*e*((t+1)*e+t)+2)}bounceIn(e){return 1-this.bounceOut(1-e)}bounceOut(e){return e<1/2.75?7.5625*e*e:e<2/2.75?7.5625*(e-=1.5/2.75)*e+.75:e<2.5/2.75?7.5625*(e-=2.25/2.75)*e+.9375:7.5625*(e-=2.625/2.75)*e+.984375}bounceInOut(e){return e<.5?this.bounceIn(e*2)*.5:this.bounceOut(e*2-1)*.5+.5}}const ka=new hp;class dp{constructor(){J(this,"container",new Dt);J(this,"color0","#ffffff");J(this,"color1","#d0d0d0")}init(){const e=new un({uniforms:{u_resolution:ce.sharedUniforms.u_resolution,u_color0:{value:new je(this.color0)},u_color1:{value:new je(this.color1)}},vertexShader:`
				varying vec2 v_uv;
				void main() {
					gl_Position = vec4(position.xy, 0.0, 1.0);
					v_uv = uv;
				}
			`,fragmentShader:`
				uniform vec2 u_resolution;
				uniform vec3 u_color0;
				uniform vec3 u_color1;

				varying vec2 v_uv;

				void main() {
					vec3 color = mix(u_color0, u_color1, v_uv.y);
					gl_FragColor = vec4(color, 1.0);
				}
			`,depthWrite:!1});this.mesh=new sn(new yr(2,2),e),this.mesh.renderOrder=-1,this.container.add(this.mesh)}resize(){}update(e){}}const Bi=new dp,qt=2*tn;new gt;new gt;const as=new W,Ga=new W,os=new an,Ha=new an,Va=new je,Wa=new je,Xa=new je,pi=new je,mi=new je;class fp{constructor(){J(this,"container",new Dt);J(this,"_baseMesh");J(this,"_blocksMesh");J(this,"_blockList",[]);J(this,"_blockRenderList",[]);J(this,"_blockUpdateRange",{start:0,count:0});J(this,"sharedUniforms",{u_lightPosition:{value:new W(-2,6,-2)},u_matcap:{value:null},u_infoTexture:{value:null}});J(this,"colorRatio",0);J(this,"restartAnimationRatio",0);J(this,"endAnimationRatio",0);J(this,"endSpawnAnimationRatio",0);J(this,"endSpawnAnimationRatioUnclamped",-.1);J(this,"infoTexture",null)}preload(){for(let e=0;e<qt;e++){let t=new ap;this._blockList.push(t),this._blockRenderList.push(t)}Ui.loadBuf(Mt.ASSETS_PATH+"models/BASE.buf",e=>{this._onBaseBlocksLoaded(e)}),Ui.loadBuf(Mt.ASSETS_PATH+"models/BOX.buf",e=>{this._onBoxLoaded(e)}),Ui.loadBuf(Mt.ASSETS_PATH+"models/lose_animation.buf",e=>{const{position:t,orient:n}=e.attributes;this.animationTotalFrames=t.count/tn,this.loseAnimationPositionArray=t.array,this.loseAnimationOrientArray=n.array}),Ui.loadExr(Mt.ASSETS_PATH+"textures/clay.exr",e=>{this.sharedUniforms.u_matcap.value=e})}_onBaseBlocksLoaded(e){let t=this._baseMesh=new sn(e,new un({uniforms:{u_lightPosition:this.sharedUniforms.u_lightPosition,u_infoTexture:this.sharedUniforms.u_infoTexture,u_matcap:this.sharedUniforms.u_matcap,u_color:{value:new je(this.defaultColor)},u_bgColor0:{value:new je(Bi.color0)},u_bgColor1:{value:new je(Bi.color1)},u_resolution:ce.sharedUniforms.u_resolution,u_yDisplacement:{value:0}},vertexShader:Ua,fragmentShader:za}));t.material.defines.IS_BASE=!0,this.container.add(t)}_onBoxLoaded(e){let t=new Bf;t.index=e.index;for(let i in e.attributes)t.setAttribute(i,e.attributes[i]);t.instanceCount=qt,t.setAttribute("instancePos",new Un(this._instancePosArray=new Float32Array(qt*3),3)),t.setAttribute("instanceOrient",new Un(this._instanceOrientArray=new Float32Array(qt*4),4)),t.setAttribute("instanceShowRatio",new Un(this._instanceShowRatioArray=new Float32Array(qt*1),1)),t.setAttribute("instanceSpinPivot",new Un(this._instanceSpinPivotArray=new Float32Array(qt*3),3)),t.setAttribute("instanceSpinOrient",new Un(this._instanceSpinOrientArray=new Float32Array(qt*4),4)),t.setAttribute("instanceColor",new Un(this._instanceColorArray=new Float32Array(qt*3),3)),t.setAttribute("instanceIsActive",new Un(this._instanceIsActiveArray=new Float32Array(qt),1)),t.attributes.instancePos.setUsage(Qn),t.attributes.instanceOrient.setUsage(Qn),t.attributes.instanceShowRatio.setUsage(Qn),t.attributes.instanceSpinPivot.setUsage(Qn),t.attributes.instanceSpinOrient.setUsage(Qn),t.attributes.instanceIsActive.setUsage(Qn);let n=this._blocksMesh=new sn(t,new un({uniforms:Object.assign({},this.sharedUniforms),vertexShader:Ua,fragmentShader:za}));n.frustumCulled=!1,this.container.add(n)}init(){this._assignFinalAnimationToTiles(),this.infoTexture=new bo(new Float32Array(tn*4),Lt,Lt,Ht,rn),this.sharedUniforms.u_infoTexture.value=this.infoTexture}_assignFinalAnimationToTiles(){let e=0;for(let t=0;t<Lt;t++)for(let n=0;n<Lt;n++){const i=Pn.getTile(n-Ot,-(t-Ot));i.loseAnimationPositionArray=new Float32Array(this.animationTotalFrames*3),i.loseAnimationOrientArray=new Float32Array(this.animationTotalFrames*4);for(let r=0;r<this.animationTotalFrames;r++){let o=r*tn*3+e*3;i.loseAnimationPositionArray[r*3+0]=this.loseAnimationPositionArray[o+0],i.loseAnimationPositionArray[r*3+1]=this.loseAnimationPositionArray[o+1],i.loseAnimationPositionArray[r*3+2]=this.loseAnimationPositionArray[o+2],o=r*tn*4+e*4,i.loseAnimationOrientArray[r*4+0]=this.loseAnimationOrientArray[o+0],i.loseAnimationOrientArray[r*4+1]=this.loseAnimationOrientArray[o+1],i.loseAnimationOrientArray[r*4+2]=this.loseAnimationOrientArray[o+2],i.loseAnimationOrientArray[r*4+3]=this.loseAnimationOrientArray[o+3]}e++}}reset(){this._blockList.forEach(e=>e.reset()),this.endAnimationRatio=0,this.endSpawnAnimationRatioUnclamped=-.1}update(e){let t=0;if(this.endAnimationRatio+=e*(ce.isResultAnimation?1:0),this.endAnimationRatio=Math.max(0,Math.min(1,this.endAnimationRatio)),this.endSpawnAnimationRatioUnclamped+=6*e*(ce.isResultAnimation?1:0),this.endSpawnAnimationRatio=Math.max(0,Math.min(1,this.endSpawnAnimationRatioUnclamped)),Yt.lastSpawnedBlock){let n=this._blockList[Yt.lastSpawnedBlock.id];n.boardPos.set(Yt.lastSpawnedBlock.currentTile.row,Yt.lastSpawnedBlock.currentTile.col),n.showRatio=ka.sineIn(Yt.lastSpawnedBlock.spawnAnimationRatio)}Va.set(ce.startColor),Wa.set(ce.endColor),Xa.set(ce.errorColor),pi.set(ce.defaultColor),this.colorRatio=Math.min(Yt.blocks.length/tn,this.colorRatio+.5*e),mi.lerpColors(Va,Wa,this.colorRatio),mi.lerp(pi,this.restartAnimationRatio),(ce.isResult||ce.isResultAnimation)&&ce.result===RESULT.FAILED&&mi.copy(Xa);for(let n=0;n<qt;n++)n<Yt.blocks.length+(Yt.lastSpawnedBlock?1:0)?(this._instanceColorArray[n*3+0]=mi.r,this._instanceColorArray[n*3+1]=mi.g,this._instanceColorArray[n*3+2]=mi.b,this._instanceIsActiveArray[n]=1):(this._instanceColorArray[n*3+0]=pi.r,this._instanceColorArray[n*3+1]=pi.g,this._instanceColorArray[n*3+2]=pi.b,this._instanceIsActiveArray[n]=0);this._baseMesh.material.uniforms.u_color.value.copy(pi),Yt.blocks.forEach(n=>{let i=this._blockList[n.id];if(i.showRatio=1,i.boardPos.set(n.currentTile.row,n.currentTile.col),n.targetTile){const r=n.targetTile.row-n.currentTile.row,o=n.targetTile.col-n.currentTile.col;i.boardDir.set(r,o)}i.animation=n.hasAnimationEnded?0:ka.sineIn(Math.max(0,n.moveAnimationRatio))}),Pn.tiles.forEach(n=>{n.forEach(i=>{let r=i.id*4;this.infoTexture.image.data[r+0]=i.activeRatio,this.infoTexture.image.data[r+1]=i.isOccupied?1:0,this.infoTexture.image.data[r+2]=i.isMain?1:0,this.infoTexture.image.data[r+3]=i.isBorder?1:0})}),this.infoTexture.needsUpdate=!0;for(let n=0;n<qt;n++){let i=this._blockList[n];i.update(e);let r=Yt.blocks.filter(o=>o.id===n)[0];if(i.showRatio>0&&(this._blockRenderList[t++]=i),ce.isResultAnimation&&ce.result===RESULT.FAILED){if(r){const o=r.currentTile;if(this.endAnimationRatio>0&&ce.result===RESULT.FAILED){const a=Math.floor(this.endAnimationRatio*this.animationTotalFrames),c=Math.min(a+1,this.animationTotalFrames-1),l=this.endAnimationRatio*this.animationTotalFrames-a;as.fromArray(o.loseAnimationPositionArray,a*3),Ga.fromArray(o.loseAnimationPositionArray,c*3),as.lerp(Ga,l),i.pos.copy(as),os.fromArray(o.loseAnimationOrientArray,a*4),Ha.fromArray(o.loseAnimationOrientArray,c*4),os.slerp(Ha,l),i.orient.copy(os)}}if(n>=tn){const o=n-tn,a=o%Lt-Ot,c=Math.floor(o/Lt)-Ot;i.showRatio=this.endSpawnAnimationRatio,i.boardPos.set(c,a)}}if(ce.isResultAnimation&&ce.result===RESULT.PAUSE&&n>=tn){const o=n-tn,a=o%Lt-Ot,c=Math.floor(o/Lt)-Ot;Pn.getTile(c,a).isOccupied||(i.showRatio=this.endSpawnAnimationRatio,i.boardPos.set(c,a))}}for(let n=0;n<qt;n++){let i=this._blockRenderList[n];i.showRatio>0&&(i.pos.toArray(this._instancePosArray,n*3),i.orient.toArray(this._instanceOrientArray,n*4),this._instanceShowRatioArray[n]=i.showRatio,i.spinPivot.toArray(this._instanceSpinPivotArray,n*3),i.spinOrient.toArray(this._instanceSpinOrientArray,n*4))}for(let n in this._blocksMesh.geometry.attributes){let i=this._blocksMesh.geometry.attributes[n];i.isInstancedBufferAttribute&&(i.updateRange.count=t*i.updateRange.itemSize,i.needsUpdate=!0)}this._blocksMesh.geometry.instanceCount=t,this.container.position.y=-1*this.restartAnimationRatio,this._baseMesh.material.uniforms.u_yDisplacement.value=-1*this.restartAnimationRatio}}const Hn=new fp,qa={type:"change"},ls={type:"start"},Ya={type:"end"};class pp extends jn{constructor(e,t){super(),t===void 0&&console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.'),t===document&&console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new W,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minPolarAngle=Math.PI*.2,this.maxPolarAngle=Math.PI*.45,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.15,this.enableZoom=!1,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=.5,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Kn.ROTATE,MIDDLE:Kn.DOLLY,RIGHT:Kn.PAN},this.touches={ONE:Jn.ROTATE,TWO:Jn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.scale=1,this._domElementKeyEvents=null,this.getPolarAngle=function(){return a.phi},this.getAzimuthalAngle=function(){return a.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(P){P.addEventListener("keydown",It),this._domElementKeyEvents=P},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.scale=1,n.object.updateProjectionMatrix(),n.dispatchEvent(qa),n.update(),r=i.NONE},this.update=function(){const P=new W,K=new an().setFromUnitVectors(e.up,new W(0,1,0)),Y=K.clone().invert(),Te=new W,Le=new an,we=2*Math.PI;return function(){const De=n.object.position;P.copy(De).sub(n.target),P.applyQuaternion(K),a.setFromVector3(P),n.autoRotate&&r===i.NONE&&x(N()),n.enableDamping?(a.theta+=c.theta*n.dampingFactor,a.phi+=c.phi*n.dampingFactor):(a.theta+=c.theta,a.phi+=c.phi);let ze=n.minAzimuthAngle,Be=n.maxAzimuthAngle;isFinite(ze)&&isFinite(Be)&&(ze<-Math.PI?ze+=we:ze>Math.PI&&(ze-=we),Be<-Math.PI?Be+=we:Be>Math.PI&&(Be-=we),ze<=Be?a.theta=Math.max(ze,Math.min(Be,a.theta)):a.theta=a.theta>(ze+Be)/2?Math.max(ze,a.theta):Math.min(Be,a.theta)),a.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,a.phi)),a.makeSafe();let qe=n.enableDamping?(n.scale-1)*n.dampingFactor+1:n.scale;return a.radius*=qe,a.radius=Math.max(n.minDistance,Math.min(n.maxDistance,a.radius)),n.enableDamping===!0?n.target.addScaledVector(l,n.dampingFactor):n.target.add(l),P.setFromSpherical(a),P.applyQuaternion(Y),De.copy(n.target).add(P),n.object.lookAt(n.target),n.enableDamping===!0?(c.theta*=1-n.dampingFactor,c.phi*=1-n.dampingFactor,l.multiplyScalar(1-n.dampingFactor)):(c.set(0,0,0),l.set(0,0,0)),n.scale=n.scale/qe,u||Te.distanceToSquared(n.object.position)>o||8*(1-Le.dot(n.object.quaternion))>o?(n.dispatchEvent(qa),Te.copy(n.object.position),Le.copy(n.object.quaternion),u=!1,!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",S),n.domElement.removeEventListener("pointerdown",Oe),n.domElement.removeEventListener("pointercancel",dt),n.domElement.removeEventListener("wheel",Ke),n.domElement.removeEventListener("pointermove",lt),n.domElement.removeEventListener("pointerup",ct),n._domElementKeyEvents!==null&&n._domElementKeyEvents.removeEventListener("keydown",It)};const n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let r=i.NONE;const o=1e-6,a=new Na,c=new Na,l=new W;let u=!1;const h=new We,f=new We,g=new We,v=new We,m=new We,d=new We,M=new We,C=new We,w=new We,T=[],E={};function N(){return 2*Math.PI/60/60*n.autoRotateSpeed}function B(){return Math.pow(.95,n.zoomSpeed)}function x(P){c.theta-=P}function R(P){c.phi-=P}const H=function(){const P=new W;return function(Y,Te){P.setFromMatrixColumn(Te,0),P.multiplyScalar(-Y),l.add(P)}}(),ne=function(){const P=new W;return function(Y,Te){n.screenSpacePanning===!0?P.setFromMatrixColumn(Te,1):(P.setFromMatrixColumn(Te,0),P.crossVectors(n.object.up,P)),P.multiplyScalar(Y),l.add(P)}}(),ae=function(){const P=new W;return function(Y,Te){const Le=n.domElement;if(n.object.isPerspectiveCamera){const we=n.object.position;P.copy(we).sub(n.target);let Ee=P.length();Ee*=Math.tan(n.object.fov/2*Math.PI/180),H(2*Y*Ee/Le.clientHeight,n.object.matrix),ne(2*Te*Ee/Le.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(H(Y*(n.object.right-n.object.left)/n.object.zoom/Le.clientWidth,n.object.matrix),ne(Te*(n.object.top-n.object.bottom)/n.object.zoom/Le.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function z(P){n.object.isPerspectiveCamera?n.scale/=P:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom*P)),n.object.updateProjectionMatrix(),u=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function F(P){n.object.isPerspectiveCamera?n.scale*=P:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/P)),n.object.updateProjectionMatrix(),u=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function ee(P){h.set(P.clientX,P.clientY)}function oe(P){M.set(P.clientX,P.clientY)}function he(P){v.set(P.clientX,P.clientY)}function te(P){f.set(P.clientX,P.clientY),g.subVectors(f,h).multiplyScalar(n.rotateSpeed);const K=n.domElement;x(2*Math.PI*g.x/K.clientHeight),R(2*Math.PI*g.y/K.clientHeight),h.copy(f),n.update()}function _e(P){C.set(P.clientX,P.clientY),w.subVectors(C,M),w.y>0?z(B()):w.y<0&&F(B()),M.copy(C),n.update()}function re(P){m.set(P.clientX,P.clientY),d.subVectors(m,v).multiplyScalar(n.panSpeed),ae(d.x,d.y),v.copy(m),n.update()}function Z(P){P.deltaY<0?F(B()):P.deltaY>0&&z(B()),n.update()}function q(P){let K=!1;switch(P.code){case n.keys.UP:ae(0,n.keyPanSpeed),K=!0;break;case n.keys.BOTTOM:ae(0,-n.keyPanSpeed),K=!0;break;case n.keys.LEFT:ae(n.keyPanSpeed,0),K=!0;break;case n.keys.RIGHT:ae(-n.keyPanSpeed,0),K=!0;break}K&&(P.preventDefault(),n.update())}function le(){if(T.length===1)h.set(T[0].pageX,T[0].pageY);else{const P=.5*(T[0].pageX+T[1].pageX),K=.5*(T[0].pageY+T[1].pageY);h.set(P,K)}}function ge(){if(T.length===1)v.set(T[0].pageX,T[0].pageY);else{const P=.5*(T[0].pageX+T[1].pageX),K=.5*(T[0].pageY+T[1].pageY);v.set(P,K)}}function Se(){const P=T[0].pageX-T[1].pageX,K=T[0].pageY-T[1].pageY,Y=Math.sqrt(P*P+K*K);M.set(0,Y)}function X(){n.enableZoom&&Se(),n.enablePan&&ge()}function Ge(){n.enableZoom&&Se(),n.enableRotate&&le()}function be(P){if(T.length==1)f.set(P.pageX,P.pageY);else{const Y=ye(P),Te=.5*(P.pageX+Y.x),Le=.5*(P.pageY+Y.y);f.set(Te,Le)}g.subVectors(f,h).multiplyScalar(n.rotateSpeed);const K=n.domElement;x(2*Math.PI*g.x/K.clientHeight),R(2*Math.PI*g.y/K.clientHeight),h.copy(f)}function Ue(P){if(T.length===1)m.set(P.pageX,P.pageY);else{const K=ye(P),Y=.5*(P.pageX+K.x),Te=.5*(P.pageY+K.y);m.set(Y,Te)}d.subVectors(m,v).multiplyScalar(n.panSpeed),ae(d.x,d.y),v.copy(m)}function Re(P){const K=ye(P),Y=P.pageX-K.x,Te=P.pageY-K.y,Le=Math.sqrt(Y*Y+Te*Te);C.set(0,Le),w.set(0,Math.pow(C.y/M.y,n.zoomSpeed)),z(w.y),M.copy(C)}function $e(P){n.enableZoom&&Re(P),n.enablePan&&Ue(P)}function Ve(P){n.enableZoom&&Re(P),n.enableRotate&&be(P)}function Oe(P){n.enabled!==!1&&(T.length===0&&(n.domElement.setPointerCapture(P.pointerId),n.domElement.addEventListener("pointermove",lt),n.domElement.addEventListener("pointerup",ct)),$(P),P.pointerType==="touch"?At(P):Tt(P))}function lt(P){n.enabled!==!1&&(P.pointerType==="touch"?A(P):at(P))}function ct(P){fe(P),T.length===0&&(n.domElement.releasePointerCapture(P.pointerId),n.domElement.removeEventListener("pointermove",lt),n.domElement.removeEventListener("pointerup",ct)),n.dispatchEvent(Ya),r=i.NONE}function dt(P){fe(P)}function Tt(P){let K;switch(P.button){case 0:K=n.mouseButtons.LEFT;break;case 1:K=n.mouseButtons.MIDDLE;break;case 2:K=n.mouseButtons.RIGHT;break;default:K=-1}switch(K){case Kn.DOLLY:if(n.enableZoom===!1)return;oe(P),r=i.DOLLY;break;case Kn.ROTATE:if(P.ctrlKey||P.metaKey||P.shiftKey){if(n.enablePan===!1)return;he(P),r=i.PAN}else{if(n.enableRotate===!1)return;ee(P),r=i.ROTATE}break;case Kn.PAN:if(P.ctrlKey||P.metaKey||P.shiftKey){if(n.enableRotate===!1)return;ee(P),r=i.ROTATE}else{if(n.enablePan===!1)return;he(P),r=i.PAN}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ls)}function at(P){if(n.enabled!==!1)switch(r){case i.ROTATE:if(n.enableRotate===!1)return;te(P);break;case i.DOLLY:if(n.enableZoom===!1)return;_e(P);break;case i.PAN:if(n.enablePan===!1)return;re(P);break}}function Ke(P){n.enabled===!1||n.enableZoom===!1||r!==i.NONE||(n.dispatchEvent(ls),Z(P),n.dispatchEvent(Ya))}function It(P){n.enabled===!1||n.enablePan===!1||q(P)}function At(P){switch(xe(P),T.length){case 1:switch(n.touches.ONE){case Jn.ROTATE:if(n.enableRotate===!1)return;le(),r=i.TOUCH_ROTATE;break;case Jn.PAN:if(n.enablePan===!1)return;ge(),r=i.TOUCH_PAN;break;default:r=i.NONE}break;case 2:switch(n.touches.TWO){case Jn.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;X(),r=i.TOUCH_DOLLY_PAN;break;case Jn.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Ge(),r=i.TOUCH_DOLLY_ROTATE;break;default:r=i.NONE}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ls)}function A(P){switch(xe(P),r){case i.TOUCH_ROTATE:if(n.enableRotate===!1)return;be(P),n.update();break;case i.TOUCH_PAN:if(n.enablePan===!1)return;Ue(P),n.update();break;case i.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;$e(P),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Ve(P),n.update();break;default:r=i.NONE}}function S(P){n.enabled}function $(P){T.push(P)}function fe(P){delete E[P.pointerId];for(let K=0;K<T.length;K++)if(T[K].pointerId==P.pointerId){T.splice(K,1);return}}function xe(P){let K=E[P.pointerId];K===void 0&&(K=new We,E[P.pointerId]=K),K.set(P.pageX,P.pageY)}function ye(P){const K=P.pointerId===T[0].pointerId?T[1]:T[0];return E[K.pointerId]}n.domElement.addEventListener("contextmenu",S),n.domElement.addEventListener("pointerdown",Oe),n.domElement.addEventListener("pointercancel",dt),n.domElement.addEventListener("wheel",Ke,{passive:!1}),this.update()}}class mp{constructor(){J(this,"status","not-started")}preload(e,t){Mt.override(e),Mt.WEBGL_OPTS.canvas=ce.canvas=e.canvas,ce.orbitTarget=e.orbitTarget,Hn.preload(),Ui.start(t)}init(){ce.renderer=new yo(Mt.WEBGL_OPTS),ce.scene=new If,ce.camera=new _o(-1,1,1,-1,1,60),ce.camera.zoom=150,ce.scene.add(ce.camera),ce.camera.position.fromArray(Mt.DEFAULT_POSITION),ce.orbitCamera=ce.camera.clone();let e=ce.orbitControls=new pp(ce.orbitCamera,ce.orbitTarget);e.enableDamping=!0,e.enableDamping=!0,e.target0.fromArray(Mt.DEFAULT_LOOKAT_POSITION),e.reset(),Yt.init(),Hn.init(),Bi.init(),ce.scene.add(Hn.container),ce.scene.add(Bi.container)}setSize(e,t){ce.viewportWidth=e,ce.viewportHeight=t,ce.viewportResolution.set(e,window.innerHeight);let n=e*Mt.DPR,i=t*Mt.DPR;if(Mt.USE_PIXEL_LIMIT===!0&&n*i>Mt.MAX_PIXEL_COUNT){let r=n/i;i=Math.sqrt(Mt.MAX_PIXEL_COUNT/r),n=Math.ceil(i*r),i=Math.ceil(i)}ce.width=n,ce.height=i,ce.resolution.set(n,i),ce.camera.aspect=n/i,ce.camera.updateProjectionMatrix(),ce.renderer.setSize(n,i),ce.canvas.style.width=`${e}px`,ce.canvas.style.height=`${t}px`,ce.camera.top=i/2,ce.camera.bottom=-i/2,ce.camera.left=-n/2,ce.camera.right=n/2,ce.camera.updateProjectionMatrix()}render(e){ce.time+=e,ce.deltaTime=e,ce.sharedUniforms.u_time.value=ce.time,ce.sharedUniforms.u_deltaTime.value=e,Yt.update(e);let t=ce.camera;ce.orbitControls.update(),ce.orbitCamera.updateMatrix(),ce.orbitCamera.matrix.decompose(t.position,t.quaternion,t.scale),t.matrix.compose(t.position,t.quaternion,t.scale),Hn.update(e),Bi.update(e),ce.renderer.setClearColor(ce.bgColor,1),ce.renderer.render(ce.scene,ce.camera)}setResult(e){}}window[Mt.APP_ID]=new mp;window.properties=ce;window.STATUS=Ze;window.RESULT=vn;
