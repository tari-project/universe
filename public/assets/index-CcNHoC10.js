var Bo=Object.defineProperty;var ko=(s,e,t)=>e in s?Bo(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var $=(s,e,t)=>(ko(s,typeof e!="symbol"?e+"":e,t),t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();/**
 * @license
 * Copyright 2010-2022 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Es="148",Jn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Qn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Go=0,Is=1,Ho=2,As=1,Vo=2,Oi=3,Zn=0,jt=1,Cs=2,Yi=3,In=0,vi=1,Ns=2,Fs=3,Os=4,Wo=5,gi=100,Xo=101,qo=102,Us=103,zs=104,Zo=200,Yo=201,jo=202,$o=203,so=204,ao=205,Ko=206,Jo=207,Qo=208,el=209,tl=210,nl=0,il=1,rl=2,gs=3,sl=4,al=5,ol=6,ll=7,oo=0,cl=1,ul=2,wn=0,hl=1,dl=2,fl=3,pl=4,ml=5,lo=300,Mi=301,yi=302,_s=303,xs=304,yr=306,vr=1e3,Gt=1001,vs=1002,yt=1003,Bs=1004,Cr=1005,bt=1006,gl=1007,bi=1008,_l=1008,Yn=1009,xl=1010,vl=1011,co=1012,Sl=1013,Hn=1014,rn=1015,bn=1016,Ml=1017,yl=1018,Si=1020,bl=1021,wl=1022,Ht=1023,Tl=1024,El=1025,Wn=1026,wi=1027,uo=1028,Al=1029,Cl=1030,Ll=1031,Rl=1033,Lr=33776,Rr=33777,Dr=33778,Pr=33779,ks=35840,Gs=35841,Hs=35842,Vs=35843,Dl=36196,Ws=37492,Xs=37496,qs=37808,Zs=37809,Ys=37810,js=37811,$s=37812,Ks=37813,Js=37814,Qs=37815,ea=37816,ta=37817,na=37818,ia=37819,ra=37820,sa=37821,aa=36492,Tn=3e3,rt=3001,Pl=3200,Il=3201,Nl=0,Fl=1,cn="srgb",ki="srgb-linear",Ir=7680,Ol=519,oa=35044,ei=35048,la="300 es",Ss=1035;class $n{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const i=this._listeners[e];if(i!==void 0){const r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}}const At=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Nr=Math.PI/180,ca=180/Math.PI;function Gi(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(At[s&255]+At[s>>8&255]+At[s>>16&255]+At[s>>24&255]+"-"+At[e&255]+At[e>>8&255]+"-"+At[e>>16&15|64]+At[e>>24&255]+"-"+At[t&63|128]+At[t>>8&255]+"-"+At[t>>16&255]+At[t>>24&255]+At[n&255]+At[n>>8&255]+At[n>>16&255]+At[n>>24&255]).toLowerCase()}function Pt(s,e,t){return Math.max(e,Math.min(t,s))}function Ul(s,e){return(s%e+e)%e}function Fr(s,e,t){return(1-t)*s+t*e}function ua(s){return(s&s-1)===0&&s!==0}function Ms(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function ji(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function zt(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}class Ge{constructor(e=0,t=0){Ge.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Vt{constructor(){Vt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1]}set(e,t,n,i,r,o,a,c,l){const u=this.elements;return u[0]=e,u[1]=i,u[2]=a,u[3]=t,u[4]=r,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],f=n[2],g=n[5],v=n[8],m=i[0],d=i[3],M=i[6],C=i[1],w=i[4],T=i[7],E=i[2],N=i[5],B=i[8];return r[0]=o*m+a*C+c*E,r[3]=o*d+a*w+c*N,r[6]=o*M+a*T+c*B,r[1]=l*m+u*C+h*E,r[4]=l*d+u*w+h*N,r[7]=l*M+u*T+h*B,r[2]=f*m+g*C+v*E,r[5]=f*d+g*w+v*N,r[8]=f*M+g*T+v*B,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-n*r*u+n*a*c+i*r*l-i*o*c}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,f=a*c-u*r,g=l*r-o*c,v=t*h+n*f+i*g;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const m=1/v;return e[0]=h*m,e[1]=(i*l-u*n)*m,e[2]=(a*n-i*o)*m,e[3]=f*m,e[4]=(u*t-i*c)*m,e[5]=(i*r-a*t)*m,e[6]=g*m,e[7]=(n*c-l*t)*m,e[8]=(o*t-n*r)*m,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-i*l,i*c,-i*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Or.makeScale(e,t)),this}rotate(e){return this.premultiply(Or.makeRotation(-e)),this}translate(e,t){return this.premultiply(Or.makeTranslation(e,t)),this}makeTranslation(e,t){return this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Or=new Vt;function ho(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function Sr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Xn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function _r(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}const Ur={[cn]:{[ki]:Xn},[ki]:{[cn]:_r}},Lt={legacyMode:!0,get workingColorSpace(){return ki},set workingColorSpace(s){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(s,e,t){if(this.legacyMode||e===t||!e||!t)return s;if(Ur[e]&&Ur[e][t]!==void 0){const n=Ur[e][t];return s.r=n(s.r),s.g=n(s.g),s.b=n(s.b),s}throw new Error("Unsupported color space conversion.")},fromWorkingColorSpace:function(s,e){return this.convert(s,this.workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this.workingColorSpace)}},fo={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},mt={r:0,g:0,b:0},Kt={h:0,s:0,l:0},$i={h:0,s:0,l:0};function zr(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}function Ki(s,e){return e.r=s.r,e.g=s.g,e.b=s.b,e}class Ye{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,t===void 0&&n===void 0?this.set(e):this.setRGB(e,t,n)}set(e){return e&&e.isColor?this.copy(e):typeof e=="number"?this.setHex(e):typeof e=="string"&&this.setStyle(e),this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=cn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Lt.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=Lt.workingColorSpace){return this.r=e,this.g=t,this.b=n,Lt.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=Lt.workingColorSpace){if(e=Ul(e,1),t=Pt(t,0,1),n=Pt(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=zr(o,r,e+1/3),this.g=zr(o,r,e),this.b=zr(o,r,e-1/3)}return Lt.toWorkingColorSpace(this,i),this}setStyle(e,t=cn){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^((?:rgb|hsl)a?)\(([^\)]*)\)/.exec(e)){let r;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(255,parseInt(r[1],10))/255,this.g=Math.min(255,parseInt(r[2],10))/255,this.b=Math.min(255,parseInt(r[3],10))/255,Lt.toWorkingColorSpace(this,t),n(r[4]),this;if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(100,parseInt(r[1],10))/100,this.g=Math.min(100,parseInt(r[2],10))/100,this.b=Math.min(100,parseInt(r[3],10))/100,Lt.toWorkingColorSpace(this,t),n(r[4]),this;break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a)){const c=parseFloat(r[1])/360,l=parseFloat(r[2])/100,u=parseFloat(r[3])/100;return n(r[4]),this.setHSL(c,l,u,t)}break}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],o=r.length;if(o===3)return this.r=parseInt(r.charAt(0)+r.charAt(0),16)/255,this.g=parseInt(r.charAt(1)+r.charAt(1),16)/255,this.b=parseInt(r.charAt(2)+r.charAt(2),16)/255,Lt.toWorkingColorSpace(this,t),this;if(o===6)return this.r=parseInt(r.charAt(0)+r.charAt(1),16)/255,this.g=parseInt(r.charAt(2)+r.charAt(3),16)/255,this.b=parseInt(r.charAt(4)+r.charAt(5),16)/255,Lt.toWorkingColorSpace(this,t),this}return e&&e.length>0?this.setColorName(e,t):this}setColorName(e,t=cn){const n=fo[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Xn(e.r),this.g=Xn(e.g),this.b=Xn(e.b),this}copyLinearToSRGB(e){return this.r=_r(e.r),this.g=_r(e.g),this.b=_r(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=cn){return Lt.fromWorkingColorSpace(Ki(this,mt),e),Pt(mt.r*255,0,255)<<16^Pt(mt.g*255,0,255)<<8^Pt(mt.b*255,0,255)<<0}getHexString(e=cn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Lt.workingColorSpace){Lt.fromWorkingColorSpace(Ki(this,mt),t);const n=mt.r,i=mt.g,r=mt.b,o=Math.max(n,i,r),a=Math.min(n,i,r);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(i-r)/h+(i<r?6:0);break;case i:c=(r-n)/h+2;break;case r:c=(n-i)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=Lt.workingColorSpace){return Lt.fromWorkingColorSpace(Ki(this,mt),t),e.r=mt.r,e.g=mt.g,e.b=mt.b,e}getStyle(e=cn){return Lt.fromWorkingColorSpace(Ki(this,mt),e),e!==cn?`color(${e} ${mt.r} ${mt.g} ${mt.b})`:`rgb(${mt.r*255|0},${mt.g*255|0},${mt.b*255|0})`}offsetHSL(e,t,n){return this.getHSL(Kt),Kt.h+=e,Kt.s+=t,Kt.l+=n,this.setHSL(Kt.h,Kt.s,Kt.l),this}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Kt),e.getHSL($i);const n=Fr(Kt.h,$i.h,t),i=Fr(Kt.s,$i.s,t),r=Fr(Kt.l,$i.l,t);return this.setHSL(n,i,r),this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}Ye.NAMES=fo;let ti;class po{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ti===void 0&&(ti=Sr("canvas")),ti.width=e.width,ti.height=e.height;const n=ti.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=ti}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Sr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=Xn(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Xn(t[n]/255)*255):t[n]=Xn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}class mo{constructor(e=null){this.isSource=!0,this.uuid=Gi(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(Br(i[o].image)):r.push(Br(i[o]))}else r=Br(i);n.url=r}return t||(e.images[this.uuid]=n),n}}function Br(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?po.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let zl=0;class It extends $n{constructor(e=It.DEFAULT_IMAGE,t=It.DEFAULT_MAPPING,n=Gt,i=Gt,r=bt,o=bi,a=Ht,c=Yn,l=It.DEFAULT_ANISOTROPY,u=Tn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:zl++}),this.uuid=Gi(),this.name="",this.source=new mo(e),this.mipmaps=[],this.mapping=t,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new Ge(0,0),this.repeat=new Ge(1,1),this.center=new Ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.encoding=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.encoding=e.encoding,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.5,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,type:this.type,encoding:this.encoding,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==lo)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case vr:e.x=e.x-Math.floor(e.x);break;case Gt:e.x=e.x<0?0:1;break;case vs:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case vr:e.y=e.y-Math.floor(e.y);break;case Gt:e.y=e.y<0?0:1;break;case vs:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}It.DEFAULT_IMAGE=null;It.DEFAULT_MAPPING=lo;It.DEFAULT_ANISOTROPY=1;class wt{constructor(e=0,t=0,n=0,i=1){wt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const c=e.elements,l=c[0],u=c[4],h=c[8],f=c[1],g=c[5],v=c[9],m=c[2],d=c[6],M=c[10];if(Math.abs(u-f)<.01&&Math.abs(h-m)<.01&&Math.abs(v-d)<.01){if(Math.abs(u+f)<.1&&Math.abs(h+m)<.1&&Math.abs(v+d)<.1&&Math.abs(l+g+M-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const w=(l+1)/2,T=(g+1)/2,E=(M+1)/2,N=(u+f)/4,B=(h+m)/4,x=(v+d)/4;return w>T&&w>E?w<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(w),i=N/n,r=B/n):T>E?T<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(T),n=N/i,r=x/i):E<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(E),n=B/r,i=x/r),this.set(n,i,r,t),this}let C=Math.sqrt((d-v)*(d-v)+(h-m)*(h-m)+(f-u)*(f-u));return Math.abs(C)<.001&&(C=1),this.x=(d-v)/C,this.y=(h-m)/C,this.z=(f-u)/C,this.w=Math.acos((l+g+M-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class jn extends $n{constructor(e=1,t=1,n={}){super(),this.isWebGLRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new wt(0,0,e,t),this.scissorTest=!1,this.viewport=new wt(0,0,e,t);const i={width:e,height:t,depth:1};this.texture=new It(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.encoding),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps!==void 0?n.generateMipmaps:!1,this.texture.internalFormat=n.internalFormat!==void 0?n.internalFormat:null,this.texture.minFilter=n.minFilter!==void 0?n.minFilter:bt,this.depthBuffer=n.depthBuffer!==void 0?n.depthBuffer:!0,this.stencilBuffer=n.stencilBuffer!==void 0?n.stencilBuffer:!1,this.depthTexture=n.depthTexture!==void 0?n.depthTexture:null,this.samples=n.samples!==void 0?n.samples:0}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new mo(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class go extends It{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=yt,this.minFilter=yt,this.wrapR=Gt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Bl extends It{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=yt,this.minFilter=yt,this.wrapR=Gt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class on{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let c=n[i+0],l=n[i+1],u=n[i+2],h=n[i+3];const f=r[o+0],g=r[o+1],v=r[o+2],m=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=f,e[t+1]=g,e[t+2]=v,e[t+3]=m;return}if(h!==m||c!==f||l!==g||u!==v){let d=1-a;const M=c*f+l*g+u*v+h*m,C=M>=0?1:-1,w=1-M*M;if(w>Number.EPSILON){const E=Math.sqrt(w),N=Math.atan2(E,M*C);d=Math.sin(d*N)/E,a=Math.sin(a*N)/E}const T=a*C;if(c=c*d+f*T,l=l*d+g*T,u=u*d+v*T,h=h*d+m*T,d===1-a){const E=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=E,l*=E,u*=E,h*=E}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,r,o){const a=n[i],c=n[i+1],l=n[i+2],u=n[i+3],h=r[o],f=r[o+1],g=r[o+2],v=r[o+3];return e[t]=a*v+u*h+c*g-l*f,e[t+1]=c*v+u*f+l*h-a*g,e[t+2]=l*v+u*g+a*f-c*h,e[t+3]=u*v-a*h-c*f-l*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t){const n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(i/2),h=a(r/2),f=c(n/2),g=c(i/2),v=c(r/2);switch(o){case"XYZ":this._x=f*u*h+l*g*v,this._y=l*g*h-f*u*v,this._z=l*u*v+f*g*h,this._w=l*u*h-f*g*v;break;case"YXZ":this._x=f*u*h+l*g*v,this._y=l*g*h-f*u*v,this._z=l*u*v-f*g*h,this._w=l*u*h+f*g*v;break;case"ZXY":this._x=f*u*h-l*g*v,this._y=l*g*h+f*u*v,this._z=l*u*v+f*g*h,this._w=l*u*h-f*g*v;break;case"ZYX":this._x=f*u*h-l*g*v,this._y=l*g*h+f*u*v,this._z=l*u*v-f*g*h,this._w=l*u*h+f*g*v;break;case"YZX":this._x=f*u*h+l*g*v,this._y=l*g*h+f*u*v,this._z=l*u*v-f*g*h,this._w=l*u*h-f*g*v;break;case"XZY":this._x=f*u*h-l*g*v,this._y=l*g*h-f*u*v,this._z=l*u*v+f*g*h,this._w=l*u*h+f*g*v;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t!==!1&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],f=n+a+h;if(f>0){const g=.5/Math.sqrt(f+1);this._w=.25/g,this._x=(u-c)*g,this._y=(r-l)*g,this._z=(o-i)*g}else if(n>a&&n>h){const g=2*Math.sqrt(1+n-a-h);this._w=(u-c)/g,this._x=.25*g,this._y=(i+o)/g,this._z=(r+l)/g}else if(a>h){const g=2*Math.sqrt(1+a-n-h);this._w=(r-l)/g,this._x=(i+o)/g,this._y=.25*g,this._z=(c+u)/g}else{const g=2*Math.sqrt(1+h-n-a);this._w=(o-i)/g,this._x=(r+l)/g,this._y=(c+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Pt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+o*a+i*l-r*c,this._y=i*u+o*c+r*a-n*l,this._z=r*u+o*l+n*c-i*a,this._w=o*u-n*a-i*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,r=this._z,o=this._w;let a=o*e._w+n*e._x+i*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const g=1-t;return this._w=g*o+t*this._w,this._x=g*n+t*this._x,this._y=g*i+t*this._y,this._z=g*r+t*this._z,this.normalize(),this._onChangeCallback(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-t)*u)/l,f=Math.sin(t*u)/l;return this._w=o*h+this._w*f,this._x=n*h+this._x*f,this._y=i*h+this._y*f,this._z=r*h+this._z*f,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(r),n*Math.cos(r),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class W{constructor(e=0,t=0,n=0){W.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ha.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ha.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=c*t+o*i-a*n,u=c*n+a*t-r*i,h=c*i+r*n-o*t,f=-r*t-o*n-a*i;return this.x=l*c+f*-r+u*-a-h*-o,this.y=u*c+f*-o+h*-r-l*-a,this.z=h*c+f*-a+l*-o-u*-r,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=i*c-r*a,this.y=r*o-n*c,this.z=n*a-i*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return kr.copy(this).projectOnVector(e),this.sub(kr)}reflect(e){return this.sub(kr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Pt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const kr=new W,ha=new on;class Hi{constructor(e=new W(1/0,1/0,1/0),t=new W(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.length;c<l;c+=3){const u=e[c],h=e[c+1],f=e[c+2];u<t&&(t=u),h<n&&(n=h),f<i&&(i=f),u>r&&(r=u),h>o&&(o=h),f>a&&(a=f)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromBufferAttribute(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.count;c<l;c++){const u=e.getX(c),h=e.getY(c),f=e.getZ(c);u<t&&(t=u),h<n&&(n=h),f<i&&(i=f),u>r&&(r=u),h>o&&(o=h),f>a&&(a=f)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Nn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0)if(t&&n.attributes!=null&&n.attributes.position!==void 0){const r=n.attributes.position;for(let o=0,a=r.count;o<a;o++)Nn.fromBufferAttribute(r,o).applyMatrix4(e.matrixWorld),this.expandByPoint(Nn)}else n.boundingBox===null&&n.computeBoundingBox(),Gr.copy(n.boundingBox),Gr.applyMatrix4(e.matrixWorld),this.union(Gr);const i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Nn),Nn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ci),Ji.subVectors(this.max,Ci),ni.subVectors(e.a,Ci),ii.subVectors(e.b,Ci),ri.subVectors(e.c,Ci),An.subVectors(ii,ni),Cn.subVectors(ri,ii),Fn.subVectors(ni,ri);let t=[0,-An.z,An.y,0,-Cn.z,Cn.y,0,-Fn.z,Fn.y,An.z,0,-An.x,Cn.z,0,-Cn.x,Fn.z,0,-Fn.x,-An.y,An.x,0,-Cn.y,Cn.x,0,-Fn.y,Fn.x,0];return!Hr(t,ni,ii,ri,Ji)||(t=[1,0,0,0,1,0,0,0,1],!Hr(t,ni,ii,ri,Ji))?!1:(Qi.crossVectors(An,Cn),t=[Qi.x,Qi.y,Qi.z],Hr(t,ni,ii,ri,Ji))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return Nn.copy(e).clamp(this.min,this.max).sub(e).length()}getBoundingSphere(e){return this.getCenter(e.center),e.radius=this.getSize(Nn).length()*.5,e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(pn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const pn=[new W,new W,new W,new W,new W,new W,new W,new W],Nn=new W,Gr=new Hi,ni=new W,ii=new W,ri=new W,An=new W,Cn=new W,Fn=new W,Ci=new W,Ji=new W,Qi=new W,On=new W;function Hr(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){On.fromArray(s,r);const a=i.x*Math.abs(On.x)+i.y*Math.abs(On.y)+i.z*Math.abs(On.z),c=e.dot(On),l=t.dot(On),u=n.dot(On);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const kl=new Hi,Li=new W,Vr=new W;class Ls{constructor(e=new W,t=-1){this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):kl.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Li.subVectors(e,this.center);const t=Li.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Li,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Vr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Li.copy(e.center).add(Vr)),this.expandByPoint(Li.copy(e.center).sub(Vr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const mn=new W,Wr=new W,er=new W,Ln=new W,Xr=new W,tr=new W,qr=new W;class Gl{constructor(e=new W,t=new W(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.direction).multiplyScalar(e).add(this.origin)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,mn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.direction).multiplyScalar(n).add(this.origin)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=mn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(mn.copy(this.direction).multiplyScalar(t).add(this.origin),mn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Wr.copy(e).add(t).multiplyScalar(.5),er.copy(t).sub(e).normalize(),Ln.copy(this.origin).sub(Wr);const r=e.distanceTo(t)*.5,o=-this.direction.dot(er),a=Ln.dot(this.direction),c=-Ln.dot(er),l=Ln.lengthSq(),u=Math.abs(1-o*o);let h,f,g,v;if(u>0)if(h=o*c-a,f=o*a-c,v=r*u,h>=0)if(f>=-v)if(f<=v){const m=1/u;h*=m,f*=m,g=h*(h+o*f+2*a)+f*(o*h+f+2*c)+l}else f=r,h=Math.max(0,-(o*f+a)),g=-h*h+f*(f+2*c)+l;else f=-r,h=Math.max(0,-(o*f+a)),g=-h*h+f*(f+2*c)+l;else f<=-v?(h=Math.max(0,-(-o*r+a)),f=h>0?-r:Math.min(Math.max(-r,-c),r),g=-h*h+f*(f+2*c)+l):f<=v?(h=0,f=Math.min(Math.max(-r,-c),r),g=f*(f+2*c)+l):(h=Math.max(0,-(o*r+a)),f=h>0?r:Math.min(Math.max(-r,-c),r),g=-h*h+f*(f+2*c)+l);else f=o>0?-r:r,h=Math.max(0,-(o*f+a)),g=-h*h+f*(f+2*c)+l;return n&&n.copy(this.direction).multiplyScalar(h).add(this.origin),i&&i.copy(er).multiplyScalar(f).add(Wr),g}intersectSphere(e,t){mn.subVectors(e.center,this.origin);const n=mn.dot(this.direction),i=mn.dot(mn)-n*n,r=e.radius*e.radius;if(i>r)return null;const o=Math.sqrt(r-i),a=n-o,c=n+o;return a<0&&c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,f=this.origin;return l>=0?(n=(e.min.x-f.x)*l,i=(e.max.x-f.x)*l):(n=(e.max.x-f.x)*l,i=(e.min.x-f.x)*l),u>=0?(r=(e.min.y-f.y)*u,o=(e.max.y-f.y)*u):(r=(e.max.y-f.y)*u,o=(e.min.y-f.y)*u),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),h>=0?(a=(e.min.z-f.z)*h,c=(e.max.z-f.z)*h):(a=(e.max.z-f.z)*h,c=(e.min.z-f.z)*h),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,mn)!==null}intersectTriangle(e,t,n,i,r){Xr.subVectors(t,e),tr.subVectors(n,e),qr.crossVectors(Xr,tr);let o=this.direction.dot(qr),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ln.subVectors(this.origin,e);const c=a*this.direction.dot(tr.crossVectors(Ln,tr));if(c<0)return null;const l=a*this.direction.dot(Xr.cross(Ln));if(l<0||c+l>o)return null;const u=-a*Ln.dot(qr);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class _t{constructor(){_t.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}set(e,t,n,i,r,o,a,c,l,u,h,f,g,v,m,d){const M=this.elements;return M[0]=e,M[4]=t,M[8]=n,M[12]=i,M[1]=r,M[5]=o,M[9]=a,M[13]=c,M[2]=l,M[6]=u,M[10]=h,M[14]=f,M[3]=g,M[7]=v,M[11]=m,M[15]=d,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new _t().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/si.setFromMatrixColumn(e,0).length(),r=1/si.setFromMatrixColumn(e,1).length(),o=1/si.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){const f=o*u,g=o*h,v=a*u,m=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=g+v*l,t[5]=f-m*l,t[9]=-a*c,t[2]=m-f*l,t[6]=v+g*l,t[10]=o*c}else if(e.order==="YXZ"){const f=c*u,g=c*h,v=l*u,m=l*h;t[0]=f+m*a,t[4]=v*a-g,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=g*a-v,t[6]=m+f*a,t[10]=o*c}else if(e.order==="ZXY"){const f=c*u,g=c*h,v=l*u,m=l*h;t[0]=f-m*a,t[4]=-o*h,t[8]=v+g*a,t[1]=g+v*a,t[5]=o*u,t[9]=m-f*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){const f=o*u,g=o*h,v=a*u,m=a*h;t[0]=c*u,t[4]=v*l-g,t[8]=f*l+m,t[1]=c*h,t[5]=m*l+f,t[9]=g*l-v,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){const f=o*c,g=o*l,v=a*c,m=a*l;t[0]=c*u,t[4]=m-f*h,t[8]=v*h+g,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=g*h+v,t[10]=f-m*h}else if(e.order==="XZY"){const f=o*c,g=o*l,v=a*c,m=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=f*h+m,t[5]=o*u,t[9]=g*h-v,t[2]=v*h-g,t[6]=a*u,t[10]=m*h+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Hl,e,Vl)}lookAt(e,t,n){const i=this.elements;return Bt.subVectors(e,t),Bt.lengthSq()===0&&(Bt.z=1),Bt.normalize(),Rn.crossVectors(n,Bt),Rn.lengthSq()===0&&(Math.abs(n.z)===1?Bt.x+=1e-4:Bt.z+=1e-4,Bt.normalize(),Rn.crossVectors(n,Bt)),Rn.normalize(),nr.crossVectors(Bt,Rn),i[0]=Rn.x,i[4]=nr.x,i[8]=Bt.x,i[1]=Rn.y,i[5]=nr.y,i[9]=Bt.y,i[2]=Rn.z,i[6]=nr.z,i[10]=Bt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],f=n[9],g=n[13],v=n[2],m=n[6],d=n[10],M=n[14],C=n[3],w=n[7],T=n[11],E=n[15],N=i[0],B=i[4],x=i[8],L=i[12],H=i[1],ne=i[5],oe=i[9],z=i[13],F=i[2],ee=i[6],le=i[10],he=i[14],te=i[3],_e=i[7],re=i[11],Y=i[15];return r[0]=o*N+a*H+c*F+l*te,r[4]=o*B+a*ne+c*ee+l*_e,r[8]=o*x+a*oe+c*le+l*re,r[12]=o*L+a*z+c*he+l*Y,r[1]=u*N+h*H+f*F+g*te,r[5]=u*B+h*ne+f*ee+g*_e,r[9]=u*x+h*oe+f*le+g*re,r[13]=u*L+h*z+f*he+g*Y,r[2]=v*N+m*H+d*F+M*te,r[6]=v*B+m*ne+d*ee+M*_e,r[10]=v*x+m*oe+d*le+M*re,r[14]=v*L+m*z+d*he+M*Y,r[3]=C*N+w*H+T*F+E*te,r[7]=C*B+w*ne+T*ee+E*_e,r[11]=C*x+w*oe+T*le+E*re,r[15]=C*L+w*z+T*he+E*Y,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],f=e[10],g=e[14],v=e[3],m=e[7],d=e[11],M=e[15];return v*(+r*c*h-i*l*h-r*a*f+n*l*f+i*a*g-n*c*g)+m*(+t*c*g-t*l*f+r*o*f-i*o*g+i*l*u-r*c*u)+d*(+t*l*h-t*a*g-r*o*h+n*o*g+r*a*u-n*l*u)+M*(-i*a*u-t*c*h+t*a*f+i*o*h-n*o*f+n*c*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],f=e[10],g=e[11],v=e[12],m=e[13],d=e[14],M=e[15],C=h*d*l-m*f*l+m*c*g-a*d*g-h*c*M+a*f*M,w=v*f*l-u*d*l-v*c*g+o*d*g+u*c*M-o*f*M,T=u*m*l-v*h*l+v*a*g-o*m*g-u*a*M+o*h*M,E=v*h*c-u*m*c-v*a*f+o*m*f+u*a*d-o*h*d,N=t*C+n*w+i*T+r*E;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/N;return e[0]=C*B,e[1]=(m*f*r-h*d*r-m*i*g+n*d*g+h*i*M-n*f*M)*B,e[2]=(a*d*r-m*c*r+m*i*l-n*d*l-a*i*M+n*c*M)*B,e[3]=(h*c*r-a*f*r-h*i*l+n*f*l+a*i*g-n*c*g)*B,e[4]=w*B,e[5]=(u*d*r-v*f*r+v*i*g-t*d*g-u*i*M+t*f*M)*B,e[6]=(v*c*r-o*d*r-v*i*l+t*d*l+o*i*M-t*c*M)*B,e[7]=(o*f*r-u*c*r+u*i*l-t*f*l-o*i*g+t*c*g)*B,e[8]=T*B,e[9]=(v*h*r-u*m*r-v*n*g+t*m*g+u*n*M-t*h*M)*B,e[10]=(o*m*r-v*a*r+v*n*l-t*m*l-o*n*M+t*a*M)*B,e[11]=(u*a*r-o*h*r-u*n*l+t*h*l+o*n*g-t*a*g)*B,e[12]=E*B,e[13]=(u*m*i-v*h*i+v*n*f-t*m*f-u*n*d+t*h*d)*B,e[14]=(v*a*i-o*m*i-v*n*c+t*m*c+o*n*d-t*a*d)*B,e[15]=(o*h*i-u*a*i+u*n*c-t*h*c-o*n*f+t*a*f)*B,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,u=r*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,u*a+n,u*c-i*o,0,l*c-i*a,u*c+i*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,u=o+o,h=a+a,f=r*l,g=r*u,v=r*h,m=o*u,d=o*h,M=a*h,C=c*l,w=c*u,T=c*h,E=n.x,N=n.y,B=n.z;return i[0]=(1-(m+M))*E,i[1]=(g+T)*E,i[2]=(v-w)*E,i[3]=0,i[4]=(g-T)*N,i[5]=(1-(f+M))*N,i[6]=(d+C)*N,i[7]=0,i[8]=(v+w)*B,i[9]=(d-C)*B,i[10]=(1-(f+m))*B,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let r=si.set(i[0],i[1],i[2]).length();const o=si.set(i[4],i[5],i[6]).length(),a=si.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],Jt.copy(this);const l=1/r,u=1/o,h=1/a;return Jt.elements[0]*=l,Jt.elements[1]*=l,Jt.elements[2]*=l,Jt.elements[4]*=u,Jt.elements[5]*=u,Jt.elements[6]*=u,Jt.elements[8]*=h,Jt.elements[9]*=h,Jt.elements[10]*=h,t.setFromRotationMatrix(Jt),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,o){const a=this.elements,c=2*r/(t-e),l=2*r/(n-i),u=(t+e)/(t-e),h=(n+i)/(n-i),f=-(o+r)/(o-r),g=-2*o*r/(o-r);return a[0]=c,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=l,a[9]=h,a[13]=0,a[2]=0,a[6]=0,a[10]=f,a[14]=g,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,n,i,r,o){const a=this.elements,c=1/(t-e),l=1/(n-i),u=1/(o-r),h=(t+e)*c,f=(n+i)*l,g=(o+r)*u;return a[0]=2*c,a[4]=0,a[8]=0,a[12]=-h,a[1]=0,a[5]=2*l,a[9]=0,a[13]=-f,a[2]=0,a[6]=0,a[10]=-2*u,a[14]=-g,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const si=new W,Jt=new _t,Hl=new W(0,0,0),Vl=new W(1,1,1),Rn=new W,nr=new W,Bt=new W,da=new _t,fa=new on;class Vi{constructor(e=0,t=0,n=0,i=Vi.DefaultOrder){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],o=i[4],a=i[8],c=i[1],l=i[5],u=i[9],h=i[2],f=i[6],g=i[10];switch(t){case"XYZ":this._y=Math.asin(Pt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Pt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,g),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Pt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-h,g),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Pt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(f,g),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Pt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,g));break;case"XZY":this._z=Math.asin(-Pt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,g),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return da.makeRotationFromQuaternion(e),this.setFromRotationMatrix(da,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return fa.setFromEuler(this),this.setFromQuaternion(fa,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}toVector3(){console.error("THREE.Euler: .toVector3() has been removed. Use Vector3.setFromEuler() instead")}}Vi.DefaultOrder="XYZ";Vi.RotationOrders=["XYZ","YZX","ZXY","XZY","YXZ","ZYX"];class _o{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Wl=0;const pa=new W,ai=new on,gn=new _t,ir=new W,Ri=new W,Xl=new W,ql=new on,ma=new W(1,0,0),ga=new W(0,1,0),_a=new W(0,0,1),Zl={type:"added"},xa={type:"removed"};class Tt extends $n{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Wl++}),this.uuid=Gi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Tt.DefaultUp.clone();const e=new W,t=new Vi,n=new on,i=new W(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new _t},normalMatrix:{value:new Vt}}),this.matrix=new _t,this.matrixWorld=new _t,this.matrixAutoUpdate=Tt.DefaultMatrixAutoUpdate,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=Tt.DefaultMatrixWorldAutoUpdate,this.layers=new _o,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ai.setFromAxisAngle(e,t),this.quaternion.multiply(ai),this}rotateOnWorldAxis(e,t){return ai.setFromAxisAngle(e,t),this.quaternion.premultiply(ai),this}rotateX(e){return this.rotateOnAxis(ma,e)}rotateY(e){return this.rotateOnAxis(ga,e)}rotateZ(e){return this.rotateOnAxis(_a,e)}translateOnAxis(e,t){return pa.copy(e).applyQuaternion(this.quaternion),this.position.add(pa.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ma,e)}translateY(e){return this.translateOnAxis(ga,e)}translateZ(e){return this.translateOnAxis(_a,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(gn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ir.copy(e):ir.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Ri.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?gn.lookAt(Ri,ir,this.up):gn.lookAt(ir,Ri,this.up),this.quaternion.setFromRotationMatrix(gn),i&&(gn.extractRotation(i.matrixWorld),ai.setFromRotationMatrix(gn),this.quaternion.premultiply(ai.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(Zl)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(xa)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){for(let e=0;e<this.children.length;e++){const t=this.children[e];t.parent=null,t.dispatchEvent(xa)}return this.children.length=0,this}attach(e){return this.updateWorldMatrix(!0,!1),gn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),gn.multiply(e.parent.matrixWorld)),e.applyMatrix4(gn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t){let n=[];this[e]===t&&n.push(this);for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectsByProperty(e,t);o.length>0&&(n=n.concat(o))}return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,e,Xl),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ri,ql,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++){const r=t[n];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const i=this.children;for(let r=0,o=i.length;r<o;r++){const a=i[r];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.5,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const h=c[l];r(e.shapes,h)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];i.animations.push(r(e.animations,c))}}if(t){const a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),f=o(e.skeletons),g=o(e.animations),v=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),f.length>0&&(n.skeletons=f),g.length>0&&(n.animations=g),v.length>0&&(n.nodes=v)}return n.object=i,n;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}Tt.DefaultUp=new W(0,1,0);Tt.DefaultMatrixAutoUpdate=!0;Tt.DefaultMatrixWorldAutoUpdate=!0;const Qt=new W,_n=new W,Zr=new W,xn=new W,oi=new W,li=new W,va=new W,Yr=new W,jr=new W,$r=new W;class Mn{constructor(e=new W,t=new W,n=new W){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Qt.subVectors(e,t),i.cross(Qt);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Qt.subVectors(i,t),_n.subVectors(n,t),Zr.subVectors(e,t);const o=Qt.dot(Qt),a=Qt.dot(_n),c=Qt.dot(Zr),l=_n.dot(_n),u=_n.dot(Zr),h=o*l-a*a;if(h===0)return r.set(-2,-1,-1);const f=1/h,g=(l*c-a*u)*f,v=(o*u-a*c)*f;return r.set(1-g-v,v,g)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,xn),xn.x>=0&&xn.y>=0&&xn.x+xn.y<=1}static getUV(e,t,n,i,r,o,a,c){return this.getBarycoord(e,t,n,i,xn),c.set(0,0),c.addScaledVector(r,xn.x),c.addScaledVector(o,xn.y),c.addScaledVector(a,xn.z),c}static isFrontFacing(e,t,n,i){return Qt.subVectors(n,t),_n.subVectors(e,t),Qt.cross(_n).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Qt.subVectors(this.c,this.b),_n.subVectors(this.a,this.b),Qt.cross(_n).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Mn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Mn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,r){return Mn.getUV(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return Mn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Mn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let o,a;oi.subVectors(i,n),li.subVectors(r,n),Yr.subVectors(e,n);const c=oi.dot(Yr),l=li.dot(Yr);if(c<=0&&l<=0)return t.copy(n);jr.subVectors(e,i);const u=oi.dot(jr),h=li.dot(jr);if(u>=0&&h<=u)return t.copy(i);const f=c*h-u*l;if(f<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(n).addScaledVector(oi,o);$r.subVectors(e,r);const g=oi.dot($r),v=li.dot($r);if(v>=0&&g<=v)return t.copy(r);const m=g*l-c*v;if(m<=0&&l>=0&&v<=0)return a=l/(l-v),t.copy(n).addScaledVector(li,a);const d=u*v-g*h;if(d<=0&&h-u>=0&&g-v>=0)return va.subVectors(r,i),a=(h-u)/(h-u+(g-v)),t.copy(i).addScaledVector(va,a);const M=1/(d+m+f);return o=m*M,a=f*M,t.copy(n).addScaledVector(oi,o).addScaledVector(li,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}let Yl=0;class br extends $n{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Yl++}),this.uuid=Gi(),this.name="",this.type="Material",this.blending=vi,this.side=Zn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=so,this.blendDst=ao,this.blendEquation=gi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=gs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ol,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ir,this.stencilZFail=Ir,this.stencilZPass=Ir,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn("THREE.Material: '"+t+"' parameter is undefined.");continue}const i=this[t];if(i===void 0){console.warn("THREE."+this.type+": '"+t+"' is not a property of this material.");continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.5,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==vi&&(n.blending=this.blending),this.side!==Zn&&(n.side=this.side),this.vertexColors&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=this.transparent),n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.stencilWrite=this.stencilWrite,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(n.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=this.premultipliedAlpha),this.wireframe===!0&&(n.wireframe=this.wireframe),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=this.flatShading),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(t){const r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class xo extends br{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ye(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=oo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const pt=new W,rr=new Ge;class Wt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=oa,this.updateRange={offset:0,count:-1},this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)rr.fromBufferAttribute(this,t),rr.applyMatrix3(e),this.setXY(t,rr.x,rr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyMatrix3(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyMatrix4(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyNormalMatrix(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.transformDirection(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}set(e,t=0){return this.array.set(e,t),this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ji(t,this.array)),t}setX(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ji(t,this.array)),t}setY(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ji(t,this.array)),t}setZ(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ji(t,this.array)),t}setW(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),n=zt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),n=zt(n,this.array),i=zt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),n=zt(n,this.array),i=zt(i,this.array),r=zt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==oa&&(e.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(e.updateRange=this.updateRange),e}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class vo extends Wt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class So extends Wt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class qn extends Wt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let jl=0;const Xt=new _t,Kr=new Tt,ci=new W,kt=new Hi,Di=new Hi,Mt=new W;class En extends $n{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:jl++}),this.uuid=Gi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ho(e)?So:vo)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Vt().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Xt.makeRotationFromQuaternion(e),this.applyMatrix4(Xt),this}rotateX(e){return Xt.makeRotationX(e),this.applyMatrix4(Xt),this}rotateY(e){return Xt.makeRotationY(e),this.applyMatrix4(Xt),this}rotateZ(e){return Xt.makeRotationZ(e),this.applyMatrix4(Xt),this}translate(e,t,n){return Xt.makeTranslation(e,t,n),this.applyMatrix4(Xt),this}scale(e,t,n){return Xt.makeScale(e,t,n),this.applyMatrix4(Xt),this}lookAt(e){return Kr.lookAt(e),Kr.updateMatrix(),this.applyMatrix4(Kr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ci).negate(),this.translate(ci.x,ci.y,ci.z),this}setFromPoints(e){const t=[];for(let n=0,i=e.length;n<i;n++){const r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new qn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Hi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new W(-1/0,-1/0,-1/0),new W(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];kt.setFromBufferAttribute(r),this.morphTargetsRelative?(Mt.addVectors(this.boundingBox.min,kt.min),this.boundingBox.expandByPoint(Mt),Mt.addVectors(this.boundingBox.max,kt.max),this.boundingBox.expandByPoint(Mt)):(this.boundingBox.expandByPoint(kt.min),this.boundingBox.expandByPoint(kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ls);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new W,1/0);return}if(e){const n=this.boundingSphere.center;if(kt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const a=t[r];Di.setFromBufferAttribute(a),this.morphTargetsRelative?(Mt.addVectors(kt.min,Di.min),kt.expandByPoint(Mt),Mt.addVectors(kt.max,Di.max),kt.expandByPoint(Mt)):(kt.expandByPoint(Di.min),kt.expandByPoint(Di.max))}kt.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)Mt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Mt));if(t)for(let r=0,o=t.length;r<o;r++){const a=t[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)Mt.fromBufferAttribute(a,l),c&&(ci.fromBufferAttribute(e,l),Mt.add(ci)),i=Math.max(i,n.distanceToSquared(Mt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,i=t.position.array,r=t.normal.array,o=t.uv.array,a=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Wt(new Float32Array(4*a),4));const c=this.getAttribute("tangent").array,l=[],u=[];for(let H=0;H<a;H++)l[H]=new W,u[H]=new W;const h=new W,f=new W,g=new W,v=new Ge,m=new Ge,d=new Ge,M=new W,C=new W;function w(H,ne,oe){h.fromArray(i,H*3),f.fromArray(i,ne*3),g.fromArray(i,oe*3),v.fromArray(o,H*2),m.fromArray(o,ne*2),d.fromArray(o,oe*2),f.sub(h),g.sub(h),m.sub(v),d.sub(v);const z=1/(m.x*d.y-d.x*m.y);isFinite(z)&&(M.copy(f).multiplyScalar(d.y).addScaledVector(g,-m.y).multiplyScalar(z),C.copy(g).multiplyScalar(m.x).addScaledVector(f,-d.x).multiplyScalar(z),l[H].add(M),l[ne].add(M),l[oe].add(M),u[H].add(C),u[ne].add(C),u[oe].add(C))}let T=this.groups;T.length===0&&(T=[{start:0,count:n.length}]);for(let H=0,ne=T.length;H<ne;++H){const oe=T[H],z=oe.start,F=oe.count;for(let ee=z,le=z+F;ee<le;ee+=3)w(n[ee+0],n[ee+1],n[ee+2])}const E=new W,N=new W,B=new W,x=new W;function L(H){B.fromArray(r,H*3),x.copy(B);const ne=l[H];E.copy(ne),E.sub(B.multiplyScalar(B.dot(ne))).normalize(),N.crossVectors(x,ne);const z=N.dot(u[H])<0?-1:1;c[H*4]=E.x,c[H*4+1]=E.y,c[H*4+2]=E.z,c[H*4+3]=z}for(let H=0,ne=T.length;H<ne;++H){const oe=T[H],z=oe.start,F=oe.count;for(let ee=z,le=z+F;ee<le;ee+=3)L(n[ee+0]),L(n[ee+1]),L(n[ee+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Wt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,g=n.count;f<g;f++)n.setXYZ(f,0,0,0);const i=new W,r=new W,o=new W,a=new W,c=new W,l=new W,u=new W,h=new W;if(e)for(let f=0,g=e.count;f<g;f+=3){const v=e.getX(f+0),m=e.getX(f+1),d=e.getX(f+2);i.fromBufferAttribute(t,v),r.fromBufferAttribute(t,m),o.fromBufferAttribute(t,d),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),a.fromBufferAttribute(n,v),c.fromBufferAttribute(n,m),l.fromBufferAttribute(n,d),a.add(u),c.add(u),l.add(u),n.setXYZ(v,a.x,a.y,a.z),n.setXYZ(m,c.x,c.y,c.z),n.setXYZ(d,l.x,l.y,l.z)}else for(let f=0,g=t.count;f<g;f+=3)i.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),o.fromBufferAttribute(t,f+2),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),n.setXYZ(f+0,u.x,u.y,u.z),n.setXYZ(f+1,u.x,u.y,u.z),n.setXYZ(f+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeBufferGeometries() instead."),this}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Mt.fromBufferAttribute(e,t),Mt.normalize(),e.setXYZ(t,Mt.x,Mt.y,Mt.z)}toNonIndexed(){function e(a,c){const l=a.array,u=a.itemSize,h=a.normalized,f=new l.constructor(c.length*u);let g=0,v=0;for(let m=0,d=c.length;m<d;m++){a.isInterleavedBufferAttribute?g=c[m]*a.data.stride+a.offset:g=c[m]*u;for(let M=0;M<u;M++)f[v++]=l[g++]}return new Wt(f,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new En,n=this.index.array,i=this.attributes;for(const a in i){const c=i[a],l=e(c,n);t.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let u=0,h=l.length;u<h;u++){const f=l[u],g=e(f,n);c.push(g)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const i={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let h=0,f=l.length;h<f;h++){const g=l[h];u.push(g.toJSON(e.data))}u.length>0&&(i[c]=u,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const i=e.attributes;for(const l in i){const u=i[l];this.setAttribute(l,u.clone(t))}const r=e.morphAttributes;for(const l in r){const u=[],h=r[l];for(let f=0,g=h.length;f<g;f++)u.push(h[f].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let l=0,u=o.length;l<u;l++){const h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,e.parameters!==void 0&&(this.parameters=Object.assign({},e.parameters)),this}dispose(){this.dispatchEvent({type:"dispose"})}}const Sa=new _t,ui=new Gl,Jr=new Ls,Pi=new W,Ii=new W,Ni=new W,Qr=new W,sr=new W,ar=new Ge,or=new Ge,lr=new Ge,es=new W,cr=new W;class sn extends Tt{constructor(e=new En,t=new xo){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const a=this.morphTargetInfluences;if(r&&a){sr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=a[c],h=r[c];u!==0&&(Qr.fromBufferAttribute(h,e),o?sr.addScaledVector(Qr,u):sr.addScaledVector(Qr.sub(t),u))}t.add(sr)}return this.isSkinnedMesh&&this.boneTransform(e,t),t}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;if(i===void 0||(n.boundingSphere===null&&n.computeBoundingSphere(),Jr.copy(n.boundingSphere),Jr.applyMatrix4(r),e.ray.intersectsSphere(Jr)===!1)||(Sa.copy(r).invert(),ui.copy(e.ray).applyMatrix4(Sa),n.boundingBox!==null&&ui.intersectsBox(n.boundingBox)===!1))return;let o;const a=n.index,c=n.attributes.position,l=n.attributes.uv,u=n.attributes.uv2,h=n.groups,f=n.drawRange;if(a!==null)if(Array.isArray(i))for(let g=0,v=h.length;g<v;g++){const m=h[g],d=i[m.materialIndex],M=Math.max(m.start,f.start),C=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let w=M,T=C;w<T;w+=3){const E=a.getX(w),N=a.getX(w+1),B=a.getX(w+2);o=ur(this,d,e,ui,l,u,E,N,B),o&&(o.faceIndex=Math.floor(w/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,f.start),v=Math.min(a.count,f.start+f.count);for(let m=g,d=v;m<d;m+=3){const M=a.getX(m),C=a.getX(m+1),w=a.getX(m+2);o=ur(this,i,e,ui,l,u,M,C,w),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}else if(c!==void 0)if(Array.isArray(i))for(let g=0,v=h.length;g<v;g++){const m=h[g],d=i[m.materialIndex],M=Math.max(m.start,f.start),C=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let w=M,T=C;w<T;w+=3){const E=w,N=w+1,B=w+2;o=ur(this,d,e,ui,l,u,E,N,B),o&&(o.faceIndex=Math.floor(w/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,f.start),v=Math.min(c.count,f.start+f.count);for(let m=g,d=v;m<d;m+=3){const M=m,C=m+1,w=m+2;o=ur(this,i,e,ui,l,u,M,C,w),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}}}function $l(s,e,t,n,i,r,o,a){let c;if(e.side===jt?c=n.intersectTriangle(o,r,i,!0,a):c=n.intersectTriangle(i,r,o,e.side===Zn,a),c===null)return null;cr.copy(a),cr.applyMatrix4(s.matrixWorld);const l=t.ray.origin.distanceTo(cr);return l<t.near||l>t.far?null:{distance:l,point:cr.clone(),object:s}}function ur(s,e,t,n,i,r,o,a,c){s.getVertexPosition(o,Pi),s.getVertexPosition(a,Ii),s.getVertexPosition(c,Ni);const l=$l(s,e,t,n,Pi,Ii,Ni,es);if(l){i&&(ar.fromBufferAttribute(i,o),or.fromBufferAttribute(i,a),lr.fromBufferAttribute(i,c),l.uv=Mn.getUV(es,Pi,Ii,Ni,ar,or,lr,new Ge)),r&&(ar.fromBufferAttribute(r,o),or.fromBufferAttribute(r,a),lr.fromBufferAttribute(r,c),l.uv2=Mn.getUV(es,Pi,Ii,Ni,ar,or,lr,new Ge));const u={a:o,b:a,c,normal:new W,materialIndex:0};Mn.getNormal(Pi,Ii,Ni,u.normal),l.face=u}return l}class Wi extends En{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};const a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],u=[],h=[];let f=0,g=0;v("z","y","x",-1,-1,n,t,e,o,r,0),v("z","y","x",1,-1,n,t,-e,o,r,1),v("x","z","y",1,1,e,n,t,i,o,2),v("x","z","y",1,-1,e,n,-t,i,o,3),v("x","y","z",1,-1,e,t,n,i,r,4),v("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new qn(l,3)),this.setAttribute("normal",new qn(u,3)),this.setAttribute("uv",new qn(h,2));function v(m,d,M,C,w,T,E,N,B,x,L){const H=T/B,ne=E/x,oe=T/2,z=E/2,F=N/2,ee=B+1,le=x+1;let he=0,te=0;const _e=new W;for(let re=0;re<le;re++){const Y=re*ne-z;for(let q=0;q<ee;q++){const ce=q*H-oe;_e[m]=ce*C,_e[d]=Y*w,_e[M]=F,l.push(_e.x,_e.y,_e.z),_e[m]=0,_e[d]=0,_e[M]=N>0?1:-1,u.push(_e.x,_e.y,_e.z),h.push(q/B),h.push(1-re/x),he+=1}}for(let re=0;re<x;re++)for(let Y=0;Y<B;Y++){const q=f+Y+ee*re,ce=f+Y+ee*(re+1),ge=f+(Y+1)+ee*(re+1),Me=f+(Y+1)+ee*re;c.push(q,ce,Me),c.push(ce,ge,Me),te+=6}a.addGroup(g,te,L),g+=te,f+=he}}static fromJSON(e){return new Wi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Ti(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Rt(s){const e={};for(let t=0;t<s.length;t++){const n=Ti(s[t]);for(const i in n)e[i]=n[i]}return e}function Kl(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function Mo(s){return s.getRenderTarget()===null&&s.outputEncoding===rt?cn:ki}const ys={clone:Ti,merge:Rt};var Jl=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ql=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class an extends br{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Jl,this.fragmentShader=Ql,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ti(e.uniforms),this.uniformsGroups=Kl(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class yo extends Tt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new _t,this.projectionMatrix=new _t,this.projectionMatrixInverse=new _t}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(-t[8],-t[9],-t[10]).normalize()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class nn extends yo{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=ca*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Nr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ca*2*Math.atan(Math.tan(Nr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Nr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*i/c,t-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const hi=-90,di=1;class ec extends Tt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n;const i=new nn(hi,di,e,t);i.layers=this.layers,i.up.set(0,1,0),i.lookAt(1,0,0),this.add(i);const r=new nn(hi,di,e,t);r.layers=this.layers,r.up.set(0,1,0),r.lookAt(-1,0,0),this.add(r);const o=new nn(hi,di,e,t);o.layers=this.layers,o.up.set(0,0,-1),o.lookAt(0,1,0),this.add(o);const a=new nn(hi,di,e,t);a.layers=this.layers,a.up.set(0,0,1),a.lookAt(0,-1,0),this.add(a);const c=new nn(hi,di,e,t);c.layers=this.layers,c.up.set(0,1,0),c.lookAt(0,0,1),this.add(c);const l=new nn(hi,di,e,t);l.layers=this.layers,l.up.set(0,1,0),l.lookAt(0,0,-1),this.add(l)}update(e,t){this.parent===null&&this.updateMatrixWorld();const n=this.renderTarget,[i,r,o,a,c,l]=this.children,u=e.getRenderTarget(),h=e.toneMapping,f=e.xr.enabled;e.toneMapping=wn,e.xr.enabled=!1;const g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0),e.render(t,i),e.setRenderTarget(n,1),e.render(t,r),e.setRenderTarget(n,2),e.render(t,o),e.setRenderTarget(n,3),e.render(t,a),e.setRenderTarget(n,4),e.render(t,c),n.texture.generateMipmaps=g,e.setRenderTarget(n,5),e.render(t,l),e.setRenderTarget(u),e.toneMapping=h,e.xr.enabled=f,n.texture.needsPMREMUpdate=!0}}class bo extends It{constructor(e,t,n,i,r,o,a,c,l,u){e=e!==void 0?e:[],t=t!==void 0?t:Mi,super(e,t,n,i,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class tc extends jn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new bo(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.encoding),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:bt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.encoding=t.encoding,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new Wi(5,5,5),r=new an({name:"CubemapFromEquirect",uniforms:Ti(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:jt,blending:In});r.uniforms.tEquirect.value=t;const o=new sn(i,r),a=t.minFilter;return t.minFilter===bi&&(t.minFilter=bt),new ec(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,i){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}}const ts=new W,nc=new W,ic=new Vt;class Bn{constructor(e=new W(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=ts.subVectors(n,t).cross(nc.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(this.normal).multiplyScalar(-this.distanceToPoint(e)).add(e)}intersectLine(e,t){const n=e.delta(ts),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(n).multiplyScalar(r).add(e.start)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||ic.getNormalMatrix(e),i=this.coplanarPoint(ts).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const fi=new Ls,hr=new W;class Rs{constructor(e=new Bn,t=new Bn,n=new Bn,i=new Bn,r=new Bn,o=new Bn){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e){const t=this.planes,n=e.elements,i=n[0],r=n[1],o=n[2],a=n[3],c=n[4],l=n[5],u=n[6],h=n[7],f=n[8],g=n[9],v=n[10],m=n[11],d=n[12],M=n[13],C=n[14],w=n[15];return t[0].setComponents(a-i,h-c,m-f,w-d).normalize(),t[1].setComponents(a+i,h+c,m+f,w+d).normalize(),t[2].setComponents(a+r,h+l,m+g,w+M).normalize(),t[3].setComponents(a-r,h-l,m-g,w-M).normalize(),t[4].setComponents(a-o,h-u,m-v,w-C).normalize(),t[5].setComponents(a+o,h+u,m+v,w+C).normalize(),this}intersectsObject(e){const t=e.geometry;return t.boundingSphere===null&&t.computeBoundingSphere(),fi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld),this.intersectsSphere(fi)}intersectsSprite(e){return fi.center.set(0,0,0),fi.radius=.7071067811865476,fi.applyMatrix4(e.matrixWorld),this.intersectsSphere(fi)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(hr.x=i.normal.x>0?e.max.x:e.min.x,hr.y=i.normal.y>0?e.max.y:e.min.y,hr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(hr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function wo(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function rc(s,e){const t=e.isWebGL2,n=new WeakMap;function i(l,u){const h=l.array,f=l.usage,g=s.createBuffer();s.bindBuffer(u,g),s.bufferData(u,h,f),l.onUploadCallback();let v;if(h instanceof Float32Array)v=5126;else if(h instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(t)v=5131;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else v=5123;else if(h instanceof Int16Array)v=5122;else if(h instanceof Uint32Array)v=5125;else if(h instanceof Int32Array)v=5124;else if(h instanceof Int8Array)v=5120;else if(h instanceof Uint8Array)v=5121;else if(h instanceof Uint8ClampedArray)v=5121;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:v,bytesPerElement:h.BYTES_PER_ELEMENT,version:l.version}}function r(l,u,h){const f=u.array,g=u.updateRange;s.bindBuffer(h,l),g.count===-1?s.bufferSubData(h,0,f):(t?s.bufferSubData(h,g.offset*f.BYTES_PER_ELEMENT,f,g.offset,g.count):s.bufferSubData(h,g.offset*f.BYTES_PER_ELEMENT,f.subarray(g.offset,g.offset+g.count)),g.count=-1),u.onUploadCallback()}function o(l){return l.isInterleavedBufferAttribute&&(l=l.data),n.get(l)}function a(l){l.isInterleavedBufferAttribute&&(l=l.data);const u=n.get(l);u&&(s.deleteBuffer(u.buffer),n.delete(l))}function c(l,u){if(l.isGLBufferAttribute){const f=n.get(l);(!f||f.version<l.version)&&n.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);const h=n.get(l);h===void 0?n.set(l,i(l,u)):h.version<l.version&&(r(h.buffer,l,u),h.version=l.version)}return{get:o,remove:a,update:c}}class wr extends En{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(i),l=a+1,u=c+1,h=e/a,f=t/c,g=[],v=[],m=[],d=[];for(let M=0;M<u;M++){const C=M*f-o;for(let w=0;w<l;w++){const T=w*h-r;v.push(T,-C,0),m.push(0,0,1),d.push(w/a),d.push(1-M/c)}}for(let M=0;M<c;M++)for(let C=0;C<a;C++){const w=C+l*M,T=C+l*(M+1),E=C+1+l*(M+1),N=C+1+l*M;g.push(w,T,N),g.push(T,E,N)}this.setIndex(g),this.setAttribute("position",new qn(v,3)),this.setAttribute("normal",new qn(m,3)),this.setAttribute("uv",new qn(d,2))}static fromJSON(e){return new wr(e.width,e.height,e.widthSegments,e.heightSegments)}}var sc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
#endif`,ac=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,oc=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,lc=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,cc=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,uc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hc="vec3 transformed = vec3( position );",dc=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,fc=`vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
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
#endif`,pc=`#ifdef USE_IRIDESCENCE
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
#endif`,mc=`#ifdef USE_BUMPMAP
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
#endif`,gc=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,_c=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,xc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,vc=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Sc=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Mc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,yc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,bc=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,wc=`#define PI 3.141592653589793
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
}`,Tc=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Ec=`vec3 transformedNormal = objectNormal;
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
#endif`,Ac=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Cc=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );
#endif`,Lc=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rc=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Dc="gl_FragColor = linearToOutputTexel( gl_FragColor );",Pc=`vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ic=`#ifdef USE_ENVMAP
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
#endif`,Nc=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Fc=`#ifdef USE_ENVMAP
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
#endif`,Oc=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Uc=`#ifdef USE_ENVMAP
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
#endif`,zc=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Bc=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,kc=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gc=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Hc=`#ifdef USE_GRADIENTMAP
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
}`,Vc=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vUv2 );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Wc=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Xc=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,qc=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Zc=`uniform bool receiveShadow;
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
#endif`,Yc=`#if defined( USE_ENVMAP )
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
#endif`,jc=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,$c=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Kc=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Jc=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Qc=`PhysicalMaterial material;
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
#endif`,eu=`struct PhysicalMaterial {
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
}`,tu=`
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
#endif`,nu=`#if defined( RE_IndirectDiffuse )
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
#endif`,iu=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`,ru=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,su=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,au=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,ou=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,lu=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,cu=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,uu=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,hu=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	uniform mat3 uvTransform;
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,du=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vUv );
	metalnessFactor *= texelMetalness.b;
#endif`,fu=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,pu=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,mu=`#ifdef USE_MORPHNORMALS
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
#endif`,gu=`#ifdef USE_MORPHTARGETS
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
#endif`,_u=`#ifdef USE_MORPHTARGETS
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
#endif`,xu=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 geometryNormal = normal;`,vu=`#ifdef OBJECTSPACE_NORMALMAP
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
#endif`,Su=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Mu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yu=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,bu=`#ifdef USE_NORMALMAP
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
#endif`,wu=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`,Tu=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	#ifdef USE_TANGENT
		clearcoatNormal = normalize( vTBN * clearcoatMapN );
	#else
		clearcoatNormal = perturbNormal2Arb( - vViewPosition, clearcoatNormal, clearcoatMapN, faceDirection );
	#endif
#endif`,Eu=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif`,Au=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Cu=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Lu=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Ru=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Du=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Pu=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Iu=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Nu=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Fu=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Ou=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Uu=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,zu=`#if defined( USE_SHADOWMAP ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Bu=`float getShadowMask() {
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
}`,ku=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Gu=`#ifdef USE_SKINNING
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
#endif`,Hu=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Vu=`#ifdef USE_SKINNING
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
#endif`,Wu=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Xu=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,qu=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Zu=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Yu=`#ifdef USE_TRANSMISSION
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
#endif`,ju=`#ifdef USE_TRANSMISSION
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
#endif`,$u=`#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	varying vec2 vUv;
#endif`,Ku=`#ifdef USE_UV
	#ifdef UVS_VERTEX_ONLY
		vec2 vUv;
	#else
		varying vec2 vUv;
	#endif
	uniform mat3 uvTransform;
#endif`,Ju=`#ifdef USE_UV
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
#endif`,Qu=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	varying vec2 vUv2;
#endif`,eh=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	attribute vec2 uv2;
	varying vec2 vUv2;
	uniform mat3 uv2Transform;
#endif`,th=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
#endif`,nh=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const ih=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,rh=`uniform sampler2D t2D;
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
}`,sh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ah=`#ifdef ENVMAP_TYPE_CUBE
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
}`,oh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lh=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,ch=`#include <common>
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
}`,uh=`#if DEPTH_PACKING == 3200
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
}`,hh=`#define DISTANCE
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
}`,dh=`#define DISTANCE
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
}`,fh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ph=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,mh=`uniform float scale;
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
}`,gh=`uniform vec3 diffuse;
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
}`,_h=`#include <common>
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
}`,xh=`uniform vec3 diffuse;
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
}`,vh=`#define LAMBERT
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
}`,Sh=`#define LAMBERT
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
}`,Mh=`#define MATCAP
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
}`,yh=`#define MATCAP
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
}`,bh=`#define NORMAL
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
}`,wh=`#define NORMAL
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
}`,Th=`#define PHONG
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
}`,Eh=`#define PHONG
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
}`,Ah=`#define STANDARD
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
}`,Ch=`#define STANDARD
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
}`,Lh=`#define TOON
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
}`,Rh=`#define TOON
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
}`,Dh=`uniform float size;
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
}`,Ph=`uniform vec3 diffuse;
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
}`,Ih=`#include <common>
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
}`,Nh=`uniform vec3 color;
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
}`,Fh=`uniform float rotation;
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
}`,Oh=`uniform vec3 diffuse;
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
}`,Xe={alphamap_fragment:sc,alphamap_pars_fragment:ac,alphatest_fragment:oc,alphatest_pars_fragment:lc,aomap_fragment:cc,aomap_pars_fragment:uc,begin_vertex:hc,beginnormal_vertex:dc,bsdfs:fc,iridescence_fragment:pc,bumpmap_pars_fragment:mc,clipping_planes_fragment:gc,clipping_planes_pars_fragment:_c,clipping_planes_pars_vertex:xc,clipping_planes_vertex:vc,color_fragment:Sc,color_pars_fragment:Mc,color_pars_vertex:yc,color_vertex:bc,common:wc,cube_uv_reflection_fragment:Tc,defaultnormal_vertex:Ec,displacementmap_pars_vertex:Ac,displacementmap_vertex:Cc,emissivemap_fragment:Lc,emissivemap_pars_fragment:Rc,encodings_fragment:Dc,encodings_pars_fragment:Pc,envmap_fragment:Ic,envmap_common_pars_fragment:Nc,envmap_pars_fragment:Fc,envmap_pars_vertex:Oc,envmap_physical_pars_fragment:Yc,envmap_vertex:Uc,fog_vertex:zc,fog_pars_vertex:Bc,fog_fragment:kc,fog_pars_fragment:Gc,gradientmap_pars_fragment:Hc,lightmap_fragment:Vc,lightmap_pars_fragment:Wc,lights_lambert_fragment:Xc,lights_lambert_pars_fragment:qc,lights_pars_begin:Zc,lights_toon_fragment:jc,lights_toon_pars_fragment:$c,lights_phong_fragment:Kc,lights_phong_pars_fragment:Jc,lights_physical_fragment:Qc,lights_physical_pars_fragment:eu,lights_fragment_begin:tu,lights_fragment_maps:nu,lights_fragment_end:iu,logdepthbuf_fragment:ru,logdepthbuf_pars_fragment:su,logdepthbuf_pars_vertex:au,logdepthbuf_vertex:ou,map_fragment:lu,map_pars_fragment:cu,map_particle_fragment:uu,map_particle_pars_fragment:hu,metalnessmap_fragment:du,metalnessmap_pars_fragment:fu,morphcolor_vertex:pu,morphnormal_vertex:mu,morphtarget_pars_vertex:gu,morphtarget_vertex:_u,normal_fragment_begin:xu,normal_fragment_maps:vu,normal_pars_fragment:Su,normal_pars_vertex:Mu,normal_vertex:yu,normalmap_pars_fragment:bu,clearcoat_normal_fragment_begin:wu,clearcoat_normal_fragment_maps:Tu,clearcoat_pars_fragment:Eu,iridescence_pars_fragment:Au,output_fragment:Cu,packing:Lu,premultiplied_alpha_fragment:Ru,project_vertex:Du,dithering_fragment:Pu,dithering_pars_fragment:Iu,roughnessmap_fragment:Nu,roughnessmap_pars_fragment:Fu,shadowmap_pars_fragment:Ou,shadowmap_pars_vertex:Uu,shadowmap_vertex:zu,shadowmask_pars_fragment:Bu,skinbase_vertex:ku,skinning_pars_vertex:Gu,skinning_vertex:Hu,skinnormal_vertex:Vu,specularmap_fragment:Wu,specularmap_pars_fragment:Xu,tonemapping_fragment:qu,tonemapping_pars_fragment:Zu,transmission_fragment:Yu,transmission_pars_fragment:ju,uv_pars_fragment:$u,uv_pars_vertex:Ku,uv_vertex:Ju,uv2_pars_fragment:Qu,uv2_pars_vertex:eh,uv2_vertex:th,worldpos_vertex:nh,background_vert:ih,background_frag:rh,backgroundCube_vert:sh,backgroundCube_frag:ah,cube_vert:oh,cube_frag:lh,depth_vert:ch,depth_frag:uh,distanceRGBA_vert:hh,distanceRGBA_frag:dh,equirect_vert:fh,equirect_frag:ph,linedashed_vert:mh,linedashed_frag:gh,meshbasic_vert:_h,meshbasic_frag:xh,meshlambert_vert:vh,meshlambert_frag:Sh,meshmatcap_vert:Mh,meshmatcap_frag:yh,meshnormal_vert:bh,meshnormal_frag:wh,meshphong_vert:Th,meshphong_frag:Eh,meshphysical_vert:Ah,meshphysical_frag:Ch,meshtoon_vert:Lh,meshtoon_frag:Rh,points_vert:Dh,points_frag:Ph,shadow_vert:Ih,shadow_frag:Nh,sprite_vert:Fh,sprite_frag:Oh},Se={common:{diffuse:{value:new Ye(16777215)},opacity:{value:1},map:{value:null},uvTransform:{value:new Vt},uv2Transform:{value:new Vt},alphaMap:{value:null},alphaTest:{value:0}},specularmap:{specularMap:{value:null}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1}},emissivemap:{emissiveMap:{value:null}},bumpmap:{bumpMap:{value:null},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalScale:{value:new Ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementScale:{value:1},displacementBias:{value:0}},roughnessmap:{roughnessMap:{value:null}},metalnessmap:{metalnessMap:{value:null}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new Ye(16777215)},opacity:{value:1},center:{value:new Ge(.5,.5)},rotation:{value:0},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Vt}}},un={basic:{uniforms:Rt([Se.common,Se.specularmap,Se.envmap,Se.aomap,Se.lightmap,Se.fog]),vertexShader:Xe.meshbasic_vert,fragmentShader:Xe.meshbasic_frag},lambert:{uniforms:Rt([Se.common,Se.specularmap,Se.envmap,Se.aomap,Se.lightmap,Se.emissivemap,Se.bumpmap,Se.normalmap,Se.displacementmap,Se.fog,Se.lights,{emissive:{value:new Ye(0)}}]),vertexShader:Xe.meshlambert_vert,fragmentShader:Xe.meshlambert_frag},phong:{uniforms:Rt([Se.common,Se.specularmap,Se.envmap,Se.aomap,Se.lightmap,Se.emissivemap,Se.bumpmap,Se.normalmap,Se.displacementmap,Se.fog,Se.lights,{emissive:{value:new Ye(0)},specular:{value:new Ye(1118481)},shininess:{value:30}}]),vertexShader:Xe.meshphong_vert,fragmentShader:Xe.meshphong_frag},standard:{uniforms:Rt([Se.common,Se.envmap,Se.aomap,Se.lightmap,Se.emissivemap,Se.bumpmap,Se.normalmap,Se.displacementmap,Se.roughnessmap,Se.metalnessmap,Se.fog,Se.lights,{emissive:{value:new Ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Xe.meshphysical_vert,fragmentShader:Xe.meshphysical_frag},toon:{uniforms:Rt([Se.common,Se.aomap,Se.lightmap,Se.emissivemap,Se.bumpmap,Se.normalmap,Se.displacementmap,Se.gradientmap,Se.fog,Se.lights,{emissive:{value:new Ye(0)}}]),vertexShader:Xe.meshtoon_vert,fragmentShader:Xe.meshtoon_frag},matcap:{uniforms:Rt([Se.common,Se.bumpmap,Se.normalmap,Se.displacementmap,Se.fog,{matcap:{value:null}}]),vertexShader:Xe.meshmatcap_vert,fragmentShader:Xe.meshmatcap_frag},points:{uniforms:Rt([Se.points,Se.fog]),vertexShader:Xe.points_vert,fragmentShader:Xe.points_frag},dashed:{uniforms:Rt([Se.common,Se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Xe.linedashed_vert,fragmentShader:Xe.linedashed_frag},depth:{uniforms:Rt([Se.common,Se.displacementmap]),vertexShader:Xe.depth_vert,fragmentShader:Xe.depth_frag},normal:{uniforms:Rt([Se.common,Se.bumpmap,Se.normalmap,Se.displacementmap,{opacity:{value:1}}]),vertexShader:Xe.meshnormal_vert,fragmentShader:Xe.meshnormal_frag},sprite:{uniforms:Rt([Se.sprite,Se.fog]),vertexShader:Xe.sprite_vert,fragmentShader:Xe.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Xe.background_vert,fragmentShader:Xe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Xe.backgroundCube_vert,fragmentShader:Xe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Xe.cube_vert,fragmentShader:Xe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Xe.equirect_vert,fragmentShader:Xe.equirect_frag},distanceRGBA:{uniforms:Rt([Se.common,Se.displacementmap,{referencePosition:{value:new W},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Xe.distanceRGBA_vert,fragmentShader:Xe.distanceRGBA_frag},shadow:{uniforms:Rt([Se.lights,Se.fog,{color:{value:new Ye(0)},opacity:{value:1}}]),vertexShader:Xe.shadow_vert,fragmentShader:Xe.shadow_frag}};un.physical={uniforms:Rt([un.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatNormalScale:{value:new Ge(1,1)},clearcoatNormalMap:{value:null},iridescence:{value:0},iridescenceMap:{value:null},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},sheen:{value:0},sheenColor:{value:new Ye(0)},sheenColorMap:{value:null},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},transmission:{value:0},transmissionMap:{value:null},transmissionSamplerSize:{value:new Ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},attenuationDistance:{value:0},attenuationColor:{value:new Ye(0)},specularIntensity:{value:1},specularIntensityMap:{value:null},specularColor:{value:new Ye(1,1,1)},specularColorMap:{value:null}}]),vertexShader:Xe.meshphysical_vert,fragmentShader:Xe.meshphysical_frag};const dr={r:0,b:0,g:0};function Uh(s,e,t,n,i,r,o){const a=new Ye(0);let c=r===!0?0:1,l,u,h=null,f=0,g=null;function v(d,M){let C=!1,w=M.isScene===!0?M.background:null;w&&w.isTexture&&(w=(M.backgroundBlurriness>0?t:e).get(w));const T=s.xr,E=T.getSession&&T.getSession();E&&E.environmentBlendMode==="additive"&&(w=null),w===null?m(a,c):w&&w.isColor&&(m(w,1),C=!0),(s.autoClear||C)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),w&&(w.isCubeTexture||w.mapping===yr)?(u===void 0&&(u=new sn(new Wi(1,1,1),new an({name:"BackgroundCubeMaterial",uniforms:Ti(un.backgroundCube.uniforms),vertexShader:un.backgroundCube.vertexShader,fragmentShader:un.backgroundCube.fragmentShader,side:jt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(N,B,x){this.matrixWorld.copyPosition(x.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),u.material.uniforms.envMap.value=w,u.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.toneMapped=w.encoding!==rt,(h!==w||f!==w.version||g!==s.toneMapping)&&(u.material.needsUpdate=!0,h=w,f=w.version,g=s.toneMapping),u.layers.enableAll(),d.unshift(u,u.geometry,u.material,0,0,null)):w&&w.isTexture&&(l===void 0&&(l=new sn(new wr(2,2),new an({name:"BackgroundMaterial",uniforms:Ti(un.background.uniforms),vertexShader:un.background.vertexShader,fragmentShader:un.background.fragmentShader,side:Zn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=w,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=w.encoding!==rt,w.matrixAutoUpdate===!0&&w.updateMatrix(),l.material.uniforms.uvTransform.value.copy(w.matrix),(h!==w||f!==w.version||g!==s.toneMapping)&&(l.material.needsUpdate=!0,h=w,f=w.version,g=s.toneMapping),l.layers.enableAll(),d.unshift(l,l.geometry,l.material,0,0,null))}function m(d,M){d.getRGB(dr,Mo(s)),n.buffers.color.setClear(dr.r,dr.g,dr.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(d,M=1){a.set(d),c=M,m(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(d){c=d,m(a,c)},render:v}}function zh(s,e,t,n){const i=s.getParameter(34921),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),o=n.isWebGL2||r!==null,a={},c=d(null);let l=c,u=!1;function h(F,ee,le,he,te){let _e=!1;if(o){const re=m(he,le,ee);l!==re&&(l=re,g(l.object)),_e=M(F,he,le,te),_e&&C(F,he,le,te)}else{const re=ee.wireframe===!0;(l.geometry!==he.id||l.program!==le.id||l.wireframe!==re)&&(l.geometry=he.id,l.program=le.id,l.wireframe=re,_e=!0)}te!==null&&t.update(te,34963),(_e||u)&&(u=!1,x(F,ee,le,he),te!==null&&s.bindBuffer(34963,t.get(te).buffer))}function f(){return n.isWebGL2?s.createVertexArray():r.createVertexArrayOES()}function g(F){return n.isWebGL2?s.bindVertexArray(F):r.bindVertexArrayOES(F)}function v(F){return n.isWebGL2?s.deleteVertexArray(F):r.deleteVertexArrayOES(F)}function m(F,ee,le){const he=le.wireframe===!0;let te=a[F.id];te===void 0&&(te={},a[F.id]=te);let _e=te[ee.id];_e===void 0&&(_e={},te[ee.id]=_e);let re=_e[he];return re===void 0&&(re=d(f()),_e[he]=re),re}function d(F){const ee=[],le=[],he=[];for(let te=0;te<i;te++)ee[te]=0,le[te]=0,he[te]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:ee,enabledAttributes:le,attributeDivisors:he,object:F,attributes:{},index:null}}function M(F,ee,le,he){const te=l.attributes,_e=ee.attributes;let re=0;const Y=le.getAttributes();for(const q in Y)if(Y[q].location>=0){const ge=te[q];let Me=_e[q];if(Me===void 0&&(q==="instanceMatrix"&&F.instanceMatrix&&(Me=F.instanceMatrix),q==="instanceColor"&&F.instanceColor&&(Me=F.instanceColor)),ge===void 0||ge.attribute!==Me||Me&&ge.data!==Me.data)return!0;re++}return l.attributesNum!==re||l.index!==he}function C(F,ee,le,he){const te={},_e=ee.attributes;let re=0;const Y=le.getAttributes();for(const q in Y)if(Y[q].location>=0){let ge=_e[q];ge===void 0&&(q==="instanceMatrix"&&F.instanceMatrix&&(ge=F.instanceMatrix),q==="instanceColor"&&F.instanceColor&&(ge=F.instanceColor));const Me={};Me.attribute=ge,ge&&ge.data&&(Me.data=ge.data),te[q]=Me,re++}l.attributes=te,l.attributesNum=re,l.index=he}function w(){const F=l.newAttributes;for(let ee=0,le=F.length;ee<le;ee++)F[ee]=0}function T(F){E(F,0)}function E(F,ee){const le=l.newAttributes,he=l.enabledAttributes,te=l.attributeDivisors;le[F]=1,he[F]===0&&(s.enableVertexAttribArray(F),he[F]=1),te[F]!==ee&&((n.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](F,ee),te[F]=ee)}function N(){const F=l.newAttributes,ee=l.enabledAttributes;for(let le=0,he=ee.length;le<he;le++)ee[le]!==F[le]&&(s.disableVertexAttribArray(le),ee[le]=0)}function B(F,ee,le,he,te,_e){n.isWebGL2===!0&&(le===5124||le===5125)?s.vertexAttribIPointer(F,ee,le,te,_e):s.vertexAttribPointer(F,ee,le,he,te,_e)}function x(F,ee,le,he){if(n.isWebGL2===!1&&(F.isInstancedMesh||he.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;w();const te=he.attributes,_e=le.getAttributes(),re=ee.defaultAttributeValues;for(const Y in _e){const q=_e[Y];if(q.location>=0){let ce=te[Y];if(ce===void 0&&(Y==="instanceMatrix"&&F.instanceMatrix&&(ce=F.instanceMatrix),Y==="instanceColor"&&F.instanceColor&&(ce=F.instanceColor)),ce!==void 0){const ge=ce.normalized,Me=ce.itemSize,X=t.get(ce);if(X===void 0)continue;const He=X.buffer,be=X.type,Ue=X.bytesPerElement;if(ce.isInterleavedBufferAttribute){const Le=ce.data,$e=Le.stride,We=ce.offset;if(Le.isInstancedInterleavedBuffer){for(let Oe=0;Oe<q.locationSize;Oe++)E(q.location+Oe,Le.meshPerAttribute);F.isInstancedMesh!==!0&&he._maxInstanceCount===void 0&&(he._maxInstanceCount=Le.meshPerAttribute*Le.count)}else for(let Oe=0;Oe<q.locationSize;Oe++)T(q.location+Oe);s.bindBuffer(34962,He);for(let Oe=0;Oe<q.locationSize;Oe++)B(q.location+Oe,Me/q.locationSize,be,ge,$e*Ue,(We+Me/q.locationSize*Oe)*Ue)}else{if(ce.isInstancedBufferAttribute){for(let Le=0;Le<q.locationSize;Le++)E(q.location+Le,ce.meshPerAttribute);F.isInstancedMesh!==!0&&he._maxInstanceCount===void 0&&(he._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let Le=0;Le<q.locationSize;Le++)T(q.location+Le);s.bindBuffer(34962,He);for(let Le=0;Le<q.locationSize;Le++)B(q.location+Le,Me/q.locationSize,be,ge,Me*Ue,Me/q.locationSize*Le*Ue)}}else if(re!==void 0){const ge=re[Y];if(ge!==void 0)switch(ge.length){case 2:s.vertexAttrib2fv(q.location,ge);break;case 3:s.vertexAttrib3fv(q.location,ge);break;case 4:s.vertexAttrib4fv(q.location,ge);break;default:s.vertexAttrib1fv(q.location,ge)}}}}N()}function L(){oe();for(const F in a){const ee=a[F];for(const le in ee){const he=ee[le];for(const te in he)v(he[te].object),delete he[te];delete ee[le]}delete a[F]}}function H(F){if(a[F.id]===void 0)return;const ee=a[F.id];for(const le in ee){const he=ee[le];for(const te in he)v(he[te].object),delete he[te];delete ee[le]}delete a[F.id]}function ne(F){for(const ee in a){const le=a[ee];if(le[F.id]===void 0)continue;const he=le[F.id];for(const te in he)v(he[te].object),delete he[te];delete le[F.id]}}function oe(){z(),u=!0,l!==c&&(l=c,g(l.object))}function z(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:h,reset:oe,resetDefaultState:z,dispose:L,releaseStatesOfGeometry:H,releaseStatesOfProgram:ne,initAttributes:w,enableAttribute:T,disableUnusedAttributes:N}}function Bh(s,e,t,n){const i=n.isWebGL2;let r;function o(l){r=l}function a(l,u){s.drawArrays(r,l,u),t.update(u,r,1)}function c(l,u,h){if(h===0)return;let f,g;if(i)f=s,g="drawArraysInstanced";else if(f=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",f===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}f[g](r,l,u,h),t.update(u,r,h)}this.setMode=o,this.render=a,this.renderInstances=c}function kh(s,e,t){let n;function i(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const B=e.get("EXT_texture_filter_anisotropic");n=s.getParameter(B.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(B){if(B==="highp"){if(s.getShaderPrecisionFormat(35633,36338).precision>0&&s.getShaderPrecisionFormat(35632,36338).precision>0)return"highp";B="mediump"}return B==="mediump"&&s.getShaderPrecisionFormat(35633,36337).precision>0&&s.getShaderPrecisionFormat(35632,36337).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&s instanceof WebGL2RenderingContext||typeof WebGL2ComputeRenderingContext<"u"&&s instanceof WebGL2ComputeRenderingContext;let a=t.precision!==void 0?t.precision:"highp";const c=r(a);c!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",c,"instead."),a=c);const l=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=s.getParameter(34930),f=s.getParameter(35660),g=s.getParameter(3379),v=s.getParameter(34076),m=s.getParameter(34921),d=s.getParameter(36347),M=s.getParameter(36348),C=s.getParameter(36349),w=f>0,T=o||e.has("OES_texture_float"),E=w&&T,N=o?s.getParameter(36183):0;return{isWebGL2:o,drawBuffers:l,getMaxAnisotropy:i,getMaxPrecision:r,precision:a,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:f,maxTextureSize:g,maxCubemapSize:v,maxAttributes:m,maxVertexUniforms:d,maxVaryings:M,maxFragmentUniforms:C,vertexTextures:w,floatFragmentTextures:T,floatVertexTextures:E,maxSamples:N}}function Gh(s){const e=this;let t=null,n=0,i=!1,r=!1;const o=new Bn,a=new Vt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,f,g){const v=h.length!==0||f||n!==0||i;return i=f,t=u(h,g,0),n=h.length,v},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1,l()},this.setState=function(h,f,g){const v=h.clippingPlanes,m=h.clipIntersection,d=h.clipShadows,M=s.get(h);if(!i||v===null||v.length===0||r&&!d)r?u(null):l();else{const C=r?0:n,w=C*4;let T=M.clippingState||null;c.value=T,T=u(v,f,w,g);for(let E=0;E!==w;++E)T[E]=t[E];M.clippingState=T,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=C}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,f,g,v){const m=h!==null?h.length:0;let d=null;if(m!==0){if(d=c.value,v!==!0||d===null){const M=g+m*4,C=f.matrixWorldInverse;a.getNormalMatrix(C),(d===null||d.length<M)&&(d=new Float32Array(M));for(let w=0,T=g;w!==m;++w,T+=4)o.copy(h[w]).applyMatrix4(C,a),o.normal.toArray(d,T),d[T+3]=o.constant}c.value=d,c.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,d}}function Hh(s){let e=new WeakMap;function t(o,a){return a===_s?o.mapping=Mi:a===xs&&(o.mapping=yi),o}function n(o){if(o&&o.isTexture&&o.isRenderTargetTexture===!1){const a=o.mapping;if(a===_s||a===xs)if(e.has(o)){const c=e.get(o).texture;return t(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new tc(c.height/2);return l.fromEquirectangularTexture(s,o),e.set(o,l),o.addEventListener("dispose",i),t(l.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}class Ds extends yo{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,o=n+e,a=i+t,c=i-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const _i=4,Ma=[.125,.215,.35,.446,.526,.582],Gn=20,ns=new Ds,ya=new Ye;let is=null;const kn=(1+Math.sqrt(5))/2,pi=1/kn,ba=[new W(1,1,1),new W(-1,1,1),new W(1,1,-1),new W(-1,1,-1),new W(0,kn,pi),new W(0,kn,-pi),new W(pi,0,kn),new W(-pi,0,kn),new W(kn,pi,0),new W(-kn,pi,0)];class wa{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){is=this._renderer.getRenderTarget(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Aa(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ea(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(is),e.scissorTest=!1,fr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Mi||e.mapping===yi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),is=this._renderer.getRenderTarget();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:bt,minFilter:bt,generateMipmaps:!1,type:bn,format:Ht,encoding:Tn,depthBuffer:!1},i=Ta(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ta(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Vh(r)),this._blurMaterial=Wh(r,e,t)}return i}_compileMaterial(e){const t=new sn(this._lodPlanes[0],e);this._renderer.compile(t,ns)}_sceneToCubeUV(e,t,n,i){const a=new nn(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,f=u.toneMapping;u.getClearColor(ya),u.toneMapping=wn,u.autoClear=!1;const g=new xo({name:"PMREM.Background",side:jt,depthWrite:!1,depthTest:!1}),v=new sn(new Wi,g);let m=!1;const d=e.background;d?d.isColor&&(g.color.copy(d),e.background=null,m=!0):(g.color.copy(ya),m=!0);for(let M=0;M<6;M++){const C=M%3;C===0?(a.up.set(0,c[M],0),a.lookAt(l[M],0,0)):C===1?(a.up.set(0,0,c[M]),a.lookAt(0,l[M],0)):(a.up.set(0,c[M],0),a.lookAt(0,0,l[M]));const w=this._cubeSize;fr(i,C*w,M>2?w:0,w,w),u.setRenderTarget(i),m&&u.render(v,a),u.render(e,a)}v.geometry.dispose(),v.material.dispose(),u.toneMapping=f,u.autoClear=h,e.background=d}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===Mi||e.mapping===yi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Aa()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ea());const r=i?this._cubemapMaterial:this._equirectMaterial,o=new sn(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;const c=this._cubeSize;fr(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,ns)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){const r=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),o=ba[(i-1)%ba.length];this._blur(e,i-1,i,r,o)}t.autoClear=n}_blur(e,t,n,i,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new sn(this._lodPlanes[i],l),f=l.uniforms,g=this._sizeLods[n]-1,v=isFinite(r)?Math.PI/(2*g):2*Math.PI/(2*Gn-1),m=r/v,d=isFinite(r)?1+Math.floor(u*m):Gn;d>Gn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${d} samples when the maximum is set to ${Gn}`);const M=[];let C=0;for(let B=0;B<Gn;++B){const x=B/m,L=Math.exp(-x*x/2);M.push(L),B===0?C+=L:B<d&&(C+=2*L)}for(let B=0;B<M.length;B++)M[B]=M[B]/C;f.envMap.value=e.texture,f.samples.value=d,f.weights.value=M,f.latitudinal.value=o==="latitudinal",a&&(f.poleAxis.value=a);const{_lodMax:w}=this;f.dTheta.value=v,f.mipInt.value=w-n;const T=this._sizeLods[i],E=3*T*(i>w-_i?i-w+_i:0),N=4*(this._cubeSize-T);fr(t,E,N,3*T,2*T),c.setRenderTarget(t),c.render(h,ns)}}function Vh(s){const e=[],t=[],n=[];let i=s;const r=s-_i+1+Ma.length;for(let o=0;o<r;o++){const a=Math.pow(2,i);t.push(a);let c=1/a;o>s-_i?c=Ma[o-s+_i-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),u=-l,h=1+l,f=[u,u,h,u,h,h,u,u,h,h,u,h],g=6,v=6,m=3,d=2,M=1,C=new Float32Array(m*v*g),w=new Float32Array(d*v*g),T=new Float32Array(M*v*g);for(let N=0;N<g;N++){const B=N%3*2/3-1,x=N>2?0:-1,L=[B,x,0,B+2/3,x,0,B+2/3,x+1,0,B,x,0,B+2/3,x+1,0,B,x+1,0];C.set(L,m*v*N),w.set(f,d*v*N);const H=[N,N,N,N,N,N];T.set(H,M*v*N)}const E=new En;E.setAttribute("position",new Wt(C,m)),E.setAttribute("uv",new Wt(w,d)),E.setAttribute("faceIndex",new Wt(T,M)),e.push(E),i>_i&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Ta(s,e,t){const n=new jn(s,e,t);return n.texture.mapping=yr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function fr(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function Wh(s,e,t){const n=new Float32Array(Gn),i=new W(0,1,0);return new an({name:"SphericalGaussianBlur",defines:{n:Gn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Ps(),fragmentShader:`

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
		`,blending:In,depthTest:!1,depthWrite:!1})}function Ea(){return new an({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ps(),fragmentShader:`

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
		`,blending:In,depthTest:!1,depthWrite:!1})}function Aa(){return new an({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ps(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function Ps(){return`

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
	`}function Xh(s){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===_s||c===xs,u=c===Mi||c===yi;if(l||u)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let h=e.get(a);return t===null&&(t=new wa(s)),h=l?t.fromEquirectangular(a,h):t.fromCubemap(a,h),e.set(a,h),h.texture}else{if(e.has(a))return e.get(a).texture;{const h=a.image;if(l&&h&&h.height>0||u&&h&&i(h)){t===null&&(t=new wa(s));const f=l?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,f),a.addEventListener("dispose",r),f.texture}else return null}}}return a}function i(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function qh(s){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?t("EXT_color_buffer_float"):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Zh(s,e,t,n){const i={},r=new WeakMap;function o(h){const f=h.target;f.index!==null&&e.remove(f.index);for(const v in f.attributes)e.remove(f.attributes[v]);f.removeEventListener("dispose",o),delete i[f.id];const g=r.get(f);g&&(e.remove(g),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(h,f){return i[f.id]===!0||(f.addEventListener("dispose",o),i[f.id]=!0,t.memory.geometries++),f}function c(h){const f=h.attributes;for(const v in f)e.update(f[v],34962);const g=h.morphAttributes;for(const v in g){const m=g[v];for(let d=0,M=m.length;d<M;d++)e.update(m[d],34962)}}function l(h){const f=[],g=h.index,v=h.attributes.position;let m=0;if(g!==null){const C=g.array;m=g.version;for(let w=0,T=C.length;w<T;w+=3){const E=C[w+0],N=C[w+1],B=C[w+2];f.push(E,N,N,B,B,E)}}else{const C=v.array;m=v.version;for(let w=0,T=C.length/3-1;w<T;w+=3){const E=w+0,N=w+1,B=w+2;f.push(E,N,N,B,B,E)}}const d=new(ho(f)?So:vo)(f,1);d.version=m;const M=r.get(h);M&&e.remove(M),r.set(h,d)}function u(h){const f=r.get(h);if(f){const g=h.index;g!==null&&f.version<g.version&&l(h)}else l(h);return r.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function Yh(s,e,t,n){const i=n.isWebGL2;let r;function o(f){r=f}let a,c;function l(f){a=f.type,c=f.bytesPerElement}function u(f,g){s.drawElements(r,g,a,f*c),t.update(g,r,1)}function h(f,g,v){if(v===0)return;let m,d;if(i)m=s,d="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[d](r,g,a,f*c,v),t.update(g,r,v)}this.setMode=o,this.setIndex=l,this.render=u,this.renderInstances=h}function jh(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case 4:t.triangles+=a*(r/3);break;case 1:t.lines+=a*(r/2);break;case 3:t.lines+=a*(r-1);break;case 2:t.lines+=a*r;break;case 0:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.frame++,t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function $h(s,e){return s[0]-e[0]}function Kh(s,e){return Math.abs(e[1])-Math.abs(s[1])}function Jh(s,e,t){const n={},i=new Float32Array(8),r=new WeakMap,o=new wt,a=[];for(let l=0;l<8;l++)a[l]=[l,0];function c(l,u,h,f){const g=l.morphTargetInfluences;if(e.isWebGL2===!0){const m=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,d=m!==void 0?m.length:0;let M=r.get(u);if(M===void 0||M.count!==d){let le=function(){F.dispose(),r.delete(u),u.removeEventListener("dispose",le)};var v=le;M!==void 0&&M.texture.dispose();const T=u.morphAttributes.position!==void 0,E=u.morphAttributes.normal!==void 0,N=u.morphAttributes.color!==void 0,B=u.morphAttributes.position||[],x=u.morphAttributes.normal||[],L=u.morphAttributes.color||[];let H=0;T===!0&&(H=1),E===!0&&(H=2),N===!0&&(H=3);let ne=u.attributes.position.count*H,oe=1;ne>e.maxTextureSize&&(oe=Math.ceil(ne/e.maxTextureSize),ne=e.maxTextureSize);const z=new Float32Array(ne*oe*4*d),F=new go(z,ne,oe,d);F.type=rn,F.needsUpdate=!0;const ee=H*4;for(let he=0;he<d;he++){const te=B[he],_e=x[he],re=L[he],Y=ne*oe*4*he;for(let q=0;q<te.count;q++){const ce=q*ee;T===!0&&(o.fromBufferAttribute(te,q),z[Y+ce+0]=o.x,z[Y+ce+1]=o.y,z[Y+ce+2]=o.z,z[Y+ce+3]=0),E===!0&&(o.fromBufferAttribute(_e,q),z[Y+ce+4]=o.x,z[Y+ce+5]=o.y,z[Y+ce+6]=o.z,z[Y+ce+7]=0),N===!0&&(o.fromBufferAttribute(re,q),z[Y+ce+8]=o.x,z[Y+ce+9]=o.y,z[Y+ce+10]=o.z,z[Y+ce+11]=re.itemSize===4?o.w:1)}}M={count:d,texture:F,size:new Ge(ne,oe)},r.set(u,M),u.addEventListener("dispose",le)}let C=0;for(let T=0;T<g.length;T++)C+=g[T];const w=u.morphTargetsRelative?1:1-C;f.getUniforms().setValue(s,"morphTargetBaseInfluence",w),f.getUniforms().setValue(s,"morphTargetInfluences",g),f.getUniforms().setValue(s,"morphTargetsTexture",M.texture,t),f.getUniforms().setValue(s,"morphTargetsTextureSize",M.size)}else{const m=g===void 0?0:g.length;let d=n[u.id];if(d===void 0||d.length!==m){d=[];for(let E=0;E<m;E++)d[E]=[E,0];n[u.id]=d}for(let E=0;E<m;E++){const N=d[E];N[0]=E,N[1]=g[E]}d.sort(Kh);for(let E=0;E<8;E++)E<m&&d[E][1]?(a[E][0]=d[E][0],a[E][1]=d[E][1]):(a[E][0]=Number.MAX_SAFE_INTEGER,a[E][1]=0);a.sort($h);const M=u.morphAttributes.position,C=u.morphAttributes.normal;let w=0;for(let E=0;E<8;E++){const N=a[E],B=N[0],x=N[1];B!==Number.MAX_SAFE_INTEGER&&x?(M&&u.getAttribute("morphTarget"+E)!==M[B]&&u.setAttribute("morphTarget"+E,M[B]),C&&u.getAttribute("morphNormal"+E)!==C[B]&&u.setAttribute("morphNormal"+E,C[B]),i[E]=x,w+=x):(M&&u.hasAttribute("morphTarget"+E)===!0&&u.deleteAttribute("morphTarget"+E),C&&u.hasAttribute("morphNormal"+E)===!0&&u.deleteAttribute("morphNormal"+E),i[E]=0)}const T=u.morphTargetsRelative?1:1-w;f.getUniforms().setValue(s,"morphTargetBaseInfluence",T),f.getUniforms().setValue(s,"morphTargetInfluences",i)}}return{update:c}}function Qh(s,e,t,n){let i=new WeakMap;function r(c){const l=n.render.frame,u=c.geometry,h=e.get(c,u);return i.get(h)!==l&&(e.update(h),i.set(h,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),t.update(c.instanceMatrix,34962),c.instanceColor!==null&&t.update(c.instanceColor,34962)),h}function o(){i=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}const To=new It,Eo=new go,Ao=new Bl,Co=new bo,Ca=[],La=[],Ra=new Float32Array(16),Da=new Float32Array(9),Pa=new Float32Array(4);function Ei(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=Ca[i];if(r===void 0&&(r=new Float32Array(i),Ca[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function xt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function vt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Tr(s,e){let t=La[e];t===void 0&&(t=new Int32Array(e),La[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function ed(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function td(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(xt(t,e))return;s.uniform2fv(this.addr,e),vt(t,e)}}function nd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(xt(t,e))return;s.uniform3fv(this.addr,e),vt(t,e)}}function id(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(xt(t,e))return;s.uniform4fv(this.addr,e),vt(t,e)}}function rd(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(xt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),vt(t,e)}else{if(xt(t,n))return;Pa.set(n),s.uniformMatrix2fv(this.addr,!1,Pa),vt(t,n)}}function sd(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(xt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),vt(t,e)}else{if(xt(t,n))return;Da.set(n),s.uniformMatrix3fv(this.addr,!1,Da),vt(t,n)}}function ad(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(xt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),vt(t,e)}else{if(xt(t,n))return;Ra.set(n),s.uniformMatrix4fv(this.addr,!1,Ra),vt(t,n)}}function od(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function ld(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(xt(t,e))return;s.uniform2iv(this.addr,e),vt(t,e)}}function cd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(xt(t,e))return;s.uniform3iv(this.addr,e),vt(t,e)}}function ud(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(xt(t,e))return;s.uniform4iv(this.addr,e),vt(t,e)}}function hd(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function dd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(xt(t,e))return;s.uniform2uiv(this.addr,e),vt(t,e)}}function fd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(xt(t,e))return;s.uniform3uiv(this.addr,e),vt(t,e)}}function pd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(xt(t,e))return;s.uniform4uiv(this.addr,e),vt(t,e)}}function md(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2D(e||To,i)}function gd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Ao,i)}function _d(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Co,i)}function xd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Eo,i)}function vd(s){switch(s){case 5126:return ed;case 35664:return td;case 35665:return nd;case 35666:return id;case 35674:return rd;case 35675:return sd;case 35676:return ad;case 5124:case 35670:return od;case 35667:case 35671:return ld;case 35668:case 35672:return cd;case 35669:case 35673:return ud;case 5125:return hd;case 36294:return dd;case 36295:return fd;case 36296:return pd;case 35678:case 36198:case 36298:case 36306:case 35682:return md;case 35679:case 36299:case 36307:return gd;case 35680:case 36300:case 36308:case 36293:return _d;case 36289:case 36303:case 36311:case 36292:return xd}}function Sd(s,e){s.uniform1fv(this.addr,e)}function Md(s,e){const t=Ei(e,this.size,2);s.uniform2fv(this.addr,t)}function yd(s,e){const t=Ei(e,this.size,3);s.uniform3fv(this.addr,t)}function bd(s,e){const t=Ei(e,this.size,4);s.uniform4fv(this.addr,t)}function wd(s,e){const t=Ei(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function Td(s,e){const t=Ei(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function Ed(s,e){const t=Ei(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function Ad(s,e){s.uniform1iv(this.addr,e)}function Cd(s,e){s.uniform2iv(this.addr,e)}function Ld(s,e){s.uniform3iv(this.addr,e)}function Rd(s,e){s.uniform4iv(this.addr,e)}function Dd(s,e){s.uniform1uiv(this.addr,e)}function Pd(s,e){s.uniform2uiv(this.addr,e)}function Id(s,e){s.uniform3uiv(this.addr,e)}function Nd(s,e){s.uniform4uiv(this.addr,e)}function Fd(s,e,t){const n=this.cache,i=e.length,r=Tr(t,i);xt(n,r)||(s.uniform1iv(this.addr,r),vt(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||To,r[o])}function Od(s,e,t){const n=this.cache,i=e.length,r=Tr(t,i);xt(n,r)||(s.uniform1iv(this.addr,r),vt(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||Ao,r[o])}function Ud(s,e,t){const n=this.cache,i=e.length,r=Tr(t,i);xt(n,r)||(s.uniform1iv(this.addr,r),vt(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||Co,r[o])}function zd(s,e,t){const n=this.cache,i=e.length,r=Tr(t,i);xt(n,r)||(s.uniform1iv(this.addr,r),vt(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||Eo,r[o])}function Bd(s){switch(s){case 5126:return Sd;case 35664:return Md;case 35665:return yd;case 35666:return bd;case 35674:return wd;case 35675:return Td;case 35676:return Ed;case 5124:case 35670:return Ad;case 35667:case 35671:return Cd;case 35668:case 35672:return Ld;case 35669:case 35673:return Rd;case 5125:return Dd;case 36294:return Pd;case 36295:return Id;case 36296:return Nd;case 35678:case 36198:case 36298:case 36306:case 35682:return Fd;case 35679:case 36299:case 36307:return Od;case 35680:case 36300:case 36308:case 36293:return Ud;case 36289:case 36303:case 36311:case 36292:return zd}}class kd{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.setValue=vd(t.type)}}class Gd{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.size=t.size,this.setValue=Bd(t.type)}}class Hd{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,o=i.length;r!==o;++r){const a=i[r];a.setValue(e,t[a.id],n)}}}const rs=/(\w+)(\])?(\[|\.)?/g;function Ia(s,e){s.seq.push(e),s.map[e.id]=e}function Vd(s,e,t){const n=s.name,i=n.length;for(rs.lastIndex=0;;){const r=rs.exec(n),o=rs.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){Ia(t,l===void 0?new kd(a,s,e):new Gd(a,s,e));break}else{let h=t.map[a];h===void 0&&(h=new Hd(a),Ia(t,h)),t=h}}}class xr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,35718);for(let i=0;i<n;++i){const r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);Vd(r,o,this)}}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){const a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const o=e[i];o.id in t&&n.push(o)}return n}}function Na(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}let Wd=0;function Xd(s,e){const t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}function qd(s){switch(s){case Tn:return["Linear","( value )"];case rt:return["sRGB","( value )"];default:return console.warn("THREE.WebGLProgram: Unsupported encoding:",s),["Linear","( value )"]}}function Fa(s,e,t){const n=s.getShaderParameter(e,35713),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+Xd(s.getShaderSource(e),o)}else return i}function Zd(s,e){const t=qd(e);return"vec4 "+s+"( vec4 value ) { return LinearTo"+t[0]+t[1]+"; }"}function Yd(s,e){let t;switch(e){case hl:t="Linear";break;case dl:t="Reinhard";break;case fl:t="OptimizedCineon";break;case pl:t="ACESFilmic";break;case ml:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function jd(s){return[s.extensionDerivatives||s.envMapCubeUVHeight||s.bumpMap||s.tangentSpaceNormalMap||s.clearcoatNormalMap||s.flatShading||s.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(s.extensionFragDepth||s.logarithmicDepthBuffer)&&s.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",s.extensionDrawBuffers&&s.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(s.extensionShaderTextureLOD||s.envMap||s.transmission)&&s.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Ui).join(`
`)}function $d(s){const e=[];for(const t in s){const n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Kd(s,e){const t={},n=s.getProgramParameter(e,35721);for(let i=0;i<n;i++){const r=s.getActiveAttrib(e,i),o=r.name;let a=1;r.type===35674&&(a=2),r.type===35675&&(a=3),r.type===35676&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function Ui(s){return s!==""}function Oa(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ua(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Jd=/^[ \t]*#include +<([\w\d./]+)>/gm;function bs(s){return s.replace(Jd,Qd)}function Qd(s,e){const t=Xe[e];if(t===void 0)throw new Error("Can not resolve #include <"+e+">");return bs(t)}const ef=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function za(s){return s.replace(ef,tf)}function tf(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Ba(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function nf(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===As?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===Vo?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===Oi&&(e="SHADOWMAP_TYPE_VSM"),e}function rf(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case Mi:case yi:e="ENVMAP_TYPE_CUBE";break;case yr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function sf(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case yi:e="ENVMAP_MODE_REFRACTION";break}return e}function af(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case oo:e="ENVMAP_BLENDING_MULTIPLY";break;case cl:e="ENVMAP_BLENDING_MIX";break;case ul:e="ENVMAP_BLENDING_ADD";break}return e}function of(s){const e=s.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function lf(s,e,t,n){const i=s.getContext(),r=t.defines;let o=t.vertexShader,a=t.fragmentShader;const c=nf(t),l=rf(t),u=sf(t),h=af(t),f=of(t),g=t.isWebGL2?"":jd(t),v=$d(r),m=i.createProgram();let d,M,C=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(d=[v].filter(Ui).join(`
`),d.length>0&&(d+=`
`),M=[g,v].filter(Ui).join(`
`),M.length>0&&(M+=`
`)):(d=[Ba(t),"#define SHADER_NAME "+t.shaderName,v,t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.supportsVertexTextures?"#define VERTEX_TEXTURES":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.displacementMap&&t.supportsVertexTextures?"#define USE_DISPLACEMENTMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ui).join(`
`),M=[g,Ba(t),"#define SHADER_NAME "+t.shaderName,v,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.physicallyCorrectLights?"#define PHYSICALLY_CORRECT_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==wn?"#define TONE_MAPPING":"",t.toneMapping!==wn?Xe.tonemapping_pars_fragment:"",t.toneMapping!==wn?Yd("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Xe.encodings_pars_fragment,Zd("linearToOutputTexel",t.outputEncoding),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ui).join(`
`)),o=bs(o),o=Oa(o,t),o=Ua(o,t),a=bs(a),a=Oa(a,t),a=Ua(a,t),o=za(o),a=za(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(C=`#version 300 es
`,d=["precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,M=["#define varying in",t.glslVersion===la?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===la?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+M);const w=C+d+o,T=C+M+a,E=Na(i,35633,w),N=Na(i,35632,T);if(i.attachShader(m,E),i.attachShader(m,N),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m),s.debug.checkShaderErrors){const L=i.getProgramInfoLog(m).trim(),H=i.getShaderInfoLog(E).trim(),ne=i.getShaderInfoLog(N).trim();let oe=!0,z=!0;if(i.getProgramParameter(m,35714)===!1){oe=!1;const F=Fa(i,E,"vertex"),ee=Fa(i,N,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,35715)+`

Program Info Log: `+L+`
`+F+`
`+ee)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(H===""||ne==="")&&(z=!1);z&&(this.diagnostics={runnable:oe,programLog:L,vertexShader:{log:H,prefix:d},fragmentShader:{log:ne,prefix:M}})}i.deleteShader(E),i.deleteShader(N);let B;this.getUniforms=function(){return B===void 0&&(B=new xr(i,m)),B};let x;return this.getAttributes=function(){return x===void 0&&(x=Kd(i,m)),x},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.name=t.shaderName,this.id=Wd++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=E,this.fragmentShader=N,this}let cf=0;class uf{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new hf(e),t.set(e,n)),n}}class hf{constructor(e){this.id=cf++,this.code=e,this.usedTimes=0}}function df(s,e,t,n,i,r,o){const a=new _o,c=new uf,l=[],u=i.isWebGL2,h=i.logarithmicDepthBuffer,f=i.vertexTextures;let g=i.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(x,L,H,ne,oe){const z=ne.fog,F=oe.geometry,ee=x.isMeshStandardMaterial?ne.environment:null,le=(x.isMeshStandardMaterial?t:e).get(x.envMap||ee),he=le&&le.mapping===yr?le.image.height:null,te=v[x.type];x.precision!==null&&(g=i.getMaxPrecision(x.precision),g!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",g,"instead."));const _e=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,re=_e!==void 0?_e.length:0;let Y=0;F.morphAttributes.position!==void 0&&(Y=1),F.morphAttributes.normal!==void 0&&(Y=2),F.morphAttributes.color!==void 0&&(Y=3);let q,ce,ge,Me;if(te){const $e=un[te];q=$e.vertexShader,ce=$e.fragmentShader}else q=x.vertexShader,ce=x.fragmentShader,c.update(x),ge=c.getVertexShaderID(x),Me=c.getFragmentShaderID(x);const X=s.getRenderTarget(),He=x.alphaTest>0,be=x.clearcoat>0,Ue=x.iridescence>0;return{isWebGL2:u,shaderID:te,shaderName:x.type,vertexShader:q,fragmentShader:ce,defines:x.defines,customVertexShaderID:ge,customFragmentShaderID:Me,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:g,instancing:oe.isInstancedMesh===!0,instancingColor:oe.isInstancedMesh===!0&&oe.instanceColor!==null,supportsVertexTextures:f,outputEncoding:X===null?s.outputEncoding:X.isXRRenderTarget===!0?X.texture.encoding:Tn,map:!!x.map,matcap:!!x.matcap,envMap:!!le,envMapMode:le&&le.mapping,envMapCubeUVHeight:he,lightMap:!!x.lightMap,aoMap:!!x.aoMap,emissiveMap:!!x.emissiveMap,bumpMap:!!x.bumpMap,normalMap:!!x.normalMap,objectSpaceNormalMap:x.normalMapType===Fl,tangentSpaceNormalMap:x.normalMapType===Nl,decodeVideoTexture:!!x.map&&x.map.isVideoTexture===!0&&x.map.encoding===rt,clearcoat:be,clearcoatMap:be&&!!x.clearcoatMap,clearcoatRoughnessMap:be&&!!x.clearcoatRoughnessMap,clearcoatNormalMap:be&&!!x.clearcoatNormalMap,iridescence:Ue,iridescenceMap:Ue&&!!x.iridescenceMap,iridescenceThicknessMap:Ue&&!!x.iridescenceThicknessMap,displacementMap:!!x.displacementMap,roughnessMap:!!x.roughnessMap,metalnessMap:!!x.metalnessMap,specularMap:!!x.specularMap,specularIntensityMap:!!x.specularIntensityMap,specularColorMap:!!x.specularColorMap,opaque:x.transparent===!1&&x.blending===vi,alphaMap:!!x.alphaMap,alphaTest:He,gradientMap:!!x.gradientMap,sheen:x.sheen>0,sheenColorMap:!!x.sheenColorMap,sheenRoughnessMap:!!x.sheenRoughnessMap,transmission:x.transmission>0,transmissionMap:!!x.transmissionMap,thicknessMap:!!x.thicknessMap,combine:x.combine,vertexTangents:!!x.normalMap&&!!F.attributes.tangent,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,vertexUvs:!!x.map||!!x.bumpMap||!!x.normalMap||!!x.specularMap||!!x.alphaMap||!!x.emissiveMap||!!x.roughnessMap||!!x.metalnessMap||!!x.clearcoatMap||!!x.clearcoatRoughnessMap||!!x.clearcoatNormalMap||!!x.iridescenceMap||!!x.iridescenceThicknessMap||!!x.displacementMap||!!x.transmissionMap||!!x.thicknessMap||!!x.specularIntensityMap||!!x.specularColorMap||!!x.sheenColorMap||!!x.sheenRoughnessMap,uvsVertexOnly:!(x.map||x.bumpMap||x.normalMap||x.specularMap||x.alphaMap||x.emissiveMap||x.roughnessMap||x.metalnessMap||x.clearcoatNormalMap||x.iridescenceMap||x.iridescenceThicknessMap||x.transmission>0||x.transmissionMap||x.thicknessMap||x.specularIntensityMap||x.specularColorMap||x.sheen>0||x.sheenColorMap||x.sheenRoughnessMap)&&!!x.displacementMap,fog:!!z,useFog:x.fog===!0,fogExp2:z&&z.isFogExp2,flatShading:!!x.flatShading,sizeAttenuation:x.sizeAttenuation,logarithmicDepthBuffer:h,skinning:oe.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:re,morphTextureStride:Y,numDirLights:L.directional.length,numPointLights:L.point.length,numSpotLights:L.spot.length,numSpotLightMaps:L.spotLightMap.length,numRectAreaLights:L.rectArea.length,numHemiLights:L.hemi.length,numDirLightShadows:L.directionalShadowMap.length,numPointLightShadows:L.pointShadowMap.length,numSpotLightShadows:L.spotShadowMap.length,numSpotLightShadowsWithMaps:L.numSpotLightShadowsWithMaps,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:x.dithering,shadowMapEnabled:s.shadowMap.enabled&&H.length>0,shadowMapType:s.shadowMap.type,toneMapping:x.toneMapped?s.toneMapping:wn,physicallyCorrectLights:s.physicallyCorrectLights,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Cs,flipSided:x.side===jt,useDepthPacking:!!x.depthPacking,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionDerivatives:x.extensions&&x.extensions.derivatives,extensionFragDepth:x.extensions&&x.extensions.fragDepth,extensionDrawBuffers:x.extensions&&x.extensions.drawBuffers,extensionShaderTextureLOD:x.extensions&&x.extensions.shaderTextureLOD,rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),customProgramCacheKey:x.customProgramCacheKey()}}function d(x){const L=[];if(x.shaderID?L.push(x.shaderID):(L.push(x.customVertexShaderID),L.push(x.customFragmentShaderID)),x.defines!==void 0)for(const H in x.defines)L.push(H),L.push(x.defines[H]);return x.isRawShaderMaterial===!1&&(M(L,x),C(L,x),L.push(s.outputEncoding)),L.push(x.customProgramCacheKey),L.join()}function M(x,L){x.push(L.precision),x.push(L.outputEncoding),x.push(L.envMapMode),x.push(L.envMapCubeUVHeight),x.push(L.combine),x.push(L.vertexUvs),x.push(L.fogExp2),x.push(L.sizeAttenuation),x.push(L.morphTargetsCount),x.push(L.morphAttributeCount),x.push(L.numDirLights),x.push(L.numPointLights),x.push(L.numSpotLights),x.push(L.numSpotLightMaps),x.push(L.numHemiLights),x.push(L.numRectAreaLights),x.push(L.numDirLightShadows),x.push(L.numPointLightShadows),x.push(L.numSpotLightShadows),x.push(L.numSpotLightShadowsWithMaps),x.push(L.shadowMapType),x.push(L.toneMapping),x.push(L.numClippingPlanes),x.push(L.numClipIntersection),x.push(L.depthPacking)}function C(x,L){a.disableAll(),L.isWebGL2&&a.enable(0),L.supportsVertexTextures&&a.enable(1),L.instancing&&a.enable(2),L.instancingColor&&a.enable(3),L.map&&a.enable(4),L.matcap&&a.enable(5),L.envMap&&a.enable(6),L.lightMap&&a.enable(7),L.aoMap&&a.enable(8),L.emissiveMap&&a.enable(9),L.bumpMap&&a.enable(10),L.normalMap&&a.enable(11),L.objectSpaceNormalMap&&a.enable(12),L.tangentSpaceNormalMap&&a.enable(13),L.clearcoat&&a.enable(14),L.clearcoatMap&&a.enable(15),L.clearcoatRoughnessMap&&a.enable(16),L.clearcoatNormalMap&&a.enable(17),L.iridescence&&a.enable(18),L.iridescenceMap&&a.enable(19),L.iridescenceThicknessMap&&a.enable(20),L.displacementMap&&a.enable(21),L.specularMap&&a.enable(22),L.roughnessMap&&a.enable(23),L.metalnessMap&&a.enable(24),L.gradientMap&&a.enable(25),L.alphaMap&&a.enable(26),L.alphaTest&&a.enable(27),L.vertexColors&&a.enable(28),L.vertexAlphas&&a.enable(29),L.vertexUvs&&a.enable(30),L.vertexTangents&&a.enable(31),L.uvsVertexOnly&&a.enable(32),x.push(a.mask),a.disableAll(),L.fog&&a.enable(0),L.useFog&&a.enable(1),L.flatShading&&a.enable(2),L.logarithmicDepthBuffer&&a.enable(3),L.skinning&&a.enable(4),L.morphTargets&&a.enable(5),L.morphNormals&&a.enable(6),L.morphColors&&a.enable(7),L.premultipliedAlpha&&a.enable(8),L.shadowMapEnabled&&a.enable(9),L.physicallyCorrectLights&&a.enable(10),L.doubleSided&&a.enable(11),L.flipSided&&a.enable(12),L.useDepthPacking&&a.enable(13),L.dithering&&a.enable(14),L.specularIntensityMap&&a.enable(15),L.specularColorMap&&a.enable(16),L.transmission&&a.enable(17),L.transmissionMap&&a.enable(18),L.thicknessMap&&a.enable(19),L.sheen&&a.enable(20),L.sheenColorMap&&a.enable(21),L.sheenRoughnessMap&&a.enable(22),L.decodeVideoTexture&&a.enable(23),L.opaque&&a.enable(24),x.push(a.mask)}function w(x){const L=v[x.type];let H;if(L){const ne=un[L];H=ys.clone(ne.uniforms)}else H=x.uniforms;return H}function T(x,L){let H;for(let ne=0,oe=l.length;ne<oe;ne++){const z=l[ne];if(z.cacheKey===L){H=z,++H.usedTimes;break}}return H===void 0&&(H=new lf(s,L,x,r),l.push(H)),H}function E(x){if(--x.usedTimes===0){const L=l.indexOf(x);l[L]=l[l.length-1],l.pop(),x.destroy()}}function N(x){c.remove(x)}function B(){c.dispose()}return{getParameters:m,getProgramCacheKey:d,getUniforms:w,acquireProgram:T,releaseProgram:E,releaseShaderCache:N,programs:l,dispose:B}}function ff(){let s=new WeakMap;function e(r){let o=s.get(r);return o===void 0&&(o={},s.set(r,o)),o}function t(r){s.delete(r)}function n(r,o,a){s.get(r)[o]=a}function i(){s=new WeakMap}return{get:e,remove:t,update:n,dispose:i}}function pf(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function ka(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function Ga(){const s=[];let e=0;const t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(h,f,g,v,m,d){let M=s[e];return M===void 0?(M={id:h.id,object:h,geometry:f,material:g,groupOrder:v,renderOrder:h.renderOrder,z:m,group:d},s[e]=M):(M.id=h.id,M.object=h,M.geometry=f,M.material=g,M.groupOrder=v,M.renderOrder=h.renderOrder,M.z=m,M.group=d),e++,M}function a(h,f,g,v,m,d){const M=o(h,f,g,v,m,d);g.transmission>0?n.push(M):g.transparent===!0?i.push(M):t.push(M)}function c(h,f,g,v,m,d){const M=o(h,f,g,v,m,d);g.transmission>0?n.unshift(M):g.transparent===!0?i.unshift(M):t.unshift(M)}function l(h,f){t.length>1&&t.sort(h||pf),n.length>1&&n.sort(f||ka),i.length>1&&i.sort(f||ka)}function u(){for(let h=e,f=s.length;h<f;h++){const g=s[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:a,unshift:c,finish:u,sort:l}}function mf(){let s=new WeakMap;function e(n,i){const r=s.get(n);let o;return r===void 0?(o=new Ga,s.set(n,[o])):i>=r.length?(o=new Ga,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function gf(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new W,color:new Ye};break;case"SpotLight":t={position:new W,direction:new W,color:new Ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new W,color:new Ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new W,skyColor:new Ye,groundColor:new Ye};break;case"RectAreaLight":t={color:new Ye,position:new W,halfWidth:new W,halfHeight:new W};break}return s[e.id]=t,t}}}function _f(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let xf=0;function vf(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function Sf(s,e){const t=new gf,n=_f(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0};for(let u=0;u<9;u++)i.probe.push(new W);const r=new W,o=new _t,a=new _t;function c(u,h){let f=0,g=0,v=0;for(let ne=0;ne<9;ne++)i.probe[ne].set(0,0,0);let m=0,d=0,M=0,C=0,w=0,T=0,E=0,N=0,B=0,x=0;u.sort(vf);const L=h!==!0?Math.PI:1;for(let ne=0,oe=u.length;ne<oe;ne++){const z=u[ne],F=z.color,ee=z.intensity,le=z.distance,he=z.shadow&&z.shadow.map?z.shadow.map.texture:null;if(z.isAmbientLight)f+=F.r*ee*L,g+=F.g*ee*L,v+=F.b*ee*L;else if(z.isLightProbe)for(let te=0;te<9;te++)i.probe[te].addScaledVector(z.sh.coefficients[te],ee);else if(z.isDirectionalLight){const te=t.get(z);if(te.color.copy(z.color).multiplyScalar(z.intensity*L),z.castShadow){const _e=z.shadow,re=n.get(z);re.shadowBias=_e.bias,re.shadowNormalBias=_e.normalBias,re.shadowRadius=_e.radius,re.shadowMapSize=_e.mapSize,i.directionalShadow[m]=re,i.directionalShadowMap[m]=he,i.directionalShadowMatrix[m]=z.shadow.matrix,T++}i.directional[m]=te,m++}else if(z.isSpotLight){const te=t.get(z);te.position.setFromMatrixPosition(z.matrixWorld),te.color.copy(F).multiplyScalar(ee*L),te.distance=le,te.coneCos=Math.cos(z.angle),te.penumbraCos=Math.cos(z.angle*(1-z.penumbra)),te.decay=z.decay,i.spot[M]=te;const _e=z.shadow;if(z.map&&(i.spotLightMap[B]=z.map,B++,_e.updateMatrices(z),z.castShadow&&x++),i.spotLightMatrix[M]=_e.matrix,z.castShadow){const re=n.get(z);re.shadowBias=_e.bias,re.shadowNormalBias=_e.normalBias,re.shadowRadius=_e.radius,re.shadowMapSize=_e.mapSize,i.spotShadow[M]=re,i.spotShadowMap[M]=he,N++}M++}else if(z.isRectAreaLight){const te=t.get(z);te.color.copy(F).multiplyScalar(ee),te.halfWidth.set(z.width*.5,0,0),te.halfHeight.set(0,z.height*.5,0),i.rectArea[C]=te,C++}else if(z.isPointLight){const te=t.get(z);if(te.color.copy(z.color).multiplyScalar(z.intensity*L),te.distance=z.distance,te.decay=z.decay,z.castShadow){const _e=z.shadow,re=n.get(z);re.shadowBias=_e.bias,re.shadowNormalBias=_e.normalBias,re.shadowRadius=_e.radius,re.shadowMapSize=_e.mapSize,re.shadowCameraNear=_e.camera.near,re.shadowCameraFar=_e.camera.far,i.pointShadow[d]=re,i.pointShadowMap[d]=he,i.pointShadowMatrix[d]=z.shadow.matrix,E++}i.point[d]=te,d++}else if(z.isHemisphereLight){const te=t.get(z);te.skyColor.copy(z.color).multiplyScalar(ee*L),te.groundColor.copy(z.groundColor).multiplyScalar(ee*L),i.hemi[w]=te,w++}}C>0&&(e.isWebGL2||s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Se.LTC_FLOAT_1,i.rectAreaLTC2=Se.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=Se.LTC_HALF_1,i.rectAreaLTC2=Se.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=f,i.ambient[1]=g,i.ambient[2]=v;const H=i.hash;(H.directionalLength!==m||H.pointLength!==d||H.spotLength!==M||H.rectAreaLength!==C||H.hemiLength!==w||H.numDirectionalShadows!==T||H.numPointShadows!==E||H.numSpotShadows!==N||H.numSpotMaps!==B)&&(i.directional.length=m,i.spot.length=M,i.rectArea.length=C,i.point.length=d,i.hemi.length=w,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.pointShadow.length=E,i.pointShadowMap.length=E,i.spotShadow.length=N,i.spotShadowMap.length=N,i.directionalShadowMatrix.length=T,i.pointShadowMatrix.length=E,i.spotLightMatrix.length=N+B-x,i.spotLightMap.length=B,i.numSpotLightShadowsWithMaps=x,H.directionalLength=m,H.pointLength=d,H.spotLength=M,H.rectAreaLength=C,H.hemiLength=w,H.numDirectionalShadows=T,H.numPointShadows=E,H.numSpotShadows=N,H.numSpotMaps=B,i.version=xf++)}function l(u,h){let f=0,g=0,v=0,m=0,d=0;const M=h.matrixWorldInverse;for(let C=0,w=u.length;C<w;C++){const T=u[C];if(T.isDirectionalLight){const E=i.directional[f];E.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(M),f++}else if(T.isSpotLight){const E=i.spot[v];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),E.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(M),v++}else if(T.isRectAreaLight){const E=i.rectArea[m];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),a.identity(),o.copy(T.matrixWorld),o.premultiply(M),a.extractRotation(o),E.halfWidth.set(T.width*.5,0,0),E.halfHeight.set(0,T.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),m++}else if(T.isPointLight){const E=i.point[g];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),g++}else if(T.isHemisphereLight){const E=i.hemi[d];E.direction.setFromMatrixPosition(T.matrixWorld),E.direction.transformDirection(M),d++}}}return{setup:c,setupView:l,state:i}}function Ha(s,e){const t=new Sf(s,e),n=[],i=[];function r(){n.length=0,i.length=0}function o(h){n.push(h)}function a(h){i.push(h)}function c(h){t.setup(n,h)}function l(h){t.setupView(n,h)}return{init:r,state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:c,setupLightsView:l,pushLight:o,pushShadow:a}}function Mf(s,e){let t=new WeakMap;function n(r,o=0){const a=t.get(r);let c;return a===void 0?(c=new Ha(s,e),t.set(r,[c])):o>=a.length?(c=new Ha(s,e),a.push(c)):c=a[o],c}function i(){t=new WeakMap}return{get:n,dispose:i}}class yf extends br{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Pl,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class bf extends br{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.referencePosition=new W,this.nearDistance=1,this.farDistance=1e3,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.referencePosition.copy(e.referencePosition),this.nearDistance=e.nearDistance,this.farDistance=e.farDistance,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const wf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Tf=`uniform sampler2D shadow_pass;
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
}`;function Ef(s,e,t){let n=new Rs;const i=new Ge,r=new Ge,o=new wt,a=new yf({depthPacking:Il}),c=new bf,l={},u=t.maxTextureSize,h={0:jt,1:Zn,2:Cs},f=new an({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ge},radius:{value:4}},vertexShader:wf,fragmentShader:Tf}),g=f.clone();g.defines.HORIZONTAL_PASS=1;const v=new En;v.setAttribute("position",new Wt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const m=new sn(v,f),d=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=As,this.render=function(T,E,N){if(d.enabled===!1||d.autoUpdate===!1&&d.needsUpdate===!1||T.length===0)return;const B=s.getRenderTarget(),x=s.getActiveCubeFace(),L=s.getActiveMipmapLevel(),H=s.state;H.setBlending(In),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);for(let ne=0,oe=T.length;ne<oe;ne++){const z=T[ne],F=z.shadow;if(F===void 0){console.warn("THREE.WebGLShadowMap:",z,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;i.copy(F.mapSize);const ee=F.getFrameExtents();if(i.multiply(ee),r.copy(F.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/ee.x),i.x=r.x*ee.x,F.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/ee.y),i.y=r.y*ee.y,F.mapSize.y=r.y)),F.map===null){const he=this.type!==Oi?{minFilter:yt,magFilter:yt}:{};F.map=new jn(i.x,i.y,he),F.map.texture.name=z.name+".shadowMap",F.camera.updateProjectionMatrix()}s.setRenderTarget(F.map),s.clear();const le=F.getViewportCount();for(let he=0;he<le;he++){const te=F.getViewport(he);o.set(r.x*te.x,r.y*te.y,r.x*te.z,r.y*te.w),H.viewport(o),F.updateMatrices(z,he),n=F.getFrustum(),w(E,N,F.camera,z,this.type)}F.isPointLightShadow!==!0&&this.type===Oi&&M(F,N),F.needsUpdate=!1}d.needsUpdate=!1,s.setRenderTarget(B,x,L)};function M(T,E){const N=e.update(m);f.defines.VSM_SAMPLES!==T.blurSamples&&(f.defines.VSM_SAMPLES=T.blurSamples,g.defines.VSM_SAMPLES=T.blurSamples,f.needsUpdate=!0,g.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new jn(i.x,i.y)),f.uniforms.shadow_pass.value=T.map.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,s.setRenderTarget(T.mapPass),s.clear(),s.renderBufferDirect(E,null,N,f,m,null),g.uniforms.shadow_pass.value=T.mapPass.texture,g.uniforms.resolution.value=T.mapSize,g.uniforms.radius.value=T.radius,s.setRenderTarget(T.map),s.clear(),s.renderBufferDirect(E,null,N,g,m,null)}function C(T,E,N,B,x,L){let H=null;const ne=N.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(ne!==void 0)H=ne;else if(H=N.isPointLight===!0?c:a,s.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){const oe=H.uuid,z=E.uuid;let F=l[oe];F===void 0&&(F={},l[oe]=F);let ee=F[z];ee===void 0&&(ee=H.clone(),F[z]=ee),H=ee}return H.visible=E.visible,H.wireframe=E.wireframe,L===Oi?H.side=E.shadowSide!==null?E.shadowSide:E.side:H.side=E.shadowSide!==null?E.shadowSide:h[E.side],H.alphaMap=E.alphaMap,H.alphaTest=E.alphaTest,H.map=E.map,H.clipShadows=E.clipShadows,H.clippingPlanes=E.clippingPlanes,H.clipIntersection=E.clipIntersection,H.displacementMap=E.displacementMap,H.displacementScale=E.displacementScale,H.displacementBias=E.displacementBias,H.wireframeLinewidth=E.wireframeLinewidth,H.linewidth=E.linewidth,N.isPointLight===!0&&H.isMeshDistanceMaterial===!0&&(H.referencePosition.setFromMatrixPosition(N.matrixWorld),H.nearDistance=B,H.farDistance=x),H}function w(T,E,N,B,x){if(T.visible===!1)return;if(T.layers.test(E.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&x===Oi)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,T.matrixWorld);const ne=e.update(T),oe=T.material;if(Array.isArray(oe)){const z=ne.groups;for(let F=0,ee=z.length;F<ee;F++){const le=z[F],he=oe[le.materialIndex];if(he&&he.visible){const te=C(T,he,B,N.near,N.far,x);s.renderBufferDirect(N,null,ne,te,T,le)}}}else if(oe.visible){const z=C(T,oe,B,N.near,N.far,x);s.renderBufferDirect(N,null,ne,z,T,null)}}const H=T.children;for(let ne=0,oe=H.length;ne<oe;ne++)w(H[ne],E,N,B,x)}}function Af(s,e,t){const n=t.isWebGL2;function i(){let I=!1;const P=new wt;let de=null;const Ae=new wt(0,0,0,0);return{setMask:function(Ie){de!==Ie&&!I&&(s.colorMask(Ie,Ie,Ie,Ie),de=Ie)},setLocked:function(Ie){I=Ie},setClear:function(Ie,Je,ft,St,dn){dn===!0&&(Ie*=St,Je*=St,ft*=St),P.set(Ie,Je,ft,St),Ae.equals(P)===!1&&(s.clearColor(Ie,Je,ft,St),Ae.copy(P))},reset:function(){I=!1,de=null,Ae.set(-1,0,0,0)}}}function r(){let I=!1,P=null,de=null,Ae=null;return{setTest:function(Ie){Ie?He(2929):be(2929)},setMask:function(Ie){P!==Ie&&!I&&(s.depthMask(Ie),P=Ie)},setFunc:function(Ie){if(de!==Ie){switch(Ie){case nl:s.depthFunc(512);break;case il:s.depthFunc(519);break;case rl:s.depthFunc(513);break;case gs:s.depthFunc(515);break;case sl:s.depthFunc(514);break;case al:s.depthFunc(518);break;case ol:s.depthFunc(516);break;case ll:s.depthFunc(517);break;default:s.depthFunc(515)}de=Ie}},setLocked:function(Ie){I=Ie},setClear:function(Ie){Ae!==Ie&&(s.clearDepth(Ie),Ae=Ie)},reset:function(){I=!1,P=null,de=null,Ae=null}}}function o(){let I=!1,P=null,de=null,Ae=null,Ie=null,Je=null,ft=null,St=null,dn=null;return{setTest:function(tt){I||(tt?He(2960):be(2960))},setMask:function(tt){P!==tt&&!I&&(s.stencilMask(tt),P=tt)},setFunc:function(tt,$t,Ft){(de!==tt||Ae!==$t||Ie!==Ft)&&(s.stencilFunc(tt,$t,Ft),de=tt,Ae=$t,Ie=Ft)},setOp:function(tt,$t,Ft){(Je!==tt||ft!==$t||St!==Ft)&&(s.stencilOp(tt,$t,Ft),Je=tt,ft=$t,St=Ft)},setLocked:function(tt){I=tt},setClear:function(tt){dn!==tt&&(s.clearStencil(tt),dn=tt)},reset:function(){I=!1,P=null,de=null,Ae=null,Ie=null,Je=null,ft=null,St=null,dn=null}}}const a=new i,c=new r,l=new o,u=new WeakMap,h=new WeakMap;let f={},g={},v=new WeakMap,m=[],d=null,M=!1,C=null,w=null,T=null,E=null,N=null,B=null,x=null,L=!1,H=null,ne=null,oe=null,z=null,F=null;const ee=s.getParameter(35661);let le=!1,he=0;const te=s.getParameter(7938);te.indexOf("WebGL")!==-1?(he=parseFloat(/^WebGL (\d)/.exec(te)[1]),le=he>=1):te.indexOf("OpenGL ES")!==-1&&(he=parseFloat(/^OpenGL ES (\d)/.exec(te)[1]),le=he>=2);let _e=null,re={};const Y=s.getParameter(3088),q=s.getParameter(2978),ce=new wt().fromArray(Y),ge=new wt().fromArray(q);function Me(I,P,de){const Ae=new Uint8Array(4),Ie=s.createTexture();s.bindTexture(I,Ie),s.texParameteri(I,10241,9728),s.texParameteri(I,10240,9728);for(let Je=0;Je<de;Je++)s.texImage2D(P+Je,0,6408,1,1,0,6408,5121,Ae);return Ie}const X={};X[3553]=Me(3553,3553,1),X[34067]=Me(34067,34069,6),a.setClear(0,0,0,1),c.setClear(1),l.setClear(0),He(2929),c.setFunc(gs),dt(!1),Et(Is),He(2884),lt(In);function He(I){f[I]!==!0&&(s.enable(I),f[I]=!0)}function be(I){f[I]!==!1&&(s.disable(I),f[I]=!1)}function Ue(I,P){return g[I]!==P?(s.bindFramebuffer(I,P),g[I]=P,n&&(I===36009&&(g[36160]=P),I===36160&&(g[36009]=P)),!0):!1}function Le(I,P){let de=m,Ae=!1;if(I)if(de=v.get(P),de===void 0&&(de=[],v.set(P,de)),I.isWebGLMultipleRenderTargets){const Ie=I.texture;if(de.length!==Ie.length||de[0]!==36064){for(let Je=0,ft=Ie.length;Je<ft;Je++)de[Je]=36064+Je;de.length=Ie.length,Ae=!0}}else de[0]!==36064&&(de[0]=36064,Ae=!0);else de[0]!==1029&&(de[0]=1029,Ae=!0);Ae&&(t.isWebGL2?s.drawBuffers(de):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(de))}function $e(I){return d!==I?(s.useProgram(I),d=I,!0):!1}const We={[gi]:32774,[Xo]:32778,[qo]:32779};if(n)We[Us]=32775,We[zs]=32776;else{const I=e.get("EXT_blend_minmax");I!==null&&(We[Us]=I.MIN_EXT,We[zs]=I.MAX_EXT)}const Oe={[Zo]:0,[Yo]:1,[jo]:768,[so]:770,[tl]:776,[Qo]:774,[Ko]:772,[$o]:769,[ao]:771,[el]:775,[Jo]:773};function lt(I,P,de,Ae,Ie,Je,ft,St){if(I===In){M===!0&&(be(3042),M=!1);return}if(M===!1&&(He(3042),M=!0),I!==Wo){if(I!==C||St!==L){if((w!==gi||N!==gi)&&(s.blendEquation(32774),w=gi,N=gi),St)switch(I){case vi:s.blendFuncSeparate(1,771,1,771);break;case Ns:s.blendFunc(1,1);break;case Fs:s.blendFuncSeparate(0,769,0,1);break;case Os:s.blendFuncSeparate(0,768,0,770);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case vi:s.blendFuncSeparate(770,771,1,771);break;case Ns:s.blendFunc(770,1);break;case Fs:s.blendFuncSeparate(0,769,0,1);break;case Os:s.blendFunc(0,768);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}T=null,E=null,B=null,x=null,C=I,L=St}return}Ie=Ie||P,Je=Je||de,ft=ft||Ae,(P!==w||Ie!==N)&&(s.blendEquationSeparate(We[P],We[Ie]),w=P,N=Ie),(de!==T||Ae!==E||Je!==B||ft!==x)&&(s.blendFuncSeparate(Oe[de],Oe[Ae],Oe[Je],Oe[ft]),T=de,E=Ae,B=Je,x=ft),C=I,L=!1}function ct(I,P){I.side===Cs?be(2884):He(2884);let de=I.side===jt;P&&(de=!de),dt(de),I.blending===vi&&I.transparent===!1?lt(In):lt(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.premultipliedAlpha),c.setFunc(I.depthFunc),c.setTest(I.depthTest),c.setMask(I.depthWrite),a.setMask(I.colorWrite);const Ae=I.stencilWrite;l.setTest(Ae),Ae&&(l.setMask(I.stencilWriteMask),l.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),l.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),Ke(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?He(32926):be(32926)}function dt(I){H!==I&&(I?s.frontFace(2304):s.frontFace(2305),H=I)}function Et(I){I!==Go?(He(2884),I!==ne&&(I===Is?s.cullFace(1029):I===Ho?s.cullFace(1028):s.cullFace(1032))):be(2884),ne=I}function at(I){I!==oe&&(le&&s.lineWidth(I),oe=I)}function Ke(I,P,de){I?(He(32823),(z!==P||F!==de)&&(s.polygonOffset(P,de),z=P,F=de)):be(32823)}function Nt(I){I?He(3089):be(3089)}function Ct(I){I===void 0&&(I=33984+ee-1),_e!==I&&(s.activeTexture(I),_e=I)}function A(I,P,de){de===void 0&&(_e===null?de=33984+ee-1:de=_e);let Ae=re[de];Ae===void 0&&(Ae={type:void 0,texture:void 0},re[de]=Ae),(Ae.type!==I||Ae.texture!==P)&&(_e!==de&&(s.activeTexture(de),_e=de),s.bindTexture(I,P||X[I]),Ae.type=I,Ae.texture=P)}function S(){const I=re[_e];I!==void 0&&I.type!==void 0&&(s.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function K(){try{s.compressedTexImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function fe(){try{s.compressedTexImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function xe(){try{s.texSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ye(){try{s.texSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function D(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function J(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Z(){try{s.texStorage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Te(){try{s.texStorage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Re(){try{s.texImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function we(){try{s.texImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ee(I){ce.equals(I)===!1&&(s.scissor(I.x,I.y,I.z,I.w),ce.copy(I))}function Pe(I){ge.equals(I)===!1&&(s.viewport(I.x,I.y,I.z,I.w),ge.copy(I))}function ze(I,P){let de=h.get(P);de===void 0&&(de=new WeakMap,h.set(P,de));let Ae=de.get(I);Ae===void 0&&(Ae=s.getUniformBlockIndex(P,I.name),de.set(I,Ae))}function Be(I,P){const Ae=h.get(P).get(I);u.get(P)!==Ae&&(s.uniformBlockBinding(P,Ae,I.__bindingPointIndex),u.set(P,Ae))}function qe(){s.disable(3042),s.disable(2884),s.disable(2929),s.disable(32823),s.disable(3089),s.disable(2960),s.disable(32926),s.blendEquation(32774),s.blendFunc(1,0),s.blendFuncSeparate(1,0,1,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(513),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(519,0,4294967295),s.stencilOp(7680,7680,7680),s.clearStencil(0),s.cullFace(1029),s.frontFace(2305),s.polygonOffset(0,0),s.activeTexture(33984),s.bindFramebuffer(36160,null),n===!0&&(s.bindFramebuffer(36009,null),s.bindFramebuffer(36008,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),f={},_e=null,re={},g={},v=new WeakMap,m=[],d=null,M=!1,C=null,w=null,T=null,E=null,N=null,B=null,x=null,L=!1,H=null,ne=null,oe=null,z=null,F=null,ce.set(0,0,s.canvas.width,s.canvas.height),ge.set(0,0,s.canvas.width,s.canvas.height),a.reset(),c.reset(),l.reset()}return{buffers:{color:a,depth:c,stencil:l},enable:He,disable:be,bindFramebuffer:Ue,drawBuffers:Le,useProgram:$e,setBlending:lt,setMaterial:ct,setFlipSided:dt,setCullFace:Et,setLineWidth:at,setPolygonOffset:Ke,setScissorTest:Nt,activeTexture:Ct,bindTexture:A,unbindTexture:S,compressedTexImage2D:K,compressedTexImage3D:fe,texImage2D:Re,texImage3D:we,updateUBOMapping:ze,uniformBlockBinding:Be,texStorage2D:Z,texStorage3D:Te,texSubImage2D:xe,texSubImage3D:ye,compressedTexSubImage2D:D,compressedTexSubImage3D:J,scissor:Ee,viewport:Pe,reset:qe}}function Cf(s,e,t,n,i,r,o){const a=i.isWebGL2,c=i.maxTextures,l=i.maxCubemapSize,u=i.maxTextureSize,h=i.maxSamples,f=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,g=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),v=new WeakMap;let m;const d=new WeakMap;let M=!1;try{M=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function C(A,S){return M?new OffscreenCanvas(A,S):Sr("canvas")}function w(A,S,K,fe){let xe=1;if((A.width>fe||A.height>fe)&&(xe=fe/Math.max(A.width,A.height)),xe<1||S===!0)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){const ye=S?Ms:Math.floor,D=ye(xe*A.width),J=ye(xe*A.height);m===void 0&&(m=C(D,J));const Z=K?C(D,J):m;return Z.width=D,Z.height=J,Z.getContext("2d").drawImage(A,0,0,D,J),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+A.width+"x"+A.height+") to ("+D+"x"+J+")."),Z}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+A.width+"x"+A.height+")."),A;return A}function T(A){return ua(A.width)&&ua(A.height)}function E(A){return a?!1:A.wrapS!==Gt||A.wrapT!==Gt||A.minFilter!==yt&&A.minFilter!==bt}function N(A,S){return A.generateMipmaps&&S&&A.minFilter!==yt&&A.minFilter!==bt}function B(A){s.generateMipmap(A)}function x(A,S,K,fe,xe=!1){if(a===!1)return S;if(A!==null){if(s[A]!==void 0)return s[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ye=S;return S===6403&&(K===5126&&(ye=33326),K===5131&&(ye=33325),K===5121&&(ye=33321)),S===33319&&(K===5126&&(ye=33328),K===5131&&(ye=33327),K===5121&&(ye=33323)),S===6408&&(K===5126&&(ye=34836),K===5131&&(ye=34842),K===5121&&(ye=fe===rt&&xe===!1?35907:32856),K===32819&&(ye=32854),K===32820&&(ye=32855)),(ye===33325||ye===33326||ye===33327||ye===33328||ye===34842||ye===34836)&&e.get("EXT_color_buffer_float"),ye}function L(A,S,K){return N(A,K)===!0||A.isFramebufferTexture&&A.minFilter!==yt&&A.minFilter!==bt?Math.log2(Math.max(S.width,S.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?S.mipmaps.length:1}function H(A){return A===yt||A===Bs||A===Cr?9728:9729}function ne(A){const S=A.target;S.removeEventListener("dispose",ne),z(S),S.isVideoTexture&&v.delete(S)}function oe(A){const S=A.target;S.removeEventListener("dispose",oe),ee(S)}function z(A){const S=n.get(A);if(S.__webglInit===void 0)return;const K=A.source,fe=d.get(K);if(fe){const xe=fe[S.__cacheKey];xe.usedTimes--,xe.usedTimes===0&&F(A),Object.keys(fe).length===0&&d.delete(K)}n.remove(A)}function F(A){const S=n.get(A);s.deleteTexture(S.__webglTexture);const K=A.source,fe=d.get(K);delete fe[S.__cacheKey],o.memory.textures--}function ee(A){const S=A.texture,K=n.get(A),fe=n.get(S);if(fe.__webglTexture!==void 0&&(s.deleteTexture(fe.__webglTexture),o.memory.textures--),A.depthTexture&&A.depthTexture.dispose(),A.isWebGLCubeRenderTarget)for(let xe=0;xe<6;xe++)s.deleteFramebuffer(K.__webglFramebuffer[xe]),K.__webglDepthbuffer&&s.deleteRenderbuffer(K.__webglDepthbuffer[xe]);else{if(s.deleteFramebuffer(K.__webglFramebuffer),K.__webglDepthbuffer&&s.deleteRenderbuffer(K.__webglDepthbuffer),K.__webglMultisampledFramebuffer&&s.deleteFramebuffer(K.__webglMultisampledFramebuffer),K.__webglColorRenderbuffer)for(let xe=0;xe<K.__webglColorRenderbuffer.length;xe++)K.__webglColorRenderbuffer[xe]&&s.deleteRenderbuffer(K.__webglColorRenderbuffer[xe]);K.__webglDepthRenderbuffer&&s.deleteRenderbuffer(K.__webglDepthRenderbuffer)}if(A.isWebGLMultipleRenderTargets)for(let xe=0,ye=S.length;xe<ye;xe++){const D=n.get(S[xe]);D.__webglTexture&&(s.deleteTexture(D.__webglTexture),o.memory.textures--),n.remove(S[xe])}n.remove(S),n.remove(A)}let le=0;function he(){le=0}function te(){const A=le;return A>=c&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+c),le+=1,A}function _e(A){const S=[];return S.push(A.wrapS),S.push(A.wrapT),S.push(A.wrapR||0),S.push(A.magFilter),S.push(A.minFilter),S.push(A.anisotropy),S.push(A.internalFormat),S.push(A.format),S.push(A.type),S.push(A.generateMipmaps),S.push(A.premultiplyAlpha),S.push(A.flipY),S.push(A.unpackAlignment),S.push(A.encoding),S.join()}function re(A,S){const K=n.get(A);if(A.isVideoTexture&&Nt(A),A.isRenderTargetTexture===!1&&A.version>0&&K.__version!==A.version){const fe=A.image;if(fe===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(fe.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{be(K,A,S);return}}t.bindTexture(3553,K.__webglTexture,33984+S)}function Y(A,S){const K=n.get(A);if(A.version>0&&K.__version!==A.version){be(K,A,S);return}t.bindTexture(35866,K.__webglTexture,33984+S)}function q(A,S){const K=n.get(A);if(A.version>0&&K.__version!==A.version){be(K,A,S);return}t.bindTexture(32879,K.__webglTexture,33984+S)}function ce(A,S){const K=n.get(A);if(A.version>0&&K.__version!==A.version){Ue(K,A,S);return}t.bindTexture(34067,K.__webglTexture,33984+S)}const ge={[vr]:10497,[Gt]:33071,[vs]:33648},Me={[yt]:9728,[Bs]:9984,[Cr]:9986,[bt]:9729,[gl]:9985,[bi]:9987};function X(A,S,K){if(K?(s.texParameteri(A,10242,ge[S.wrapS]),s.texParameteri(A,10243,ge[S.wrapT]),(A===32879||A===35866)&&s.texParameteri(A,32882,ge[S.wrapR]),s.texParameteri(A,10240,Me[S.magFilter]),s.texParameteri(A,10241,Me[S.minFilter])):(s.texParameteri(A,10242,33071),s.texParameteri(A,10243,33071),(A===32879||A===35866)&&s.texParameteri(A,32882,33071),(S.wrapS!==Gt||S.wrapT!==Gt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),s.texParameteri(A,10240,H(S.magFilter)),s.texParameteri(A,10241,H(S.minFilter)),S.minFilter!==yt&&S.minFilter!==bt&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),e.has("EXT_texture_filter_anisotropic")===!0){const fe=e.get("EXT_texture_filter_anisotropic");if(S.magFilter===yt||S.minFilter!==Cr&&S.minFilter!==bi||S.type===rn&&e.has("OES_texture_float_linear")===!1||a===!1&&S.type===bn&&e.has("OES_texture_half_float_linear")===!1)return;(S.anisotropy>1||n.get(S).__currentAnisotropy)&&(s.texParameterf(A,fe.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy)}}function He(A,S){let K=!1;A.__webglInit===void 0&&(A.__webglInit=!0,S.addEventListener("dispose",ne));const fe=S.source;let xe=d.get(fe);xe===void 0&&(xe={},d.set(fe,xe));const ye=_e(S);if(ye!==A.__cacheKey){xe[ye]===void 0&&(xe[ye]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,K=!0),xe[ye].usedTimes++;const D=xe[A.__cacheKey];D!==void 0&&(xe[A.__cacheKey].usedTimes--,D.usedTimes===0&&F(S)),A.__cacheKey=ye,A.__webglTexture=xe[ye].texture}return K}function be(A,S,K){let fe=3553;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(fe=35866),S.isData3DTexture&&(fe=32879);const xe=He(A,S),ye=S.source;t.bindTexture(fe,A.__webglTexture,33984+K);const D=n.get(ye);if(ye.version!==D.__version||xe===!0){t.activeTexture(33984+K),s.pixelStorei(37440,S.flipY),s.pixelStorei(37441,S.premultiplyAlpha),s.pixelStorei(3317,S.unpackAlignment),s.pixelStorei(37443,0);const J=E(S)&&T(S.image)===!1;let Z=w(S.image,J,!1,u);Z=Ct(S,Z);const Te=T(Z)||a,Re=r.convert(S.format,S.encoding);let we=r.convert(S.type),Ee=x(S.internalFormat,Re,we,S.encoding,S.isVideoTexture);X(fe,S,Te);let Pe;const ze=S.mipmaps,Be=a&&S.isVideoTexture!==!0,qe=D.__version===void 0||xe===!0,I=L(S,Z,Te);if(S.isDepthTexture)Ee=6402,a?S.type===rn?Ee=36012:S.type===Hn?Ee=33190:S.type===Si?Ee=35056:Ee=33189:S.type===rn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),S.format===Wn&&Ee===6402&&S.type!==co&&S.type!==Hn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),S.type=Hn,we=r.convert(S.type)),S.format===wi&&Ee===6402&&(Ee=34041,S.type!==Si&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),S.type=Si,we=r.convert(S.type))),qe&&(Be?t.texStorage2D(3553,1,Ee,Z.width,Z.height):t.texImage2D(3553,0,Ee,Z.width,Z.height,0,Re,we,null));else if(S.isDataTexture)if(ze.length>0&&Te){Be&&qe&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let P=0,de=ze.length;P<de;P++)Pe=ze[P],Be?t.texSubImage2D(3553,P,0,0,Pe.width,Pe.height,Re,we,Pe.data):t.texImage2D(3553,P,Ee,Pe.width,Pe.height,0,Re,we,Pe.data);S.generateMipmaps=!1}else Be?(qe&&t.texStorage2D(3553,I,Ee,Z.width,Z.height),t.texSubImage2D(3553,0,0,0,Z.width,Z.height,Re,we,Z.data)):t.texImage2D(3553,0,Ee,Z.width,Z.height,0,Re,we,Z.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Be&&qe&&t.texStorage3D(35866,I,Ee,ze[0].width,ze[0].height,Z.depth);for(let P=0,de=ze.length;P<de;P++)Pe=ze[P],S.format!==Ht?Re!==null?Be?t.compressedTexSubImage3D(35866,P,0,0,0,Pe.width,Pe.height,Z.depth,Re,Pe.data,0,0):t.compressedTexImage3D(35866,P,Ee,Pe.width,Pe.height,Z.depth,0,Pe.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?t.texSubImage3D(35866,P,0,0,0,Pe.width,Pe.height,Z.depth,Re,we,Pe.data):t.texImage3D(35866,P,Ee,Pe.width,Pe.height,Z.depth,0,Re,we,Pe.data)}else{Be&&qe&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let P=0,de=ze.length;P<de;P++)Pe=ze[P],S.format!==Ht?Re!==null?Be?t.compressedTexSubImage2D(3553,P,0,0,Pe.width,Pe.height,Re,Pe.data):t.compressedTexImage2D(3553,P,Ee,Pe.width,Pe.height,0,Pe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?t.texSubImage2D(3553,P,0,0,Pe.width,Pe.height,Re,we,Pe.data):t.texImage2D(3553,P,Ee,Pe.width,Pe.height,0,Re,we,Pe.data)}else if(S.isDataArrayTexture)Be?(qe&&t.texStorage3D(35866,I,Ee,Z.width,Z.height,Z.depth),t.texSubImage3D(35866,0,0,0,0,Z.width,Z.height,Z.depth,Re,we,Z.data)):t.texImage3D(35866,0,Ee,Z.width,Z.height,Z.depth,0,Re,we,Z.data);else if(S.isData3DTexture)Be?(qe&&t.texStorage3D(32879,I,Ee,Z.width,Z.height,Z.depth),t.texSubImage3D(32879,0,0,0,0,Z.width,Z.height,Z.depth,Re,we,Z.data)):t.texImage3D(32879,0,Ee,Z.width,Z.height,Z.depth,0,Re,we,Z.data);else if(S.isFramebufferTexture){if(qe)if(Be)t.texStorage2D(3553,I,Ee,Z.width,Z.height);else{let P=Z.width,de=Z.height;for(let Ae=0;Ae<I;Ae++)t.texImage2D(3553,Ae,Ee,P,de,0,Re,we,null),P>>=1,de>>=1}}else if(ze.length>0&&Te){Be&&qe&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let P=0,de=ze.length;P<de;P++)Pe=ze[P],Be?t.texSubImage2D(3553,P,0,0,Re,we,Pe):t.texImage2D(3553,P,Ee,Re,we,Pe);S.generateMipmaps=!1}else Be?(qe&&t.texStorage2D(3553,I,Ee,Z.width,Z.height),t.texSubImage2D(3553,0,0,0,Re,we,Z)):t.texImage2D(3553,0,Ee,Re,we,Z);N(S,Te)&&B(fe),D.__version=ye.version,S.onUpdate&&S.onUpdate(S)}A.__version=S.version}function Ue(A,S,K){if(S.image.length!==6)return;const fe=He(A,S),xe=S.source;t.bindTexture(34067,A.__webglTexture,33984+K);const ye=n.get(xe);if(xe.version!==ye.__version||fe===!0){t.activeTexture(33984+K),s.pixelStorei(37440,S.flipY),s.pixelStorei(37441,S.premultiplyAlpha),s.pixelStorei(3317,S.unpackAlignment),s.pixelStorei(37443,0);const D=S.isCompressedTexture||S.image[0].isCompressedTexture,J=S.image[0]&&S.image[0].isDataTexture,Z=[];for(let P=0;P<6;P++)!D&&!J?Z[P]=w(S.image[P],!1,!0,l):Z[P]=J?S.image[P].image:S.image[P],Z[P]=Ct(S,Z[P]);const Te=Z[0],Re=T(Te)||a,we=r.convert(S.format,S.encoding),Ee=r.convert(S.type),Pe=x(S.internalFormat,we,Ee,S.encoding),ze=a&&S.isVideoTexture!==!0,Be=ye.__version===void 0||fe===!0;let qe=L(S,Te,Re);X(34067,S,Re);let I;if(D){ze&&Be&&t.texStorage2D(34067,qe,Pe,Te.width,Te.height);for(let P=0;P<6;P++){I=Z[P].mipmaps;for(let de=0;de<I.length;de++){const Ae=I[de];S.format!==Ht?we!==null?ze?t.compressedTexSubImage2D(34069+P,de,0,0,Ae.width,Ae.height,we,Ae.data):t.compressedTexImage2D(34069+P,de,Pe,Ae.width,Ae.height,0,Ae.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ze?t.texSubImage2D(34069+P,de,0,0,Ae.width,Ae.height,we,Ee,Ae.data):t.texImage2D(34069+P,de,Pe,Ae.width,Ae.height,0,we,Ee,Ae.data)}}}else{I=S.mipmaps,ze&&Be&&(I.length>0&&qe++,t.texStorage2D(34067,qe,Pe,Z[0].width,Z[0].height));for(let P=0;P<6;P++)if(J){ze?t.texSubImage2D(34069+P,0,0,0,Z[P].width,Z[P].height,we,Ee,Z[P].data):t.texImage2D(34069+P,0,Pe,Z[P].width,Z[P].height,0,we,Ee,Z[P].data);for(let de=0;de<I.length;de++){const Ie=I[de].image[P].image;ze?t.texSubImage2D(34069+P,de+1,0,0,Ie.width,Ie.height,we,Ee,Ie.data):t.texImage2D(34069+P,de+1,Pe,Ie.width,Ie.height,0,we,Ee,Ie.data)}}else{ze?t.texSubImage2D(34069+P,0,0,0,we,Ee,Z[P]):t.texImage2D(34069+P,0,Pe,we,Ee,Z[P]);for(let de=0;de<I.length;de++){const Ae=I[de];ze?t.texSubImage2D(34069+P,de+1,0,0,we,Ee,Ae.image[P]):t.texImage2D(34069+P,de+1,Pe,we,Ee,Ae.image[P])}}}N(S,Re)&&B(34067),ye.__version=xe.version,S.onUpdate&&S.onUpdate(S)}A.__version=S.version}function Le(A,S,K,fe,xe){const ye=r.convert(K.format,K.encoding),D=r.convert(K.type),J=x(K.internalFormat,ye,D,K.encoding);n.get(S).__hasExternalTextures||(xe===32879||xe===35866?t.texImage3D(xe,0,J,S.width,S.height,S.depth,0,ye,D,null):t.texImage2D(xe,0,J,S.width,S.height,0,ye,D,null)),t.bindFramebuffer(36160,A),Ke(S)?f.framebufferTexture2DMultisampleEXT(36160,fe,xe,n.get(K).__webglTexture,0,at(S)):(xe===3553||xe>=34069&&xe<=34074)&&s.framebufferTexture2D(36160,fe,xe,n.get(K).__webglTexture,0),t.bindFramebuffer(36160,null)}function $e(A,S,K){if(s.bindRenderbuffer(36161,A),S.depthBuffer&&!S.stencilBuffer){let fe=33189;if(K||Ke(S)){const xe=S.depthTexture;xe&&xe.isDepthTexture&&(xe.type===rn?fe=36012:xe.type===Hn&&(fe=33190));const ye=at(S);Ke(S)?f.renderbufferStorageMultisampleEXT(36161,ye,fe,S.width,S.height):s.renderbufferStorageMultisample(36161,ye,fe,S.width,S.height)}else s.renderbufferStorage(36161,fe,S.width,S.height);s.framebufferRenderbuffer(36160,36096,36161,A)}else if(S.depthBuffer&&S.stencilBuffer){const fe=at(S);K&&Ke(S)===!1?s.renderbufferStorageMultisample(36161,fe,35056,S.width,S.height):Ke(S)?f.renderbufferStorageMultisampleEXT(36161,fe,35056,S.width,S.height):s.renderbufferStorage(36161,34041,S.width,S.height),s.framebufferRenderbuffer(36160,33306,36161,A)}else{const fe=S.isWebGLMultipleRenderTargets===!0?S.texture:[S.texture];for(let xe=0;xe<fe.length;xe++){const ye=fe[xe],D=r.convert(ye.format,ye.encoding),J=r.convert(ye.type),Z=x(ye.internalFormat,D,J,ye.encoding),Te=at(S);K&&Ke(S)===!1?s.renderbufferStorageMultisample(36161,Te,Z,S.width,S.height):Ke(S)?f.renderbufferStorageMultisampleEXT(36161,Te,Z,S.width,S.height):s.renderbufferStorage(36161,Z,S.width,S.height)}}s.bindRenderbuffer(36161,null)}function We(A,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(36160,A),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(S.depthTexture).__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),re(S.depthTexture,0);const fe=n.get(S.depthTexture).__webglTexture,xe=at(S);if(S.depthTexture.format===Wn)Ke(S)?f.framebufferTexture2DMultisampleEXT(36160,36096,3553,fe,0,xe):s.framebufferTexture2D(36160,36096,3553,fe,0);else if(S.depthTexture.format===wi)Ke(S)?f.framebufferTexture2DMultisampleEXT(36160,33306,3553,fe,0,xe):s.framebufferTexture2D(36160,33306,3553,fe,0);else throw new Error("Unknown depthTexture format")}function Oe(A){const S=n.get(A),K=A.isWebGLCubeRenderTarget===!0;if(A.depthTexture&&!S.__autoAllocateDepthBuffer){if(K)throw new Error("target.depthTexture not supported in Cube render targets");We(S.__webglFramebuffer,A)}else if(K){S.__webglDepthbuffer=[];for(let fe=0;fe<6;fe++)t.bindFramebuffer(36160,S.__webglFramebuffer[fe]),S.__webglDepthbuffer[fe]=s.createRenderbuffer(),$e(S.__webglDepthbuffer[fe],A,!1)}else t.bindFramebuffer(36160,S.__webglFramebuffer),S.__webglDepthbuffer=s.createRenderbuffer(),$e(S.__webglDepthbuffer,A,!1);t.bindFramebuffer(36160,null)}function lt(A,S,K){const fe=n.get(A);S!==void 0&&Le(fe.__webglFramebuffer,A,A.texture,36064,3553),K!==void 0&&Oe(A)}function ct(A){const S=A.texture,K=n.get(A),fe=n.get(S);A.addEventListener("dispose",oe),A.isWebGLMultipleRenderTargets!==!0&&(fe.__webglTexture===void 0&&(fe.__webglTexture=s.createTexture()),fe.__version=S.version,o.memory.textures++);const xe=A.isWebGLCubeRenderTarget===!0,ye=A.isWebGLMultipleRenderTargets===!0,D=T(A)||a;if(xe){K.__webglFramebuffer=[];for(let J=0;J<6;J++)K.__webglFramebuffer[J]=s.createFramebuffer()}else{if(K.__webglFramebuffer=s.createFramebuffer(),ye)if(i.drawBuffers){const J=A.texture;for(let Z=0,Te=J.length;Z<Te;Z++){const Re=n.get(J[Z]);Re.__webglTexture===void 0&&(Re.__webglTexture=s.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&A.samples>0&&Ke(A)===!1){const J=ye?S:[S];K.__webglMultisampledFramebuffer=s.createFramebuffer(),K.__webglColorRenderbuffer=[],t.bindFramebuffer(36160,K.__webglMultisampledFramebuffer);for(let Z=0;Z<J.length;Z++){const Te=J[Z];K.__webglColorRenderbuffer[Z]=s.createRenderbuffer(),s.bindRenderbuffer(36161,K.__webglColorRenderbuffer[Z]);const Re=r.convert(Te.format,Te.encoding),we=r.convert(Te.type),Ee=x(Te.internalFormat,Re,we,Te.encoding,A.isXRRenderTarget===!0),Pe=at(A);s.renderbufferStorageMultisample(36161,Pe,Ee,A.width,A.height),s.framebufferRenderbuffer(36160,36064+Z,36161,K.__webglColorRenderbuffer[Z])}s.bindRenderbuffer(36161,null),A.depthBuffer&&(K.__webglDepthRenderbuffer=s.createRenderbuffer(),$e(K.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(36160,null)}}if(xe){t.bindTexture(34067,fe.__webglTexture),X(34067,S,D);for(let J=0;J<6;J++)Le(K.__webglFramebuffer[J],A,S,36064,34069+J);N(S,D)&&B(34067),t.unbindTexture()}else if(ye){const J=A.texture;for(let Z=0,Te=J.length;Z<Te;Z++){const Re=J[Z],we=n.get(Re);t.bindTexture(3553,we.__webglTexture),X(3553,Re,D),Le(K.__webglFramebuffer,A,Re,36064+Z,3553),N(Re,D)&&B(3553)}t.unbindTexture()}else{let J=3553;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(a?J=A.isWebGL3DRenderTarget?32879:35866:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(J,fe.__webglTexture),X(J,S,D),Le(K.__webglFramebuffer,A,S,36064,J),N(S,D)&&B(J),t.unbindTexture()}A.depthBuffer&&Oe(A)}function dt(A){const S=T(A)||a,K=A.isWebGLMultipleRenderTargets===!0?A.texture:[A.texture];for(let fe=0,xe=K.length;fe<xe;fe++){const ye=K[fe];if(N(ye,S)){const D=A.isWebGLCubeRenderTarget?34067:3553,J=n.get(ye).__webglTexture;t.bindTexture(D,J),B(D),t.unbindTexture()}}}function Et(A){if(a&&A.samples>0&&Ke(A)===!1){const S=A.isWebGLMultipleRenderTargets?A.texture:[A.texture],K=A.width,fe=A.height;let xe=16384;const ye=[],D=A.stencilBuffer?33306:36096,J=n.get(A),Z=A.isWebGLMultipleRenderTargets===!0;if(Z)for(let Te=0;Te<S.length;Te++)t.bindFramebuffer(36160,J.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Te,36161,null),t.bindFramebuffer(36160,J.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Te,3553,null,0);t.bindFramebuffer(36008,J.__webglMultisampledFramebuffer),t.bindFramebuffer(36009,J.__webglFramebuffer);for(let Te=0;Te<S.length;Te++){ye.push(36064+Te),A.depthBuffer&&ye.push(D);const Re=J.__ignoreDepthValues!==void 0?J.__ignoreDepthValues:!1;if(Re===!1&&(A.depthBuffer&&(xe|=256),A.stencilBuffer&&(xe|=1024)),Z&&s.framebufferRenderbuffer(36008,36064,36161,J.__webglColorRenderbuffer[Te]),Re===!0&&(s.invalidateFramebuffer(36008,[D]),s.invalidateFramebuffer(36009,[D])),Z){const we=n.get(S[Te]).__webglTexture;s.framebufferTexture2D(36009,36064,3553,we,0)}s.blitFramebuffer(0,0,K,fe,0,0,K,fe,xe,9728),g&&s.invalidateFramebuffer(36008,ye)}if(t.bindFramebuffer(36008,null),t.bindFramebuffer(36009,null),Z)for(let Te=0;Te<S.length;Te++){t.bindFramebuffer(36160,J.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Te,36161,J.__webglColorRenderbuffer[Te]);const Re=n.get(S[Te]).__webglTexture;t.bindFramebuffer(36160,J.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Te,3553,Re,0)}t.bindFramebuffer(36009,J.__webglMultisampledFramebuffer)}}function at(A){return Math.min(h,A.samples)}function Ke(A){const S=n.get(A);return a&&A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Nt(A){const S=o.render.frame;v.get(A)!==S&&(v.set(A,S),A.update())}function Ct(A,S){const K=A.encoding,fe=A.format,xe=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||A.format===Ss||K!==Tn&&(K===rt?a===!1?e.has("EXT_sRGB")===!0&&fe===Ht?(A.format=Ss,A.minFilter=bt,A.generateMipmaps=!1):S=po.sRGBToLinear(S):(fe!==Ht||xe!==Yn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture encoding:",K)),S}this.allocateTextureUnit=te,this.resetTextureUnits=he,this.setTexture2D=re,this.setTexture2DArray=Y,this.setTexture3D=q,this.setTextureCube=ce,this.rebindTextures=lt,this.setupRenderTarget=ct,this.updateRenderTargetMipmap=dt,this.updateMultisampleRenderTarget=Et,this.setupDepthRenderbuffer=Oe,this.setupFrameBufferTexture=Le,this.useMultisampledRTT=Ke}function Lf(s,e,t){const n=t.isWebGL2;function i(r,o=null){let a;if(r===Yn)return 5121;if(r===Ml)return 32819;if(r===yl)return 32820;if(r===xl)return 5120;if(r===vl)return 5122;if(r===co)return 5123;if(r===Sl)return 5124;if(r===Hn)return 5125;if(r===rn)return 5126;if(r===bn)return n?5131:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(r===bl)return 6406;if(r===Ht)return 6408;if(r===Tl)return 6409;if(r===El)return 6410;if(r===Wn)return 6402;if(r===wi)return 34041;if(r===wl)return console.warn("THREE.WebGLRenderer: THREE.RGBFormat has been removed. Use THREE.RGBAFormat instead. https://github.com/mrdoob/three.js/pull/23228"),6408;if(r===Ss)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(r===uo)return 6403;if(r===Al)return 36244;if(r===Cl)return 33319;if(r===Ll)return 33320;if(r===Rl)return 36249;if(r===Lr||r===Rr||r===Dr||r===Pr)if(o===rt)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(r===Lr)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===Rr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===Dr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===Pr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(r===Lr)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===Rr)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===Dr)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===Pr)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===ks||r===Gs||r===Hs||r===Vs)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(r===ks)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Gs)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===Hs)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Vs)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Dl)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===Ws||r===Xs)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(r===Ws)return o===rt?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(r===Xs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===qs||r===Zs||r===Ys||r===js||r===$s||r===Ks||r===Js||r===Qs||r===ea||r===ta||r===na||r===ia||r===ra||r===sa)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(r===qs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===Zs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===Ys)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===js)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===$s)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===Ks)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===Js)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===Qs)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===ea)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===ta)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===na)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===ia)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===ra)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===sa)return o===rt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===aa)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(r===aa)return o===rt?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT}else return null;return r===Si?n?34042:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):s[r]!==void 0?s[r]:null}return{convert:i}}class Rf extends nn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class pr extends Tt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Df={type:"move"};class ss{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new W,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new W),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new W,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new W),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(const m of e.hand.values()){const d=t.getJointPose(m,n),M=this._getHandJoint(l,m);d!==null&&(M.matrix.fromArray(d.transform.matrix),M.matrix.decompose(M.position,M.rotation,M.scale),M.jointRadius=d.radius),M.visible=d!==null}const u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],f=u.position.distanceTo(h.position),g=.02,v=.005;l.inputState.pinching&&f>g+v?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&f<=g-v&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Df)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new pr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Pf extends It{constructor(e,t,n,i,r,o,a,c,l,u){if(u=u!==void 0?u:Wn,u!==Wn&&u!==wi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Wn&&(n=Hn),n===void 0&&u===wi&&(n=Si),super(null,i,r,o,a,c,u,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:yt,this.minFilter=c!==void 0?c:yt,this.flipY=!1,this.generateMipmaps=!1}}class If extends $n{constructor(e,t){super();const n=this;let i=null,r=1,o=null,a="local-floor",c=null,l=null,u=null,h=null,f=null,g=null;const v=t.getContextAttributes();let m=null,d=null;const M=[],C=[],w=new Set,T=new Map,E=new nn;E.layers.enable(1),E.viewport=new wt;const N=new nn;N.layers.enable(2),N.viewport=new wt;const B=[E,N],x=new Rf;x.layers.enable(1),x.layers.enable(2);let L=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let q=M[Y];return q===void 0&&(q=new ss,M[Y]=q),q.getTargetRaySpace()},this.getControllerGrip=function(Y){let q=M[Y];return q===void 0&&(q=new ss,M[Y]=q),q.getGripSpace()},this.getHand=function(Y){let q=M[Y];return q===void 0&&(q=new ss,M[Y]=q),q.getHandSpace()};function ne(Y){const q=C.indexOf(Y.inputSource);if(q===-1)return;const ce=M[q];ce!==void 0&&ce.dispatchEvent({type:Y.type,data:Y.inputSource})}function oe(){i.removeEventListener("select",ne),i.removeEventListener("selectstart",ne),i.removeEventListener("selectend",ne),i.removeEventListener("squeeze",ne),i.removeEventListener("squeezestart",ne),i.removeEventListener("squeezeend",ne),i.removeEventListener("end",oe),i.removeEventListener("inputsourceschange",z);for(let Y=0;Y<M.length;Y++){const q=C[Y];q!==null&&(C[Y]=null,M[Y].disconnect(q))}L=null,H=null,e.setRenderTarget(m),f=null,h=null,u=null,i=null,d=null,re.stop(),n.isPresenting=!1,n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){a=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Y){c=Y},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(Y){if(i=Y,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",ne),i.addEventListener("selectstart",ne),i.addEventListener("selectend",ne),i.addEventListener("squeeze",ne),i.addEventListener("squeezestart",ne),i.addEventListener("squeezeend",ne),i.addEventListener("end",oe),i.addEventListener("inputsourceschange",z),v.xrCompatible!==!0&&await t.makeXRCompatible(),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const q={antialias:i.renderState.layers===void 0?v.antialias:!0,alpha:v.alpha,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,q),i.updateRenderState({baseLayer:f}),d=new jn(f.framebufferWidth,f.framebufferHeight,{format:Ht,type:Yn,encoding:e.outputEncoding,stencilBuffer:v.stencil})}else{let q=null,ce=null,ge=null;v.depth&&(ge=v.stencil?35056:33190,q=v.stencil?wi:Wn,ce=v.stencil?Si:Hn);const Me={colorFormat:32856,depthFormat:ge,scaleFactor:r};u=new XRWebGLBinding(i,t),h=u.createProjectionLayer(Me),i.updateRenderState({layers:[h]}),d=new jn(h.textureWidth,h.textureHeight,{format:Ht,type:Yn,depthTexture:new Pf(h.textureWidth,h.textureHeight,ce,void 0,void 0,void 0,void 0,void 0,void 0,q),stencilBuffer:v.stencil,encoding:e.outputEncoding,samples:v.antialias?4:0});const X=e.properties.get(d);X.__ignoreDepthValues=h.ignoreDepthValues}d.isXRRenderTarget=!0,this.setFoveation(1),c=null,o=await i.requestReferenceSpace(a),re.setContext(i),re.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}};function z(Y){for(let q=0;q<Y.removed.length;q++){const ce=Y.removed[q],ge=C.indexOf(ce);ge>=0&&(C[ge]=null,M[ge].disconnect(ce))}for(let q=0;q<Y.added.length;q++){const ce=Y.added[q];let ge=C.indexOf(ce);if(ge===-1){for(let X=0;X<M.length;X++)if(X>=C.length){C.push(ce),ge=X;break}else if(C[X]===null){C[X]=ce,ge=X;break}if(ge===-1)break}const Me=M[ge];Me&&Me.connect(ce)}}const F=new W,ee=new W;function le(Y,q,ce){F.setFromMatrixPosition(q.matrixWorld),ee.setFromMatrixPosition(ce.matrixWorld);const ge=F.distanceTo(ee),Me=q.projectionMatrix.elements,X=ce.projectionMatrix.elements,He=Me[14]/(Me[10]-1),be=Me[14]/(Me[10]+1),Ue=(Me[9]+1)/Me[5],Le=(Me[9]-1)/Me[5],$e=(Me[8]-1)/Me[0],We=(X[8]+1)/X[0],Oe=He*$e,lt=He*We,ct=ge/(-$e+We),dt=ct*-$e;q.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(dt),Y.translateZ(ct),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert();const Et=He+ct,at=be+ct,Ke=Oe-dt,Nt=lt+(ge-dt),Ct=Ue*be/at*Et,A=Le*be/at*Et;Y.projectionMatrix.makePerspective(Ke,Nt,Ct,A,Et,at)}function he(Y,q){q===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(q.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(i===null)return;x.near=N.near=E.near=Y.near,x.far=N.far=E.far=Y.far,(L!==x.near||H!==x.far)&&(i.updateRenderState({depthNear:x.near,depthFar:x.far}),L=x.near,H=x.far);const q=Y.parent,ce=x.cameras;he(x,q);for(let Me=0;Me<ce.length;Me++)he(ce[Me],q);x.matrixWorld.decompose(x.position,x.quaternion,x.scale),Y.matrix.copy(x.matrix),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale);const ge=Y.children;for(let Me=0,X=ge.length;Me<X;Me++)ge[Me].updateMatrixWorld(!0);ce.length===2?le(x,E,N):x.projectionMatrix.copy(E.projectionMatrix)},this.getCamera=function(){return x},this.getFoveation=function(){if(h!==null)return h.fixedFoveation;if(f!==null)return f.fixedFoveation},this.setFoveation=function(Y){h!==null&&(h.fixedFoveation=Y),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Y)},this.getPlanes=function(){return w};let te=null;function _e(Y,q){if(l=q.getViewerPose(c||o),g=q,l!==null){const ce=l.views;f!==null&&(e.setRenderTargetFramebuffer(d,f.framebuffer),e.setRenderTarget(d));let ge=!1;ce.length!==x.cameras.length&&(x.cameras.length=0,ge=!0);for(let Me=0;Me<ce.length;Me++){const X=ce[Me];let He=null;if(f!==null)He=f.getViewport(X);else{const Ue=u.getViewSubImage(h,X);He=Ue.viewport,Me===0&&(e.setRenderTargetTextures(d,Ue.colorTexture,h.ignoreDepthValues?void 0:Ue.depthStencilTexture),e.setRenderTarget(d))}let be=B[Me];be===void 0&&(be=new nn,be.layers.enable(Me),be.viewport=new wt,B[Me]=be),be.matrix.fromArray(X.transform.matrix),be.projectionMatrix.fromArray(X.projectionMatrix),be.viewport.set(He.x,He.y,He.width,He.height),Me===0&&x.matrix.copy(be.matrix),ge===!0&&x.cameras.push(be)}}for(let ce=0;ce<M.length;ce++){const ge=C[ce],Me=M[ce];ge!==null&&Me!==void 0&&Me.update(ge,q,c||o)}if(te&&te(Y,q),q.detectedPlanes){n.dispatchEvent({type:"planesdetected",data:q.detectedPlanes});let ce=null;for(const ge of w)q.detectedPlanes.has(ge)||(ce===null&&(ce=[]),ce.push(ge));if(ce!==null)for(const ge of ce)w.delete(ge),T.delete(ge),n.dispatchEvent({type:"planeremoved",data:ge});for(const ge of q.detectedPlanes)if(!w.has(ge))w.add(ge),T.set(ge,q.lastChangedTime),n.dispatchEvent({type:"planeadded",data:ge});else{const Me=T.get(ge);ge.lastChangedTime>Me&&(T.set(ge,ge.lastChangedTime),n.dispatchEvent({type:"planechanged",data:ge}))}}g=null}const re=new wo;re.setAnimationLoop(_e),this.setAnimationLoop=function(Y){te=Y},this.dispose=function(){}}}function Nf(s,e){function t(m,d){d.color.getRGB(m.fogColor.value,Mo(s)),d.isFog?(m.fogNear.value=d.near,m.fogFar.value=d.far):d.isFogExp2&&(m.fogDensity.value=d.density)}function n(m,d,M,C,w){d.isMeshBasicMaterial||d.isMeshLambertMaterial?i(m,d):d.isMeshToonMaterial?(i(m,d),u(m,d)):d.isMeshPhongMaterial?(i(m,d),l(m,d)):d.isMeshStandardMaterial?(i(m,d),h(m,d),d.isMeshPhysicalMaterial&&f(m,d,w)):d.isMeshMatcapMaterial?(i(m,d),g(m,d)):d.isMeshDepthMaterial?i(m,d):d.isMeshDistanceMaterial?(i(m,d),v(m,d)):d.isMeshNormalMaterial?i(m,d):d.isLineBasicMaterial?(r(m,d),d.isLineDashedMaterial&&o(m,d)):d.isPointsMaterial?a(m,d,M,C):d.isSpriteMaterial?c(m,d):d.isShadowMaterial?(m.color.value.copy(d.color),m.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function i(m,d){m.opacity.value=d.opacity,d.color&&m.diffuse.value.copy(d.color),d.emissive&&m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(m.map.value=d.map),d.alphaMap&&(m.alphaMap.value=d.alphaMap),d.bumpMap&&(m.bumpMap.value=d.bumpMap,m.bumpScale.value=d.bumpScale,d.side===jt&&(m.bumpScale.value*=-1)),d.displacementMap&&(m.displacementMap.value=d.displacementMap,m.displacementScale.value=d.displacementScale,m.displacementBias.value=d.displacementBias),d.emissiveMap&&(m.emissiveMap.value=d.emissiveMap),d.normalMap&&(m.normalMap.value=d.normalMap,m.normalScale.value.copy(d.normalScale),d.side===jt&&m.normalScale.value.negate()),d.specularMap&&(m.specularMap.value=d.specularMap),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);const M=e.get(d).envMap;if(M&&(m.envMap.value=M,m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=d.reflectivity,m.ior.value=d.ior,m.refractionRatio.value=d.refractionRatio),d.lightMap){m.lightMap.value=d.lightMap;const T=s.physicallyCorrectLights!==!0?Math.PI:1;m.lightMapIntensity.value=d.lightMapIntensity*T}d.aoMap&&(m.aoMap.value=d.aoMap,m.aoMapIntensity.value=d.aoMapIntensity);let C;d.map?C=d.map:d.specularMap?C=d.specularMap:d.displacementMap?C=d.displacementMap:d.normalMap?C=d.normalMap:d.bumpMap?C=d.bumpMap:d.roughnessMap?C=d.roughnessMap:d.metalnessMap?C=d.metalnessMap:d.alphaMap?C=d.alphaMap:d.emissiveMap?C=d.emissiveMap:d.clearcoatMap?C=d.clearcoatMap:d.clearcoatNormalMap?C=d.clearcoatNormalMap:d.clearcoatRoughnessMap?C=d.clearcoatRoughnessMap:d.iridescenceMap?C=d.iridescenceMap:d.iridescenceThicknessMap?C=d.iridescenceThicknessMap:d.specularIntensityMap?C=d.specularIntensityMap:d.specularColorMap?C=d.specularColorMap:d.transmissionMap?C=d.transmissionMap:d.thicknessMap?C=d.thicknessMap:d.sheenColorMap?C=d.sheenColorMap:d.sheenRoughnessMap&&(C=d.sheenRoughnessMap),C!==void 0&&(C.isWebGLRenderTarget&&(C=C.texture),C.matrixAutoUpdate===!0&&C.updateMatrix(),m.uvTransform.value.copy(C.matrix));let w;d.aoMap?w=d.aoMap:d.lightMap&&(w=d.lightMap),w!==void 0&&(w.isWebGLRenderTarget&&(w=w.texture),w.matrixAutoUpdate===!0&&w.updateMatrix(),m.uv2Transform.value.copy(w.matrix))}function r(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity}function o(m,d){m.dashSize.value=d.dashSize,m.totalSize.value=d.dashSize+d.gapSize,m.scale.value=d.scale}function a(m,d,M,C){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.size.value=d.size*M,m.scale.value=C*.5,d.map&&(m.map.value=d.map),d.alphaMap&&(m.alphaMap.value=d.alphaMap),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);let w;d.map?w=d.map:d.alphaMap&&(w=d.alphaMap),w!==void 0&&(w.matrixAutoUpdate===!0&&w.updateMatrix(),m.uvTransform.value.copy(w.matrix))}function c(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.rotation.value=d.rotation,d.map&&(m.map.value=d.map),d.alphaMap&&(m.alphaMap.value=d.alphaMap),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);let M;d.map?M=d.map:d.alphaMap&&(M=d.alphaMap),M!==void 0&&(M.matrixAutoUpdate===!0&&M.updateMatrix(),m.uvTransform.value.copy(M.matrix))}function l(m,d){m.specular.value.copy(d.specular),m.shininess.value=Math.max(d.shininess,1e-4)}function u(m,d){d.gradientMap&&(m.gradientMap.value=d.gradientMap)}function h(m,d){m.roughness.value=d.roughness,m.metalness.value=d.metalness,d.roughnessMap&&(m.roughnessMap.value=d.roughnessMap),d.metalnessMap&&(m.metalnessMap.value=d.metalnessMap),e.get(d).envMap&&(m.envMapIntensity.value=d.envMapIntensity)}function f(m,d,M){m.ior.value=d.ior,d.sheen>0&&(m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),m.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(m.sheenColorMap.value=d.sheenColorMap),d.sheenRoughnessMap&&(m.sheenRoughnessMap.value=d.sheenRoughnessMap)),d.clearcoat>0&&(m.clearcoat.value=d.clearcoat,m.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(m.clearcoatMap.value=d.clearcoatMap),d.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap),d.clearcoatNormalMap&&(m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),m.clearcoatNormalMap.value=d.clearcoatNormalMap,d.side===jt&&m.clearcoatNormalScale.value.negate())),d.iridescence>0&&(m.iridescence.value=d.iridescence,m.iridescenceIOR.value=d.iridescenceIOR,m.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(m.iridescenceMap.value=d.iridescenceMap),d.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=d.iridescenceThicknessMap)),d.transmission>0&&(m.transmission.value=d.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),d.transmissionMap&&(m.transmissionMap.value=d.transmissionMap),m.thickness.value=d.thickness,d.thicknessMap&&(m.thicknessMap.value=d.thicknessMap),m.attenuationDistance.value=d.attenuationDistance,m.attenuationColor.value.copy(d.attenuationColor)),m.specularIntensity.value=d.specularIntensity,m.specularColor.value.copy(d.specularColor),d.specularIntensityMap&&(m.specularIntensityMap.value=d.specularIntensityMap),d.specularColorMap&&(m.specularColorMap.value=d.specularColorMap)}function g(m,d){d.matcap&&(m.matcap.value=d.matcap)}function v(m,d){m.referencePosition.value.copy(d.referencePosition),m.nearDistance.value=d.nearDistance,m.farDistance.value=d.farDistance}return{refreshFogUniforms:t,refreshMaterialUniforms:n}}function Ff(s,e,t,n){let i={},r={},o=[];const a=t.isWebGL2?s.getParameter(35375):0;function c(C,w){const T=w.program;n.uniformBlockBinding(C,T)}function l(C,w){let T=i[C.id];T===void 0&&(v(C),T=u(C),i[C.id]=T,C.addEventListener("dispose",d));const E=w.program;n.updateUBOMapping(C,E);const N=e.render.frame;r[C.id]!==N&&(f(C),r[C.id]=N)}function u(C){const w=h();C.__bindingPointIndex=w;const T=s.createBuffer(),E=C.__size,N=C.usage;return s.bindBuffer(35345,T),s.bufferData(35345,E,N),s.bindBuffer(35345,null),s.bindBufferBase(35345,w,T),T}function h(){for(let C=0;C<a;C++)if(o.indexOf(C)===-1)return o.push(C),C;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(C){const w=i[C.id],T=C.uniforms,E=C.__cache;s.bindBuffer(35345,w);for(let N=0,B=T.length;N<B;N++){const x=T[N];if(g(x,N,E)===!0){const L=x.__offset,H=Array.isArray(x.value)?x.value:[x.value];let ne=0;for(let oe=0;oe<H.length;oe++){const z=H[oe],F=m(z);typeof z=="number"?(x.__data[0]=z,s.bufferSubData(35345,L+ne,x.__data)):z.isMatrix3?(x.__data[0]=z.elements[0],x.__data[1]=z.elements[1],x.__data[2]=z.elements[2],x.__data[3]=z.elements[0],x.__data[4]=z.elements[3],x.__data[5]=z.elements[4],x.__data[6]=z.elements[5],x.__data[7]=z.elements[0],x.__data[8]=z.elements[6],x.__data[9]=z.elements[7],x.__data[10]=z.elements[8],x.__data[11]=z.elements[0]):(z.toArray(x.__data,ne),ne+=F.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(35345,L,x.__data)}}s.bindBuffer(35345,null)}function g(C,w,T){const E=C.value;if(T[w]===void 0){if(typeof E=="number")T[w]=E;else{const N=Array.isArray(E)?E:[E],B=[];for(let x=0;x<N.length;x++)B.push(N[x].clone());T[w]=B}return!0}else if(typeof E=="number"){if(T[w]!==E)return T[w]=E,!0}else{const N=Array.isArray(T[w])?T[w]:[T[w]],B=Array.isArray(E)?E:[E];for(let x=0;x<N.length;x++){const L=N[x];if(L.equals(B[x])===!1)return L.copy(B[x]),!0}}return!1}function v(C){const w=C.uniforms;let T=0;const E=16;let N=0;for(let B=0,x=w.length;B<x;B++){const L=w[B],H={boundary:0,storage:0},ne=Array.isArray(L.value)?L.value:[L.value];for(let oe=0,z=ne.length;oe<z;oe++){const F=ne[oe],ee=m(F);H.boundary+=ee.boundary,H.storage+=ee.storage}if(L.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=T,B>0){N=T%E;const oe=E-N;N!==0&&oe-H.boundary<0&&(T+=E-N,L.__offset=T)}T+=H.storage}return N=T%E,N>0&&(T+=E-N),C.__size=T,C.__cache={},this}function m(C){const w={boundary:0,storage:0};return typeof C=="number"?(w.boundary=4,w.storage=4):C.isVector2?(w.boundary=8,w.storage=8):C.isVector3||C.isColor?(w.boundary=16,w.storage=12):C.isVector4?(w.boundary=16,w.storage=16):C.isMatrix3?(w.boundary=48,w.storage=48):C.isMatrix4?(w.boundary=64,w.storage=64):C.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",C),w}function d(C){const w=C.target;w.removeEventListener("dispose",d);const T=o.indexOf(w.__bindingPointIndex);o.splice(T,1),s.deleteBuffer(i[w.id]),delete i[w.id],delete r[w.id]}function M(){for(const C in i)s.deleteBuffer(i[C]);o=[],i={},r={}}return{bind:c,update:l,dispose:M}}function Of(){const s=Sr("canvas");return s.style.display="block",s}function Lo(s={}){this.isWebGLRenderer=!0;const e=s.canvas!==void 0?s.canvas:Of(),t=s.context!==void 0?s.context:null,n=s.depth!==void 0?s.depth:!0,i=s.stencil!==void 0?s.stencil:!0,r=s.antialias!==void 0?s.antialias:!1,o=s.premultipliedAlpha!==void 0?s.premultipliedAlpha:!0,a=s.preserveDrawingBuffer!==void 0?s.preserveDrawingBuffer:!1,c=s.powerPreference!==void 0?s.powerPreference:"default",l=s.failIfMajorPerformanceCaveat!==void 0?s.failIfMajorPerformanceCaveat:!1;let u;t!==null?u=t.getContextAttributes().alpha:u=s.alpha!==void 0?s.alpha:!1;let h=null,f=null;const g=[],v=[];this.domElement=e,this.debug={checkShaderErrors:!0},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.outputEncoding=Tn,this.physicallyCorrectLights=!1,this.toneMapping=wn,this.toneMappingExposure=1;const m=this;let d=!1,M=0,C=0,w=null,T=-1,E=null;const N=new wt,B=new wt;let x=null,L=e.width,H=e.height,ne=1,oe=null,z=null;const F=new wt(0,0,L,H),ee=new wt(0,0,L,H);let le=!1;const he=new Rs;let te=!1,_e=!1,re=null;const Y=new _t,q=new Ge,ce=new W,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Me(){return w===null?ne:1}let X=t;function He(y,G){for(let k=0;k<y.length;k++){const U=y[k],Q=e.getContext(U,G);if(Q!==null)return Q}return null}try{const y={alpha:!0,depth:n,stencil:i,antialias:r,premultipliedAlpha:o,preserveDrawingBuffer:a,powerPreference:c,failIfMajorPerformanceCaveat:l};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Es}`),e.addEventListener("webglcontextlost",Ee,!1),e.addEventListener("webglcontextrestored",Pe,!1),e.addEventListener("webglcontextcreationerror",ze,!1),X===null){const G=["webgl2","webgl","experimental-webgl"];if(m.isWebGL1Renderer===!0&&G.shift(),X=He(G,y),X===null)throw He(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}X.getShaderPrecisionFormat===void 0&&(X.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let be,Ue,Le,$e,We,Oe,lt,ct,dt,Et,at,Ke,Nt,Ct,A,S,K,fe,xe,ye,D,J,Z,Te;function Re(){be=new qh(X),Ue=new kh(X,be,s),be.init(Ue),J=new Lf(X,be,Ue),Le=new Af(X,be,Ue),$e=new jh,We=new ff,Oe=new Cf(X,be,Le,We,Ue,J,$e),lt=new Hh(m),ct=new Xh(m),dt=new rc(X,Ue),Z=new zh(X,be,dt,Ue),Et=new Zh(X,dt,$e,Z),at=new Qh(X,Et,dt,$e),xe=new Jh(X,Ue,Oe),S=new Gh(We),Ke=new df(m,lt,ct,be,Ue,Z,S),Nt=new Nf(m,We),Ct=new mf,A=new Mf(be,Ue),fe=new Uh(m,lt,ct,Le,at,u,o),K=new Ef(m,at,Ue),Te=new Ff(X,$e,Ue,Le),ye=new Bh(X,be,$e,Ue),D=new Yh(X,be,$e,Ue),$e.programs=Ke.programs,m.capabilities=Ue,m.extensions=be,m.properties=We,m.renderLists=Ct,m.shadowMap=K,m.state=Le,m.info=$e}Re();const we=new If(m,X);this.xr=we,this.getContext=function(){return X},this.getContextAttributes=function(){return X.getContextAttributes()},this.forceContextLoss=function(){const y=be.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=be.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(y){y!==void 0&&(ne=y,this.setSize(L,H,!1))},this.getSize=function(y){return y.set(L,H)},this.setSize=function(y,G,k){if(we.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}L=y,H=G,e.width=Math.floor(y*ne),e.height=Math.floor(G*ne),k!==!1&&(e.style.width=y+"px",e.style.height=G+"px"),this.setViewport(0,0,y,G)},this.getDrawingBufferSize=function(y){return y.set(L*ne,H*ne).floor()},this.setDrawingBufferSize=function(y,G,k){L=y,H=G,ne=k,e.width=Math.floor(y*k),e.height=Math.floor(G*k),this.setViewport(0,0,y,G)},this.getCurrentViewport=function(y){return y.copy(N)},this.getViewport=function(y){return y.copy(F)},this.setViewport=function(y,G,k,U){y.isVector4?F.set(y.x,y.y,y.z,y.w):F.set(y,G,k,U),Le.viewport(N.copy(F).multiplyScalar(ne).floor())},this.getScissor=function(y){return y.copy(ee)},this.setScissor=function(y,G,k,U){y.isVector4?ee.set(y.x,y.y,y.z,y.w):ee.set(y,G,k,U),Le.scissor(B.copy(ee).multiplyScalar(ne).floor())},this.getScissorTest=function(){return le},this.setScissorTest=function(y){Le.setScissorTest(le=y)},this.setOpaqueSort=function(y){oe=y},this.setTransparentSort=function(y){z=y},this.getClearColor=function(y){return y.copy(fe.getClearColor())},this.setClearColor=function(){fe.setClearColor.apply(fe,arguments)},this.getClearAlpha=function(){return fe.getClearAlpha()},this.setClearAlpha=function(){fe.setClearAlpha.apply(fe,arguments)},this.clear=function(y=!0,G=!0,k=!0){let U=0;y&&(U|=16384),G&&(U|=256),k&&(U|=1024),X.clear(U)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Ee,!1),e.removeEventListener("webglcontextrestored",Pe,!1),e.removeEventListener("webglcontextcreationerror",ze,!1),Ct.dispose(),A.dispose(),We.dispose(),lt.dispose(),ct.dispose(),at.dispose(),Z.dispose(),Te.dispose(),Ke.dispose(),we.dispose(),we.removeEventListener("sessionstart",Ae),we.removeEventListener("sessionend",Ie),re&&(re.dispose(),re=null),Je.stop()};function Ee(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),d=!0}function Pe(){console.log("THREE.WebGLRenderer: Context Restored."),d=!1;const y=$e.autoReset,G=K.enabled,k=K.autoUpdate,U=K.needsUpdate,Q=K.type;Re(),$e.autoReset=y,K.enabled=G,K.autoUpdate=k,K.needsUpdate=U,K.type=Q}function ze(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Be(y){const G=y.target;G.removeEventListener("dispose",Be),qe(G)}function qe(y){I(y),We.remove(y)}function I(y){const G=We.get(y).programs;G!==void 0&&(G.forEach(function(k){Ke.releaseProgram(k)}),y.isShaderMaterial&&Ke.releaseShaderCache(y))}this.renderBufferDirect=function(y,G,k,U,Q,p){G===null&&(G=ge);const _=Q.isMesh&&Q.matrixWorld.determinant()<0,b=Er(y,G,k,U,Q);Le.setMaterial(U,_);let R=k.index,V=1;U.wireframe===!0&&(R=Et.getWireframeAttribute(k),V=2);const O=k.drawRange,j=k.attributes.position;let se=O.start*V,pe=(O.start+O.count)*V;p!==null&&(se=Math.max(se,p.start*V),pe=Math.min(pe,(p.start+p.count)*V)),R!==null?(se=Math.max(se,0),pe=Math.min(pe,R.count)):j!=null&&(se=Math.max(se,0),pe=Math.min(pe,j.count));const ie=pe-se;if(ie<0||ie===1/0)return;Z.setup(Q,U,b,k,R);let me,ve=ye;if(R!==null&&(me=dt.get(R),ve=D,ve.setIndex(me)),Q.isMesh)U.wireframe===!0?(Le.setLineWidth(U.wireframeLinewidth*Me()),ve.setMode(1)):ve.setMode(4);else if(Q.isLine){let ue=U.linewidth;ue===void 0&&(ue=1),Le.setLineWidth(ue*Me()),Q.isLineSegments?ve.setMode(1):Q.isLineLoop?ve.setMode(2):ve.setMode(3)}else Q.isPoints?ve.setMode(0):Q.isSprite&&ve.setMode(4);if(Q.isInstancedMesh)ve.renderInstances(se,ie,Q.count);else if(k.isInstancedBufferGeometry){const ue=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,Fe=Math.min(k.instanceCount,ue);ve.renderInstances(se,ie,Fe)}else ve.render(se,ie)},this.compile=function(y,G){function k(U,Q,p){U.transparent===!0&&U.side===Yi?(U.side=jt,U.needsUpdate=!0,Ft(U,Q,p),U.side=Zn,U.needsUpdate=!0,Ft(U,Q,p),U.side=Yi):Ft(U,Q,p)}f=A.get(y),f.init(),v.push(f),y.traverseVisible(function(U){U.isLight&&U.layers.test(G.layers)&&(f.pushLight(U),U.castShadow&&f.pushShadow(U))}),f.setupLights(m.physicallyCorrectLights),y.traverse(function(U){const Q=U.material;if(Q)if(Array.isArray(Q))for(let p=0;p<Q.length;p++){const _=Q[p];k(_,y,U)}else k(Q,y,U)}),v.pop(),f=null};let P=null;function de(y){P&&P(y)}function Ae(){Je.stop()}function Ie(){Je.start()}const Je=new wo;Je.setAnimationLoop(de),typeof self<"u"&&Je.setContext(self),this.setAnimationLoop=function(y){P=y,we.setAnimationLoop(y),y===null?Je.stop():Je.start()},we.addEventListener("sessionstart",Ae),we.addEventListener("sessionend",Ie),this.render=function(y,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(d===!0)return;y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),we.enabled===!0&&we.isPresenting===!0&&(we.cameraAutoUpdate===!0&&we.updateCamera(G),G=we.getCamera()),y.isScene===!0&&y.onBeforeRender(m,y,G,w),f=A.get(y,v.length),f.init(),v.push(f),Y.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),he.setFromProjectionMatrix(Y),_e=this.localClippingEnabled,te=S.init(this.clippingPlanes,_e,G),h=Ct.get(y,g.length),h.init(),g.push(h),ft(y,G,0,m.sortObjects),h.finish(),m.sortObjects===!0&&h.sort(oe,z),te===!0&&S.beginShadows();const k=f.state.shadowsArray;if(K.render(k,y,G),te===!0&&S.endShadows(),this.info.autoReset===!0&&this.info.reset(),fe.render(h,y),f.setupLights(m.physicallyCorrectLights),G.isArrayCamera){const U=G.cameras;for(let Q=0,p=U.length;Q<p;Q++){const _=U[Q];St(h,y,_,_.viewport)}}else St(h,y,G);w!==null&&(Oe.updateMultisampleRenderTarget(w),Oe.updateRenderTargetMipmap(w)),y.isScene===!0&&y.onAfterRender(m,y,G),Z.resetDefaultState(),T=-1,E=null,v.pop(),v.length>0?f=v[v.length-1]:f=null,g.pop(),g.length>0?h=g[g.length-1]:h=null};function ft(y,G,k,U){if(y.visible===!1)return;if(y.layers.test(G.layers)){if(y.isGroup)k=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(G);else if(y.isLight)f.pushLight(y),y.castShadow&&f.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||he.intersectsSprite(y)){U&&ce.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Y);const _=at.update(y),b=y.material;b.visible&&h.push(y,_,b,k,ce.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(y.isSkinnedMesh&&y.skeleton.frame!==$e.render.frame&&(y.skeleton.update(),y.skeleton.frame=$e.render.frame),!y.frustumCulled||he.intersectsObject(y))){U&&ce.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Y);const _=at.update(y),b=y.material;if(Array.isArray(b)){const R=_.groups;for(let V=0,O=R.length;V<O;V++){const j=R[V],se=b[j.materialIndex];se&&se.visible&&h.push(y,_,se,k,ce.z,j)}}else b.visible&&h.push(y,_,b,k,ce.z,null)}}const p=y.children;for(let _=0,b=p.length;_<b;_++)ft(p[_],G,k,U)}function St(y,G,k,U){const Q=y.opaque,p=y.transmissive,_=y.transparent;f.setupLightsView(k),p.length>0&&dn(Q,G,k),U&&Le.viewport(N.copy(U)),Q.length>0&&tt(Q,G,k),p.length>0&&tt(p,G,k),_.length>0&&tt(_,G,k),Le.buffers.depth.setTest(!0),Le.buffers.depth.setMask(!0),Le.buffers.color.setMask(!0),Le.setPolygonOffset(!1)}function dn(y,G,k){const U=Ue.isWebGL2;re===null&&(re=new jn(1,1,{generateMipmaps:!0,type:be.has("EXT_color_buffer_half_float")?bn:Yn,minFilter:bi,samples:U&&r===!0?4:0})),m.getDrawingBufferSize(q),U?re.setSize(q.x,q.y):re.setSize(Ms(q.x),Ms(q.y));const Q=m.getRenderTarget();m.setRenderTarget(re),m.clear();const p=m.toneMapping;m.toneMapping=wn,tt(y,G,k),m.toneMapping=p,Oe.updateMultisampleRenderTarget(re),Oe.updateRenderTargetMipmap(re),m.setRenderTarget(Q)}function tt(y,G,k){const U=G.isScene===!0?G.overrideMaterial:null;for(let Q=0,p=y.length;Q<p;Q++){const _=y[Q],b=_.object,R=_.geometry,V=U===null?_.material:U,O=_.group;b.layers.test(k.layers)&&$t(b,G,k,R,V,O)}}function $t(y,G,k,U,Q,p){y.onBeforeRender(m,G,k,U,Q,p),y.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),Q.onBeforeRender(m,G,k,U,y,p),Q.transparent===!0&&Q.side===Yi?(Q.side=jt,Q.needsUpdate=!0,m.renderBufferDirect(k,G,U,Q,y,p),Q.side=Zn,Q.needsUpdate=!0,m.renderBufferDirect(k,G,U,Q,y,p),Q.side=Yi):m.renderBufferDirect(k,G,U,Q,y,p),y.onAfterRender(m,G,k,U,Q,p)}function Ft(y,G,k){G.isScene!==!0&&(G=ge);const U=We.get(y),Q=f.state.lights,p=f.state.shadowsArray,_=Q.state.version,b=Ke.getParameters(y,Q.state,p,G,k),R=Ke.getProgramCacheKey(b);let V=U.programs;U.environment=y.isMeshStandardMaterial?G.environment:null,U.fog=G.fog,U.envMap=(y.isMeshStandardMaterial?ct:lt).get(y.envMap||U.environment),V===void 0&&(y.addEventListener("dispose",Be),V=new Map,U.programs=V);let O=V.get(R);if(O!==void 0){if(U.currentProgram===O&&U.lightsStateVersion===_)return qi(y,b),O}else b.uniforms=Ke.getUniforms(y),y.onBuild(k,b,m),y.onBeforeCompile(b,m),O=Ke.acquireProgram(b,R),V.set(R,O),U.uniforms=b.uniforms;const j=U.uniforms;(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(j.clippingPlanes=S.uniform),qi(y,b),U.needsLights=Ar(y),U.lightsStateVersion=_,U.needsLights&&(j.ambientLightColor.value=Q.state.ambient,j.lightProbe.value=Q.state.probe,j.directionalLights.value=Q.state.directional,j.directionalLightShadows.value=Q.state.directionalShadow,j.spotLights.value=Q.state.spot,j.spotLightShadows.value=Q.state.spotShadow,j.rectAreaLights.value=Q.state.rectArea,j.ltc_1.value=Q.state.rectAreaLTC1,j.ltc_2.value=Q.state.rectAreaLTC2,j.pointLights.value=Q.state.point,j.pointLightShadows.value=Q.state.pointShadow,j.hemisphereLights.value=Q.state.hemi,j.directionalShadowMap.value=Q.state.directionalShadowMap,j.directionalShadowMatrix.value=Q.state.directionalShadowMatrix,j.spotShadowMap.value=Q.state.spotShadowMap,j.spotLightMatrix.value=Q.state.spotLightMatrix,j.spotLightMap.value=Q.state.spotLightMap,j.pointShadowMap.value=Q.state.pointShadowMap,j.pointShadowMatrix.value=Q.state.pointShadowMatrix);const se=O.getUniforms(),pe=xr.seqWithValue(se.seq,j);return U.currentProgram=O,U.uniformsList=pe,O}function qi(y,G){const k=We.get(y);k.outputEncoding=G.outputEncoding,k.instancing=G.instancing,k.skinning=G.skinning,k.morphTargets=G.morphTargets,k.morphNormals=G.morphNormals,k.morphColors=G.morphColors,k.morphTargetsCount=G.morphTargetsCount,k.numClippingPlanes=G.numClippingPlanes,k.numIntersection=G.numClipIntersection,k.vertexAlphas=G.vertexAlphas,k.vertexTangents=G.vertexTangents,k.toneMapping=G.toneMapping}function Er(y,G,k,U,Q){G.isScene!==!0&&(G=ge),Oe.resetTextureUnits();const p=G.fog,_=U.isMeshStandardMaterial?G.environment:null,b=w===null?m.outputEncoding:w.isXRRenderTarget===!0?w.texture.encoding:Tn,R=(U.isMeshStandardMaterial?ct:lt).get(U.envMap||_),V=U.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,O=!!U.normalMap&&!!k.attributes.tangent,j=!!k.morphAttributes.position,se=!!k.morphAttributes.normal,pe=!!k.morphAttributes.color,ie=U.toneMapped?m.toneMapping:wn,me=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,ve=me!==void 0?me.length:0,ue=We.get(U),Fe=f.state.lights;if(te===!0&&(_e===!0||y!==E)){const ke=y===E&&U.id===T;S.setState(U,y,ke)}let De=!1;U.version===ue.__version?(ue.needsLights&&ue.lightsStateVersion!==Fe.state.version||ue.outputEncoding!==b||Q.isInstancedMesh&&ue.instancing===!1||!Q.isInstancedMesh&&ue.instancing===!0||Q.isSkinnedMesh&&ue.skinning===!1||!Q.isSkinnedMesh&&ue.skinning===!0||ue.envMap!==R||U.fog===!0&&ue.fog!==p||ue.numClippingPlanes!==void 0&&(ue.numClippingPlanes!==S.numPlanes||ue.numIntersection!==S.numIntersection)||ue.vertexAlphas!==V||ue.vertexTangents!==O||ue.morphTargets!==j||ue.morphNormals!==se||ue.morphColors!==pe||ue.toneMapping!==ie||Ue.isWebGL2===!0&&ue.morphTargetsCount!==ve)&&(De=!0):(De=!0,ue.__version=U.version);let Ce=ue.currentProgram;De===!0&&(Ce=Ft(U,G,Q));let Ne=!1,Ve=!1,nt=!1;const Ze=Ce.getUniforms(),ut=ue.uniforms;if(Le.useProgram(Ce.program)&&(Ne=!0,Ve=!0,nt=!0),U.id!==T&&(T=U.id,Ve=!0),Ne||E!==y){if(Ze.setValue(X,"projectionMatrix",y.projectionMatrix),Ue.logarithmicDepthBuffer&&Ze.setValue(X,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),E!==y&&(E=y,Ve=!0,nt=!0),U.isShaderMaterial||U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshStandardMaterial||U.envMap){const ke=Ze.map.cameraPosition;ke!==void 0&&ke.setValue(X,ce.setFromMatrixPosition(y.matrixWorld))}(U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshLambertMaterial||U.isMeshBasicMaterial||U.isMeshStandardMaterial||U.isShaderMaterial)&&Ze.setValue(X,"isOrthographic",y.isOrthographicCamera===!0),(U.isMeshPhongMaterial||U.isMeshToonMaterial||U.isMeshLambertMaterial||U.isMeshBasicMaterial||U.isMeshStandardMaterial||U.isShaderMaterial||U.isShadowMaterial||Q.isSkinnedMesh)&&Ze.setValue(X,"viewMatrix",y.matrixWorldInverse)}if(Q.isSkinnedMesh){Ze.setOptional(X,Q,"bindMatrix"),Ze.setOptional(X,Q,"bindMatrixInverse");const ke=Q.skeleton;ke&&(Ue.floatVertexTextures?(ke.boneTexture===null&&ke.computeBoneTexture(),Ze.setValue(X,"boneTexture",ke.boneTexture,Oe),Ze.setValue(X,"boneTextureSize",ke.boneTextureSize)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}const Qe=k.morphAttributes;if((Qe.position!==void 0||Qe.normal!==void 0||Qe.color!==void 0&&Ue.isWebGL2===!0)&&xe.update(Q,k,U,Ce),(Ve||ue.receiveShadow!==Q.receiveShadow)&&(ue.receiveShadow=Q.receiveShadow,Ze.setValue(X,"receiveShadow",Q.receiveShadow)),U.isMeshGouraudMaterial&&U.envMap!==null&&(ut.envMap.value=R,ut.flipEnvMap.value=R.isCubeTexture&&R.isRenderTargetTexture===!1?-1:1),Ve&&(Ze.setValue(X,"toneMappingExposure",m.toneMappingExposure),ue.needsLights&&Kn(ut,nt),p&&U.fog===!0&&Nt.refreshFogUniforms(ut,p),Nt.refreshMaterialUniforms(ut,U,ne,H,re),xr.upload(X,ue.uniformsList,ut,Oe)),U.isShaderMaterial&&U.uniformsNeedUpdate===!0&&(xr.upload(X,ue.uniformsList,ut,Oe),U.uniformsNeedUpdate=!1),U.isSpriteMaterial&&Ze.setValue(X,"center",Q.center),Ze.setValue(X,"modelViewMatrix",Q.modelViewMatrix),Ze.setValue(X,"normalMatrix",Q.normalMatrix),Ze.setValue(X,"modelMatrix",Q.matrixWorld),U.isShaderMaterial||U.isRawShaderMaterial){const ke=U.uniformsGroups;for(let ot=0,Ot=ke.length;ot<Ot;ot++)if(Ue.isWebGL2){const ht=ke[ot];Te.update(ht,Ce),Te.bind(ht,Ce)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Ce}function Kn(y,G){y.ambientLightColor.needsUpdate=G,y.lightProbe.needsUpdate=G,y.directionalLights.needsUpdate=G,y.directionalLightShadows.needsUpdate=G,y.pointLights.needsUpdate=G,y.pointLightShadows.needsUpdate=G,y.spotLights.needsUpdate=G,y.spotLightShadows.needsUpdate=G,y.rectAreaLights.needsUpdate=G,y.hemisphereLights.needsUpdate=G}function Ar(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return M},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(y,G,k){We.get(y.texture).__webglTexture=G,We.get(y.depthTexture).__webglTexture=k;const U=We.get(y);U.__hasExternalTextures=!0,U.__hasExternalTextures&&(U.__autoAllocateDepthBuffer=k===void 0,U.__autoAllocateDepthBuffer||be.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),U.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(y,G){const k=We.get(y);k.__webglFramebuffer=G,k.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(y,G=0,k=0){w=y,M=G,C=k;let U=!0,Q=null,p=!1,_=!1;if(y){const R=We.get(y);R.__useDefaultFramebuffer!==void 0?(Le.bindFramebuffer(36160,null),U=!1):R.__webglFramebuffer===void 0?Oe.setupRenderTarget(y):R.__hasExternalTextures&&Oe.rebindTextures(y,We.get(y.texture).__webglTexture,We.get(y.depthTexture).__webglTexture);const V=y.texture;(V.isData3DTexture||V.isDataArrayTexture||V.isCompressedArrayTexture)&&(_=!0);const O=We.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Q=O[G],p=!0):Ue.isWebGL2&&y.samples>0&&Oe.useMultisampledRTT(y)===!1?Q=We.get(y).__webglMultisampledFramebuffer:Q=O,N.copy(y.viewport),B.copy(y.scissor),x=y.scissorTest}else N.copy(F).multiplyScalar(ne).floor(),B.copy(ee).multiplyScalar(ne).floor(),x=le;if(Le.bindFramebuffer(36160,Q)&&Ue.drawBuffers&&U&&Le.drawBuffers(y,Q),Le.viewport(N),Le.scissor(B),Le.setScissorTest(x),p){const R=We.get(y.texture);X.framebufferTexture2D(36160,36064,34069+G,R.__webglTexture,k)}else if(_){const R=We.get(y.texture),V=G||0;X.framebufferTextureLayer(36160,36064,R.__webglTexture,k||0,V)}T=-1},this.readRenderTargetPixels=function(y,G,k,U,Q,p,_){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let b=We.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&_!==void 0&&(b=b[_]),b){Le.bindFramebuffer(36160,b);try{const R=y.texture,V=R.format,O=R.type;if(V!==Ht&&J.convert(V)!==X.getParameter(35739)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const j=O===bn&&(be.has("EXT_color_buffer_half_float")||Ue.isWebGL2&&be.has("EXT_color_buffer_float"));if(O!==Yn&&J.convert(O)!==X.getParameter(35738)&&!(O===rn&&(Ue.isWebGL2||be.has("OES_texture_float")||be.has("WEBGL_color_buffer_float")))&&!j){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=y.width-U&&k>=0&&k<=y.height-Q&&X.readPixels(G,k,U,Q,J.convert(V),J.convert(O),p)}finally{const R=w!==null?We.get(w).__webglFramebuffer:null;Le.bindFramebuffer(36160,R)}}},this.copyFramebufferToTexture=function(y,G,k=0){const U=Math.pow(2,-k),Q=Math.floor(G.image.width*U),p=Math.floor(G.image.height*U);Oe.setTexture2D(G,0),X.copyTexSubImage2D(3553,k,0,0,y.x,y.y,Q,p),Le.unbindTexture()},this.copyTextureToTexture=function(y,G,k,U=0){const Q=G.image.width,p=G.image.height,_=J.convert(k.format),b=J.convert(k.type);Oe.setTexture2D(k,0),X.pixelStorei(37440,k.flipY),X.pixelStorei(37441,k.premultiplyAlpha),X.pixelStorei(3317,k.unpackAlignment),G.isDataTexture?X.texSubImage2D(3553,U,y.x,y.y,Q,p,_,b,G.image.data):G.isCompressedTexture?X.compressedTexSubImage2D(3553,U,y.x,y.y,G.mipmaps[0].width,G.mipmaps[0].height,_,G.mipmaps[0].data):X.texSubImage2D(3553,U,y.x,y.y,_,b,G.image),U===0&&k.generateMipmaps&&X.generateMipmap(3553),Le.unbindTexture()},this.copyTextureToTexture3D=function(y,G,k,U,Q=0){if(m.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const p=y.max.x-y.min.x+1,_=y.max.y-y.min.y+1,b=y.max.z-y.min.z+1,R=J.convert(U.format),V=J.convert(U.type);let O;if(U.isData3DTexture)Oe.setTexture3D(U,0),O=32879;else if(U.isDataArrayTexture)Oe.setTexture2DArray(U,0),O=35866;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}X.pixelStorei(37440,U.flipY),X.pixelStorei(37441,U.premultiplyAlpha),X.pixelStorei(3317,U.unpackAlignment);const j=X.getParameter(3314),se=X.getParameter(32878),pe=X.getParameter(3316),ie=X.getParameter(3315),me=X.getParameter(32877),ve=k.isCompressedTexture?k.mipmaps[0]:k.image;X.pixelStorei(3314,ve.width),X.pixelStorei(32878,ve.height),X.pixelStorei(3316,y.min.x),X.pixelStorei(3315,y.min.y),X.pixelStorei(32877,y.min.z),k.isDataTexture||k.isData3DTexture?X.texSubImage3D(O,Q,G.x,G.y,G.z,p,_,b,R,V,ve.data):k.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),X.compressedTexSubImage3D(O,Q,G.x,G.y,G.z,p,_,b,R,ve.data)):X.texSubImage3D(O,Q,G.x,G.y,G.z,p,_,b,R,V,ve),X.pixelStorei(3314,j),X.pixelStorei(32878,se),X.pixelStorei(3316,pe),X.pixelStorei(3315,ie),X.pixelStorei(32877,me),Q===0&&U.generateMipmaps&&X.generateMipmap(O),Le.unbindTexture()},this.initTexture=function(y){y.isCubeTexture?Oe.setTextureCube(y,0):y.isData3DTexture?Oe.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?Oe.setTexture2DArray(y,0):Oe.setTexture2D(y,0),Le.unbindTexture()},this.resetState=function(){M=0,C=0,w=null,Le.reset(),Z.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}class Uf extends Lo{}Uf.prototype.isWebGL1Renderer=!0;class zf extends Tt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.backgroundIntensity=this.backgroundIntensity),t}get autoUpdate(){return console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate}set autoUpdate(e){console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate=e}}class Ro extends It{constructor(e=null,t=1,n=1,i,r,o,a,c,l=yt,u=yt,h,f){super(null,o,a,c,l,u,i,r,h,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Un extends Wt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Va={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};class Bf{constructor(e,t,n){const i=this;let r=!1,o=0,a=0,c;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(u){a++,r===!1&&i.onStart!==void 0&&i.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,i.onProgress!==void 0&&i.onProgress(u,o,a),o===a&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){const h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,f=l.length;h<f;h+=2){const g=l[h],v=l[h+1];if(g.global&&(g.lastIndex=0),g.test(u))return v}return null}}}const kf=new Bf;let Do=class{constructor(e){this.manager=e!==void 0?e:kf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};const vn={};class Gf extends Error{constructor(e,t){super(e),this.response=t}}class Hf extends Do{constructor(e){super(e)}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=Va.get(e);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(vn[e]!==void 0){vn[e].push({onLoad:t,onProgress:n,onError:i});return}vn[e]=[],vn[e].push({onLoad:t,onProgress:n,onError:i});const o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const u=vn[e],h=l.body.getReader(),f=l.headers.get("Content-Length")||l.headers.get("X-File-Size"),g=f?parseInt(f):0,v=g!==0;let m=0;const d=new ReadableStream({start(M){C();function C(){h.read().then(({done:w,value:T})=>{if(w)M.close();else{m+=T.byteLength;const E=new ProgressEvent("progress",{lengthComputable:v,loaded:m,total:g});for(let N=0,B=u.length;N<B;N++){const x=u[N];x.onProgress&&x.onProgress(E)}M.enqueue(T),C()}})}}});return new Response(d)}else throw new Gf(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return l.json();default:if(a===void 0)return l.text();{const h=/charset="?([^;"\s]*)"?/i.exec(a),f=h&&h[1]?h[1].toLowerCase():void 0,g=new TextDecoder(f);return l.arrayBuffer().then(v=>g.decode(v))}}}).then(l=>{Va.add(e,l);const u=vn[e];delete vn[e];for(let h=0,f=u.length;h<f;h++){const g=u[h];g.onLoad&&g.onLoad(l)}}).catch(l=>{const u=vn[e];if(u===void 0)throw this.manager.itemError(e),l;delete vn[e];for(let h=0,f=u.length;h<f;h++){const g=u[h];g.onError&&g.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class Vf extends Do{constructor(e){super(e)}load(e,t,n,i){const r=this,o=new Ro,a=new Hf(this.manager);return a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setPath(this.path),a.setWithCredentials(r.withCredentials),a.load(e,function(c){const l=r.parse(c);l&&(l.image!==void 0?o.image=l.image:l.data!==void 0&&(o.image.width=l.width,o.image.height=l.height,o.image.data=l.data),o.wrapS=l.wrapS!==void 0?l.wrapS:Gt,o.wrapT=l.wrapT!==void 0?l.wrapT:Gt,o.magFilter=l.magFilter!==void 0?l.magFilter:bt,o.minFilter=l.minFilter!==void 0?l.minFilter:bt,o.anisotropy=l.anisotropy!==void 0?l.anisotropy:1,l.encoding!==void 0&&(o.encoding=l.encoding),l.flipY!==void 0&&(o.flipY=l.flipY),l.format!==void 0&&(o.format=l.format),l.type!==void 0&&(o.type=l.type),l.mipmaps!==void 0&&(o.mipmaps=l.mipmaps,o.minFilter=bi),l.mipmapCount===1&&(o.minFilter=bt),l.generateMipmaps!==void 0&&(o.generateMipmaps=l.generateMipmaps),o.needsUpdate=!0,t&&t(o,l))},n,i),o}}class Wf extends Tt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ye(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}const as=new _t,Wa=new W,Xa=new W;class Xf{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ge(512,512),this.map=null,this.mapPass=null,this.matrix=new _t,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Rs,this._frameExtents=new Ge(1,1),this._viewportCount=1,this._viewports=[new wt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Wa.setFromMatrixPosition(e.matrixWorld),t.position.copy(Wa),Xa.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Xa),t.updateMatrixWorld(),as.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(as),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(as)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class qf extends Xf{constructor(){super(new Ds(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Zf extends Wf{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Tt.DefaultUp),this.updateMatrix(),this.target=new Tt,this.shadow=new qf}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Yf extends En{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}class qa{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Pt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const yn=jf();function jf(){const s=new ArrayBuffer(4),e=new Float32Array(s),t=new Uint32Array(s),n=new Uint32Array(512),i=new Uint32Array(512);for(let c=0;c<256;++c){const l=c-127;l<-27?(n[c]=0,n[c|256]=32768,i[c]=24,i[c|256]=24):l<-14?(n[c]=1024>>-l-14,n[c|256]=1024>>-l-14|32768,i[c]=-l-1,i[c|256]=-l-1):l<=15?(n[c]=l+15<<10,n[c|256]=l+15<<10|32768,i[c]=13,i[c|256]=13):l<128?(n[c]=31744,n[c|256]=64512,i[c]=24,i[c|256]=24):(n[c]=31744,n[c|256]=64512,i[c]=13,i[c|256]=13)}const r=new Uint32Array(2048),o=new Uint32Array(64),a=new Uint32Array(64);for(let c=1;c<1024;++c){let l=c<<13,u=0;for(;!(l&8388608);)l<<=1,u-=8388608;l&=-8388609,u+=947912704,r[c]=l|u}for(let c=1024;c<2048;++c)r[c]=939524096+(c-1024<<13);for(let c=1;c<31;++c)o[c]=c<<23;o[31]=1199570944,o[32]=2147483648;for(let c=33;c<63;++c)o[c]=2147483648+(c-32<<23);o[63]=3347054592;for(let c=1;c<64;++c)c!==32&&(a[c]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:i,mantissaTable:r,exponentTable:o,offsetTable:a}}function $f(s){Math.abs(s)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),s=Pt(s,-65504,65504),yn.floatView[0]=s;const e=yn.uint32View[0],t=e>>23&511;return yn.baseTable[t]+((e&8388607)>>yn.shiftTable[t])}function Kf(s){const e=s>>10;return yn.uint32View[0]=yn.mantissaTable[yn.offsetTable[e]+(s&1023)]+yn.exponentTable[e],yn.floatView[0]}var Za=Object.freeze({__proto__:null,toHalfFloat:$f,fromHalfFloat:Kf});typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Es}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Es);class Jf{constructor(){$(this,"APP_ID","glApp");$(this,"ASSETS_PATH","/assets/");$(this,"DPR",Math.min(2,window.devicePixelRatio||1));$(this,"USE_PIXEL_LIMIT",!0);$(this,"MAX_PIXEL_COUNT",2560*1440);$(this,"DEFAULT_POSITION",[20,18,20]);$(this,"DEFAULT_LOOKAT_POSITION",[0,0,0]);$(this,"WEBGL_OPTS",{antialias:!0,alpha:!1});$(this,"SIMULATION_SPEED_SCALE",2);$(this,"FREE_BLOCKS_COUNT",12);if(window.URLSearchParams){const t=(n=>[...n].reduce((i,[r,o])=>(i[r]=o===""?!0:o,i),{}))(new URLSearchParams(window.location.search));this.override(t)}}override(e){for(const t in e)if(this[t]!==void 0){const n=e[t].toString();typeof this[t]=="boolean"?this[t]=!(n==="0"||n===!1):typeof this[t]=="number"?this[t]=parseFloat(n):typeof this[t]=="string"&&(this[t]=n)}}}const gt=new Jf;function Qf(s){return s&&s.__esModule&&Object.prototype.hasOwnProperty.call(s,"default")?s.default:s}var Po={exports:{}};(function(s){(function(e){function t(){this._listeners=[],this.dispatchCount=0}var n=t.prototype;n.add=a,n.addOnce=c,n.remove=l,n.dispatch=u;var i="Callback function is missing!",r=Array.prototype.slice;function o(h){h.sort(function(f,g){return f=f.p,g=g.p,g<f?1:g>f?-1:0})}function a(h,f,g,v){if(!h)throw i;g=g||0;for(var m=this._listeners,d,M,C,w=m.length;w--;)if(d=m[w],d.f===h&&d.c===f)return!1;typeof g=="function"&&(M=g,g=v,C=4),m.unshift({f:h,c:f,p:g,r:M||h,a:r.call(arguments,C||3),j:0}),o(m)}function c(h,f,g,v){if(!h)throw i;var m=this,d=function(){return m.remove.call(m,h,f),h.apply(f,r.call(arguments,0))};v=r.call(arguments,0),v.length===1&&v.push(e),v.splice(2,0,d),a.apply(m,v)}function l(h,f){if(!h)return this._listeners.length=0,!0;for(var g=this._listeners,v,m=g.length;m--;)if(v=g[m],v.f===h&&(!f||v.c===f))return v.j=0,g.splice(m,1),!0;return!1}function u(h){h=r.call(arguments,0),this.dispatchCount++;for(var f=this.dispatchCount,g=this._listeners,v,m,d=g.length;d--;)if(v=g[d],v&&v.j<f&&(v.j=f,v.r.apply(v.c,v.a.concat(h))===!1)){m=v;break}for(g=this._listeners,d=g.length;d--;)g[d].j=0;return m}s.exports=t})()})(Po);var ep=Po.exports;const Fi=Qf(ep),je={NOT_STARTED:"not-started",STARTED:"started",FREE:"free",RESULT:"result",RESULT_ANIMATION:"result_animation",RESTART_ANIMATION:"restart_animation",RESTART:"restart"},os=[je.NOT_STARTED,je.STARTED,je.FREE,je.RESULT,je.RESULT_ANIMATION,je.RESTART_ANIMATION,je.RESTART],Sn={NONE:"none",PAUSE:"pause",COMPLETED:"completed",FAILED:"failed"};class tp{constructor(){$(this,"time",0);$(this,"deltaTime",0);$(this,"width",0);$(this,"height",0);$(this,"viewportWidth",0);$(this,"viewportHeight",0);$(this,"renderer",null);$(this,"scene",null);$(this,"camera",null);$(this,"orbitControls",null);$(this,"orbitCamera",null);$(this,"postprocessing",null);$(this,"resolution",new Ge);$(this,"viewportResolution",new Ge);$(this,"bgColor",new Ye("#d0d0d0"));$(this,"debugAlpha",!1);$(this,"skipProfileUpdate",!1);$(this,"canvas",null);$(this,"sharedUniforms",{u_time:{value:0},u_deltaTime:{value:1},u_resolution:{value:this.resolution},u_viewportResolution:{value:this.viewportResolution},u_bgColor:{value:this.bgColor}});$(this,"loadList",[]);$(this,"animationSpeed",1);$(this,"startColor","#1E90FF");$(this,"endColor","#30ff2A");$(this,"errorColor","#FF006A");$(this,"defaultColor","#FFF5Ea");$(this,"freeAnimationSpeed",1);$(this,"resultAnimationSpeed",4);$(this,"stateSignal",new Fi);$(this,"resultSignal",new Fi);$(this,"endCycleSignal",new Fi);$(this,"spawnSignal",new Fi);$(this,"gameEndedSignal",new Fi);$(this,"state",je.NOT_STARTED);$(this,"pendingState",null);$(this,"result",Sn.NONE);$(this,"activeBlocksCount",0);$(this,"maxFreeSpawn",gt.FREE_BLOCKS_COUNT);$(this,"hasStarted",!1);$(this,"hasNotStarted",!1);$(this,"isFree",!1);$(this,"isResult",!1);$(this,"isResultAnimation",!1);$(this,"isRestartAnimation",!1);$(this,"isRestart",!1);$(this,"isSuccessResult",!1);$(this,"isFailResult",!1);const e=document.getElementById("current-state"),t=document.getElementById("pending-state"),n=()=>{e&&(e.innerText=this.state,(this.state===je.RESULT||this.state===je.RESULT_ANIMATION)&&(e.innerText+=` (${this.result})`)),t&&(t.innerText=this.pendingState,this.pendingState===je.RESULT&&(t.innerText+=` (${this.result})`))},i=()=>{this.hasStarted=this.state===je.STARTED,this.hasNotStarted=this.state===je.NOT_STARTED,this.isFree=this.state===je.FREE,this.isResult=this.state===je.RESULT,this.isResultAnimation=this.state===je.RESULT_ANIMATION,this.isRestartAnimation=this.state===je.RESTART_ANIMATION,this.isRestart=this.state===je.RESTART,this.isSuccessResult=(this.isResult||this.isResultAnimation)&&this.result===Sn.COMPLETED,this.isFailResult=(this.isResult||this.isResultAnimation)&&this.result===Sn.FAILED,this.isPaused=(this.isResult||this.isResultAnimation)&&this.result===Sn.PAUSE};i(),n(),this.endCycleSignal.add(()=>{this.state===je.RESULT&&this.result===Sn.FAILED&&this.activeBlocksCount<this.maxFreeSpawn||(this.hasStarted&&this.stateSignal.dispatch(je.FREE),this.isResult&&(this.result===Sn.FAILED||this.result===Sn.PAUSE)&&this.stateSignal.dispatch(je.RESULT_ANIMATION),this.isRestart&&this.stateSignal.dispatch(je.NOT_STARTED),i())}),this.stateSignal.add(r=>{os.indexOf(this.state),!(r===je.STARTED&&!(this.state===je.NOT_STARTED||this.state===je.RESTART))&&(r===je.STARTED||r===je.NOT_STARTED?(this.result=Sn.NONE,this.state=je.STARTED):this.state=r,i(),n())}),this.resultSignal.add(r=>{const o=os.indexOf(this.state),a=os.indexOf(je.RESULT);o+1===a&&(this.state=je.RESULT,this.result=r,n())})}handleStatusChange(){}}const ae=new tp;/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.6.9
*/var Ya=function(s){return URL.createObjectURL(new Blob([s],{type:"text/javascript"}))};try{URL.revokeObjectURL(Ya(""))}catch{Ya=function(e){return"data:application/javascript;charset=UTF-8,"+encodeURI(e)}}var Yt=Uint8Array,Pn=Uint16Array,ws=Uint32Array,Io=new Yt([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),No=new Yt([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),np=new Yt([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Fo=function(s,e){for(var t=new Pn(31),n=0;n<31;++n)t[n]=e+=1<<s[n-1];for(var i=new ws(t[30]),n=1;n<30;++n)for(var r=t[n];r<t[n+1];++r)i[r]=r-t[n]<<5|n;return[t,i]},Oo=Fo(Io,2),Uo=Oo[0],ip=Oo[1];Uo[28]=258,ip[258]=28;var rp=Fo(No,0),sp=rp[0],Ts=new Pn(32768);for(var st=0;st<32768;++st){var Dn=(st&43690)>>>1|(st&21845)<<1;Dn=(Dn&52428)>>>2|(Dn&13107)<<2,Dn=(Dn&61680)>>>4|(Dn&3855)<<4,Ts[st]=((Dn&65280)>>>8|(Dn&255)<<8)>>>1}var zi=function(s,e,t){for(var n=s.length,i=0,r=new Pn(e);i<n;++i)++r[s[i]-1];var o=new Pn(e);for(i=0;i<e;++i)o[i]=o[i-1]+r[i-1]<<1;var a;if(t){a=new Pn(1<<e);var c=15-e;for(i=0;i<n;++i)if(s[i])for(var l=i<<4|s[i],u=e-s[i],h=o[s[i]-1]++<<u,f=h|(1<<u)-1;h<=f;++h)a[Ts[h]>>>c]=l}else for(a=new Pn(n),i=0;i<n;++i)s[i]&&(a[i]=Ts[o[s[i]-1]++]>>>15-s[i]);return a},Xi=new Yt(288);for(var st=0;st<144;++st)Xi[st]=8;for(var st=144;st<256;++st)Xi[st]=9;for(var st=256;st<280;++st)Xi[st]=7;for(var st=280;st<288;++st)Xi[st]=8;var zo=new Yt(32);for(var st=0;st<32;++st)zo[st]=5;var ap=zi(Xi,9,1),op=zi(zo,5,1),ls=function(s){for(var e=s[0],t=1;t<s.length;++t)s[t]>e&&(e=s[t]);return e},en=function(s,e,t){var n=e/8|0;return(s[n]|s[n+1]<<8)>>(e&7)&t},cs=function(s,e){var t=e/8|0;return(s[t]|s[t+1]<<8|s[t+2]<<16)>>(e&7)},lp=function(s){return(s/8|0)+(s&7&&1)},cp=function(s,e,t){(t==null||t>s.length)&&(t=s.length);var n=new(s instanceof Pn?Pn:s instanceof ws?ws:Yt)(t-e);return n.set(s.subarray(e,t)),n},up=function(s,e,t){var n=s.length;if(!n||t&&!t.l&&n<5)return e||new Yt(0);var i=!e||t,r=!t||t.i;t||(t={}),e||(e=new Yt(n*3));var o=function(X){var He=e.length;if(X>He){var be=new Yt(Math.max(He*2,X));be.set(e),e=be}},a=t.f||0,c=t.p||0,l=t.b||0,u=t.l,h=t.d,f=t.m,g=t.n,v=n*8;do{if(!u){t.f=a=en(s,c,1);var m=en(s,c+1,3);if(c+=3,m)if(m==1)u=ap,h=op,f=9,g=5;else if(m==2){var w=en(s,c,31)+257,T=en(s,c+10,15)+4,E=w+en(s,c+5,31)+1;c+=14;for(var N=new Yt(E),B=new Yt(19),x=0;x<T;++x)B[np[x]]=en(s,c+x*3,7);c+=T*3;for(var L=ls(B),H=(1<<L)-1,ne=zi(B,L,1),x=0;x<E;){var oe=ne[en(s,c,H)];c+=oe&15;var d=oe>>>4;if(d<16)N[x++]=d;else{var z=0,F=0;for(d==16?(F=3+en(s,c,3),c+=2,z=N[x-1]):d==17?(F=3+en(s,c,7),c+=3):d==18&&(F=11+en(s,c,127),c+=7);F--;)N[x++]=z}}var ee=N.subarray(0,w),le=N.subarray(w);f=ls(ee),g=ls(le),u=zi(ee,f,1),h=zi(le,g,1)}else throw"invalid block type";else{var d=lp(c)+4,M=s[d-4]|s[d-3]<<8,C=d+M;if(C>n){if(r)throw"unexpected EOF";break}i&&o(l+M),e.set(s.subarray(d,C),l),t.b=l+=M,t.p=c=C*8;continue}if(c>v){if(r)throw"unexpected EOF";break}}i&&o(l+131072);for(var he=(1<<f)-1,te=(1<<g)-1,_e=c;;_e=c){var z=u[cs(s,c)&he],re=z>>>4;if(c+=z&15,c>v){if(r)throw"unexpected EOF";break}if(!z)throw"invalid length/literal";if(re<256)e[l++]=re;else if(re==256){_e=c,u=null;break}else{var Y=re-254;if(re>264){var x=re-257,q=Io[x];Y=en(s,c,(1<<q)-1)+Uo[x],c+=q}var ce=h[cs(s,c)&te],ge=ce>>>4;if(!ce)throw"invalid distance";c+=ce&15;var le=sp[ge];if(ge>3){var q=No[ge];le+=cs(s,c)&(1<<q)-1,c+=q}if(c>v){if(r)throw"unexpected EOF";break}i&&o(l+131072);for(var Me=l+Y;l<Me;l+=4)e[l]=e[l-le],e[l+1]=e[l+1-le],e[l+2]=e[l+2-le],e[l+3]=e[l+3-le];l=Me}}t.l=u,t.p=_e,t.b=l,u&&(a=1,t.m=f,t.d=h,t.n=g)}while(!a);return l==e.length?e:cp(e,0,l)},hp=new Yt(0),dp=function(s){if((s[0]&15)!=8||s[0]>>>4>7||(s[0]<<8|s[1])%31)throw"invalid zlib data";if(s[1]&32)throw"invalid zlib data: preset dictionaries not supported"};function mr(s,e){return up((dp(s),s.subarray(2,-4)),e)}var fp=typeof TextDecoder<"u"&&new TextDecoder,pp=0;try{fp.decode(hp,{stream:!0}),pp=1}catch{}class mp extends Vf{constructor(e){super(e),this.type=bn}parse(e){const L=Math.pow(2.7182818,2.2);function H(p,_){let b=0;for(let V=0;V<65536;++V)(V==0||p[V>>3]&1<<(V&7))&&(_[b++]=V);const R=b-1;for(;b<65536;)_[b++]=0;return R}function ne(p){for(let _=0;_<16384;_++)p[_]={},p[_].len=0,p[_].lit=0,p[_].p=null}const oe={l:0,c:0,lc:0};function z(p,_,b,R,V){for(;b<p;)_=_<<8|Pe(R,V),b+=8;b-=p,oe.l=_>>b&(1<<p)-1,oe.c=_,oe.lc=b}const F=new Array(59);function ee(p){for(let b=0;b<=58;++b)F[b]=0;for(let b=0;b<65537;++b)F[p[b]]+=1;let _=0;for(let b=58;b>0;--b){const R=_+F[b]>>1;F[b]=_,_=R}for(let b=0;b<65537;++b){const R=p[b];R>0&&(p[b]=R|F[R]++<<6)}}function le(p,_,b,R,V,O){const j=_;let se=0,pe=0;for(;R<=V;R++){if(j.value-_.value>b)return!1;z(6,se,pe,p,j);const ie=oe.l;if(se=oe.c,pe=oe.lc,O[R]=ie,ie==63){if(j.value-_.value>b)throw new Error("Something wrong with hufUnpackEncTable");z(8,se,pe,p,j);let me=oe.l+6;if(se=oe.c,pe=oe.lc,R+me>V+1)throw new Error("Something wrong with hufUnpackEncTable");for(;me--;)O[R++]=0;R--}else if(ie>=59){let me=ie-59+2;if(R+me>V+1)throw new Error("Something wrong with hufUnpackEncTable");for(;me--;)O[R++]=0;R--}}ee(O)}function he(p){return p&63}function te(p){return p>>6}function _e(p,_,b,R){for(;_<=b;_++){const V=te(p[_]),O=he(p[_]);if(V>>O)throw new Error("Invalid table entry");if(O>14){const j=R[V>>O-14];if(j.len)throw new Error("Invalid table entry");if(j.lit++,j.p){const se=j.p;j.p=new Array(j.lit);for(let pe=0;pe<j.lit-1;++pe)j.p[pe]=se[pe]}else j.p=new Array(1);j.p[j.lit-1]=_}else if(O){let j=0;for(let se=1<<14-O;se>0;se--){const pe=R[(V<<14-O)+j];if(pe.len||pe.p)throw new Error("Invalid table entry");pe.len=O,pe.lit=_,j++}}}return!0}const re={c:0,lc:0};function Y(p,_,b,R){p=p<<8|Pe(b,R),_+=8,re.c=p,re.lc=_}const q={c:0,lc:0};function ce(p,_,b,R,V,O,j,se,pe){if(p==_){R<8&&(Y(b,R,V,O),b=re.c,R=re.lc),R-=8;let ie=b>>R;if(ie=new Uint8Array([ie])[0],se.value+ie>pe)return!1;const me=j[se.value-1];for(;ie-- >0;)j[se.value++]=me}else if(se.value<pe)j[se.value++]=p;else return!1;q.c=b,q.lc=R}function ge(p){return p&65535}function Me(p){const _=ge(p);return _>32767?_-65536:_}const X={a:0,b:0};function He(p,_){const b=Me(p),V=Me(_),O=b+(V&1)+(V>>1),j=O,se=O-V;X.a=j,X.b=se}function be(p,_){const b=ge(p),R=ge(_),V=b-(R>>1)&65535,O=R+V-32768&65535;X.a=O,X.b=V}function Ue(p,_,b,R,V,O,j){const se=j<16384,pe=b>V?V:b;let ie=1,me,ve;for(;ie<=pe;)ie<<=1;for(ie>>=1,me=ie,ie>>=1;ie>=1;){ve=0;const ue=ve+O*(V-me),Fe=O*ie,De=O*me,Ce=R*ie,Ne=R*me;let Ve,nt,Ze,ut;for(;ve<=ue;ve+=De){let Qe=ve;const ke=ve+R*(b-me);for(;Qe<=ke;Qe+=Ne){const ot=Qe+Ce,Ot=Qe+Fe,ht=Ot+Ce;se?(He(p[Qe+_],p[Ot+_]),Ve=X.a,Ze=X.b,He(p[ot+_],p[ht+_]),nt=X.a,ut=X.b,He(Ve,nt),p[Qe+_]=X.a,p[ot+_]=X.b,He(Ze,ut),p[Ot+_]=X.a,p[ht+_]=X.b):(be(p[Qe+_],p[Ot+_]),Ve=X.a,Ze=X.b,be(p[ot+_],p[ht+_]),nt=X.a,ut=X.b,be(Ve,nt),p[Qe+_]=X.a,p[ot+_]=X.b,be(Ze,ut),p[Ot+_]=X.a,p[ht+_]=X.b)}if(b&ie){const ot=Qe+Fe;se?He(p[Qe+_],p[ot+_]):be(p[Qe+_],p[ot+_]),Ve=X.a,p[ot+_]=X.b,p[Qe+_]=Ve}}if(V&ie){let Qe=ve;const ke=ve+R*(b-me);for(;Qe<=ke;Qe+=Ne){const ot=Qe+Ce;se?He(p[Qe+_],p[ot+_]):be(p[Qe+_],p[ot+_]),Ve=X.a,p[ot+_]=X.b,p[Qe+_]=Ve}}me=ie,ie>>=1}return ve}function Le(p,_,b,R,V,O,j,se,pe){let ie=0,me=0;const ve=j,ue=Math.trunc(R.value+(V+7)/8);for(;R.value<ue;)for(Y(ie,me,b,R),ie=re.c,me=re.lc;me>=14;){const De=ie>>me-14&16383,Ce=_[De];if(Ce.len)me-=Ce.len,ce(Ce.lit,O,ie,me,b,R,se,pe,ve),ie=q.c,me=q.lc;else{if(!Ce.p)throw new Error("hufDecode issues");let Ne;for(Ne=0;Ne<Ce.lit;Ne++){const Ve=he(p[Ce.p[Ne]]);for(;me<Ve&&R.value<ue;)Y(ie,me,b,R),ie=re.c,me=re.lc;if(me>=Ve&&te(p[Ce.p[Ne]])==(ie>>me-Ve&(1<<Ve)-1)){me-=Ve,ce(Ce.p[Ne],O,ie,me,b,R,se,pe,ve),ie=q.c,me=q.lc;break}}if(Ne==Ce.lit)throw new Error("hufDecode issues")}}const Fe=8-V&7;for(ie>>=Fe,me-=Fe;me>0;){const De=_[ie<<14-me&16383];if(De.len)me-=De.len,ce(De.lit,O,ie,me,b,R,se,pe,ve),ie=q.c,me=q.lc;else throw new Error("hufDecode issues")}return!0}function $e(p,_,b,R,V,O){const j={value:0},se=b.value,pe=Ee(_,b),ie=Ee(_,b);b.value+=4;const me=Ee(_,b);if(b.value+=4,pe<0||pe>=65537||ie<0||ie>=65537)throw new Error("Something wrong with HUF_ENCSIZE");const ve=new Array(65537),ue=new Array(16384);ne(ue);const Fe=R-(b.value-se);if(le(p,b,Fe,pe,ie,ve),me>8*(R-(b.value-se)))throw new Error("Something wrong with hufUncompress");_e(ve,pe,ie,ue),Le(ve,ue,p,b,me,ie,O,V,j)}function We(p,_,b){for(let R=0;R<b;++R)_[R]=p[_[R]]}function Oe(p){for(let _=1;_<p.length;_++){const b=p[_-1]+p[_]-128;p[_]=b}}function lt(p,_){let b=0,R=Math.floor((p.length+1)/2),V=0;const O=p.length-1;for(;!(V>O||(_[V++]=p[b++],V>O));)_[V++]=p[R++]}function ct(p){let _=p.byteLength;const b=new Array;let R=0;const V=new DataView(p);for(;_>0;){const O=V.getInt8(R++);if(O<0){const j=-O;_-=j+1;for(let se=0;se<j;se++)b.push(V.getUint8(R++))}else{const j=O;_-=2;const se=V.getUint8(R++);for(let pe=0;pe<j+1;pe++)b.push(se)}}return b}function dt(p,_,b,R,V,O){let j=new DataView(O.buffer);const se=b[p.idx[0]].width,pe=b[p.idx[0]].height,ie=3,me=Math.floor(se/8),ve=Math.ceil(se/8),ue=Math.ceil(pe/8),Fe=se-(ve-1)*8,De=pe-(ue-1)*8,Ce={value:0},Ne=new Array(ie),Ve=new Array(ie),nt=new Array(ie),Ze=new Array(ie),ut=new Array(ie);for(let ke=0;ke<ie;++ke)ut[ke]=_[p.idx[ke]],Ne[ke]=ke<1?0:Ne[ke-1]+ve*ue,Ve[ke]=new Float32Array(64),nt[ke]=new Uint16Array(64),Ze[ke]=new Uint16Array(ve*64);for(let ke=0;ke<ue;++ke){let ot=8;ke==ue-1&&(ot=De);let Ot=8;for(let et=0;et<ve;++et){et==ve-1&&(Ot=Fe);for(let it=0;it<ie;++it)nt[it].fill(0),nt[it][0]=V[Ne[it]++],Et(Ce,R,nt[it]),at(nt[it],Ve[it]),Ke(Ve[it]);Nt(Ve);for(let it=0;it<ie;++it)Ct(Ve[it],Ze[it],et*64)}let ht=0;for(let et=0;et<ie;++et){const it=b[p.idx[et]].type;for(let fn=8*ke;fn<8*ke+ot;++fn){ht=ut[et][fn];for(let Ai=0;Ai<me;++Ai){const ln=Ai*64+(fn&7)*8;j.setUint16(ht+0*2*it,Ze[et][ln+0],!0),j.setUint16(ht+1*2*it,Ze[et][ln+1],!0),j.setUint16(ht+2*2*it,Ze[et][ln+2],!0),j.setUint16(ht+3*2*it,Ze[et][ln+3],!0),j.setUint16(ht+4*2*it,Ze[et][ln+4],!0),j.setUint16(ht+5*2*it,Ze[et][ln+5],!0),j.setUint16(ht+6*2*it,Ze[et][ln+6],!0),j.setUint16(ht+7*2*it,Ze[et][ln+7],!0),ht+=8*2*it}}if(me!=ve)for(let fn=8*ke;fn<8*ke+ot;++fn){const Ai=ut[et][fn]+8*me*2*it,ln=me*64+(fn&7)*8;for(let Zi=0;Zi<Ot;++Zi)j.setUint16(Ai+Zi*2*it,Ze[et][ln+Zi],!0)}}}const Qe=new Uint16Array(se);j=new DataView(O.buffer);for(let ke=0;ke<ie;++ke){b[p.idx[ke]].decoded=!0;const ot=b[p.idx[ke]].type;if(b[ke].type==2)for(let Ot=0;Ot<pe;++Ot){const ht=ut[ke][Ot];for(let et=0;et<se;++et)Qe[et]=j.getUint16(ht+et*2*ot,!0);for(let et=0;et<se;++et)j.setFloat32(ht+et*2*ot,P(Qe[et]),!0)}}}function Et(p,_,b){let R,V=1;for(;V<64;)R=_[p.value],R==65280?V=64:R>>8==255?V+=R&255:(b[V]=R,V++),p.value++}function at(p,_){_[0]=P(p[0]),_[1]=P(p[1]),_[2]=P(p[5]),_[3]=P(p[6]),_[4]=P(p[14]),_[5]=P(p[15]),_[6]=P(p[27]),_[7]=P(p[28]),_[8]=P(p[2]),_[9]=P(p[4]),_[10]=P(p[7]),_[11]=P(p[13]),_[12]=P(p[16]),_[13]=P(p[26]),_[14]=P(p[29]),_[15]=P(p[42]),_[16]=P(p[3]),_[17]=P(p[8]),_[18]=P(p[12]),_[19]=P(p[17]),_[20]=P(p[25]),_[21]=P(p[30]),_[22]=P(p[41]),_[23]=P(p[43]),_[24]=P(p[9]),_[25]=P(p[11]),_[26]=P(p[18]),_[27]=P(p[24]),_[28]=P(p[31]),_[29]=P(p[40]),_[30]=P(p[44]),_[31]=P(p[53]),_[32]=P(p[10]),_[33]=P(p[19]),_[34]=P(p[23]),_[35]=P(p[32]),_[36]=P(p[39]),_[37]=P(p[45]),_[38]=P(p[52]),_[39]=P(p[54]),_[40]=P(p[20]),_[41]=P(p[22]),_[42]=P(p[33]),_[43]=P(p[38]),_[44]=P(p[46]),_[45]=P(p[51]),_[46]=P(p[55]),_[47]=P(p[60]),_[48]=P(p[21]),_[49]=P(p[34]),_[50]=P(p[37]),_[51]=P(p[47]),_[52]=P(p[50]),_[53]=P(p[56]),_[54]=P(p[59]),_[55]=P(p[61]),_[56]=P(p[35]),_[57]=P(p[36]),_[58]=P(p[48]),_[59]=P(p[49]),_[60]=P(p[57]),_[61]=P(p[58]),_[62]=P(p[62]),_[63]=P(p[63])}function Ke(p){const _=.5*Math.cos(.7853975),b=.5*Math.cos(3.14159/16),R=.5*Math.cos(3.14159/8),V=.5*Math.cos(3*3.14159/16),O=.5*Math.cos(5*3.14159/16),j=.5*Math.cos(3*3.14159/8),se=.5*Math.cos(7*3.14159/16),pe=new Array(4),ie=new Array(4),me=new Array(4),ve=new Array(4);for(let ue=0;ue<8;++ue){const Fe=ue*8;pe[0]=R*p[Fe+2],pe[1]=j*p[Fe+2],pe[2]=R*p[Fe+6],pe[3]=j*p[Fe+6],ie[0]=b*p[Fe+1]+V*p[Fe+3]+O*p[Fe+5]+se*p[Fe+7],ie[1]=V*p[Fe+1]-se*p[Fe+3]-b*p[Fe+5]-O*p[Fe+7],ie[2]=O*p[Fe+1]-b*p[Fe+3]+se*p[Fe+5]+V*p[Fe+7],ie[3]=se*p[Fe+1]-O*p[Fe+3]+V*p[Fe+5]-b*p[Fe+7],me[0]=_*(p[Fe+0]+p[Fe+4]),me[3]=_*(p[Fe+0]-p[Fe+4]),me[1]=pe[0]+pe[3],me[2]=pe[1]-pe[2],ve[0]=me[0]+me[1],ve[1]=me[3]+me[2],ve[2]=me[3]-me[2],ve[3]=me[0]-me[1],p[Fe+0]=ve[0]+ie[0],p[Fe+1]=ve[1]+ie[1],p[Fe+2]=ve[2]+ie[2],p[Fe+3]=ve[3]+ie[3],p[Fe+4]=ve[3]-ie[3],p[Fe+5]=ve[2]-ie[2],p[Fe+6]=ve[1]-ie[1],p[Fe+7]=ve[0]-ie[0]}for(let ue=0;ue<8;++ue)pe[0]=R*p[16+ue],pe[1]=j*p[16+ue],pe[2]=R*p[48+ue],pe[3]=j*p[48+ue],ie[0]=b*p[8+ue]+V*p[24+ue]+O*p[40+ue]+se*p[56+ue],ie[1]=V*p[8+ue]-se*p[24+ue]-b*p[40+ue]-O*p[56+ue],ie[2]=O*p[8+ue]-b*p[24+ue]+se*p[40+ue]+V*p[56+ue],ie[3]=se*p[8+ue]-O*p[24+ue]+V*p[40+ue]-b*p[56+ue],me[0]=_*(p[ue]+p[32+ue]),me[3]=_*(p[ue]-p[32+ue]),me[1]=pe[0]+pe[3],me[2]=pe[1]-pe[2],ve[0]=me[0]+me[1],ve[1]=me[3]+me[2],ve[2]=me[3]-me[2],ve[3]=me[0]-me[1],p[0+ue]=ve[0]+ie[0],p[8+ue]=ve[1]+ie[1],p[16+ue]=ve[2]+ie[2],p[24+ue]=ve[3]+ie[3],p[32+ue]=ve[3]-ie[3],p[40+ue]=ve[2]-ie[2],p[48+ue]=ve[1]-ie[1],p[56+ue]=ve[0]-ie[0]}function Nt(p){for(let _=0;_<64;++_){const b=p[0][_],R=p[1][_],V=p[2][_];p[0][_]=b+1.5747*V,p[1][_]=b-.1873*R-.4682*V,p[2][_]=b+1.8556*R}}function Ct(p,_,b){for(let R=0;R<64;++R)_[b+R]=Za.toHalfFloat(A(p[R]))}function A(p){return p<=1?Math.sign(p)*Math.pow(Math.abs(p),2.2):Math.sign(p)*Math.pow(L,Math.abs(p)-1)}function S(p){return new DataView(p.array.buffer,p.offset.value,p.size)}function K(p){const _=p.viewer.buffer.slice(p.offset.value,p.offset.value+p.size),b=new Uint8Array(ct(_)),R=new Uint8Array(b.length);return Oe(b),lt(b,R),new DataView(R.buffer)}function fe(p){const _=p.array.slice(p.offset.value,p.offset.value+p.size),b=mr(_),R=new Uint8Array(b.length);return Oe(b),lt(b,R),new DataView(R.buffer)}function xe(p){const _=p.viewer,b={value:p.offset.value},R=new Uint16Array(p.width*p.scanlineBlockSize*(p.channels*p.type)),V=new Uint8Array(8192);let O=0;const j=new Array(p.channels);for(let De=0;De<p.channels;De++)j[De]={},j[De].start=O,j[De].end=j[De].start,j[De].nx=p.width,j[De].ny=p.lines,j[De].size=p.type,O+=j[De].nx*j[De].ny*j[De].size;const se=de(_,b),pe=de(_,b);if(pe>=8192)throw new Error("Something is wrong with PIZ_COMPRESSION BITMAP_SIZE");if(se<=pe)for(let De=0;De<pe-se+1;De++)V[De+se]=ze(_,b);const ie=new Uint16Array(65536),me=H(V,ie),ve=Ee(_,b);$e(p.array,_,b,ve,R,O);for(let De=0;De<p.channels;++De){const Ce=j[De];for(let Ne=0;Ne<j[De].size;++Ne)Ue(R,Ce.start+Ne,Ce.nx,Ce.size,Ce.ny,Ce.nx*Ce.size,me)}We(ie,R,O);let ue=0;const Fe=new Uint8Array(R.buffer.byteLength);for(let De=0;De<p.lines;De++)for(let Ce=0;Ce<p.channels;Ce++){const Ne=j[Ce],Ve=Ne.nx*Ne.size,nt=new Uint8Array(R.buffer,Ne.end*2,Ve*2);Fe.set(nt,ue),ue+=Ve*2,Ne.end+=Ve}return new DataView(Fe.buffer)}function ye(p){const _=p.array.slice(p.offset.value,p.offset.value+p.size),b=mr(_),R=p.lines*p.channels*p.width,V=p.type==1?new Uint16Array(R):new Uint32Array(R);let O=0,j=0;const se=new Array(4);for(let pe=0;pe<p.lines;pe++)for(let ie=0;ie<p.channels;ie++){let me=0;switch(p.type){case 1:se[0]=O,se[1]=se[0]+p.width,O=se[1]+p.width;for(let ve=0;ve<p.width;++ve){const ue=b[se[0]++]<<8|b[se[1]++];me+=ue,V[j]=me,j++}break;case 2:se[0]=O,se[1]=se[0]+p.width,se[2]=se[1]+p.width,O=se[2]+p.width;for(let ve=0;ve<p.width;++ve){const ue=b[se[0]++]<<24|b[se[1]++]<<16|b[se[2]++]<<8;me+=ue,V[j]=me,j++}break}}return new DataView(V.buffer)}function D(p){const _=p.viewer,b={value:p.offset.value},R=new Uint8Array(p.width*p.lines*(p.channels*p.type*2)),V={version:Be(_,b),unknownUncompressedSize:Be(_,b),unknownCompressedSize:Be(_,b),acCompressedSize:Be(_,b),dcCompressedSize:Be(_,b),rleCompressedSize:Be(_,b),rleUncompressedSize:Be(_,b),rleRawSize:Be(_,b),totalAcUncompressedCount:Be(_,b),totalDcUncompressedCount:Be(_,b),acCompression:Be(_,b)};if(V.version<2)throw new Error("EXRLoader.parse: "+G.compression+" version "+V.version+" is unsupported");const O=new Array;let j=de(_,b)-2;for(;j>0;){const Ce=J(_.buffer,b),Ne=ze(_,b),Ve=Ne>>2&3,nt=(Ne>>4)-1,Ze=new Int8Array([nt])[0],ut=ze(_,b);O.push({name:Ce,index:Ze,type:ut,compression:Ve}),j-=Ce.length+3}const se=G.channels,pe=new Array(p.channels);for(let Ce=0;Ce<p.channels;++Ce){const Ne=pe[Ce]={},Ve=se[Ce];Ne.name=Ve.name,Ne.compression=0,Ne.decoded=!1,Ne.type=Ve.pixelType,Ne.pLinear=Ve.pLinear,Ne.width=p.width,Ne.height=p.lines}const ie={idx:new Array(3)};for(let Ce=0;Ce<p.channels;++Ce){const Ne=pe[Ce];for(let Ve=0;Ve<O.length;++Ve){const nt=O[Ve];Ne.name==nt.name&&(Ne.compression=nt.compression,nt.index>=0&&(ie.idx[nt.index]=Ce),Ne.offset=Ce)}}let me,ve,ue;if(V.acCompressedSize>0)switch(V.acCompression){case 0:me=new Uint16Array(V.totalAcUncompressedCount),$e(p.array,_,b,V.acCompressedSize,me,V.totalAcUncompressedCount);break;case 1:const Ce=p.array.slice(b.value,b.value+V.totalAcUncompressedCount),Ne=mr(Ce);me=new Uint16Array(Ne.buffer),b.value+=V.totalAcUncompressedCount;break}if(V.dcCompressedSize>0){const Ce={array:p.array,offset:b,size:V.dcCompressedSize};ve=new Uint16Array(fe(Ce).buffer),b.value+=V.dcCompressedSize}if(V.rleRawSize>0){const Ce=p.array.slice(b.value,b.value+V.rleCompressedSize),Ne=mr(Ce);ue=ct(Ne.buffer),b.value+=V.rleCompressedSize}let Fe=0;const De=new Array(pe.length);for(let Ce=0;Ce<De.length;++Ce)De[Ce]=new Array;for(let Ce=0;Ce<p.lines;++Ce)for(let Ne=0;Ne<pe.length;++Ne)De[Ne].push(Fe),Fe+=pe[Ne].width*p.type*2;dt(ie,De,pe,me,ve,R);for(let Ce=0;Ce<pe.length;++Ce){const Ne=pe[Ce];if(!Ne.decoded)switch(Ne.compression){case 2:let Ve=0,nt=0;for(let Ze=0;Ze<p.lines;++Ze){let ut=De[Ce][Ve];for(let Qe=0;Qe<Ne.width;++Qe){for(let ke=0;ke<2*Ne.type;++ke)R[ut++]=ue[nt+ke*Ne.width*Ne.height];nt++}Ve++}break;case 1:default:throw new Error("EXRLoader.parse: unsupported channel compression")}}return new DataView(R.buffer)}function J(p,_){const b=new Uint8Array(p);let R=0;for(;b[_.value+R]!=0;)R+=1;const V=new TextDecoder().decode(b.slice(_.value,_.value+R));return _.value=_.value+R+1,V}function Z(p,_,b){const R=new TextDecoder().decode(new Uint8Array(p).slice(_.value,_.value+b));return _.value=_.value+b,R}function Te(p,_){const b=we(p,_),R=Ee(p,_);return[b,R]}function Re(p,_){const b=Ee(p,_),R=Ee(p,_);return[b,R]}function we(p,_){const b=p.getInt32(_.value,!0);return _.value=_.value+4,b}function Ee(p,_){const b=p.getUint32(_.value,!0);return _.value=_.value+4,b}function Pe(p,_){const b=p[_.value];return _.value=_.value+1,b}function ze(p,_){const b=p.getUint8(_.value);return _.value=_.value+1,b}const Be=function(p,_){const b=Number(p.getBigInt64(_.value,!0));return _.value+=8,b};function qe(p,_){const b=p.getFloat32(_.value,!0);return _.value+=4,b}function I(p,_){return Za.toHalfFloat(qe(p,_))}function P(p){const _=(p&31744)>>10,b=p&1023;return(p>>15?-1:1)*(_?_===31?b?NaN:1/0:Math.pow(2,_-15)*(1+b/1024):6103515625e-14*(b/1024))}function de(p,_){const b=p.getUint16(_.value,!0);return _.value+=2,b}function Ae(p,_){return P(de(p,_))}function Ie(p,_,b,R){const V=b.value,O=[];for(;b.value<V+R-1;){const j=J(_,b),se=we(p,b),pe=ze(p,b);b.value+=3;const ie=we(p,b),me=we(p,b);O.push({name:j,pixelType:se,pLinear:pe,xSampling:ie,ySampling:me})}return b.value+=1,O}function Je(p,_){const b=qe(p,_),R=qe(p,_),V=qe(p,_),O=qe(p,_),j=qe(p,_),se=qe(p,_),pe=qe(p,_),ie=qe(p,_);return{redX:b,redY:R,greenX:V,greenY:O,blueX:j,blueY:se,whiteX:pe,whiteY:ie}}function ft(p,_){const b=["NO_COMPRESSION","RLE_COMPRESSION","ZIPS_COMPRESSION","ZIP_COMPRESSION","PIZ_COMPRESSION","PXR24_COMPRESSION","B44_COMPRESSION","B44A_COMPRESSION","DWAA_COMPRESSION","DWAB_COMPRESSION"],R=ze(p,_);return b[R]}function St(p,_){const b=Ee(p,_),R=Ee(p,_),V=Ee(p,_),O=Ee(p,_);return{xMin:b,yMin:R,xMax:V,yMax:O}}function dn(p,_){const b=["INCREASING_Y"],R=ze(p,_);return b[R]}function tt(p,_){const b=qe(p,_),R=qe(p,_);return[b,R]}function $t(p,_){const b=qe(p,_),R=qe(p,_),V=qe(p,_);return[b,R,V]}function Ft(p,_,b,R,V){if(R==="string"||R==="stringvector"||R==="iccProfile")return Z(_,b,V);if(R==="chlist")return Ie(p,_,b,V);if(R==="chromaticities")return Je(p,b);if(R==="compression")return ft(p,b);if(R==="box2i")return St(p,b);if(R==="lineOrder")return dn(p,b);if(R==="float")return qe(p,b);if(R==="v2f")return tt(p,b);if(R==="v3f")return $t(p,b);if(R==="int")return we(p,b);if(R==="rational")return Te(p,b);if(R==="timecode")return Re(p,b);if(R==="preview")return b.value+=V,"skipped";b.value+=V}function qi(p,_,b){const R={};if(p.getUint32(0,!0)!=20000630)throw new Error("THREE.EXRLoader: provided file doesn't appear to be in OpenEXR format.");R.version=p.getUint8(4);const V=p.getUint8(5);R.spec={singleTile:!!(V&2),longName:!!(V&4),deepFormat:!!(V&8),multiPart:!!(V&16)},b.value=8;let O=!0;for(;O;){const j=J(_,b);if(j==0)O=!1;else{const se=J(_,b),pe=Ee(p,b),ie=Ft(p,_,b,se,pe);ie===void 0?console.warn(`EXRLoader.parse: skipped unknown header attribute type '${se}'.`):R[j]=ie}}if(V&-5)throw console.error("EXRHeader:",R),new Error("THREE.EXRLoader: provided file is currently unsupported.");return R}function Er(p,_,b,R,V){const O={size:0,viewer:_,array:b,offset:R,width:p.dataWindow.xMax-p.dataWindow.xMin+1,height:p.dataWindow.yMax-p.dataWindow.yMin+1,channels:p.channels.length,bytesPerLine:null,lines:null,inputSize:null,type:p.channels[0].pixelType,uncompress:null,getter:null,format:null,encoding:null};switch(p.compression){case"NO_COMPRESSION":O.lines=1,O.uncompress=S;break;case"RLE_COMPRESSION":O.lines=1,O.uncompress=K;break;case"ZIPS_COMPRESSION":O.lines=1,O.uncompress=fe;break;case"ZIP_COMPRESSION":O.lines=16,O.uncompress=fe;break;case"PIZ_COMPRESSION":O.lines=32,O.uncompress=xe;break;case"PXR24_COMPRESSION":O.lines=16,O.uncompress=ye;break;case"DWAA_COMPRESSION":O.lines=32,O.uncompress=D;break;case"DWAB_COMPRESSION":O.lines=256,O.uncompress=D;break;default:throw new Error("EXRLoader.parse: "+p.compression+" is unsupported")}if(O.scanlineBlockSize=O.lines,O.type==1)switch(V){case rn:O.getter=Ae,O.inputSize=2;break;case bn:O.getter=de,O.inputSize=2;break}else if(O.type==2)switch(V){case rn:O.getter=qe,O.inputSize=4;break;case bn:O.getter=I,O.inputSize=4}else throw new Error("EXRLoader.parse: unsupported pixelType "+O.type+" for "+p.compression+".");O.blockCount=(p.dataWindow.yMax+1)/O.scanlineBlockSize;for(let se=0;se<O.blockCount;se++)Be(_,R);O.outputChannels=O.channels==3?4:O.channels;const j=O.width*O.height*O.outputChannels;switch(V){case rn:O.byteArray=new Float32Array(j),O.channels<O.outputChannels&&O.byteArray.fill(1,0,j);break;case bn:O.byteArray=new Uint16Array(j),O.channels<O.outputChannels&&O.byteArray.fill(15360,0,j);break;default:console.error("THREE.EXRLoader: unsupported type: ",V);break}return O.bytesPerLine=O.width*O.inputSize*O.channels,O.outputChannels==4?(O.format=Ht,O.encoding=Tn):(O.format=uo,O.encoding=Tn),O}const Kn=new DataView(e),Ar=new Uint8Array(e),y={value:0},G=qi(Kn,e,y),k=Er(G,Kn,Ar,y,this.type),U={value:0},Q={R:0,G:1,B:2,A:3,Y:0};for(let p=0;p<k.height/k.scanlineBlockSize;p++){const _=Ee(Kn,y);k.size=Ee(Kn,y),k.lines=_+k.scanlineBlockSize>k.height?k.height-_:k.scanlineBlockSize;const R=k.size<k.lines*k.bytesPerLine?k.uncompress(k):S(k);y.value+=k.size;for(let V=0;V<k.scanlineBlockSize;V++){const O=V+p*k.scanlineBlockSize;if(O>=k.height)break;for(let j=0;j<k.channels;j++){const se=Q[G.channels[j].name];for(let pe=0;pe<k.width;pe++){U.value=(V*(k.channels*k.width)+j*k.width+pe)*k.inputSize;const ie=(k.height-1-O)*(k.width*k.outputChannels)+pe*k.outputChannels+se;k.byteArray[ie]=k.getter(R,U)}}}}return{header:G,width:k.width,height:k.height,data:k.byteArray,format:k.format,encoding:k.encoding,type:this.type}}setDataType(e){return this.type=e,this}load(e,t,n,i){function r(o,a){o.encoding=a.encoding,o.minFilter=bt,o.magFilter=bt,o.generateMipmaps=!1,o.flipY=!1,t&&t(o,a)}return super.load(e,r,n,i)}}class gp{constructor(){$(this,"list",[]);$(this,"onLoadCallback")}loadBuf(e,t){this.list.push(()=>{fetch(e).then(n=>n.arrayBuffer()).then(n=>{let i=new Uint32Array(n,0,1)[0],r=JSON.parse(String.fromCharCode.apply(null,new Uint8Array(n,4,i))),o=r.vertexCount,a=r.indexCount,c=4+i,l=new En,u=r.attributes;for(let h=0,f=u.length;h<f;h++){let g=u[h],v=g.id,m=v==="indices"?a:o,d=g.componentSize,M=window[g.storageType],C=new M(n,c,m*d),w=M.BYTES_PER_ELEMENT,T;if(g.needsPack){let E=g.packedComponents,N=E.length,B=g.storageType.indexOf("Int")===0,x=1<<w*8,L=B?x*.5:0,H=1/x;T=new Float32Array(m*d);for(let ne=0,oe=0;ne<m;ne++)for(let z=0;z<N;z++){let F=E[z];T[oe]=(C[oe]+L)*H*F.delta+F.from,oe++}}else T=C;v==="indices"?l.setIndex(new Wt(T,1)):l.setAttribute(v,new Wt(T,d)),c+=m*d*w}t&&t(l),this._onLoad()})})}loadExr(e,t){this.list.push(()=>{new mp().load(e,i=>{t&&t(i),this._onLoad()})})}loadTexture(e,t){this.list.push(()=>{const n=new Image;n.onload=()=>{const i=new It(n);i.minFilter=_l,i.magFilter=bt,i.generateMipmaps=!0,i.anisotropy=ae.renderer.capabilities.getMaxAnisotropy(),i.flipY=!0,t&&t(i),this._onLoad()},n.src=e})}start(e){this.loadedCount=0,this.onLoadCallback=e;for(let t=0;t<this.list.length;t++)this.list[t]()}_onLoad(){this.loadedCount++,this.loadedCount===this.list.length&&(this.list.length=0,this.onLoadCallback&&this.onLoadCallback())}}const xi=new gp,us=`#define GLSLIFY 1
attribute vec3 instancePos;
attribute vec4 instanceOrient;
attribute float instanceShowRatio;
attribute vec3 instanceSpinPivot;
attribute vec4 instanceSpinOrient;
attribute vec3 instanceColor;
attribute float instanceIsActive;

varying vec3 v_modelPosition;
varying vec3 v_viewPosition;
varying vec3 v_worldPosition;

varying vec3 v_modelNormal;
varying vec3 v_viewNormal;
varying vec3 v_worldNormal;

varying vec2 v_uv;

varying vec3 v_color;
varying float v_clipY;
varying float v_isActive;

vec3 qrotate(vec4 q, vec3 v) {
	return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

#ifdef IS_DEPTH
    varying vec2 vHighPrecisionZW;
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
#endif

vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
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
	vec3 viewNormal = normalMatrix * nor;
	vec4 worldPosition = (modelMatrix * vec4(pos, 1.0));

    gl_Position = projectionMatrix * viewPos;

    v_modelPosition = position;
    v_viewPosition = -viewPos.xyz;
    v_worldPosition = worldPosition.xyz;

    v_modelNormal = normal;
    v_viewNormal = normalMatrix * nor;
    v_worldNormal = inverseTransformDirection(viewNormal, viewMatrix);

    v_color = instanceColor;
    v_isActive = instanceIsActive;

    #if defined( USE_SHADOWMAP )
        #if NUM_DIR_LIGHT_SHADOWS > 0
            // Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.
            vec4 shadowWorldPosition;

            #pragma unroll_loop_start
            for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

                shadowWorldPosition = worldPosition + vec4( v_worldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
                vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;

            }
            #pragma unroll_loop_end
        #endif
    #endif

    #ifndef IS_BASE
        v_uv = (instancePos.xz + 2.5) / 5.0;
    #else
        v_uv = (position.xz + 2.5) / 5.0;
    #endif

    #ifdef IS_DEPTH
        vHighPrecisionZW = gl_Position.zw;
    #endif
}
`,ja=`#define GLSLIFY 1
uniform vec3 u_lightPosition;
uniform sampler2D u_matcap;
uniform sampler2D u_infoTexture;

#ifdef IS_BASE
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor0;
    uniform vec3 u_bgColor1;
    uniform vec3 u_color;
    uniform vec3 u_blocksColor;
    uniform float u_yDisplacement;
    uniform float u_endAnimationRatio;
#endif

varying vec3 v_modelPosition;
varying vec3 v_viewPosition;
varying vec3 v_worldPosition;

varying vec3 v_modelNormal;
varying vec3 v_viewNormal;
varying vec3 v_worldNormal;

varying vec2 v_uv;

varying vec3 v_color;
varying float v_clipY;
varying float v_isActive;

vec3 SRGBtoLinear(vec3 srgb) {
    return pow(srgb, vec3(2.2));
}

vec3 linearToSRGB(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

float linearstep(float edge0, float edge1, float x) {
    return  clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

#include <packing>
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

	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {

		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

		float shadow = 1.0;

		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;

		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

		if ( frustumTest ) {
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
		}
		return shadow;
	}
#endif
#include <getBlueNoise>

uniform bool receiveShadow;
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif

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

	vec3 N = normalize(v_worldNormal); // normal in world space
	vec3 V = normalize(cameraPosition - v_worldPosition); // view direction
	vec3 L = u_lightPosition - v_worldPosition; // light direction
	float lightDistance = length(L);
	L /= lightDistance;

    // basic shading
    float attenuation = 1. / (0.12 * lightDistance + 0.012 * lightDistance * lightDistance);

	float NdV = max(0., dot(N, V));

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

        ao = 1.0 - 0.65 * ao;
    #else
        float aoThreshold = 2.5;
        float depth = 0.045;
        ao = linearstep(aoThreshold - depth, aoThreshold, abs(v_modelPosition.x));
        ao += linearstep(aoThreshold - depth, aoThreshold, abs(v_modelPosition.z));
        aoThreshold = 0.5;
        ao += linearstep(aoThreshold + depth, aoThreshold, -v_modelPosition.y);
        ao = min(1.0, ao);
    #endif

    // shadows
    float shadowMask = 1.0;
    #ifdef USE_SHADOWMAP
        #if NUM_DIR_LIGHT_SHADOWS > 0
            DirectionalLightShadow directionalLight;
            #pragma unroll_loop_start
            for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
                directionalLight = directionalLightShadows[ i ];
                vec3 noises = getBlueNoise(gl_FragCoord.xy);
                shadowMask = getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias + noises.z * 0.005, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] + vec4((noises.xy - 0.5) / directionalLight.shadowMapSize, 0.0, 0.0));
            }
            #pragma unroll_loop_end
        #endif

        #ifdef IS_BASE
            shadowMask -= 0.9 * infoTexture.x * step(-0.525, v_modelPosition.y);
        #endif

    #endif

    // final
    #ifdef IS_BASE
        vec3 albedo = SRGBtoLinear(u_color);
    #else
        vec3 albedo = SRGBtoLinear(v_color);
    #endif

    vec3 matcapMap = SRGBtoLinear(texture2D(u_matcap, uv).rgb);
    vec3 matcapDiff = vec3(matcapMap.r);
    vec3 matcapSpec = vec3(matcapMap.b);

	vec3 color = albedo * (matcapDiff * 0.25 + 0.75);
	color += clamp(N.y, 0.0, 0.5);
    color += 0.5 * shadowMask * matcapSpec;
    color *= attenuation;
    color += 0.5 * (1.0 - NdV);
    color *= 0.4 + 0.6 * ao;
    color *= 0.7 + 0.3 * shadowMask;

    #ifdef IS_BASE
        color += SRGBtoLinear(u_blocksColor) * 0.2 * (1.0 - u_endAnimationRatio) * infoTexture.y * infoTexture.x * step(-0.55, v_modelPosition.y);
    #endif

    gl_FragColor = vec4(linearToSRGB(color), 1.0);

    #ifdef IS_BASE
        vec2 screenUv = gl_FragCoord.xy / u_resolution;
        float alpha = linearstep(-6.0, -3.0, v_modelPosition.y + u_yDisplacement);
        gl_FragColor.rgb = mix(mix(u_bgColor0, u_bgColor1, screenUv.y), gl_FragColor.rgb, alpha);
    #else
        // gl_FragColor = vec4(vec3(ao), 1.0);
    #endif
    // gl_FragColor = vec4(vec3(shadowMask), 1.0);

}

`,_p=`#define GLSLIFY 1
#include <common>
#include <packing>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
    gl_FragColor = packDepthToRGBA( fragCoordZ );
}
`;let xp=new W,vp=class{constructor(){$(this,"animation",0);$(this,"boardDir",new Ge(0,0));$(this,"boardPos",new Ge(0,0));$(this,"pos",new W(0,0,0));$(this,"orient",new on);$(this,"showRatio",0);$(this,"spinPivot",new W(0,0,0));$(this,"spinOrient",new on)}reset(){this.animation=0,this.boardDir.set(0,0),this.boardPos.set(0,0),this.pos.set(0,0,0),this.orient.set(0,0,0,1),this.showRatio=0,this.spinPivot.set(0,0,0),this.spinOrient.set(0,0,0,1)}update(e){this.pos.set(this.boardPos.x,0,-this.boardPos.y),this.spinPivot.set(this.boardDir.x*.5,-.5,-this.boardDir.y*.5),this.spinOrient.setFromAxisAngle(xp.set(-this.boardDir.y,0,-this.boardDir.x),this.animation*Math.PI/2)}};const $a=(s,e)=>Math.sqrt(Math.pow(s,2)+Math.pow(e,2));class Sp{constructor(e=0,t=0,n=0){$(this,"id",-1);$(this,"row",0);$(this,"col",0);$(this,"priority",0);$(this,"ringIndex",0);$(this,"isMain",!1);$(this,"isBorder",!1);$(this,"isOccupied",!1);$(this,"willBeOccupied",!1);$(this,"domEl",null);$(this,"neighbours",null);$(this,"reachableNeighbours",null);$(this,"prioritySortedReachableNeighbours",null);$(this,"activeRatio",0);$(this,"MAX_DISTANCE",$a(Ut,Ut));$(this,"loseAnimationPositionArray",null);$(this,"loseAnimationOrientArray",null);$(this,"randomDelay",0);this.id=e,this.row=t,this.col=n,this.distance=$a(t,n),this.priority=this.MAX_DISTANCE-this.distance,this.ringIndex=Math.floor(this.distance),this.isMain=t===0&&n===0,this.isBorder=Math.abs(t)===2||Math.abs(n)===2,this.randomDelay=Math.random()*.5+(this.MAX_DISTANCE-this.priority)*.5}init(){this.reachableNeighbours=this.neighbours.filter(e=>e.row===this.row||e.col===this.col),this.prioritySortedReachableNeighbours=this.reachableNeighbours.toSorted((e,t)=>e.priority-t.priority)}shuffleReachableNeighbours(){let e=this.reachableNeighbours.length;for(;e!=0;){let t=Math.floor(Math.random()*e);e--,[this.reachableNeighbours[e],this.reachableNeighbours[t]]=[this.reachableNeighbours[t],this.reachableNeighbours[e]]}this.prioritySortedReachableNeighbours=this.reachableNeighbours.toSorted((t,n)=>t.priority-n.priority)}reset(){this.isOccupied=!1,this.willBeOccupied=!1,this.activeRatio=0}update(e){this.domEl&&(this.domEl.style.backgroundColor=`rgba(255, 0, 0, ${this.activeRatio})`)}}const Dt=5,Ut=Math.floor(Dt/2),tn=Dt*Dt;class Mp{constructor(){$(this,"tiles",new Map);$(this,"mainTile",null)}init(){this.domEl=document.querySelector("#board");let e=0;for(let t=0;t<Dt;t++){let n;this.domEl&&(n=document.createElement("div"),n.classList.add("row"),this.domEl.appendChild(n));const i=t-Ut,r=new Map;this.tiles.set(i,r);for(let o=0;o<Dt;o++){let a;this.domEl&&(a=document.createElement("div"),a.classList.add("tile"),n.appendChild(a));const c=o-Ut,l=new Sp(e,i,c);this.domEl&&(l.domEl=a),r.set(c,l),e++}}for(let t=0;t<Dt;t++)for(let n=0;n<Dt;n++){const i=this.getTile(t-Ut,n-Ut),r=this.getNeighbouringTiles(t-Ut,n-Ut);i.neighbours=r,i.init()}this.mainTile=this.getTile(0,0)}getTile(e,t){const n=this.tiles.get(e);return n?n.get(t):null}getRandomFreeTile(){const e=[];return this.tiles.forEach(t=>{t.forEach(n=>{n.isOccupied||e.push(n)})}),e.length===0?null:e[Math.floor(Math.random()*e.length)]}getNeighbouringTiles(e,t){const n=[];for(let i=-1;i<=1;i++)for(let r=-1;r<=1;r++){if(i===0&&r===0)continue;const o=this.getTile(e+i,t+r);o&&n.push(o)}return n}reset(){this.tiles.forEach(e=>{e.forEach(t=>{t.reset()})})}update(e){this.tiles.forEach(t=>{t.forEach(n=>{n.update(e)})})}}const hn=new Mp;class Ka{constructor(e){$(this,"id",-1);$(this,"isMoving",!1);$(this,"hasBeenSpawned",!1);$(this,"hasAnimationEnded",!1);$(this,"hasBeenEvaluated",!1);$(this,"currentTile",null);$(this,"targetTile",null);$(this,"moveAnimationRatio",0);$(this,"spawnAnimationRatio",0);$(this,"animationTimeScale",1);$(this,"randomVec",{x:Math.random()-.5,y:Math.random()-.5});$(this,"lifeCycle",0);this.id=e}init(){}updateTile(){this.currentTile.isOccupied=!0,this.currentTile.willBeOccupied=!1,this.currentTile.domEl&&(this.currentTile.domEl.innerHTML=this.id)}moveToNextTile(e=!1,t=0){this.hasBeenEvaluated=!0,this.moveAnimationRatio=-t;let n;this.currentTile.shuffleReachableNeighbours(),e?n=this.currentTile.reachableNeighbours:n=this.currentTile.prioritySortedReachableNeighbours;let i=n.find(r=>{let o=!r.isOccupied&&!r.willBeOccupied&&!r.isMain;return e||(o=o&&this.currentTile.priority>=r.priority),o});!this.currentTile.isMain&&Math.random()>.8&&(i=null),i?(this.targetTile=i,this.targetTile.willBeOccupied=!0,this.isMoving=!0):this.hasAnimationEnded=!0}endMove(){this.moveAnimationRatio=1,this.currentTile.domEl&&(this.currentTile.domEl.innerHTML=""),this.currentTile.isOccupied=!1,this.currentTile=this.targetTile,this.targetTile=null,this.hasAnimationEnded=!0,this.updateTile()}resetAfterCycle(){this.hasBeenEvaluated=!1,this.hasAnimationEnded=!1,this.moveAnimationRatio=0,this.isMoving=!1,this.animationTimeScale=.5+Math.random()*.5,this.lifeCycle++,this.updateTile()}reset(){this.id=-1,this.isMoving=!1,this.hasBeenSpawned=!1,this.hasAnimationEnded=!1,this.hasBeenEvaluated=!1,this.currentTile=null,this.targetTile=null,this.moveAnimationRatio=0,this.spawnAnimationRatio=0,this.animationTimeScale=1,this.lifeCycle=0}update(e){let t=!1;this.hasBeenSpawned?(this.isMoving&&!this.hasAnimationEnded||ae.isResultAnimation)&&(this.moveAnimationRatio+=this.animationTimeScale*gt.SIMULATION_SPEED_SCALE*ae.animationSpeed*e,this.moveAnimationRatio=Math.min(1,this.moveAnimationRatio),this.moveAnimationRatio===1&&(ae.isFree||ae.isResult)&&(t=!0)):(this.spawnAnimationRatio+=gt.SIMULATION_SPEED_SCALE*ae.animationSpeed*e,this.spawnAnimationRatio=Math.min(1,this.spawnAnimationRatio),this.spawnAnimationRatio>=1&&(this.hasBeenSpawned=!0));const n=Math.max(0,Math.min(1,this.hasBeenSpawned?this.moveAnimationRatio:this.spawnAnimationRatio));this.currentTile.activeRatio=1-n,this.targetTile?this.targetTile.activeRatio=n:this.currentTile.activeRatio=1,t&&this.endMove()}}class yp{constructor(){$(this,"blocks",[]);$(this,"lastSpawnedBlock",null);$(this,"cycleIndex",0);$(this,"animationSpeedRatio",0);$(this,"restartAnimationRatio",0)}init(){hn.init(),this.spawnBlock()}spawnBlock(){if(!(ae.isFailResult||ae.isPaused)&&!(ae.isFree&&this.blocks.length>=ae.maxFreeSpawn)){if(this.blocks.length>=tn){ae.stateSignal.dispatch(je.RESULT_ANIMATION);return}if(!hn.mainTile.isOccupied){if(ae.isSuccessResult)for(let e=0;e<Math.floor(1+Math.random()*3);e++){const t=hn.getRandomFreeTile();if(t){const n=new Ka(this.blocks.length);n.currentTile=t,n.init(),n.updateTile(),this.blocks=[n,...this.blocks]}}else{const e=new Ka(this.blocks.length);e.currentTile=hn.mainTile,this.lastSpawnedBlock=e,e.init(),e.updateTile()}ae.spawnSignal.dispatch()}}}startNewCycle(){ae.endCycleSignal.dispatch(),!ae.isRestartAnimation&&(ae.isRestart||ae.hasNotStarted||(this.cycleIndex++,this.lastSpawnedBlock&&(this.blocks=[this.lastSpawnedBlock,...this.blocks],this.lastSpawnedBlock=null),ae.activeBlocksCount=this.blocks.length,!ae.isFailResult&&(ae.isPaused||(this.blocks.forEach(e=>{e.resetAfterCycle()}),this.spawnBlock(),this.calculatePaths()))))}calculatePaths(){this.lastSpawnedBlock&&this.lastSpawnedBlock.hasBeenSpawned&&this.lastSpawnedBlock.moveToNextTile(ae.isFree,0),this.blocks.forEach((e,t)=>{!e.hasBeenEvaluated&&e.hasBeenSpawned&&e.moveToNextTile(ae.isFree,t*.2)})}reset(){this.blocks.forEach(e=>{e.reset()}),Vn.reset(),hn.reset(),this.blocks=[],this.lastSpawnedBlock=null,this.cycleIndex=0,ae.stateSignal.dispatch(je.NOT_STARTED),this.animationSpeedRatio=0}update(e){if(ae.hasNotStarted)return;if(ae.isRestartAnimation){this.restartAnimationRatio=this.restartAnimationRatio+2*e,this.restartAnimationRatio>=1&&(ae.stateSignal.dispatch(je.RESTART),ae.gameEndedSignal.dispatch(),this.restartAnimationRatio=0,this.reset(),this.startNewCycle()),Vn.restartAnimationRatio=this.restartAnimationRatio;return}if(ae.isResultAnimation){let n=!0;this.blocks.forEach(i=>{n=n&&Vn.endAnimationRatio===1}),n&&ae.stateSignal.dispatch(je.RESTART_ANIMATION)}this.animationSpeedRatio=this.animationSpeedRatio+e*(ae.isResult?1:0),this.animationSpeedRatio=Math.min(1,this.animationSpeedRatio),ae.animationSpeed=ae.freeAnimationSpeed+(ae.resultAnimationSpeed-ae.freeAnimationSpeed)*this.animationSpeedRatio,this.lastSpawnedBlock&&this.lastSpawnedBlock.update(e),this.blocks.forEach(n=>{n.update(e)}),hn.update(e);let t=!0;this.lastSpawnedBlock&&(t=t&&this.lastSpawnedBlock.hasBeenSpawned),this.blocks.forEach(n=>{n.lifeCycle>0?(t=t&&n.hasBeenEvaluated,t=t&&n.hasAnimationEnded):t=t&&n.spawnAnimationRatio===1}),t=t||ae.isResultAnimation||ae.isFailResult||ae.isPaused,t&&this.startNewCycle()}}const Zt=new yp;class bp{quadIn(e){return e*e}quadOut(e){return e*(2-e)}quadInOut(e){return(e*=2)<1?.5*e*e:-.5*(--e*(e-2)-1)}cubicIn(e){return e*e*e}cubicOut(e){return--e*e*e+1}cubicInOut(e){return(e*=2)<1?.5*e*e*e:.5*((e-=2)*e*e+2)}quartIn(e){return e*e*e*e}quartOut(e){return 1- --e*e*e*e}quartInOut(e){return(e*=2)<1?.5*e*e*e*e:-.5*((e-=2)*e*e*e-2)}quintIn(e){return e*e*e*e*e}quintOut(e){return--e*e*e*e*e+1}quintInOut(e){return(e*=2)<1?.5*e*e*e*e*e:.5*((e-=2)*e*e*e*e+2)}sineIn(e){return 1-Math.cos(e*Math.PI/2)}sineOut(e){return Math.sin(e*Math.PI/2)}sineInOut(e){return .5*(1-Math.cos(Math.PI*e))}expoIn(e){return e===0?0:Math.pow(1024,e-1)}expoOut(e){return e===1?1:1-Math.pow(2,-10*e)}expoInOut(e){return e===0?0:e===1?1:(e*=2)<1?.5*Math.pow(1024,e-1):.5*(-Math.pow(2,-10*(e-1))+2)}circIn(e){return 1-Math.sqrt(1-e*e)}circOut(e){return Math.sqrt(1- --e*e)}circInOut(e){return(e*=2)<1?-.5*(Math.sqrt(1-e*e)-1):.5*(Math.sqrt(1-(e-=2)*e)+1)}elasticIn(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),-(n*Math.pow(2,10*(e-=1))*Math.sin((e-t)*2*Math.PI/i)))}elasticOut(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),n*Math.pow(2,-10*e)*Math.sin((e-t)*2*Math.PI/i)+1)}elasticInOut(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),(e*=2)<1?-.5*n*Math.pow(2,10*(e-=1))*Math.sin((e-t)*2*Math.PI/i):n*Math.pow(2,-10*(e-=1))*Math.sin((e-t)*2*Math.PI/i)*.5+1)}backIn(e){let t=1.70158;return e*e*((t+1)*e-t)}backOut(e){let t=1.70158;return--e*e*((t+1)*e+t)+1}backInOut(e){let t=2.5949095;return(e*=2)<1?.5*e*e*((t+1)*e-t):.5*((e-=2)*e*((t+1)*e+t)+2)}bounceIn(e){return 1-this.bounceOut(1-e)}bounceOut(e){return e<1/2.75?7.5625*e*e:e<2/2.75?7.5625*(e-=1.5/2.75)*e+.75:e<2.5/2.75?7.5625*(e-=2.25/2.75)*e+.9375:7.5625*(e-=2.625/2.75)*e+.984375}bounceInOut(e){return e<.5?this.bounceIn(e*2)*.5:this.bounceOut(e*2-1)*.5+.5}}const hs=new bp;class wp{constructor(){$(this,"container",new Tt);$(this,"color0","#ffffff");$(this,"color1","#d0d0d0")}init(){const e=new an({uniforms:{u_resolution:ae.sharedUniforms.u_resolution,u_color0:{value:new Ye(this.color0)},u_color1:{value:new Ye(this.color1)}},vertexShader:`
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
			`,depthWrite:!1});this.mesh=new sn(new wr(2,2),e),this.mesh.renderOrder=-1,this.container.add(this.mesh)}resize(){}update(e){}}const Bi=new wp,Tp=`#define GLSLIFY 1
uniform sampler2D u_blueNoiseTexture;
uniform vec2 u_blueNoiseTexelSize;
uniform vec2 u_blueNoiseCoordOffset;

// getBlueNoise(gl_FragCoord.xy)
vec3 getBlueNoise (vec2 coord) {
	return texture2D(u_blueNoiseTexture, coord * u_blueNoiseTexelSize + u_blueNoiseCoordOffset).rgb;
}
`;class Ep{constructor(){$(this,"sharedUniforms",{u_blueNoiseTexture:{value:null},u_blueNoiseTexelSize:{value:null},u_blueNoiseCoordOffset:{value:new Ge}});$(this,"TEXTURE_SIZE",128)}preInit(){xi.loadTexture(gt.ASSETS_PATH+"textures/LDR_RGB1_0.png",e=>{e.generateMipmaps=!1,e.minFilter=e.magFilter=yt,e.wrapS=e.wrapT=vr,e.needsUpdate=!0,this.sharedUniforms.u_blueNoiseTexture.value=e,this.sharedUniforms.u_blueNoiseTexelSize.value=new Ge(1/this.TEXTURE_SIZE,1/this.TEXTURE_SIZE)}),Xe.getBlueNoise=Tp}update(e){this.sharedUniforms.u_blueNoiseCoordOffset.value.set(Math.random(),Math.random())}}const Mr=new Ep,qt=2*tn,gr=new Ge,ds=new Ge,fs=new W,Ja=new W,ps=new on,Qa=new on,eo=new Ye,to=new Ye,no=new Ye,mi=new Ye,zn=new Ye;class Ap{constructor(){$(this,"container",new Tt);$(this,"_baseMesh");$(this,"_blocksMesh");$(this,"_blockList",[]);$(this,"_blockRenderList",[]);$(this,"_blockUpdateRange",{start:0,count:0});$(this,"sharedUniforms",{u_lightPosition:{value:new W(-2,6,-4)},u_matcap:{value:null},u_infoTexture:{value:null}});$(this,"colorRatio",0);$(this,"restartAnimationRatio",0);$(this,"preEndAnimationRatio",0);$(this,"endAnimationRatio",0);$(this,"endSpawnAnimationRatio",0);$(this,"endSpawnAnimationRatioUnclamped",-.1);$(this,"infoTexture",null)}preload(){for(let e=0;e<qt;e++){let t=new vp;this._blockList.push(t),this._blockRenderList.push(t)}xi.loadBuf(gt.ASSETS_PATH+"models/BASE.buf",e=>{this._onBaseBlocksLoaded(e)}),xi.loadBuf(gt.ASSETS_PATH+"models/BOX.buf",e=>{this._onBoxLoaded(e)}),xi.loadBuf(gt.ASSETS_PATH+"models/lose_animation.buf",e=>{const{position:t,orient:n}=e.attributes;this.animationTotalFrames=t.count/tn,this.loseAnimationPositionArray=t.array,this.loseAnimationOrientArray=n.array}),xi.loadExr(gt.ASSETS_PATH+"textures/matcap.exr",e=>{this.sharedUniforms.u_matcap.value=e})}_onBaseBlocksLoaded(e){let t=this._baseMesh=new sn(e,new an({uniforms:Object.assign({u_lightPosition:this.sharedUniforms.u_lightPosition,u_infoTexture:this.sharedUniforms.u_infoTexture,u_matcap:this.sharedUniforms.u_matcap,u_color:{value:new Ye(this.defaultColor)},u_blocksColor:{value:new Ye},u_bgColor0:{value:new Ye(Bi.color0)},u_bgColor1:{value:new Ye(Bi.color1)},u_resolution:ae.sharedUniforms.u_resolution,u_yDisplacement:{value:0},u_endAnimationRatio:{value:0}},ys.merge([Se.lights]),Mr.sharedUniforms),vertexShader:us,fragmentShader:ja,lights:!0}));t.receiveShadow=!0,t.castShadow=!0,t.material.defines.IS_BASE=!0,this.container.add(t)}_onBoxLoaded(e){let t=new Yf;t.index=e.index;for(let i in e.attributes)t.setAttribute(i,e.attributes[i]);t.instanceCount=qt,t.setAttribute("instancePos",new Un(this._instancePosArray=new Float32Array(qt*3),3)),t.setAttribute("instanceOrient",new Un(this._instanceOrientArray=new Float32Array(qt*4),4)),t.setAttribute("instanceShowRatio",new Un(this._instanceShowRatioArray=new Float32Array(qt*1),1)),t.setAttribute("instanceSpinPivot",new Un(this._instanceSpinPivotArray=new Float32Array(qt*3),3)),t.setAttribute("instanceSpinOrient",new Un(this._instanceSpinOrientArray=new Float32Array(qt*4),4)),t.setAttribute("instanceColor",new Un(this._instanceColorArray=new Float32Array(qt*3),3)),t.setAttribute("instanceIsActive",new Un(this._instanceIsActiveArray=new Float32Array(qt),1)),t.attributes.instancePos.setUsage(ei),t.attributes.instanceOrient.setUsage(ei),t.attributes.instanceShowRatio.setUsage(ei),t.attributes.instanceSpinPivot.setUsage(ei),t.attributes.instanceSpinOrient.setUsage(ei),t.attributes.instanceIsActive.setUsage(ei);let n=this._blocksMesh=new sn(t,new an({uniforms:Object.assign({},this.sharedUniforms,Mr.sharedUniforms,ys.merge([Se.lights])),vertexShader:us,fragmentShader:ja,lights:!0}));n.frustumCulled=!1,n.customDepthMaterial=new an({uniforms:Object.assign({},this.sharedUniforms),vertexShader:us,fragmentShader:_p}),n.customDepthMaterial.defines.IS_DEPTH=!0,n.castShadow=!0,n.receiveShadow=!0,this.container.add(n)}init(){this.directLight=new Zf(16777215,1),this.directLight.position.copy(this.sharedUniforms.u_lightPosition.value),this.directLight.castShadow=!0,this.directLight.shadow.camera.near=3,this.directLight.shadow.camera.far=13,this.directLight.shadow.camera.right=5,this.directLight.shadow.camera.left=-5,this.directLight.shadow.camera.top=5,this.directLight.shadow.camera.bottom=-5,this.directLight.shadow.mapSize.width=512,this.directLight.shadow.mapSize.height=512,this.directLight.shadow.bias=.01,this.container.add(this.directLight),this.container.add(this.directLight.target),this._assignFinalAnimationToTiles(),this.infoTexture=new Ro(new Float32Array(tn*4),Dt,Dt,Ht,rn),this.sharedUniforms.u_infoTexture.value=this.infoTexture}_assignFinalAnimationToTiles(){let e=0;for(let t=0;t<Dt;t++)for(let n=0;n<Dt;n++){const i=hn.getTile(n-Ut,-(t-Ut));i.loseAnimationPositionArray=new Float32Array(this.animationTotalFrames*3),i.loseAnimationOrientArray=new Float32Array(this.animationTotalFrames*4);for(let r=0;r<this.animationTotalFrames;r++){let o=r*tn*3+e*3;i.loseAnimationPositionArray[r*3+0]=this.loseAnimationPositionArray[o+0],i.loseAnimationPositionArray[r*3+1]=this.loseAnimationPositionArray[o+1],i.loseAnimationPositionArray[r*3+2]=this.loseAnimationPositionArray[o+2],o=r*tn*4+e*4,i.loseAnimationOrientArray[r*4+0]=this.loseAnimationOrientArray[o+0],i.loseAnimationOrientArray[r*4+1]=this.loseAnimationOrientArray[o+1],i.loseAnimationOrientArray[r*4+2]=this.loseAnimationOrientArray[o+2],i.loseAnimationOrientArray[r*4+3]=this.loseAnimationOrientArray[o+3]}e++}}reset(){this._blockList.forEach(e=>e.reset()),this.preEndAnimationRatio=0,this.endAnimationRatio=0,this.endSpawnAnimationRatioUnclamped=0}update(e){let t=0;if(this.preEndAnimationRatio+=(ae.isFailResult?4:100)*e*(ae.isResultAnimation?1:0),this.preEndAnimationRatio=Math.max(0,Math.min(1,this.preEndAnimationRatio)),this.endAnimationRatio+=e*(ae.isResultAnimation&&this.preEndAnimationRatio===1?1:0),this.endAnimationRatio=Math.max(0,Math.min(1,this.endAnimationRatio)),this.endSpawnAnimationRatioUnclamped+=6*e*(ae.isResultAnimation&&this.preEndAnimationRatio===1?1:0),this.endSpawnAnimationRatio=Math.max(0,Math.min(1,this.endSpawnAnimationRatioUnclamped)),this._baseMesh.material.uniforms.u_endAnimationRatio.value=this.endAnimationRatio,Zt.lastSpawnedBlock){let n=this._blockList[Zt.lastSpawnedBlock.id];n.boardPos.set(Zt.lastSpawnedBlock.currentTile.row,Zt.lastSpawnedBlock.currentTile.col),n.showRatio=hs.sineIn(Zt.lastSpawnedBlock.spawnAnimationRatio)}eo.set(ae.startColor),to.set(ae.endColor),no.set(ae.errorColor),mi.set(ae.defaultColor),this.colorRatio=Math.min(Zt.blocks.length/tn,this.colorRatio+.5*e),zn.lerpColors(eo,to,this.colorRatio),zn.lerp(mi,this.restartAnimationRatio),ae.isFailResult&&this.preEndAnimationRatio===1&&zn.copy(no);for(let n=0;n<qt;n++)n<Zt.blocks.length+(Zt.lastSpawnedBlock?1:0)?(this._instanceColorArray[n*3+0]=zn.r,this._instanceColorArray[n*3+1]=zn.g,this._instanceColorArray[n*3+2]=zn.b,this._instanceIsActiveArray[n]=1):(this._instanceColorArray[n*3+0]=mi.r,this._instanceColorArray[n*3+1]=mi.g,this._instanceColorArray[n*3+2]=mi.b,this._instanceIsActiveArray[n]=0);this._baseMesh.material.uniforms.u_color.value.copy(mi),this._baseMesh.material.uniforms.u_blocksColor.value.copy(zn),Zt.blocks.forEach(n=>{let i=this._blockList[n.id];if(i.showRatio=hs.sineIn(n.spawnAnimationRatio),i.boardPos.set(n.currentTile.row,n.currentTile.col),n.targetTile){const r=n.targetTile.row-n.currentTile.row,o=n.targetTile.col-n.currentTile.col;i.boardDir.set(r,o)}i.animation=n.hasAnimationEnded?0:hs.sineIn(Math.max(0,n.moveAnimationRatio))}),hn.tiles.forEach(n=>{n.forEach(i=>{let r=i.id*4;this.infoTexture.image.data[r+0]=i.activeRatio,this.infoTexture.image.data[r+1]=i.isOccupied?1:0,this.infoTexture.image.data[r+2]=i.isMain?1:0,this.infoTexture.image.data[r+3]=i.isBorder?1:0})}),this.infoTexture.needsUpdate=!0;for(let n=0;n<qt;n++){let i=this._blockList[n];i.update(e);let r=Zt.blocks.filter(o=>o.id===n)[0];if(i.showRatio>0&&(this._blockRenderList[t++]=i),ae.isResultAnimation&&ae.result===RESULT.FAILED){if(r){const o=r.currentTile;if(this.preEndAnimationRatio>0&&this.preEndAnimationRatio<1&&ae.result===RESULT.FAILED&&(gr.set(r.randomVec.x,r.randomVec.y),gr.normalize(),gr.multiplyScalar(this.preEndAnimationRatio),ds.addScaledVector(gr,.09*Math.sin(this.preEndAnimationRatio*25)),i.pos.x+=ds.x,i.pos.z+=ds.y),this.endAnimationRatio>0&&ae.result===RESULT.FAILED){const a=Math.floor(this.endAnimationRatio*this.animationTotalFrames),c=Math.min(a+1,this.animationTotalFrames-1),l=this.endAnimationRatio*this.animationTotalFrames-a;fs.fromArray(o.loseAnimationPositionArray,a*3),Ja.fromArray(o.loseAnimationPositionArray,c*3),fs.lerp(Ja,l),i.pos.copy(fs),ps.fromArray(o.loseAnimationOrientArray,a*4),Qa.fromArray(o.loseAnimationOrientArray,c*4),ps.slerp(Qa,l),i.orient.copy(ps)}}if(n>=tn){const o=n-tn,a=o%Dt-Ut,c=Math.floor(o/Dt)-Ut,l=hn.getTile(c,a),u=Math.max(0,Math.min(1,this.endSpawnAnimationRatioUnclamped-l.randomDelay));l.isOccupied||(l.activeRatio=u),i.showRatio=u,i.boardPos.set(c,a)}}if(ae.isResultAnimation&&ae.result===RESULT.PAUSE&&n>=tn){const o=n-tn,a=o%Dt-Ut,c=Math.floor(o/Dt)-Ut,l=hn.getTile(c,a);if(!l.isOccupied){const u=Math.max(0,Math.min(1,this.endSpawnAnimationRatioUnclamped-l.randomDelay));l.activeRatio=u,i.showRatio=u,i.boardPos.set(c,a)}}}for(let n=0;n<qt;n++){let i=this._blockRenderList[n];i.showRatio>0&&(i.pos.toArray(this._instancePosArray,n*3),i.orient.toArray(this._instanceOrientArray,n*4),this._instanceShowRatioArray[n]=i.showRatio,i.spinPivot.toArray(this._instanceSpinPivotArray,n*3),i.spinOrient.toArray(this._instanceSpinOrientArray,n*4))}for(let n in this._blocksMesh.geometry.attributes){let i=this._blocksMesh.geometry.attributes[n];i.isInstancedBufferAttribute&&(i.updateRange.count=t*i.updateRange.itemSize,i.needsUpdate=!0)}this._blocksMesh.geometry.instanceCount=t,this.container.position.y=-1*this.restartAnimationRatio,this._baseMesh.material.uniforms.u_yDisplacement.value=-1*this.restartAnimationRatio}}const Vn=new Ap,io={type:"change"},ms={type:"start"},ro={type:"end"};class Cp extends $n{constructor(e,t){super(),t===void 0&&console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.'),t===document&&console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new W,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minPolarAngle=Math.PI*.2,this.maxPolarAngle=Math.PI*.45,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.15,this.enableZoom=!1,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=.5,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Jn.ROTATE,MIDDLE:Jn.DOLLY,RIGHT:Jn.PAN},this.touches={ONE:Qn.ROTATE,TWO:Qn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.scale=1,this._domElementKeyEvents=null,this.getPolarAngle=function(){return a.phi},this.getAzimuthalAngle=function(){return a.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(D){D.addEventListener("keydown",Nt),this._domElementKeyEvents=D},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.scale=1,n.object.updateProjectionMatrix(),n.dispatchEvent(io),n.update(),r=i.NONE},this.update=function(){const D=new W,J=new on().setFromUnitVectors(e.up,new W(0,1,0)),Z=J.clone().invert(),Te=new W,Re=new on,we=2*Math.PI;return function(){const Pe=n.object.position;D.copy(Pe).sub(n.target),D.applyQuaternion(J),a.setFromVector3(D),n.autoRotate&&r===i.NONE&&x(N()),n.enableDamping?(a.theta+=c.theta*n.dampingFactor,a.phi+=c.phi*n.dampingFactor):(a.theta+=c.theta,a.phi+=c.phi);let ze=n.minAzimuthAngle,Be=n.maxAzimuthAngle;isFinite(ze)&&isFinite(Be)&&(ze<-Math.PI?ze+=we:ze>Math.PI&&(ze-=we),Be<-Math.PI?Be+=we:Be>Math.PI&&(Be-=we),ze<=Be?a.theta=Math.max(ze,Math.min(Be,a.theta)):a.theta=a.theta>(ze+Be)/2?Math.max(ze,a.theta):Math.min(Be,a.theta)),a.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,a.phi)),a.makeSafe();let qe=n.enableDamping?(n.scale-1)*n.dampingFactor+1:n.scale;return a.radius*=qe,a.radius=Math.max(n.minDistance,Math.min(n.maxDistance,a.radius)),n.enableDamping===!0?n.target.addScaledVector(l,n.dampingFactor):n.target.add(l),D.setFromSpherical(a),D.applyQuaternion(Z),Pe.copy(n.target).add(D),n.object.lookAt(n.target),n.enableDamping===!0?(c.theta*=1-n.dampingFactor,c.phi*=1-n.dampingFactor,l.multiplyScalar(1-n.dampingFactor)):(c.set(0,0,0),l.set(0,0,0)),n.scale=n.scale/qe,u||Te.distanceToSquared(n.object.position)>o||8*(1-Re.dot(n.object.quaternion))>o?(n.dispatchEvent(io),Te.copy(n.object.position),Re.copy(n.object.quaternion),u=!1,!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",S),n.domElement.removeEventListener("pointerdown",Oe),n.domElement.removeEventListener("pointercancel",dt),n.domElement.removeEventListener("wheel",Ke),n.domElement.removeEventListener("pointermove",lt),n.domElement.removeEventListener("pointerup",ct),n._domElementKeyEvents!==null&&n._domElementKeyEvents.removeEventListener("keydown",Nt)};const n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let r=i.NONE;const o=1e-6,a=new qa,c=new qa,l=new W;let u=!1;const h=new Ge,f=new Ge,g=new Ge,v=new Ge,m=new Ge,d=new Ge,M=new Ge,C=new Ge,w=new Ge,T=[],E={};function N(){return 2*Math.PI/60/60*n.autoRotateSpeed}function B(){return Math.pow(.95,n.zoomSpeed)}function x(D){c.theta-=D}function L(D){c.phi-=D}const H=function(){const D=new W;return function(Z,Te){D.setFromMatrixColumn(Te,0),D.multiplyScalar(-Z),l.add(D)}}(),ne=function(){const D=new W;return function(Z,Te){n.screenSpacePanning===!0?D.setFromMatrixColumn(Te,1):(D.setFromMatrixColumn(Te,0),D.crossVectors(n.object.up,D)),D.multiplyScalar(Z),l.add(D)}}(),oe=function(){const D=new W;return function(Z,Te){const Re=n.domElement;if(n.object.isPerspectiveCamera){const we=n.object.position;D.copy(we).sub(n.target);let Ee=D.length();Ee*=Math.tan(n.object.fov/2*Math.PI/180),H(2*Z*Ee/Re.clientHeight,n.object.matrix),ne(2*Te*Ee/Re.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(H(Z*(n.object.right-n.object.left)/n.object.zoom/Re.clientWidth,n.object.matrix),ne(Te*(n.object.top-n.object.bottom)/n.object.zoom/Re.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function z(D){n.object.isPerspectiveCamera?n.scale/=D:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom*D)),n.object.updateProjectionMatrix(),u=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function F(D){n.object.isPerspectiveCamera?n.scale*=D:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/D)),n.object.updateProjectionMatrix(),u=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function ee(D){h.set(D.clientX,D.clientY)}function le(D){M.set(D.clientX,D.clientY)}function he(D){v.set(D.clientX,D.clientY)}function te(D){f.set(D.clientX,D.clientY),g.subVectors(f,h).multiplyScalar(n.rotateSpeed);const J=n.domElement;x(2*Math.PI*g.x/J.clientHeight),L(2*Math.PI*g.y/J.clientHeight),h.copy(f),n.update()}function _e(D){C.set(D.clientX,D.clientY),w.subVectors(C,M),w.y>0?z(B()):w.y<0&&F(B()),M.copy(C),n.update()}function re(D){m.set(D.clientX,D.clientY),d.subVectors(m,v).multiplyScalar(n.panSpeed),oe(d.x,d.y),v.copy(m),n.update()}function Y(D){D.deltaY<0?F(B()):D.deltaY>0&&z(B()),n.update()}function q(D){let J=!1;switch(D.code){case n.keys.UP:oe(0,n.keyPanSpeed),J=!0;break;case n.keys.BOTTOM:oe(0,-n.keyPanSpeed),J=!0;break;case n.keys.LEFT:oe(n.keyPanSpeed,0),J=!0;break;case n.keys.RIGHT:oe(-n.keyPanSpeed,0),J=!0;break}J&&(D.preventDefault(),n.update())}function ce(){if(T.length===1)h.set(T[0].pageX,T[0].pageY);else{const D=.5*(T[0].pageX+T[1].pageX),J=.5*(T[0].pageY+T[1].pageY);h.set(D,J)}}function ge(){if(T.length===1)v.set(T[0].pageX,T[0].pageY);else{const D=.5*(T[0].pageX+T[1].pageX),J=.5*(T[0].pageY+T[1].pageY);v.set(D,J)}}function Me(){const D=T[0].pageX-T[1].pageX,J=T[0].pageY-T[1].pageY,Z=Math.sqrt(D*D+J*J);M.set(0,Z)}function X(){n.enableZoom&&Me(),n.enablePan&&ge()}function He(){n.enableZoom&&Me(),n.enableRotate&&ce()}function be(D){if(T.length==1)f.set(D.pageX,D.pageY);else{const Z=ye(D),Te=.5*(D.pageX+Z.x),Re=.5*(D.pageY+Z.y);f.set(Te,Re)}g.subVectors(f,h).multiplyScalar(n.rotateSpeed);const J=n.domElement;x(2*Math.PI*g.x/J.clientHeight),L(2*Math.PI*g.y/J.clientHeight),h.copy(f)}function Ue(D){if(T.length===1)m.set(D.pageX,D.pageY);else{const J=ye(D),Z=.5*(D.pageX+J.x),Te=.5*(D.pageY+J.y);m.set(Z,Te)}d.subVectors(m,v).multiplyScalar(n.panSpeed),oe(d.x,d.y),v.copy(m)}function Le(D){const J=ye(D),Z=D.pageX-J.x,Te=D.pageY-J.y,Re=Math.sqrt(Z*Z+Te*Te);C.set(0,Re),w.set(0,Math.pow(C.y/M.y,n.zoomSpeed)),z(w.y),M.copy(C)}function $e(D){n.enableZoom&&Le(D),n.enablePan&&Ue(D)}function We(D){n.enableZoom&&Le(D),n.enableRotate&&be(D)}function Oe(D){n.enabled!==!1&&(T.length===0&&(n.domElement.setPointerCapture(D.pointerId),n.domElement.addEventListener("pointermove",lt),n.domElement.addEventListener("pointerup",ct)),K(D),D.pointerType==="touch"?Ct(D):Et(D))}function lt(D){n.enabled!==!1&&(D.pointerType==="touch"?A(D):at(D))}function ct(D){fe(D),T.length===0&&(n.domElement.releasePointerCapture(D.pointerId),n.domElement.removeEventListener("pointermove",lt),n.domElement.removeEventListener("pointerup",ct)),n.dispatchEvent(ro),r=i.NONE}function dt(D){fe(D)}function Et(D){let J;switch(D.button){case 0:J=n.mouseButtons.LEFT;break;case 1:J=n.mouseButtons.MIDDLE;break;case 2:J=n.mouseButtons.RIGHT;break;default:J=-1}switch(J){case Jn.DOLLY:if(n.enableZoom===!1)return;le(D),r=i.DOLLY;break;case Jn.ROTATE:if(D.ctrlKey||D.metaKey||D.shiftKey){if(n.enablePan===!1)return;he(D),r=i.PAN}else{if(n.enableRotate===!1)return;ee(D),r=i.ROTATE}break;case Jn.PAN:if(D.ctrlKey||D.metaKey||D.shiftKey){if(n.enableRotate===!1)return;ee(D),r=i.ROTATE}else{if(n.enablePan===!1)return;he(D),r=i.PAN}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ms)}function at(D){if(n.enabled!==!1)switch(r){case i.ROTATE:if(n.enableRotate===!1)return;te(D);break;case i.DOLLY:if(n.enableZoom===!1)return;_e(D);break;case i.PAN:if(n.enablePan===!1)return;re(D);break}}function Ke(D){n.enabled===!1||n.enableZoom===!1||r!==i.NONE||(n.dispatchEvent(ms),Y(D),n.dispatchEvent(ro))}function Nt(D){n.enabled===!1||n.enablePan===!1||q(D)}function Ct(D){switch(xe(D),T.length){case 1:switch(n.touches.ONE){case Qn.ROTATE:if(n.enableRotate===!1)return;ce(),r=i.TOUCH_ROTATE;break;case Qn.PAN:if(n.enablePan===!1)return;ge(),r=i.TOUCH_PAN;break;default:r=i.NONE}break;case 2:switch(n.touches.TWO){case Qn.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;X(),r=i.TOUCH_DOLLY_PAN;break;case Qn.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;He(),r=i.TOUCH_DOLLY_ROTATE;break;default:r=i.NONE}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ms)}function A(D){switch(xe(D),r){case i.TOUCH_ROTATE:if(n.enableRotate===!1)return;be(D),n.update();break;case i.TOUCH_PAN:if(n.enablePan===!1)return;Ue(D),n.update();break;case i.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;$e(D),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;We(D),n.update();break;default:r=i.NONE}}function S(D){n.enabled}function K(D){T.push(D)}function fe(D){delete E[D.pointerId];for(let J=0;J<T.length;J++)if(T[J].pointerId==D.pointerId){T.splice(J,1);return}}function xe(D){let J=E[D.pointerId];J===void 0&&(J=new Ge,E[D.pointerId]=J),J.set(D.pageX,D.pageY)}function ye(D){const J=D.pointerId===T[0].pointerId?T[1]:T[0];return E[J.pointerId]}n.domElement.addEventListener("contextmenu",S),n.domElement.addEventListener("pointerdown",Oe),n.domElement.addEventListener("pointercancel",dt),n.domElement.addEventListener("wheel",Ke,{passive:!1}),this.update()}}class Lp{constructor(){$(this,"status","not-started")}preload(e,t){gt.override(e),gt.WEBGL_OPTS.canvas=ae.canvas=e.canvas,ae.orbitTarget=e.orbitTarget,Vn.preload(),Mr.preInit(),ae.renderer=new Lo(gt.WEBGL_OPTS),xi.start(t)}init(){ae.renderer.shadowMap.enabled=!0,ae.renderer.shadowMap.type=As,ae.scene=new zf,ae.camera=new Ds(-1,1,1,-1,1,60),ae.camera.zoom=150,ae.scene.add(ae.camera),ae.camera.position.fromArray(gt.DEFAULT_POSITION),ae.orbitCamera=ae.camera.clone();let e=ae.orbitControls=new Cp(ae.orbitCamera,ae.orbitTarget);e.enableDamping=!0,e.enableDamping=!0,e.target0.fromArray(gt.DEFAULT_LOOKAT_POSITION),e.reset(),Zt.init(),Vn.init(),Bi.init(),ae.scene.add(Vn.container),ae.scene.add(Bi.container)}setSize(e,t){ae.viewportWidth=e,ae.viewportHeight=t,ae.viewportResolution.set(e,window.innerHeight);let n=e*gt.DPR,i=t*gt.DPR;if(gt.USE_PIXEL_LIMIT===!0&&n*i>gt.MAX_PIXEL_COUNT){let r=n/i;i=Math.sqrt(gt.MAX_PIXEL_COUNT/r),n=Math.ceil(i*r),i=Math.ceil(i)}ae.width=n,ae.height=i,ae.resolution.set(n,i),ae.camera.aspect=n/i,ae.camera.updateProjectionMatrix(),ae.renderer.setSize(n,i),ae.canvas.style.width=`${e}px`,ae.canvas.style.height=`${t}px`,ae.camera.top=i/2,ae.camera.bottom=-i/2,ae.camera.left=-n/2,ae.camera.right=n/2,ae.camera.updateProjectionMatrix()}render(e){ae.time+=e,ae.deltaTime=e,ae.sharedUniforms.u_time.value=ae.time,ae.sharedUniforms.u_deltaTime.value=e,Mr.update(e),Zt.update(e);let t=ae.camera;ae.orbitControls.update(),ae.orbitCamera.updateMatrix(),ae.orbitCamera.matrix.decompose(t.position,t.quaternion,t.scale),t.matrix.compose(t.position,t.quaternion,t.scale),Vn.update(e),Bi.update(e),ae.renderer.setClearColor(ae.bgColor,1),ae.renderer.render(ae.scene,ae.camera)}setResult(e){}}window[gt.APP_ID]=new Lp;window.properties=ae;window.STATUS=je;window.RESULT=Sn;
