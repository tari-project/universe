var Ho=Object.defineProperty;var Vo=(s,e,t)=>e in s?Ho(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var J=(s,e,t)=>(Vo(s,typeof e!="symbol"?e+"":e,t),t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();/**
 * @license
 * Copyright 2010-2022 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Rs="148",ei={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},ti={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Wo=0,Fs=1,Xo=2,Ls=1,qo=2,zi=3,jn=0,Jt=1,Ds=2,Ji=3,Fn=0,Mi=1,Os=2,zs=3,Bs=4,Yo=5,_i=100,Zo=101,jo=102,ks=103,Gs=104,$o=200,Ko=201,Jo=202,Qo=203,lo=204,co=205,el=206,tl=207,nl=208,il=209,rl=210,sl=0,al=1,ol=2,vs=3,ll=4,cl=5,ul=6,hl=7,uo=0,dl=1,fl=2,En=0,pl=1,ml=2,gl=3,_l=4,xl=5,ho=300,bi=301,wi=302,Ss=303,Ms=304,Cr=306,Er=1e3,qt=1001,ys=1002,wt=1003,Hs=1004,Nr=1005,Tt=1006,vl=1007,Ti=1008,Sl=1008,$n=1009,Ml=1010,yl=1011,fo=1012,bl=1013,Xn=1014,an=1015,Tn=1016,wl=1017,Tl=1018,yi=1020,El=1021,Al=1022,Yt=1023,Cl=1024,Rl=1025,qn=1026,Ei=1027,po=1028,Ll=1029,Dl=1030,Pl=1031,Il=1033,Ur=33776,Fr=33777,Or=33778,zr=33779,Vs=35840,Ws=35841,Xs=35842,qs=35843,Nl=36196,Ys=37492,Zs=37496,js=37808,$s=37809,Ks=37810,Js=37811,Qs=37812,ea=37813,ta=37814,na=37815,ia=37816,ra=37817,sa=37818,aa=37819,oa=37820,la=37821,ca=36492,An=3e3,st=3001,Ul=3200,Fl=3201,Ol=0,zl=1,hn="srgb",Hi="srgb-linear",Br=7680,Bl=519,ua=35044,On=35048,ha="300 es",bs=1035;class Jn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const i=this._listeners[e];if(i!==void 0){const r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}}const Rt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],kr=Math.PI/180,da=180/Math.PI;function Wi(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Rt[s&255]+Rt[s>>8&255]+Rt[s>>16&255]+Rt[s>>24&255]+"-"+Rt[e&255]+Rt[e>>8&255]+"-"+Rt[e>>16&15|64]+Rt[e>>24&255]+"-"+Rt[t&63|128]+Rt[t>>8&255]+"-"+Rt[t>>16&255]+Rt[t>>24&255]+Rt[n&255]+Rt[n>>8&255]+Rt[n>>16&255]+Rt[n>>24&255]).toLowerCase()}function Nt(s,e,t){return Math.max(e,Math.min(t,s))}function kl(s,e){return(s%e+e)%e}function Gr(s,e,t){return(1-t)*s+t*e}function fa(s){return(s&s-1)===0&&s!==0}function ws(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Qi(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function kt(s,e){switch(e.constructor){case Float32Array:return s;case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}class Ge{constructor(e=0,t=0){Ge.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Zt{constructor(){Zt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1]}set(e,t,n,i,r,o,a,c,l){const u=this.elements;return u[0]=e,u[1]=i,u[2]=a,u[3]=t,u[4]=r,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],d=n[2],g=n[5],x=n[8],m=i[0],f=i[3],M=i[6],C=i[1],w=i[4],T=i[7],E=i[2],N=i[5],B=i[8];return r[0]=o*m+a*C+c*E,r[3]=o*f+a*w+c*N,r[6]=o*M+a*T+c*B,r[1]=l*m+u*C+h*E,r[4]=l*f+u*w+h*N,r[7]=l*M+u*T+h*B,r[2]=d*m+g*C+x*E,r[5]=d*f+g*w+x*N,r[8]=d*M+g*T+x*B,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-n*r*u+n*a*c+i*r*l-i*o*c}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,d=a*c-u*r,g=l*r-o*c,x=t*h+n*d+i*g;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const m=1/x;return e[0]=h*m,e[1]=(i*l-u*n)*m,e[2]=(a*n-i*o)*m,e[3]=d*m,e[4]=(u*t-i*c)*m,e[5]=(i*r-a*t)*m,e[6]=g*m,e[7]=(n*c-l*t)*m,e[8]=(o*t-n*r)*m,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-i*l,i*c,-i*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Hr.makeScale(e,t)),this}rotate(e){return this.premultiply(Hr.makeRotation(-e)),this}translate(e,t){return this.premultiply(Hr.makeTranslation(e,t)),this}makeTranslation(e,t){return this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Hr=new Zt;function mo(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function Ar(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Yn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function wr(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}const Vr={[hn]:{[Hi]:Yn},[Hi]:{[hn]:wr}},Dt={legacyMode:!0,get workingColorSpace(){return Hi},set workingColorSpace(s){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(s,e,t){if(this.legacyMode||e===t||!e||!t)return s;if(Vr[e]&&Vr[e][t]!==void 0){const n=Vr[e][t];return s.r=n(s.r),s.g=n(s.g),s.b=n(s.b),s}throw new Error("Unsupported color space conversion.")},fromWorkingColorSpace:function(s,e){return this.convert(s,this.workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this.workingColorSpace)}},go={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},_t={r:0,g:0,b:0},en={h:0,s:0,l:0},er={h:0,s:0,l:0};function Wr(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}function tr(s,e){return e.r=s.r,e.g=s.g,e.b=s.b,e}class je{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,t===void 0&&n===void 0?this.set(e):this.setRGB(e,t,n)}set(e){return e&&e.isColor?this.copy(e):typeof e=="number"?this.setHex(e):typeof e=="string"&&this.setStyle(e),this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=hn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Dt.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=Dt.workingColorSpace){return this.r=e,this.g=t,this.b=n,Dt.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=Dt.workingColorSpace){if(e=kl(e,1),t=Nt(t,0,1),n=Nt(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Wr(o,r,e+1/3),this.g=Wr(o,r,e),this.b=Wr(o,r,e-1/3)}return Dt.toWorkingColorSpace(this,i),this}setStyle(e,t=hn){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^((?:rgb|hsl)a?)\(([^\)]*)\)/.exec(e)){let r;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(255,parseInt(r[1],10))/255,this.g=Math.min(255,parseInt(r[2],10))/255,this.b=Math.min(255,parseInt(r[3],10))/255,Dt.toWorkingColorSpace(this,t),n(r[4]),this;if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(100,parseInt(r[1],10))/100,this.g=Math.min(100,parseInt(r[2],10))/100,this.b=Math.min(100,parseInt(r[3],10))/100,Dt.toWorkingColorSpace(this,t),n(r[4]),this;break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a)){const c=parseFloat(r[1])/360,l=parseFloat(r[2])/100,u=parseFloat(r[3])/100;return n(r[4]),this.setHSL(c,l,u,t)}break}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],o=r.length;if(o===3)return this.r=parseInt(r.charAt(0)+r.charAt(0),16)/255,this.g=parseInt(r.charAt(1)+r.charAt(1),16)/255,this.b=parseInt(r.charAt(2)+r.charAt(2),16)/255,Dt.toWorkingColorSpace(this,t),this;if(o===6)return this.r=parseInt(r.charAt(0)+r.charAt(1),16)/255,this.g=parseInt(r.charAt(2)+r.charAt(3),16)/255,this.b=parseInt(r.charAt(4)+r.charAt(5),16)/255,Dt.toWorkingColorSpace(this,t),this}return e&&e.length>0?this.setColorName(e,t):this}setColorName(e,t=hn){const n=go[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Yn(e.r),this.g=Yn(e.g),this.b=Yn(e.b),this}copyLinearToSRGB(e){return this.r=wr(e.r),this.g=wr(e.g),this.b=wr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=hn){return Dt.fromWorkingColorSpace(tr(this,_t),e),Nt(_t.r*255,0,255)<<16^Nt(_t.g*255,0,255)<<8^Nt(_t.b*255,0,255)<<0}getHexString(e=hn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Dt.workingColorSpace){Dt.fromWorkingColorSpace(tr(this,_t),t);const n=_t.r,i=_t.g,r=_t.b,o=Math.max(n,i,r),a=Math.min(n,i,r);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(i-r)/h+(i<r?6:0);break;case i:c=(r-n)/h+2;break;case r:c=(n-i)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=Dt.workingColorSpace){return Dt.fromWorkingColorSpace(tr(this,_t),t),e.r=_t.r,e.g=_t.g,e.b=_t.b,e}getStyle(e=hn){return Dt.fromWorkingColorSpace(tr(this,_t),e),e!==hn?`color(${e} ${_t.r} ${_t.g} ${_t.b})`:`rgb(${_t.r*255|0},${_t.g*255|0},${_t.b*255|0})`}offsetHSL(e,t,n){return this.getHSL(en),en.h+=e,en.s+=t,en.l+=n,this.setHSL(en.h,en.s,en.l),this}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(en),e.getHSL(er);const n=Gr(en.h,er.h,t),i=Gr(en.s,er.s,t),r=Gr(en.l,er.l,t);return this.setHSL(n,i,r),this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}je.NAMES=go;let ni;class _o{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ni===void 0&&(ni=Ar("canvas")),ni.width=e.width,ni.height=e.height;const n=ni.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=ni}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Ar("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=Yn(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Yn(t[n]/255)*255):t[n]=Yn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}class xo{constructor(e=null){this.isSource=!0,this.uuid=Wi(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?r.push(Xr(i[o].image)):r.push(Xr(i[o]))}else r=Xr(i);n.url=r}return t||(e.images[this.uuid]=n),n}}function Xr(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?_o.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Gl=0;class Ut extends Jn{constructor(e=Ut.DEFAULT_IMAGE,t=Ut.DEFAULT_MAPPING,n=qt,i=qt,r=Tt,o=Ti,a=Yt,c=$n,l=Ut.DEFAULT_ANISOTROPY,u=An){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Gl++}),this.uuid=Wi(),this.name="",this.source=new xo(e),this.mipmaps=[],this.mapping=t,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new Ge(0,0),this.repeat=new Ge(1,1),this.center=new Ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Zt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.encoding=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.encoding=e.encoding,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.5,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,type:this.type,encoding:this.encoding,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ho)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Er:e.x=e.x-Math.floor(e.x);break;case qt:e.x=e.x<0?0:1;break;case ys:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Er:e.y=e.y-Math.floor(e.y);break;case qt:e.y=e.y<0?0:1;break;case ys:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}Ut.DEFAULT_IMAGE=null;Ut.DEFAULT_MAPPING=ho;Ut.DEFAULT_ANISOTROPY=1;class Et{constructor(e=0,t=0,n=0,i=1){Et.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const c=e.elements,l=c[0],u=c[4],h=c[8],d=c[1],g=c[5],x=c[9],m=c[2],f=c[6],M=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-m)<.01&&Math.abs(x-f)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+m)<.1&&Math.abs(x+f)<.1&&Math.abs(l+g+M-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const w=(l+1)/2,T=(g+1)/2,E=(M+1)/2,N=(u+d)/4,B=(h+m)/4,v=(x+f)/4;return w>T&&w>E?w<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(w),i=N/n,r=B/n):T>E?T<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(T),n=N/i,r=v/i):E<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(E),n=B/r,i=v/r),this.set(n,i,r,t),this}let C=Math.sqrt((f-x)*(f-x)+(h-m)*(h-m)+(d-u)*(d-u));return Math.abs(C)<.001&&(C=1),this.x=(f-x)/C,this.y=(h-m)/C,this.z=(d-u)/C,this.w=Math.acos((l+g+M-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Kn extends Jn{constructor(e=1,t=1,n={}){super(),this.isWebGLRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Et(0,0,e,t),this.scissorTest=!1,this.viewport=new Et(0,0,e,t);const i={width:e,height:t,depth:1};this.texture=new Ut(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.encoding),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps!==void 0?n.generateMipmaps:!1,this.texture.internalFormat=n.internalFormat!==void 0?n.internalFormat:null,this.texture.minFilter=n.minFilter!==void 0?n.minFilter:Tt,this.depthBuffer=n.depthBuffer!==void 0?n.depthBuffer:!0,this.stencilBuffer=n.stencilBuffer!==void 0?n.stencilBuffer:!1,this.depthTexture=n.depthTexture!==void 0?n.depthTexture:null,this.samples=n.samples!==void 0?n.samples:0}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new xo(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class vo extends Ut{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=wt,this.minFilter=wt,this.wrapR=qt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Hl extends Ut{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=wt,this.minFilter=wt,this.wrapR=qt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class cn{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,a){let c=n[i+0],l=n[i+1],u=n[i+2],h=n[i+3];const d=r[o+0],g=r[o+1],x=r[o+2],m=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=d,e[t+1]=g,e[t+2]=x,e[t+3]=m;return}if(h!==m||c!==d||l!==g||u!==x){let f=1-a;const M=c*d+l*g+u*x+h*m,C=M>=0?1:-1,w=1-M*M;if(w>Number.EPSILON){const E=Math.sqrt(w),N=Math.atan2(E,M*C);f=Math.sin(f*N)/E,a=Math.sin(a*N)/E}const T=a*C;if(c=c*f+d*T,l=l*f+g*T,u=u*f+x*T,h=h*f+m*T,f===1-a){const E=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=E,l*=E,u*=E,h*=E}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,r,o){const a=n[i],c=n[i+1],l=n[i+2],u=n[i+3],h=r[o],d=r[o+1],g=r[o+2],x=r[o+3];return e[t]=a*x+u*h+c*g-l*d,e[t+1]=c*x+u*d+l*h-a*g,e[t+2]=l*x+u*g+a*d-c*h,e[t+3]=u*x-a*h-c*d-l*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t){const n=e._x,i=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(i/2),h=a(r/2),d=c(n/2),g=c(i/2),x=c(r/2);switch(o){case"XYZ":this._x=d*u*h+l*g*x,this._y=l*g*h-d*u*x,this._z=l*u*x+d*g*h,this._w=l*u*h-d*g*x;break;case"YXZ":this._x=d*u*h+l*g*x,this._y=l*g*h-d*u*x,this._z=l*u*x-d*g*h,this._w=l*u*h+d*g*x;break;case"ZXY":this._x=d*u*h-l*g*x,this._y=l*g*h+d*u*x,this._z=l*u*x+d*g*h,this._w=l*u*h-d*g*x;break;case"ZYX":this._x=d*u*h-l*g*x,this._y=l*g*h+d*u*x,this._z=l*u*x-d*g*h,this._w=l*u*h+d*g*x;break;case"YZX":this._x=d*u*h+l*g*x,this._y=l*g*h+d*u*x,this._z=l*u*x-d*g*h,this._w=l*u*h-d*g*x;break;case"XZY":this._x=d*u*h-l*g*x,this._y=l*g*h-d*u*x,this._z=l*u*x+d*g*h,this._w=l*u*h+d*g*x;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t!==!1&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],d=n+a+h;if(d>0){const g=.5/Math.sqrt(d+1);this._w=.25/g,this._x=(u-c)*g,this._y=(r-l)*g,this._z=(o-i)*g}else if(n>a&&n>h){const g=2*Math.sqrt(1+n-a-h);this._w=(u-c)/g,this._x=.25*g,this._y=(i+o)/g,this._z=(r+l)/g}else if(a>h){const g=2*Math.sqrt(1+a-n-h);this._w=(r-l)/g,this._x=(i+o)/g,this._y=.25*g,this._z=(c+u)/g}else{const g=2*Math.sqrt(1+h-n-a);this._w=(o-i)/g,this._x=(r+l)/g,this._y=(c+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Nt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+o*a+i*l-r*c,this._y=i*u+o*c+r*a-n*l,this._z=r*u+o*l+n*c-i*a,this._w=o*u-n*a-i*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,r=this._z,o=this._w;let a=o*e._w+n*e._x+i*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const g=1-t;return this._w=g*o+t*this._w,this._x=g*n+t*this._x,this._y=g*i+t*this._y,this._z=g*r+t*this._z,this.normalize(),this._onChangeCallback(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-t)*u)/l,d=Math.sin(t*u)/l;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=i*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(r),n*Math.cos(r),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class W{constructor(e=0,t=0,n=0){W.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(pa.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(pa.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=c*t+o*i-a*n,u=c*n+a*t-r*i,h=c*i+r*n-o*t,d=-r*t-o*n-a*i;return this.x=l*c+d*-r+u*-a-h*-o,this.y=u*c+d*-o+h*-r-l*-a,this.z=h*c+d*-a+l*-o-u*-r,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=i*c-r*a,this.y=r*o-n*c,this.z=n*a-i*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return qr.copy(this).projectOnVector(e),this.sub(qr)}reflect(e){return this.sub(qr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Nt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const qr=new W,pa=new cn;class Xi{constructor(e=new W(1/0,1/0,1/0),t=new W(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.length;c<l;c+=3){const u=e[c],h=e[c+1],d=e[c+2];u<t&&(t=u),h<n&&(n=h),d<i&&(i=d),u>r&&(r=u),h>o&&(o=h),d>a&&(a=d)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromBufferAttribute(e){let t=1/0,n=1/0,i=1/0,r=-1/0,o=-1/0,a=-1/0;for(let c=0,l=e.count;c<l;c++){const u=e.getX(c),h=e.getY(c),d=e.getZ(c);u<t&&(t=u),h<n&&(n=h),d<i&&(i=d),u>r&&(r=u),h>o&&(o=h),d>a&&(a=d)}return this.min.set(t,n,i),this.max.set(r,o,a),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=zn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0)if(t&&n.attributes!=null&&n.attributes.position!==void 0){const r=n.attributes.position;for(let o=0,a=r.count;o<a;o++)zn.fromBufferAttribute(r,o).applyMatrix4(e.matrixWorld),this.expandByPoint(zn)}else n.boundingBox===null&&n.computeBoundingBox(),Yr.copy(n.boundingBox),Yr.applyMatrix4(e.matrixWorld),this.union(Yr);const i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,zn),zn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Li),nr.subVectors(this.max,Li),ii.subVectors(e.a,Li),ri.subVectors(e.b,Li),si.subVectors(e.c,Li),Rn.subVectors(ri,ii),Ln.subVectors(si,ri),Bn.subVectors(ii,si);let t=[0,-Rn.z,Rn.y,0,-Ln.z,Ln.y,0,-Bn.z,Bn.y,Rn.z,0,-Rn.x,Ln.z,0,-Ln.x,Bn.z,0,-Bn.x,-Rn.y,Rn.x,0,-Ln.y,Ln.x,0,-Bn.y,Bn.x,0];return!Zr(t,ii,ri,si,nr)||(t=[1,0,0,0,1,0,0,0,1],!Zr(t,ii,ri,si,nr))?!1:(ir.crossVectors(Rn,Ln),t=[ir.x,ir.y,ir.z],Zr(t,ii,ri,si,nr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return zn.copy(e).clamp(this.min,this.max).sub(e).length()}getBoundingSphere(e){return this.getCenter(e.center),e.radius=this.getSize(zn).length()*.5,e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(gn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const gn=[new W,new W,new W,new W,new W,new W,new W,new W],zn=new W,Yr=new Xi,ii=new W,ri=new W,si=new W,Rn=new W,Ln=new W,Bn=new W,Li=new W,nr=new W,ir=new W,kn=new W;function Zr(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){kn.fromArray(s,r);const a=i.x*Math.abs(kn.x)+i.y*Math.abs(kn.y)+i.z*Math.abs(kn.z),c=e.dot(kn),l=t.dot(kn),u=n.dot(kn);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const Vl=new Xi,Di=new W,jr=new W;class Ps{constructor(e=new W,t=-1){this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Vl.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Di.subVectors(e,this.center);const t=Di.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Di,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(jr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Di.copy(e.center).add(jr)),this.expandByPoint(Di.copy(e.center).sub(jr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const _n=new W,$r=new W,rr=new W,Dn=new W,Kr=new W,sr=new W,Jr=new W;class Wl{constructor(e=new W,t=new W(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.direction).multiplyScalar(e).add(this.origin)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,_n)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.direction).multiplyScalar(n).add(this.origin)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=_n.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(_n.copy(this.direction).multiplyScalar(t).add(this.origin),_n.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){$r.copy(e).add(t).multiplyScalar(.5),rr.copy(t).sub(e).normalize(),Dn.copy(this.origin).sub($r);const r=e.distanceTo(t)*.5,o=-this.direction.dot(rr),a=Dn.dot(this.direction),c=-Dn.dot(rr),l=Dn.lengthSq(),u=Math.abs(1-o*o);let h,d,g,x;if(u>0)if(h=o*c-a,d=o*a-c,x=r*u,h>=0)if(d>=-x)if(d<=x){const m=1/u;h*=m,d*=m,g=h*(h+o*d+2*a)+d*(o*h+d+2*c)+l}else d=r,h=Math.max(0,-(o*d+a)),g=-h*h+d*(d+2*c)+l;else d=-r,h=Math.max(0,-(o*d+a)),g=-h*h+d*(d+2*c)+l;else d<=-x?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-c),r),g=-h*h+d*(d+2*c)+l):d<=x?(h=0,d=Math.min(Math.max(-r,-c),r),g=d*(d+2*c)+l):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-c),r),g=-h*h+d*(d+2*c)+l);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),g=-h*h+d*(d+2*c)+l;return n&&n.copy(this.direction).multiplyScalar(h).add(this.origin),i&&i.copy(rr).multiplyScalar(d).add($r),g}intersectSphere(e,t){_n.subVectors(e.center,this.origin);const n=_n.dot(this.direction),i=_n.dot(_n)-n*n,r=e.radius*e.radius;if(i>r)return null;const o=Math.sqrt(r-i),a=n-o,c=n+o;return a<0&&c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,i=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,i=(e.min.x-d.x)*l),u>=0?(r=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(r=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),h>=0?(a=(e.min.z-d.z)*h,c=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,c=(e.min.z-d.z)*h),n>c||a>i)||((a>n||n!==n)&&(n=a),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,_n)!==null}intersectTriangle(e,t,n,i,r){Kr.subVectors(t,e),sr.subVectors(n,e),Jr.crossVectors(Kr,sr);let o=this.direction.dot(Jr),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Dn.subVectors(this.origin,e);const c=a*this.direction.dot(sr.crossVectors(Dn,sr));if(c<0)return null;const l=a*this.direction.dot(Kr.cross(Dn));if(l<0||c+l>o)return null;const u=-a*Dn.dot(Jr);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class vt{constructor(){vt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}set(e,t,n,i,r,o,a,c,l,u,h,d,g,x,m,f){const M=this.elements;return M[0]=e,M[4]=t,M[8]=n,M[12]=i,M[1]=r,M[5]=o,M[9]=a,M[13]=c,M[2]=l,M[6]=u,M[10]=h,M[14]=d,M[3]=g,M[7]=x,M[11]=m,M[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new vt().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/ai.setFromMatrixColumn(e,0).length(),r=1/ai.setFromMatrixColumn(e,1).length(),o=1/ai.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){const d=o*u,g=o*h,x=a*u,m=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=g+x*l,t[5]=d-m*l,t[9]=-a*c,t[2]=m-d*l,t[6]=x+g*l,t[10]=o*c}else if(e.order==="YXZ"){const d=c*u,g=c*h,x=l*u,m=l*h;t[0]=d+m*a,t[4]=x*a-g,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=g*a-x,t[6]=m+d*a,t[10]=o*c}else if(e.order==="ZXY"){const d=c*u,g=c*h,x=l*u,m=l*h;t[0]=d-m*a,t[4]=-o*h,t[8]=x+g*a,t[1]=g+x*a,t[5]=o*u,t[9]=m-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){const d=o*u,g=o*h,x=a*u,m=a*h;t[0]=c*u,t[4]=x*l-g,t[8]=d*l+m,t[1]=c*h,t[5]=m*l+d,t[9]=g*l-x,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){const d=o*c,g=o*l,x=a*c,m=a*l;t[0]=c*u,t[4]=m-d*h,t[8]=x*h+g,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=g*h+x,t[10]=d-m*h}else if(e.order==="XZY"){const d=o*c,g=o*l,x=a*c,m=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=d*h+m,t[5]=o*u,t[9]=g*h-x,t[2]=x*h-g,t[6]=a*u,t[10]=m*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Xl,e,ql)}lookAt(e,t,n){const i=this.elements;return Gt.subVectors(e,t),Gt.lengthSq()===0&&(Gt.z=1),Gt.normalize(),Pn.crossVectors(n,Gt),Pn.lengthSq()===0&&(Math.abs(n.z)===1?Gt.x+=1e-4:Gt.z+=1e-4,Gt.normalize(),Pn.crossVectors(n,Gt)),Pn.normalize(),ar.crossVectors(Gt,Pn),i[0]=Pn.x,i[4]=ar.x,i[8]=Gt.x,i[1]=Pn.y,i[5]=ar.y,i[9]=Gt.y,i[2]=Pn.z,i[6]=ar.z,i[10]=Gt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],d=n[9],g=n[13],x=n[2],m=n[6],f=n[10],M=n[14],C=n[3],w=n[7],T=n[11],E=n[15],N=i[0],B=i[4],v=i[8],R=i[12],H=i[1],ne=i[5],ae=i[9],z=i[13],U=i[2],ee=i[6],oe=i[10],ue=i[14],te=i[3],ge=i[7],re=i[11],Z=i[15];return r[0]=o*N+a*H+c*U+l*te,r[4]=o*B+a*ne+c*ee+l*ge,r[8]=o*v+a*ae+c*oe+l*re,r[12]=o*R+a*z+c*ue+l*Z,r[1]=u*N+h*H+d*U+g*te,r[5]=u*B+h*ne+d*ee+g*ge,r[9]=u*v+h*ae+d*oe+g*re,r[13]=u*R+h*z+d*ue+g*Z,r[2]=x*N+m*H+f*U+M*te,r[6]=x*B+m*ne+f*ee+M*ge,r[10]=x*v+m*ae+f*oe+M*re,r[14]=x*R+m*z+f*ue+M*Z,r[3]=C*N+w*H+T*U+E*te,r[7]=C*B+w*ne+T*ee+E*ge,r[11]=C*v+w*ae+T*oe+E*re,r[15]=C*R+w*z+T*ue+E*Z,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],d=e[10],g=e[14],x=e[3],m=e[7],f=e[11],M=e[15];return x*(+r*c*h-i*l*h-r*a*d+n*l*d+i*a*g-n*c*g)+m*(+t*c*g-t*l*d+r*o*d-i*o*g+i*l*u-r*c*u)+f*(+t*l*h-t*a*g-r*o*h+n*o*g+r*a*u-n*l*u)+M*(-i*a*u-t*c*h+t*a*d+i*o*h-n*o*d+n*c*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],d=e[10],g=e[11],x=e[12],m=e[13],f=e[14],M=e[15],C=h*f*l-m*d*l+m*c*g-a*f*g-h*c*M+a*d*M,w=x*d*l-u*f*l-x*c*g+o*f*g+u*c*M-o*d*M,T=u*m*l-x*h*l+x*a*g-o*m*g-u*a*M+o*h*M,E=x*h*c-u*m*c-x*a*d+o*m*d+u*a*f-o*h*f,N=t*C+n*w+i*T+r*E;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/N;return e[0]=C*B,e[1]=(m*d*r-h*f*r-m*i*g+n*f*g+h*i*M-n*d*M)*B,e[2]=(a*f*r-m*c*r+m*i*l-n*f*l-a*i*M+n*c*M)*B,e[3]=(h*c*r-a*d*r-h*i*l+n*d*l+a*i*g-n*c*g)*B,e[4]=w*B,e[5]=(u*f*r-x*d*r+x*i*g-t*f*g-u*i*M+t*d*M)*B,e[6]=(x*c*r-o*f*r-x*i*l+t*f*l+o*i*M-t*c*M)*B,e[7]=(o*d*r-u*c*r+u*i*l-t*d*l-o*i*g+t*c*g)*B,e[8]=T*B,e[9]=(x*h*r-u*m*r-x*n*g+t*m*g+u*n*M-t*h*M)*B,e[10]=(o*m*r-x*a*r+x*n*l-t*m*l-o*n*M+t*a*M)*B,e[11]=(u*a*r-o*h*r-u*n*l+t*h*l+o*n*g-t*a*g)*B,e[12]=E*B,e[13]=(u*m*i-x*h*i+x*n*d-t*m*d-u*n*f+t*h*f)*B,e[14]=(x*a*i-o*m*i-x*n*c+t*m*c+o*n*f-t*a*f)*B,e[15]=(o*h*i-u*a*i+u*n*c-t*h*c-o*n*d+t*a*d)*B,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,u=r*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,u*a+n,u*c-i*o,0,l*c-i*a,u*c+i*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,u=o+o,h=a+a,d=r*l,g=r*u,x=r*h,m=o*u,f=o*h,M=a*h,C=c*l,w=c*u,T=c*h,E=n.x,N=n.y,B=n.z;return i[0]=(1-(m+M))*E,i[1]=(g+T)*E,i[2]=(x-w)*E,i[3]=0,i[4]=(g-T)*N,i[5]=(1-(d+M))*N,i[6]=(f+C)*N,i[7]=0,i[8]=(x+w)*B,i[9]=(f-C)*B,i[10]=(1-(d+m))*B,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let r=ai.set(i[0],i[1],i[2]).length();const o=ai.set(i[4],i[5],i[6]).length(),a=ai.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],tn.copy(this);const l=1/r,u=1/o,h=1/a;return tn.elements[0]*=l,tn.elements[1]*=l,tn.elements[2]*=l,tn.elements[4]*=u,tn.elements[5]*=u,tn.elements[6]*=u,tn.elements[8]*=h,tn.elements[9]*=h,tn.elements[10]*=h,t.setFromRotationMatrix(tn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,i,r,o){const a=this.elements,c=2*r/(t-e),l=2*r/(n-i),u=(t+e)/(t-e),h=(n+i)/(n-i),d=-(o+r)/(o-r),g=-2*o*r/(o-r);return a[0]=c,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=l,a[9]=h,a[13]=0,a[2]=0,a[6]=0,a[10]=d,a[14]=g,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,n,i,r,o){const a=this.elements,c=1/(t-e),l=1/(n-i),u=1/(o-r),h=(t+e)*c,d=(n+i)*l,g=(o+r)*u;return a[0]=2*c,a[4]=0,a[8]=0,a[12]=-h,a[1]=0,a[5]=2*l,a[9]=0,a[13]=-d,a[2]=0,a[6]=0,a[10]=-2*u,a[14]=-g,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const ai=new W,tn=new vt,Xl=new W(0,0,0),ql=new W(1,1,1),Pn=new W,ar=new W,Gt=new W,ma=new vt,ga=new cn;class qi{constructor(e=0,t=0,n=0,i=qi.DefaultOrder){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],o=i[4],a=i[8],c=i[1],l=i[5],u=i[9],h=i[2],d=i[6],g=i[10];switch(t){case"XYZ":this._y=Math.asin(Nt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Nt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,g),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Nt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,g),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Nt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,g),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Nt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,g));break;case"XZY":this._z=Math.asin(-Nt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,g),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ma.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ma,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ga.setFromEuler(this),this.setFromQuaternion(ga,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}toVector3(){console.error("THREE.Euler: .toVector3() has been removed. Use Vector3.setFromEuler() instead")}}qi.DefaultOrder="XYZ";qi.RotationOrders=["XYZ","YZX","ZXY","XZY","YXZ","ZYX"];class So{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Yl=0;const _a=new W,oi=new cn,xn=new vt,or=new W,Pi=new W,Zl=new W,jl=new cn,xa=new W(1,0,0),va=new W(0,1,0),Sa=new W(0,0,1),$l={type:"added"},Ma={type:"removed"};class At extends Jn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Yl++}),this.uuid=Wi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=At.DefaultUp.clone();const e=new W,t=new qi,n=new cn,i=new W(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new vt},normalMatrix:{value:new Zt}}),this.matrix=new vt,this.matrixWorld=new vt,this.matrixAutoUpdate=At.DefaultMatrixAutoUpdate,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=At.DefaultMatrixWorldAutoUpdate,this.layers=new So,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return oi.setFromAxisAngle(e,t),this.quaternion.multiply(oi),this}rotateOnWorldAxis(e,t){return oi.setFromAxisAngle(e,t),this.quaternion.premultiply(oi),this}rotateX(e){return this.rotateOnAxis(xa,e)}rotateY(e){return this.rotateOnAxis(va,e)}rotateZ(e){return this.rotateOnAxis(Sa,e)}translateOnAxis(e,t){return _a.copy(e).applyQuaternion(this.quaternion),this.position.add(_a.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(xa,e)}translateY(e){return this.translateOnAxis(va,e)}translateZ(e){return this.translateOnAxis(Sa,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(xn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?or.copy(e):or.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Pi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?xn.lookAt(Pi,or,this.up):xn.lookAt(or,Pi,this.up),this.quaternion.setFromRotationMatrix(xn),i&&(xn.extractRotation(i.matrixWorld),oi.setFromRotationMatrix(xn),this.quaternion.premultiply(oi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent($l)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ma)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){for(let e=0;e<this.children.length;e++){const t=this.children[e];t.parent=null,t.dispatchEvent(Ma)}return this.children.length=0,this}attach(e){return this.updateWorldMatrix(!0,!1),xn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),xn.multiply(e.parent.matrixWorld)),e.applyMatrix4(xn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t){let n=[];this[e]===t&&n.push(this);for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectsByProperty(e,t);o.length>0&&(n=n.concat(o))}return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Pi,e,Zl),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Pi,jl,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++){const r=t[n];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const i=this.children;for(let r=0,o=i.length;r<o;r++){const a=i[r];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.5,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const h=c[l];r(e.shapes,h)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));i.material=a}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];i.animations.push(r(e.animations,c))}}if(t){const a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),g=o(e.animations),x=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),g.length>0&&(n.animations=g),x.length>0&&(n.nodes=x)}return n.object=i,n;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}At.DefaultUp=new W(0,1,0);At.DefaultMatrixAutoUpdate=!0;At.DefaultMatrixWorldAutoUpdate=!0;const nn=new W,vn=new W,Qr=new W,Sn=new W,li=new W,ci=new W,ya=new W,es=new W,ts=new W,ns=new W;class bn{constructor(e=new W,t=new W,n=new W){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),nn.subVectors(e,t),i.cross(nn);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){nn.subVectors(i,t),vn.subVectors(n,t),Qr.subVectors(e,t);const o=nn.dot(nn),a=nn.dot(vn),c=nn.dot(Qr),l=vn.dot(vn),u=vn.dot(Qr),h=o*l-a*a;if(h===0)return r.set(-2,-1,-1);const d=1/h,g=(l*c-a*u)*d,x=(o*u-a*c)*d;return r.set(1-g-x,x,g)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Sn),Sn.x>=0&&Sn.y>=0&&Sn.x+Sn.y<=1}static getUV(e,t,n,i,r,o,a,c){return this.getBarycoord(e,t,n,i,Sn),c.set(0,0),c.addScaledVector(r,Sn.x),c.addScaledVector(o,Sn.y),c.addScaledVector(a,Sn.z),c}static isFrontFacing(e,t,n,i){return nn.subVectors(n,t),vn.subVectors(e,t),nn.cross(vn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return nn.subVectors(this.c,this.b),vn.subVectors(this.a,this.b),nn.cross(vn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return bn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return bn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,r){return bn.getUV(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return bn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return bn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let o,a;li.subVectors(i,n),ci.subVectors(r,n),es.subVectors(e,n);const c=li.dot(es),l=ci.dot(es);if(c<=0&&l<=0)return t.copy(n);ts.subVectors(e,i);const u=li.dot(ts),h=ci.dot(ts);if(u>=0&&h<=u)return t.copy(i);const d=c*h-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(n).addScaledVector(li,o);ns.subVectors(e,r);const g=li.dot(ns),x=ci.dot(ns);if(x>=0&&g<=x)return t.copy(r);const m=g*l-c*x;if(m<=0&&l>=0&&x<=0)return a=l/(l-x),t.copy(n).addScaledVector(ci,a);const f=u*x-g*h;if(f<=0&&h-u>=0&&g-x>=0)return ya.subVectors(r,i),a=(h-u)/(h-u+(g-x)),t.copy(i).addScaledVector(ya,a);const M=1/(f+m+d);return o=m*M,a=d*M,t.copy(n).addScaledVector(li,o).addScaledVector(ci,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}let Kl=0;class Rr extends Jn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Kl++}),this.uuid=Wi(),this.name="",this.type="Material",this.blending=Mi,this.side=jn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=lo,this.blendDst=co,this.blendEquation=_i,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=vs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Bl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Br,this.stencilZFail=Br,this.stencilZPass=Br,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn("THREE.Material: '"+t+"' parameter is undefined.");continue}const i=this[t];if(i===void 0){console.warn("THREE."+this.type+": '"+t+"' is not a property of this material.");continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.5,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Mi&&(n.blending=this.blending),this.side!==jn&&(n.side=this.side),this.vertexColors&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=this.transparent),n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.stencilWrite=this.stencilWrite,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(n.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=this.premultipliedAlpha),this.wireframe===!0&&(n.wireframe=this.wireframe),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=this.flatShading),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(t){const r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Mo extends Rr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new je(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=uo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const gt=new W,lr=new Ge;class jt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=ua,this.updateRange={offset:0,count:-1},this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)lr.fromBufferAttribute(this,t),lr.applyMatrix3(e),this.setXY(t,lr.x,lr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix3(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix4(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyNormalMatrix(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.transformDirection(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}set(e,t=0){return this.array.set(e,t),this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Qi(t,this.array)),t}setX(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Qi(t,this.array)),t}setY(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Qi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Qi(t,this.array)),t}setW(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array),i=kt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array),i=kt(i,this.array),r=kt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ua&&(e.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(e.updateRange=this.updateRange),e}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class yo extends jt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class bo extends jt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Zn extends jt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Jl=0;const $t=new vt,is=new At,ui=new W,Ht=new Xi,Ii=new Xi,bt=new W;class Cn extends Jn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Jl++}),this.uuid=Wi(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(mo(e)?bo:yo)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Zt().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return $t.makeRotationFromQuaternion(e),this.applyMatrix4($t),this}rotateX(e){return $t.makeRotationX(e),this.applyMatrix4($t),this}rotateY(e){return $t.makeRotationY(e),this.applyMatrix4($t),this}rotateZ(e){return $t.makeRotationZ(e),this.applyMatrix4($t),this}translate(e,t,n){return $t.makeTranslation(e,t,n),this.applyMatrix4($t),this}scale(e,t,n){return $t.makeScale(e,t,n),this.applyMatrix4($t),this}lookAt(e){return is.lookAt(e),is.updateMatrix(),this.applyMatrix4(is.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ui).negate(),this.translate(ui.x,ui.y,ui.z),this}setFromPoints(e){const t=[];for(let n=0,i=e.length;n<i;n++){const r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Zn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Xi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new W(-1/0,-1/0,-1/0),new W(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];Ht.setFromBufferAttribute(r),this.morphTargetsRelative?(bt.addVectors(this.boundingBox.min,Ht.min),this.boundingBox.expandByPoint(bt),bt.addVectors(this.boundingBox.max,Ht.max),this.boundingBox.expandByPoint(bt)):(this.boundingBox.expandByPoint(Ht.min),this.boundingBox.expandByPoint(Ht.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ps);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new W,1/0);return}if(e){const n=this.boundingSphere.center;if(Ht.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const a=t[r];Ii.setFromBufferAttribute(a),this.morphTargetsRelative?(bt.addVectors(Ht.min,Ii.min),Ht.expandByPoint(bt),bt.addVectors(Ht.max,Ii.max),Ht.expandByPoint(bt)):(Ht.expandByPoint(Ii.min),Ht.expandByPoint(Ii.max))}Ht.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)bt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(bt));if(t)for(let r=0,o=t.length;r<o;r++){const a=t[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)bt.fromBufferAttribute(a,l),c&&(ui.fromBufferAttribute(e,l),bt.add(ui)),i=Math.max(i,n.distanceToSquared(bt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,i=t.position.array,r=t.normal.array,o=t.uv.array,a=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new jt(new Float32Array(4*a),4));const c=this.getAttribute("tangent").array,l=[],u=[];for(let H=0;H<a;H++)l[H]=new W,u[H]=new W;const h=new W,d=new W,g=new W,x=new Ge,m=new Ge,f=new Ge,M=new W,C=new W;function w(H,ne,ae){h.fromArray(i,H*3),d.fromArray(i,ne*3),g.fromArray(i,ae*3),x.fromArray(o,H*2),m.fromArray(o,ne*2),f.fromArray(o,ae*2),d.sub(h),g.sub(h),m.sub(x),f.sub(x);const z=1/(m.x*f.y-f.x*m.y);isFinite(z)&&(M.copy(d).multiplyScalar(f.y).addScaledVector(g,-m.y).multiplyScalar(z),C.copy(g).multiplyScalar(m.x).addScaledVector(d,-f.x).multiplyScalar(z),l[H].add(M),l[ne].add(M),l[ae].add(M),u[H].add(C),u[ne].add(C),u[ae].add(C))}let T=this.groups;T.length===0&&(T=[{start:0,count:n.length}]);for(let H=0,ne=T.length;H<ne;++H){const ae=T[H],z=ae.start,U=ae.count;for(let ee=z,oe=z+U;ee<oe;ee+=3)w(n[ee+0],n[ee+1],n[ee+2])}const E=new W,N=new W,B=new W,v=new W;function R(H){B.fromArray(r,H*3),v.copy(B);const ne=l[H];E.copy(ne),E.sub(B.multiplyScalar(B.dot(ne))).normalize(),N.crossVectors(v,ne);const z=N.dot(u[H])<0?-1:1;c[H*4]=E.x,c[H*4+1]=E.y,c[H*4+2]=E.z,c[H*4+3]=z}for(let H=0,ne=T.length;H<ne;++H){const ae=T[H],z=ae.start,U=ae.count;for(let ee=z,oe=z+U;ee<oe;ee+=3)R(n[ee+0]),R(n[ee+1]),R(n[ee+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new jt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,g=n.count;d<g;d++)n.setXYZ(d,0,0,0);const i=new W,r=new W,o=new W,a=new W,c=new W,l=new W,u=new W,h=new W;if(e)for(let d=0,g=e.count;d<g;d+=3){const x=e.getX(d+0),m=e.getX(d+1),f=e.getX(d+2);i.fromBufferAttribute(t,x),r.fromBufferAttribute(t,m),o.fromBufferAttribute(t,f),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),a.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),l.fromBufferAttribute(n,f),a.add(u),c.add(u),l.add(u),n.setXYZ(x,a.x,a.y,a.z),n.setXYZ(m,c.x,c.y,c.z),n.setXYZ(f,l.x,l.y,l.z)}else for(let d=0,g=t.count;d<g;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,r),h.subVectors(i,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeBufferGeometries() instead."),this}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)bt.fromBufferAttribute(e,t),bt.normalize(),e.setXYZ(t,bt.x,bt.y,bt.z)}toNonIndexed(){function e(a,c){const l=a.array,u=a.itemSize,h=a.normalized,d=new l.constructor(c.length*u);let g=0,x=0;for(let m=0,f=c.length;m<f;m++){a.isInterleavedBufferAttribute?g=c[m]*a.data.stride+a.offset:g=c[m]*u;for(let M=0;M<u;M++)d[x++]=l[g++]}return new jt(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Cn,n=this.index.array,i=this.attributes;for(const a in i){const c=i[a],l=e(c,n);t.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let u=0,h=l.length;u<h;u++){const d=l[u],g=e(d,n);c.push(g)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const i={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let h=0,d=l.length;h<d;h++){const g=l[h];u.push(g.toJSON(e.data))}u.length>0&&(i[c]=u,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const i=e.attributes;for(const l in i){const u=i[l];this.setAttribute(l,u.clone(t))}const r=e.morphAttributes;for(const l in r){const u=[],h=r[l];for(let d=0,g=h.length;d<g;d++)u.push(h[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let l=0,u=o.length;l<u;l++){const h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,e.parameters!==void 0&&(this.parameters=Object.assign({},e.parameters)),this}dispose(){this.dispatchEvent({type:"dispose"})}}const ba=new vt,hi=new Wl,rs=new Ps,Ni=new W,Ui=new W,Fi=new W,ss=new W,cr=new W,ur=new Ge,hr=new Ge,dr=new Ge,as=new W,fr=new W;class on extends At{constructor(e=new Cn,t=new Mo){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){const a=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const a=this.morphTargetInfluences;if(r&&a){cr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=a[c],h=r[c];u!==0&&(ss.fromBufferAttribute(h,e),o?cr.addScaledVector(ss,u):cr.addScaledVector(ss.sub(t),u))}t.add(cr)}return this.isSkinnedMesh&&this.boneTransform(e,t),t}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;if(i===void 0||(n.boundingSphere===null&&n.computeBoundingSphere(),rs.copy(n.boundingSphere),rs.applyMatrix4(r),e.ray.intersectsSphere(rs)===!1)||(ba.copy(r).invert(),hi.copy(e.ray).applyMatrix4(ba),n.boundingBox!==null&&hi.intersectsBox(n.boundingBox)===!1))return;let o;const a=n.index,c=n.attributes.position,l=n.attributes.uv,u=n.attributes.uv2,h=n.groups,d=n.drawRange;if(a!==null)if(Array.isArray(i))for(let g=0,x=h.length;g<x;g++){const m=h[g],f=i[m.materialIndex],M=Math.max(m.start,d.start),C=Math.min(a.count,Math.min(m.start+m.count,d.start+d.count));for(let w=M,T=C;w<T;w+=3){const E=a.getX(w),N=a.getX(w+1),B=a.getX(w+2);o=pr(this,f,e,hi,l,u,E,N,B),o&&(o.faceIndex=Math.floor(w/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,d.start),x=Math.min(a.count,d.start+d.count);for(let m=g,f=x;m<f;m+=3){const M=a.getX(m),C=a.getX(m+1),w=a.getX(m+2);o=pr(this,i,e,hi,l,u,M,C,w),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}else if(c!==void 0)if(Array.isArray(i))for(let g=0,x=h.length;g<x;g++){const m=h[g],f=i[m.materialIndex],M=Math.max(m.start,d.start),C=Math.min(c.count,Math.min(m.start+m.count,d.start+d.count));for(let w=M,T=C;w<T;w+=3){const E=w,N=w+1,B=w+2;o=pr(this,f,e,hi,l,u,E,N,B),o&&(o.faceIndex=Math.floor(w/3),o.face.materialIndex=m.materialIndex,t.push(o))}}else{const g=Math.max(0,d.start),x=Math.min(c.count,d.start+d.count);for(let m=g,f=x;m<f;m+=3){const M=m,C=m+1,w=m+2;o=pr(this,i,e,hi,l,u,M,C,w),o&&(o.faceIndex=Math.floor(m/3),t.push(o))}}}}function Ql(s,e,t,n,i,r,o,a){let c;if(e.side===Jt?c=n.intersectTriangle(o,r,i,!0,a):c=n.intersectTriangle(i,r,o,e.side===jn,a),c===null)return null;fr.copy(a),fr.applyMatrix4(s.matrixWorld);const l=t.ray.origin.distanceTo(fr);return l<t.near||l>t.far?null:{distance:l,point:fr.clone(),object:s}}function pr(s,e,t,n,i,r,o,a,c){s.getVertexPosition(o,Ni),s.getVertexPosition(a,Ui),s.getVertexPosition(c,Fi);const l=Ql(s,e,t,n,Ni,Ui,Fi,as);if(l){i&&(ur.fromBufferAttribute(i,o),hr.fromBufferAttribute(i,a),dr.fromBufferAttribute(i,c),l.uv=bn.getUV(as,Ni,Ui,Fi,ur,hr,dr,new Ge)),r&&(ur.fromBufferAttribute(r,o),hr.fromBufferAttribute(r,a),dr.fromBufferAttribute(r,c),l.uv2=bn.getUV(as,Ni,Ui,Fi,ur,hr,dr,new Ge));const u={a:o,b:a,c,normal:new W,materialIndex:0};bn.getNormal(Ni,Ui,Fi,u.normal),l.face=u}return l}class Yi extends Cn{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};const a=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],u=[],h=[];let d=0,g=0;x("z","y","x",-1,-1,n,t,e,o,r,0),x("z","y","x",1,-1,n,t,-e,o,r,1),x("x","z","y",1,1,e,n,t,i,o,2),x("x","z","y",1,-1,e,n,-t,i,o,3),x("x","y","z",1,-1,e,t,n,i,r,4),x("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new Zn(l,3)),this.setAttribute("normal",new Zn(u,3)),this.setAttribute("uv",new Zn(h,2));function x(m,f,M,C,w,T,E,N,B,v,R){const H=T/B,ne=E/v,ae=T/2,z=E/2,U=N/2,ee=B+1,oe=v+1;let ue=0,te=0;const ge=new W;for(let re=0;re<oe;re++){const Z=re*ne-z;for(let q=0;q<ee;q++){const le=q*H-ae;ge[m]=le*C,ge[f]=Z*w,ge[M]=U,l.push(ge.x,ge.y,ge.z),ge[m]=0,ge[f]=0,ge[M]=N>0?1:-1,u.push(ge.x,ge.y,ge.z),h.push(q/B),h.push(1-re/v),ue+=1}}for(let re=0;re<v;re++)for(let Z=0;Z<B;Z++){const q=d+Z+ee*re,le=d+Z+ee*(re+1),me=d+(Z+1)+ee*(re+1),Se=d+(Z+1)+ee*re;c.push(q,le,Se),c.push(le,me,Se),te+=6}a.addGroup(g,te,R),g+=te,d+=ue}}static fromJSON(e){return new Yi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Ai(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Pt(s){const e={};for(let t=0;t<s.length;t++){const n=Ai(s[t]);for(const i in n)e[i]=n[i]}return e}function ec(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function wo(s){return s.getRenderTarget()===null&&s.outputEncoding===st?hn:Hi}const Ts={clone:Ai,merge:Pt};var tc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,nc=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ln extends Rr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tc,this.fragmentShader=nc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ai(e.uniforms),this.uniformsGroups=ec(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class To extends At{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new vt,this.projectionMatrix=new vt,this.projectionMatrixInverse=new vt}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(-t[8],-t[9],-t[10]).normalize()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class sn extends To{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=da*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(kr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return da*2*Math.atan(Math.tan(kr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(kr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*i/c,t-=o.offsetY*n/l,i*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const di=-90,fi=1;class ic extends At{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n;const i=new sn(di,fi,e,t);i.layers=this.layers,i.up.set(0,1,0),i.lookAt(1,0,0),this.add(i);const r=new sn(di,fi,e,t);r.layers=this.layers,r.up.set(0,1,0),r.lookAt(-1,0,0),this.add(r);const o=new sn(di,fi,e,t);o.layers=this.layers,o.up.set(0,0,-1),o.lookAt(0,1,0),this.add(o);const a=new sn(di,fi,e,t);a.layers=this.layers,a.up.set(0,0,1),a.lookAt(0,-1,0),this.add(a);const c=new sn(di,fi,e,t);c.layers=this.layers,c.up.set(0,1,0),c.lookAt(0,0,1),this.add(c);const l=new sn(di,fi,e,t);l.layers=this.layers,l.up.set(0,1,0),l.lookAt(0,0,-1),this.add(l)}update(e,t){this.parent===null&&this.updateMatrixWorld();const n=this.renderTarget,[i,r,o,a,c,l]=this.children,u=e.getRenderTarget(),h=e.toneMapping,d=e.xr.enabled;e.toneMapping=En,e.xr.enabled=!1;const g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0),e.render(t,i),e.setRenderTarget(n,1),e.render(t,r),e.setRenderTarget(n,2),e.render(t,o),e.setRenderTarget(n,3),e.render(t,a),e.setRenderTarget(n,4),e.render(t,c),n.texture.generateMipmaps=g,e.setRenderTarget(n,5),e.render(t,l),e.setRenderTarget(u),e.toneMapping=h,e.xr.enabled=d,n.texture.needsPMREMUpdate=!0}}class Eo extends Ut{constructor(e,t,n,i,r,o,a,c,l,u){e=e!==void 0?e:[],t=t!==void 0?t:bi,super(e,t,n,i,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class rc extends Kn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new Eo(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.encoding),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Tt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.encoding=t.encoding,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new Yi(5,5,5),r=new ln({name:"CubemapFromEquirect",uniforms:Ai(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Jt,blending:Fn});r.uniforms.tEquirect.value=t;const o=new on(i,r),a=t.minFilter;return t.minFilter===Ti&&(t.minFilter=Tt),new ic(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,i){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}}const os=new W,sc=new W,ac=new Zt;class Hn{constructor(e=new W(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=os.subVectors(n,t).cross(sc.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(this.normal).multiplyScalar(-this.distanceToPoint(e)).add(e)}intersectLine(e,t){const n=e.delta(os),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(n).multiplyScalar(r).add(e.start)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||ac.getNormalMatrix(e),i=this.coplanarPoint(os).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const pi=new Ps,mr=new W;class Is{constructor(e=new Hn,t=new Hn,n=new Hn,i=new Hn,r=new Hn,o=new Hn){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(r),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e){const t=this.planes,n=e.elements,i=n[0],r=n[1],o=n[2],a=n[3],c=n[4],l=n[5],u=n[6],h=n[7],d=n[8],g=n[9],x=n[10],m=n[11],f=n[12],M=n[13],C=n[14],w=n[15];return t[0].setComponents(a-i,h-c,m-d,w-f).normalize(),t[1].setComponents(a+i,h+c,m+d,w+f).normalize(),t[2].setComponents(a+r,h+l,m+g,w+M).normalize(),t[3].setComponents(a-r,h-l,m-g,w-M).normalize(),t[4].setComponents(a-o,h-u,m-x,w-C).normalize(),t[5].setComponents(a+o,h+u,m+x,w+C).normalize(),this}intersectsObject(e){const t=e.geometry;return t.boundingSphere===null&&t.computeBoundingSphere(),pi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld),this.intersectsSphere(pi)}intersectsSprite(e){return pi.center.set(0,0,0),pi.radius=.7071067811865476,pi.applyMatrix4(e.matrixWorld),this.intersectsSphere(pi)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(mr.x=i.normal.x>0?e.max.x:e.min.x,mr.y=i.normal.y>0?e.max.y:e.min.y,mr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(mr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Ao(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function oc(s,e){const t=e.isWebGL2,n=new WeakMap;function i(l,u){const h=l.array,d=l.usage,g=s.createBuffer();s.bindBuffer(u,g),s.bufferData(u,h,d),l.onUploadCallback();let x;if(h instanceof Float32Array)x=5126;else if(h instanceof Uint16Array)if(l.isFloat16BufferAttribute)if(t)x=5131;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else x=5123;else if(h instanceof Int16Array)x=5122;else if(h instanceof Uint32Array)x=5125;else if(h instanceof Int32Array)x=5124;else if(h instanceof Int8Array)x=5120;else if(h instanceof Uint8Array)x=5121;else if(h instanceof Uint8ClampedArray)x=5121;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:g,type:x,bytesPerElement:h.BYTES_PER_ELEMENT,version:l.version}}function r(l,u,h){const d=u.array,g=u.updateRange;s.bindBuffer(h,l),g.count===-1?s.bufferSubData(h,0,d):(t?s.bufferSubData(h,g.offset*d.BYTES_PER_ELEMENT,d,g.offset,g.count):s.bufferSubData(h,g.offset*d.BYTES_PER_ELEMENT,d.subarray(g.offset,g.offset+g.count)),g.count=-1),u.onUploadCallback()}function o(l){return l.isInterleavedBufferAttribute&&(l=l.data),n.get(l)}function a(l){l.isInterleavedBufferAttribute&&(l=l.data);const u=n.get(l);u&&(s.deleteBuffer(u.buffer),n.delete(l))}function c(l,u){if(l.isGLBufferAttribute){const d=n.get(l);(!d||d.version<l.version)&&n.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}l.isInterleavedBufferAttribute&&(l=l.data);const h=n.get(l);h===void 0?n.set(l,i(l,u)):h.version<l.version&&(r(h.buffer,l,u),h.version=l.version)}return{get:o,remove:a,update:c}}class Lr extends Cn{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(i),l=a+1,u=c+1,h=e/a,d=t/c,g=[],x=[],m=[],f=[];for(let M=0;M<u;M++){const C=M*d-o;for(let w=0;w<l;w++){const T=w*h-r;x.push(T,-C,0),m.push(0,0,1),f.push(w/a),f.push(1-M/c)}}for(let M=0;M<c;M++)for(let C=0;C<a;C++){const w=C+l*M,T=C+l*(M+1),E=C+1+l*(M+1),N=C+1+l*M;g.push(w,T,N),g.push(T,E,N)}this.setIndex(g),this.setAttribute("position",new Zn(x,3)),this.setAttribute("normal",new Zn(m,3)),this.setAttribute("uv",new Zn(f,2))}static fromJSON(e){return new Lr(e.width,e.height,e.widthSegments,e.heightSegments)}}var lc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
#endif`,cc=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,uc=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,hc=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,dc=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,fc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,pc="vec3 transformed = vec3( position );",mc=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,gc=`vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
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
#endif`,_c=`#ifdef USE_IRIDESCENCE
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
#endif`,xc=`#ifdef USE_BUMPMAP
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
#endif`,vc=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Sc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Mc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,yc=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,bc=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,wc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Tc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Ec=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,Ac=`#define PI 3.141592653589793
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
}`,Cc=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Rc=`vec3 transformedNormal = objectNormal;
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
#endif`,Lc=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Dc=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );
#endif`,Pc=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ic=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Nc="gl_FragColor = linearToOutputTexel( gl_FragColor );",Uc=`vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Fc=`#ifdef USE_ENVMAP
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
#endif`,Oc=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,zc=`#ifdef USE_ENVMAP
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
#endif`,Bc=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,kc=`#ifdef USE_ENVMAP
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
#endif`,Gc=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Hc=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Vc=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Wc=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Xc=`#ifdef USE_GRADIENTMAP
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
}`,qc=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vUv2 );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Yc=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Zc=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,jc=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,$c=`uniform bool receiveShadow;
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
#endif`,Kc=`#if defined( USE_ENVMAP )
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
#endif`,Jc=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Qc=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,eu=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,tu=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,nu=`PhysicalMaterial material;
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
#endif`,iu=`struct PhysicalMaterial {
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
}`,ru=`
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
#endif`,su=`#if defined( RE_IndirectDiffuse )
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
#endif`,au=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`,ou=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,lu=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,cu=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,uu=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,hu=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,du=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,fu=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,pu=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	uniform mat3 uvTransform;
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,mu=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vUv );
	metalnessFactor *= texelMetalness.b;
#endif`,gu=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,_u=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,xu=`#ifdef USE_MORPHNORMALS
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
#endif`,vu=`#ifdef USE_MORPHTARGETS
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
#endif`,Su=`#ifdef USE_MORPHTARGETS
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
#endif`,Mu=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 geometryNormal = normal;`,yu=`#ifdef OBJECTSPACE_NORMALMAP
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
#endif`,bu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Tu=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Eu=`#ifdef USE_NORMALMAP
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
#endif`,Au=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`,Cu=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	#ifdef USE_TANGENT
		clearcoatNormal = normalize( vTBN * clearcoatMapN );
	#else
		clearcoatNormal = perturbNormal2Arb( - vViewPosition, clearcoatNormal, clearcoatMapN, faceDirection );
	#endif
#endif`,Ru=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif`,Lu=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Du=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Pu=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Iu=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Nu=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Uu=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Fu=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ou=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vUv );
	roughnessFactor *= texelRoughness.g;
#endif`,zu=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Bu=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,ku=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Gu=`#if defined( USE_SHADOWMAP ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Hu=`float getShadowMask() {
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
}`,Vu=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Wu=`#ifdef USE_SKINNING
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
#endif`,Xu=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,qu=`#ifdef USE_SKINNING
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
#endif`,Yu=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zu=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ju=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$u=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Ku=`#ifdef USE_TRANSMISSION
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
#endif`,Ju=`#ifdef USE_TRANSMISSION
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
#endif`,Qu=`#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	varying vec2 vUv;
#endif`,eh=`#ifdef USE_UV
	#ifdef UVS_VERTEX_ONLY
		vec2 vUv;
	#else
		varying vec2 vUv;
	#endif
	uniform mat3 uvTransform;
#endif`,th=`#ifdef USE_UV
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
#endif`,nh=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	varying vec2 vUv2;
#endif`,ih=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	attribute vec2 uv2;
	varying vec2 vUv2;
	uniform mat3 uv2Transform;
#endif`,rh=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
#endif`,sh=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const ah=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,oh=`uniform sampler2D t2D;
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
}`,lh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ch=`#ifdef ENVMAP_TYPE_CUBE
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
}`,uh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,hh=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,dh=`#include <common>
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
}`,fh=`#if DEPTH_PACKING == 3200
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
}`,ph=`#define DISTANCE
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
}`,mh=`#define DISTANCE
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
}`,gh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,_h=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,xh=`uniform float scale;
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
}`,vh=`uniform vec3 diffuse;
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
}`,Sh=`#include <common>
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
}`,Mh=`uniform vec3 diffuse;
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
}`,yh=`#define LAMBERT
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
}`,bh=`#define LAMBERT
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
}`,wh=`#define MATCAP
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
}`,Th=`#define MATCAP
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
}`,Eh=`#define NORMAL
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
}`,Ah=`#define NORMAL
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
}`,Ch=`#define PHONG
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
}`,Rh=`#define PHONG
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
}`,Lh=`#define STANDARD
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
}`,Dh=`#define STANDARD
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
}`,Ph=`#define TOON
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
}`,Ih=`#define TOON
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
}`,Nh=`uniform float size;
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
}`,Uh=`uniform vec3 diffuse;
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
}`,Fh=`#include <common>
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
}`,Oh=`uniform vec3 color;
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
}`,zh=`uniform float rotation;
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
}`,Bh=`uniform vec3 diffuse;
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
}`,qe={alphamap_fragment:lc,alphamap_pars_fragment:cc,alphatest_fragment:uc,alphatest_pars_fragment:hc,aomap_fragment:dc,aomap_pars_fragment:fc,begin_vertex:pc,beginnormal_vertex:mc,bsdfs:gc,iridescence_fragment:_c,bumpmap_pars_fragment:xc,clipping_planes_fragment:vc,clipping_planes_pars_fragment:Sc,clipping_planes_pars_vertex:Mc,clipping_planes_vertex:yc,color_fragment:bc,color_pars_fragment:wc,color_pars_vertex:Tc,color_vertex:Ec,common:Ac,cube_uv_reflection_fragment:Cc,defaultnormal_vertex:Rc,displacementmap_pars_vertex:Lc,displacementmap_vertex:Dc,emissivemap_fragment:Pc,emissivemap_pars_fragment:Ic,encodings_fragment:Nc,encodings_pars_fragment:Uc,envmap_fragment:Fc,envmap_common_pars_fragment:Oc,envmap_pars_fragment:zc,envmap_pars_vertex:Bc,envmap_physical_pars_fragment:Kc,envmap_vertex:kc,fog_vertex:Gc,fog_pars_vertex:Hc,fog_fragment:Vc,fog_pars_fragment:Wc,gradientmap_pars_fragment:Xc,lightmap_fragment:qc,lightmap_pars_fragment:Yc,lights_lambert_fragment:Zc,lights_lambert_pars_fragment:jc,lights_pars_begin:$c,lights_toon_fragment:Jc,lights_toon_pars_fragment:Qc,lights_phong_fragment:eu,lights_phong_pars_fragment:tu,lights_physical_fragment:nu,lights_physical_pars_fragment:iu,lights_fragment_begin:ru,lights_fragment_maps:su,lights_fragment_end:au,logdepthbuf_fragment:ou,logdepthbuf_pars_fragment:lu,logdepthbuf_pars_vertex:cu,logdepthbuf_vertex:uu,map_fragment:hu,map_pars_fragment:du,map_particle_fragment:fu,map_particle_pars_fragment:pu,metalnessmap_fragment:mu,metalnessmap_pars_fragment:gu,morphcolor_vertex:_u,morphnormal_vertex:xu,morphtarget_pars_vertex:vu,morphtarget_vertex:Su,normal_fragment_begin:Mu,normal_fragment_maps:yu,normal_pars_fragment:bu,normal_pars_vertex:wu,normal_vertex:Tu,normalmap_pars_fragment:Eu,clearcoat_normal_fragment_begin:Au,clearcoat_normal_fragment_maps:Cu,clearcoat_pars_fragment:Ru,iridescence_pars_fragment:Lu,output_fragment:Du,packing:Pu,premultiplied_alpha_fragment:Iu,project_vertex:Nu,dithering_fragment:Uu,dithering_pars_fragment:Fu,roughnessmap_fragment:Ou,roughnessmap_pars_fragment:zu,shadowmap_pars_fragment:Bu,shadowmap_pars_vertex:ku,shadowmap_vertex:Gu,shadowmask_pars_fragment:Hu,skinbase_vertex:Vu,skinning_pars_vertex:Wu,skinning_vertex:Xu,skinnormal_vertex:qu,specularmap_fragment:Yu,specularmap_pars_fragment:Zu,tonemapping_fragment:ju,tonemapping_pars_fragment:$u,transmission_fragment:Ku,transmission_pars_fragment:Ju,uv_pars_fragment:Qu,uv_pars_vertex:eh,uv_vertex:th,uv2_pars_fragment:nh,uv2_pars_vertex:ih,uv2_vertex:rh,worldpos_vertex:sh,background_vert:ah,background_frag:oh,backgroundCube_vert:lh,backgroundCube_frag:ch,cube_vert:uh,cube_frag:hh,depth_vert:dh,depth_frag:fh,distanceRGBA_vert:ph,distanceRGBA_frag:mh,equirect_vert:gh,equirect_frag:_h,linedashed_vert:xh,linedashed_frag:vh,meshbasic_vert:Sh,meshbasic_frag:Mh,meshlambert_vert:yh,meshlambert_frag:bh,meshmatcap_vert:wh,meshmatcap_frag:Th,meshnormal_vert:Eh,meshnormal_frag:Ah,meshphong_vert:Ch,meshphong_frag:Rh,meshphysical_vert:Lh,meshphysical_frag:Dh,meshtoon_vert:Ph,meshtoon_frag:Ih,points_vert:Nh,points_frag:Uh,shadow_vert:Fh,shadow_frag:Oh,sprite_vert:zh,sprite_frag:Bh},ve={common:{diffuse:{value:new je(16777215)},opacity:{value:1},map:{value:null},uvTransform:{value:new Zt},uv2Transform:{value:new Zt},alphaMap:{value:null},alphaTest:{value:0}},specularmap:{specularMap:{value:null}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1}},emissivemap:{emissiveMap:{value:null}},bumpmap:{bumpMap:{value:null},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalScale:{value:new Ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementScale:{value:1},displacementBias:{value:0}},roughnessmap:{roughnessMap:{value:null}},metalnessmap:{metalnessMap:{value:null}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new je(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new je(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Zt}},sprite:{diffuse:{value:new je(16777215)},opacity:{value:1},center:{value:new Ge(.5,.5)},rotation:{value:0},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new Zt}}},dn={basic:{uniforms:Pt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.fog]),vertexShader:qe.meshbasic_vert,fragmentShader:qe.meshbasic_frag},lambert:{uniforms:Pt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,ve.lights,{emissive:{value:new je(0)}}]),vertexShader:qe.meshlambert_vert,fragmentShader:qe.meshlambert_frag},phong:{uniforms:Pt([ve.common,ve.specularmap,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,ve.lights,{emissive:{value:new je(0)},specular:{value:new je(1118481)},shininess:{value:30}}]),vertexShader:qe.meshphong_vert,fragmentShader:qe.meshphong_frag},standard:{uniforms:Pt([ve.common,ve.envmap,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.roughnessmap,ve.metalnessmap,ve.fog,ve.lights,{emissive:{value:new je(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag},toon:{uniforms:Pt([ve.common,ve.aomap,ve.lightmap,ve.emissivemap,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.gradientmap,ve.fog,ve.lights,{emissive:{value:new je(0)}}]),vertexShader:qe.meshtoon_vert,fragmentShader:qe.meshtoon_frag},matcap:{uniforms:Pt([ve.common,ve.bumpmap,ve.normalmap,ve.displacementmap,ve.fog,{matcap:{value:null}}]),vertexShader:qe.meshmatcap_vert,fragmentShader:qe.meshmatcap_frag},points:{uniforms:Pt([ve.points,ve.fog]),vertexShader:qe.points_vert,fragmentShader:qe.points_frag},dashed:{uniforms:Pt([ve.common,ve.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qe.linedashed_vert,fragmentShader:qe.linedashed_frag},depth:{uniforms:Pt([ve.common,ve.displacementmap]),vertexShader:qe.depth_vert,fragmentShader:qe.depth_frag},normal:{uniforms:Pt([ve.common,ve.bumpmap,ve.normalmap,ve.displacementmap,{opacity:{value:1}}]),vertexShader:qe.meshnormal_vert,fragmentShader:qe.meshnormal_frag},sprite:{uniforms:Pt([ve.sprite,ve.fog]),vertexShader:qe.sprite_vert,fragmentShader:qe.sprite_frag},background:{uniforms:{uvTransform:{value:new Zt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qe.background_vert,fragmentShader:qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:qe.backgroundCube_vert,fragmentShader:qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qe.cube_vert,fragmentShader:qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qe.equirect_vert,fragmentShader:qe.equirect_frag},distanceRGBA:{uniforms:Pt([ve.common,ve.displacementmap,{referencePosition:{value:new W},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qe.distanceRGBA_vert,fragmentShader:qe.distanceRGBA_frag},shadow:{uniforms:Pt([ve.lights,ve.fog,{color:{value:new je(0)},opacity:{value:1}}]),vertexShader:qe.shadow_vert,fragmentShader:qe.shadow_frag}};dn.physical={uniforms:Pt([dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatNormalScale:{value:new Ge(1,1)},clearcoatNormalMap:{value:null},iridescence:{value:0},iridescenceMap:{value:null},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},sheen:{value:0},sheenColor:{value:new je(0)},sheenColorMap:{value:null},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},transmission:{value:0},transmissionMap:{value:null},transmissionSamplerSize:{value:new Ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},attenuationDistance:{value:0},attenuationColor:{value:new je(0)},specularIntensity:{value:1},specularIntensityMap:{value:null},specularColor:{value:new je(1,1,1)},specularColorMap:{value:null}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag};const gr={r:0,b:0,g:0};function kh(s,e,t,n,i,r,o){const a=new je(0);let c=r===!0?0:1,l,u,h=null,d=0,g=null;function x(f,M){let C=!1,w=M.isScene===!0?M.background:null;w&&w.isTexture&&(w=(M.backgroundBlurriness>0?t:e).get(w));const T=s.xr,E=T.getSession&&T.getSession();E&&E.environmentBlendMode==="additive"&&(w=null),w===null?m(a,c):w&&w.isColor&&(m(w,1),C=!0),(s.autoClear||C)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),w&&(w.isCubeTexture||w.mapping===Cr)?(u===void 0&&(u=new on(new Yi(1,1,1),new ln({name:"BackgroundCubeMaterial",uniforms:Ai(dn.backgroundCube.uniforms),vertexShader:dn.backgroundCube.vertexShader,fragmentShader:dn.backgroundCube.fragmentShader,side:Jt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(N,B,v){this.matrixWorld.copyPosition(v.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),u.material.uniforms.envMap.value=w,u.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.toneMapped=w.encoding!==st,(h!==w||d!==w.version||g!==s.toneMapping)&&(u.material.needsUpdate=!0,h=w,d=w.version,g=s.toneMapping),u.layers.enableAll(),f.unshift(u,u.geometry,u.material,0,0,null)):w&&w.isTexture&&(l===void 0&&(l=new on(new Lr(2,2),new ln({name:"BackgroundMaterial",uniforms:Ai(dn.background.uniforms),vertexShader:dn.background.vertexShader,fragmentShader:dn.background.fragmentShader,side:jn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=w,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=w.encoding!==st,w.matrixAutoUpdate===!0&&w.updateMatrix(),l.material.uniforms.uvTransform.value.copy(w.matrix),(h!==w||d!==w.version||g!==s.toneMapping)&&(l.material.needsUpdate=!0,h=w,d=w.version,g=s.toneMapping),l.layers.enableAll(),f.unshift(l,l.geometry,l.material,0,0,null))}function m(f,M){f.getRGB(gr,wo(s)),n.buffers.color.setClear(gr.r,gr.g,gr.b,M,o)}return{getClearColor:function(){return a},setClearColor:function(f,M=1){a.set(f),c=M,m(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(f){c=f,m(a,c)},render:x}}function Gh(s,e,t,n){const i=s.getParameter(34921),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),o=n.isWebGL2||r!==null,a={},c=f(null);let l=c,u=!1;function h(U,ee,oe,ue,te){let ge=!1;if(o){const re=m(ue,oe,ee);l!==re&&(l=re,g(l.object)),ge=M(U,ue,oe,te),ge&&C(U,ue,oe,te)}else{const re=ee.wireframe===!0;(l.geometry!==ue.id||l.program!==oe.id||l.wireframe!==re)&&(l.geometry=ue.id,l.program=oe.id,l.wireframe=re,ge=!0)}te!==null&&t.update(te,34963),(ge||u)&&(u=!1,v(U,ee,oe,ue),te!==null&&s.bindBuffer(34963,t.get(te).buffer))}function d(){return n.isWebGL2?s.createVertexArray():r.createVertexArrayOES()}function g(U){return n.isWebGL2?s.bindVertexArray(U):r.bindVertexArrayOES(U)}function x(U){return n.isWebGL2?s.deleteVertexArray(U):r.deleteVertexArrayOES(U)}function m(U,ee,oe){const ue=oe.wireframe===!0;let te=a[U.id];te===void 0&&(te={},a[U.id]=te);let ge=te[ee.id];ge===void 0&&(ge={},te[ee.id]=ge);let re=ge[ue];return re===void 0&&(re=f(d()),ge[ue]=re),re}function f(U){const ee=[],oe=[],ue=[];for(let te=0;te<i;te++)ee[te]=0,oe[te]=0,ue[te]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:ee,enabledAttributes:oe,attributeDivisors:ue,object:U,attributes:{},index:null}}function M(U,ee,oe,ue){const te=l.attributes,ge=ee.attributes;let re=0;const Z=oe.getAttributes();for(const q in Z)if(Z[q].location>=0){const me=te[q];let Se=ge[q];if(Se===void 0&&(q==="instanceMatrix"&&U.instanceMatrix&&(Se=U.instanceMatrix),q==="instanceColor"&&U.instanceColor&&(Se=U.instanceColor)),me===void 0||me.attribute!==Se||Se&&me.data!==Se.data)return!0;re++}return l.attributesNum!==re||l.index!==ue}function C(U,ee,oe,ue){const te={},ge=ee.attributes;let re=0;const Z=oe.getAttributes();for(const q in Z)if(Z[q].location>=0){let me=ge[q];me===void 0&&(q==="instanceMatrix"&&U.instanceMatrix&&(me=U.instanceMatrix),q==="instanceColor"&&U.instanceColor&&(me=U.instanceColor));const Se={};Se.attribute=me,me&&me.data&&(Se.data=me.data),te[q]=Se,re++}l.attributes=te,l.attributesNum=re,l.index=ue}function w(){const U=l.newAttributes;for(let ee=0,oe=U.length;ee<oe;ee++)U[ee]=0}function T(U){E(U,0)}function E(U,ee){const oe=l.newAttributes,ue=l.enabledAttributes,te=l.attributeDivisors;oe[U]=1,ue[U]===0&&(s.enableVertexAttribArray(U),ue[U]=1),te[U]!==ee&&((n.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](U,ee),te[U]=ee)}function N(){const U=l.newAttributes,ee=l.enabledAttributes;for(let oe=0,ue=ee.length;oe<ue;oe++)ee[oe]!==U[oe]&&(s.disableVertexAttribArray(oe),ee[oe]=0)}function B(U,ee,oe,ue,te,ge){n.isWebGL2===!0&&(oe===5124||oe===5125)?s.vertexAttribIPointer(U,ee,oe,te,ge):s.vertexAttribPointer(U,ee,oe,ue,te,ge)}function v(U,ee,oe,ue){if(n.isWebGL2===!1&&(U.isInstancedMesh||ue.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;w();const te=ue.attributes,ge=oe.getAttributes(),re=ee.defaultAttributeValues;for(const Z in ge){const q=ge[Z];if(q.location>=0){let le=te[Z];if(le===void 0&&(Z==="instanceMatrix"&&U.instanceMatrix&&(le=U.instanceMatrix),Z==="instanceColor"&&U.instanceColor&&(le=U.instanceColor)),le!==void 0){const me=le.normalized,Se=le.itemSize,X=t.get(le);if(X===void 0)continue;const He=X.buffer,be=X.type,Oe=X.bytesPerElement;if(le.isInterleavedBufferAttribute){const Re=le.data,$e=Re.stride,Xe=le.offset;if(Re.isInstancedInterleavedBuffer){for(let Fe=0;Fe<q.locationSize;Fe++)E(q.location+Fe,Re.meshPerAttribute);U.isInstancedMesh!==!0&&ue._maxInstanceCount===void 0&&(ue._maxInstanceCount=Re.meshPerAttribute*Re.count)}else for(let Fe=0;Fe<q.locationSize;Fe++)T(q.location+Fe);s.bindBuffer(34962,He);for(let Fe=0;Fe<q.locationSize;Fe++)B(q.location+Fe,Se/q.locationSize,be,me,$e*Oe,(Xe+Se/q.locationSize*Fe)*Oe)}else{if(le.isInstancedBufferAttribute){for(let Re=0;Re<q.locationSize;Re++)E(q.location+Re,le.meshPerAttribute);U.isInstancedMesh!==!0&&ue._maxInstanceCount===void 0&&(ue._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let Re=0;Re<q.locationSize;Re++)T(q.location+Re);s.bindBuffer(34962,He);for(let Re=0;Re<q.locationSize;Re++)B(q.location+Re,Se/q.locationSize,be,me,Se*Oe,Se/q.locationSize*Re*Oe)}}else if(re!==void 0){const me=re[Z];if(me!==void 0)switch(me.length){case 2:s.vertexAttrib2fv(q.location,me);break;case 3:s.vertexAttrib3fv(q.location,me);break;case 4:s.vertexAttrib4fv(q.location,me);break;default:s.vertexAttrib1fv(q.location,me)}}}}N()}function R(){ae();for(const U in a){const ee=a[U];for(const oe in ee){const ue=ee[oe];for(const te in ue)x(ue[te].object),delete ue[te];delete ee[oe]}delete a[U]}}function H(U){if(a[U.id]===void 0)return;const ee=a[U.id];for(const oe in ee){const ue=ee[oe];for(const te in ue)x(ue[te].object),delete ue[te];delete ee[oe]}delete a[U.id]}function ne(U){for(const ee in a){const oe=a[ee];if(oe[U.id]===void 0)continue;const ue=oe[U.id];for(const te in ue)x(ue[te].object),delete ue[te];delete oe[U.id]}}function ae(){z(),u=!0,l!==c&&(l=c,g(l.object))}function z(){c.geometry=null,c.program=null,c.wireframe=!1}return{setup:h,reset:ae,resetDefaultState:z,dispose:R,releaseStatesOfGeometry:H,releaseStatesOfProgram:ne,initAttributes:w,enableAttribute:T,disableUnusedAttributes:N}}function Hh(s,e,t,n){const i=n.isWebGL2;let r;function o(l){r=l}function a(l,u){s.drawArrays(r,l,u),t.update(u,r,1)}function c(l,u,h){if(h===0)return;let d,g;if(i)d=s,g="drawArraysInstanced";else if(d=e.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",d===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}d[g](r,l,u,h),t.update(u,r,h)}this.setMode=o,this.render=a,this.renderInstances=c}function Vh(s,e,t){let n;function i(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const B=e.get("EXT_texture_filter_anisotropic");n=s.getParameter(B.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(B){if(B==="highp"){if(s.getShaderPrecisionFormat(35633,36338).precision>0&&s.getShaderPrecisionFormat(35632,36338).precision>0)return"highp";B="mediump"}return B==="mediump"&&s.getShaderPrecisionFormat(35633,36337).precision>0&&s.getShaderPrecisionFormat(35632,36337).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&s instanceof WebGL2RenderingContext||typeof WebGL2ComputeRenderingContext<"u"&&s instanceof WebGL2ComputeRenderingContext;let a=t.precision!==void 0?t.precision:"highp";const c=r(a);c!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",c,"instead."),a=c);const l=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=s.getParameter(34930),d=s.getParameter(35660),g=s.getParameter(3379),x=s.getParameter(34076),m=s.getParameter(34921),f=s.getParameter(36347),M=s.getParameter(36348),C=s.getParameter(36349),w=d>0,T=o||e.has("OES_texture_float"),E=w&&T,N=o?s.getParameter(36183):0;return{isWebGL2:o,drawBuffers:l,getMaxAnisotropy:i,getMaxPrecision:r,precision:a,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:d,maxTextureSize:g,maxCubemapSize:x,maxAttributes:m,maxVertexUniforms:f,maxVaryings:M,maxFragmentUniforms:C,vertexTextures:w,floatFragmentTextures:T,floatVertexTextures:E,maxSamples:N}}function Wh(s){const e=this;let t=null,n=0,i=!1,r=!1;const o=new Hn,a=new Zt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d,g){const x=h.length!==0||d||n!==0||i;return i=d,t=u(h,g,0),n=h.length,x},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1,l()},this.setState=function(h,d,g){const x=h.clippingPlanes,m=h.clipIntersection,f=h.clipShadows,M=s.get(h);if(!i||x===null||x.length===0||r&&!f)r?u(null):l();else{const C=r?0:n,w=C*4;let T=M.clippingState||null;c.value=T,T=u(x,d,w,g);for(let E=0;E!==w;++E)T[E]=t[E];M.clippingState=T,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=C}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,g,x){const m=h!==null?h.length:0;let f=null;if(m!==0){if(f=c.value,x!==!0||f===null){const M=g+m*4,C=d.matrixWorldInverse;a.getNormalMatrix(C),(f===null||f.length<M)&&(f=new Float32Array(M));for(let w=0,T=g;w!==m;++w,T+=4)o.copy(h[w]).applyMatrix4(C,a),o.normal.toArray(f,T),f[T+3]=o.constant}c.value=f,c.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,f}}function Xh(s){let e=new WeakMap;function t(o,a){return a===Ss?o.mapping=bi:a===Ms&&(o.mapping=wi),o}function n(o){if(o&&o.isTexture&&o.isRenderTargetTexture===!1){const a=o.mapping;if(a===Ss||a===Ms)if(e.has(o)){const c=e.get(o).texture;return t(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new rc(c.height/2);return l.fromEquirectangularTexture(s,o),e.set(o,l),o.addEventListener("dispose",i),t(l.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}class Ns extends To{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,o=n+e,a=i+t,c=i-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const vi=4,wa=[.125,.215,.35,.446,.526,.582],Wn=20,ls=new Ns,Ta=new je;let cs=null;const Vn=(1+Math.sqrt(5))/2,mi=1/Vn,Ea=[new W(1,1,1),new W(-1,1,1),new W(1,1,-1),new W(-1,1,-1),new W(0,Vn,mi),new W(0,Vn,-mi),new W(mi,0,Vn),new W(-mi,0,Vn),new W(Vn,mi,0),new W(-Vn,mi,0)];class Aa{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){cs=this._renderer.getRenderTarget(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=La(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ra(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(cs),e.scissorTest=!1,_r(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===bi||e.mapping===wi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),cs=this._renderer.getRenderTarget();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Tt,minFilter:Tt,generateMipmaps:!1,type:Tn,format:Yt,encoding:An,depthBuffer:!1},i=Ca(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ca(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=qh(r)),this._blurMaterial=Yh(r,e,t)}return i}_compileMaterial(e){const t=new on(this._lodPlanes[0],e);this._renderer.compile(t,ls)}_sceneToCubeUV(e,t,n,i){const a=new sn(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Ta),u.toneMapping=En,u.autoClear=!1;const g=new Mo({name:"PMREM.Background",side:Jt,depthWrite:!1,depthTest:!1}),x=new on(new Yi,g);let m=!1;const f=e.background;f?f.isColor&&(g.color.copy(f),e.background=null,m=!0):(g.color.copy(Ta),m=!0);for(let M=0;M<6;M++){const C=M%3;C===0?(a.up.set(0,c[M],0),a.lookAt(l[M],0,0)):C===1?(a.up.set(0,0,c[M]),a.lookAt(0,l[M],0)):(a.up.set(0,c[M],0),a.lookAt(0,0,l[M]));const w=this._cubeSize;_r(i,C*w,M>2?w:0,w,w),u.setRenderTarget(i),m&&u.render(x,a),u.render(e,a)}x.geometry.dispose(),x.material.dispose(),u.toneMapping=d,u.autoClear=h,e.background=f}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===bi||e.mapping===wi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=La()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ra());const r=i?this._cubemapMaterial:this._equirectMaterial,o=new on(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;const c=this._cubeSize;_r(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,ls)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){const r=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),o=Ea[(i-1)%Ea.length];this._blur(e,i-1,i,r,o)}t.autoClear=n}_blur(e,t,n,i,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new on(this._lodPlanes[i],l),d=l.uniforms,g=this._sizeLods[n]-1,x=isFinite(r)?Math.PI/(2*g):2*Math.PI/(2*Wn-1),m=r/x,f=isFinite(r)?1+Math.floor(u*m):Wn;f>Wn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Wn}`);const M=[];let C=0;for(let B=0;B<Wn;++B){const v=B/m,R=Math.exp(-v*v/2);M.push(R),B===0?C+=R:B<f&&(C+=2*R)}for(let B=0;B<M.length;B++)M[B]=M[B]/C;d.envMap.value=e.texture,d.samples.value=f,d.weights.value=M,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:w}=this;d.dTheta.value=x,d.mipInt.value=w-n;const T=this._sizeLods[i],E=3*T*(i>w-vi?i-w+vi:0),N=4*(this._cubeSize-T);_r(t,E,N,3*T,2*T),c.setRenderTarget(t),c.render(h,ls)}}function qh(s){const e=[],t=[],n=[];let i=s;const r=s-vi+1+wa.length;for(let o=0;o<r;o++){const a=Math.pow(2,i);t.push(a);let c=1/a;o>s-vi?c=wa[o-s+vi-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),u=-l,h=1+l,d=[u,u,h,u,h,h,u,u,h,h,u,h],g=6,x=6,m=3,f=2,M=1,C=new Float32Array(m*x*g),w=new Float32Array(f*x*g),T=new Float32Array(M*x*g);for(let N=0;N<g;N++){const B=N%3*2/3-1,v=N>2?0:-1,R=[B,v,0,B+2/3,v,0,B+2/3,v+1,0,B,v,0,B+2/3,v+1,0,B,v+1,0];C.set(R,m*x*N),w.set(d,f*x*N);const H=[N,N,N,N,N,N];T.set(H,M*x*N)}const E=new Cn;E.setAttribute("position",new jt(C,m)),E.setAttribute("uv",new jt(w,f)),E.setAttribute("faceIndex",new jt(T,M)),e.push(E),i>vi&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Ca(s,e,t){const n=new Kn(s,e,t);return n.texture.mapping=Cr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function _r(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function Yh(s,e,t){const n=new Float32Array(Wn),i=new W(0,1,0);return new ln({name:"SphericalGaussianBlur",defines:{n:Wn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Us(),fragmentShader:`

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
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Ra(){return new ln({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Us(),fragmentShader:`

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
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function La(){return new ln({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Us(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Us(){return`

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
	`}function Zh(s){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===Ss||c===Ms,u=c===bi||c===wi;if(l||u)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let h=e.get(a);return t===null&&(t=new Aa(s)),h=l?t.fromEquirectangular(a,h):t.fromCubemap(a,h),e.set(a,h),h.texture}else{if(e.has(a))return e.get(a).texture;{const h=a.image;if(l&&h&&h.height>0||u&&h&&i(h)){t===null&&(t=new Aa(s));const d=l?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,d),a.addEventListener("dispose",r),d.texture}else return null}}}return a}function i(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function jh(s){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?t("EXT_color_buffer_float"):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function $h(s,e,t,n){const i={},r=new WeakMap;function o(h){const d=h.target;d.index!==null&&e.remove(d.index);for(const x in d.attributes)e.remove(d.attributes[x]);d.removeEventListener("dispose",o),delete i[d.id];const g=r.get(d);g&&(e.remove(g),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function c(h){const d=h.attributes;for(const x in d)e.update(d[x],34962);const g=h.morphAttributes;for(const x in g){const m=g[x];for(let f=0,M=m.length;f<M;f++)e.update(m[f],34962)}}function l(h){const d=[],g=h.index,x=h.attributes.position;let m=0;if(g!==null){const C=g.array;m=g.version;for(let w=0,T=C.length;w<T;w+=3){const E=C[w+0],N=C[w+1],B=C[w+2];d.push(E,N,N,B,B,E)}}else{const C=x.array;m=x.version;for(let w=0,T=C.length/3-1;w<T;w+=3){const E=w+0,N=w+1,B=w+2;d.push(E,N,N,B,B,E)}}const f=new(mo(d)?bo:yo)(d,1);f.version=m;const M=r.get(h);M&&e.remove(M),r.set(h,f)}function u(h){const d=r.get(h);if(d){const g=h.index;g!==null&&d.version<g.version&&l(h)}else l(h);return r.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function Kh(s,e,t,n){const i=n.isWebGL2;let r;function o(d){r=d}let a,c;function l(d){a=d.type,c=d.bytesPerElement}function u(d,g){s.drawElements(r,g,a,d*c),t.update(g,r,1)}function h(d,g,x){if(x===0)return;let m,f;if(i)m=s,f="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[f](r,g,a,d*c,x),t.update(g,r,x)}this.setMode=o,this.setIndex=l,this.render=u,this.renderInstances=h}function Jh(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case 4:t.triangles+=a*(r/3);break;case 1:t.lines+=a*(r/2);break;case 3:t.lines+=a*(r-1);break;case 2:t.lines+=a*r;break;case 0:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.frame++,t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Qh(s,e){return s[0]-e[0]}function ed(s,e){return Math.abs(e[1])-Math.abs(s[1])}function td(s,e,t){const n={},i=new Float32Array(8),r=new WeakMap,o=new Et,a=[];for(let l=0;l<8;l++)a[l]=[l,0];function c(l,u,h,d){const g=l.morphTargetInfluences;if(e.isWebGL2===!0){const m=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,f=m!==void 0?m.length:0;let M=r.get(u);if(M===void 0||M.count!==f){let oe=function(){U.dispose(),r.delete(u),u.removeEventListener("dispose",oe)};var x=oe;M!==void 0&&M.texture.dispose();const T=u.morphAttributes.position!==void 0,E=u.morphAttributes.normal!==void 0,N=u.morphAttributes.color!==void 0,B=u.morphAttributes.position||[],v=u.morphAttributes.normal||[],R=u.morphAttributes.color||[];let H=0;T===!0&&(H=1),E===!0&&(H=2),N===!0&&(H=3);let ne=u.attributes.position.count*H,ae=1;ne>e.maxTextureSize&&(ae=Math.ceil(ne/e.maxTextureSize),ne=e.maxTextureSize);const z=new Float32Array(ne*ae*4*f),U=new vo(z,ne,ae,f);U.type=an,U.needsUpdate=!0;const ee=H*4;for(let ue=0;ue<f;ue++){const te=B[ue],ge=v[ue],re=R[ue],Z=ne*ae*4*ue;for(let q=0;q<te.count;q++){const le=q*ee;T===!0&&(o.fromBufferAttribute(te,q),z[Z+le+0]=o.x,z[Z+le+1]=o.y,z[Z+le+2]=o.z,z[Z+le+3]=0),E===!0&&(o.fromBufferAttribute(ge,q),z[Z+le+4]=o.x,z[Z+le+5]=o.y,z[Z+le+6]=o.z,z[Z+le+7]=0),N===!0&&(o.fromBufferAttribute(re,q),z[Z+le+8]=o.x,z[Z+le+9]=o.y,z[Z+le+10]=o.z,z[Z+le+11]=re.itemSize===4?o.w:1)}}M={count:f,texture:U,size:new Ge(ne,ae)},r.set(u,M),u.addEventListener("dispose",oe)}let C=0;for(let T=0;T<g.length;T++)C+=g[T];const w=u.morphTargetsRelative?1:1-C;d.getUniforms().setValue(s,"morphTargetBaseInfluence",w),d.getUniforms().setValue(s,"morphTargetInfluences",g),d.getUniforms().setValue(s,"morphTargetsTexture",M.texture,t),d.getUniforms().setValue(s,"morphTargetsTextureSize",M.size)}else{const m=g===void 0?0:g.length;let f=n[u.id];if(f===void 0||f.length!==m){f=[];for(let E=0;E<m;E++)f[E]=[E,0];n[u.id]=f}for(let E=0;E<m;E++){const N=f[E];N[0]=E,N[1]=g[E]}f.sort(ed);for(let E=0;E<8;E++)E<m&&f[E][1]?(a[E][0]=f[E][0],a[E][1]=f[E][1]):(a[E][0]=Number.MAX_SAFE_INTEGER,a[E][1]=0);a.sort(Qh);const M=u.morphAttributes.position,C=u.morphAttributes.normal;let w=0;for(let E=0;E<8;E++){const N=a[E],B=N[0],v=N[1];B!==Number.MAX_SAFE_INTEGER&&v?(M&&u.getAttribute("morphTarget"+E)!==M[B]&&u.setAttribute("morphTarget"+E,M[B]),C&&u.getAttribute("morphNormal"+E)!==C[B]&&u.setAttribute("morphNormal"+E,C[B]),i[E]=v,w+=v):(M&&u.hasAttribute("morphTarget"+E)===!0&&u.deleteAttribute("morphTarget"+E),C&&u.hasAttribute("morphNormal"+E)===!0&&u.deleteAttribute("morphNormal"+E),i[E]=0)}const T=u.morphTargetsRelative?1:1-w;d.getUniforms().setValue(s,"morphTargetBaseInfluence",T),d.getUniforms().setValue(s,"morphTargetInfluences",i)}}return{update:c}}function nd(s,e,t,n){let i=new WeakMap;function r(c){const l=n.render.frame,u=c.geometry,h=e.get(c,u);return i.get(h)!==l&&(e.update(h),i.set(h,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),t.update(c.instanceMatrix,34962),c.instanceColor!==null&&t.update(c.instanceColor,34962)),h}function o(){i=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}const Co=new Ut,Ro=new vo,Lo=new Hl,Do=new Eo,Da=[],Pa=[],Ia=new Float32Array(16),Na=new Float32Array(9),Ua=new Float32Array(4);function Ci(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=Da[i];if(r===void 0&&(r=new Float32Array(i),Da[i]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,s[o].toArray(r,a)}return r}function St(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Mt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Dr(s,e){let t=Pa[e];t===void 0&&(t=new Int32Array(e),Pa[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function id(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function rd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;s.uniform2fv(this.addr,e),Mt(t,e)}}function sd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(St(t,e))return;s.uniform3fv(this.addr,e),Mt(t,e)}}function ad(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;s.uniform4fv(this.addr,e),Mt(t,e)}}function od(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,n))return;Ua.set(n),s.uniformMatrix2fv(this.addr,!1,Ua),Mt(t,n)}}function ld(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,n))return;Na.set(n),s.uniformMatrix3fv(this.addr,!1,Na),Mt(t,n)}}function cd(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Mt(t,e)}else{if(St(t,n))return;Ia.set(n),s.uniformMatrix4fv(this.addr,!1,Ia),Mt(t,n)}}function ud(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function hd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;s.uniform2iv(this.addr,e),Mt(t,e)}}function dd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;s.uniform3iv(this.addr,e),Mt(t,e)}}function fd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;s.uniform4iv(this.addr,e),Mt(t,e)}}function pd(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function md(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;s.uniform2uiv(this.addr,e),Mt(t,e)}}function gd(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;s.uniform3uiv(this.addr,e),Mt(t,e)}}function _d(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;s.uniform4uiv(this.addr,e),Mt(t,e)}}function xd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2D(e||Co,i)}function vd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Lo,i)}function Sd(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Do,i)}function Md(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Ro,i)}function yd(s){switch(s){case 5126:return id;case 35664:return rd;case 35665:return sd;case 35666:return ad;case 35674:return od;case 35675:return ld;case 35676:return cd;case 5124:case 35670:return ud;case 35667:case 35671:return hd;case 35668:case 35672:return dd;case 35669:case 35673:return fd;case 5125:return pd;case 36294:return md;case 36295:return gd;case 36296:return _d;case 35678:case 36198:case 36298:case 36306:case 35682:return xd;case 35679:case 36299:case 36307:return vd;case 35680:case 36300:case 36308:case 36293:return Sd;case 36289:case 36303:case 36311:case 36292:return Md}}function bd(s,e){s.uniform1fv(this.addr,e)}function wd(s,e){const t=Ci(e,this.size,2);s.uniform2fv(this.addr,t)}function Td(s,e){const t=Ci(e,this.size,3);s.uniform3fv(this.addr,t)}function Ed(s,e){const t=Ci(e,this.size,4);s.uniform4fv(this.addr,t)}function Ad(s,e){const t=Ci(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function Cd(s,e){const t=Ci(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function Rd(s,e){const t=Ci(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function Ld(s,e){s.uniform1iv(this.addr,e)}function Dd(s,e){s.uniform2iv(this.addr,e)}function Pd(s,e){s.uniform3iv(this.addr,e)}function Id(s,e){s.uniform4iv(this.addr,e)}function Nd(s,e){s.uniform1uiv(this.addr,e)}function Ud(s,e){s.uniform2uiv(this.addr,e)}function Fd(s,e){s.uniform3uiv(this.addr,e)}function Od(s,e){s.uniform4uiv(this.addr,e)}function zd(s,e,t){const n=this.cache,i=e.length,r=Dr(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||Co,r[o])}function Bd(s,e,t){const n=this.cache,i=e.length,r=Dr(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||Lo,r[o])}function kd(s,e,t){const n=this.cache,i=e.length,r=Dr(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||Do,r[o])}function Gd(s,e,t){const n=this.cache,i=e.length,r=Dr(t,i);St(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||Ro,r[o])}function Hd(s){switch(s){case 5126:return bd;case 35664:return wd;case 35665:return Td;case 35666:return Ed;case 35674:return Ad;case 35675:return Cd;case 35676:return Rd;case 5124:case 35670:return Ld;case 35667:case 35671:return Dd;case 35668:case 35672:return Pd;case 35669:case 35673:return Id;case 5125:return Nd;case 36294:return Ud;case 36295:return Fd;case 36296:return Od;case 35678:case 36198:case 36298:case 36306:case 35682:return zd;case 35679:case 36299:case 36307:return Bd;case 35680:case 36300:case 36308:case 36293:return kd;case 36289:case 36303:case 36311:case 36292:return Gd}}class Vd{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.setValue=yd(t.type)}}class Wd{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.size=t.size,this.setValue=Hd(t.type)}}class Xd{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,o=i.length;r!==o;++r){const a=i[r];a.setValue(e,t[a.id],n)}}}const us=/(\w+)(\])?(\[|\.)?/g;function Fa(s,e){s.seq.push(e),s.map[e.id]=e}function qd(s,e,t){const n=s.name,i=n.length;for(us.lastIndex=0;;){const r=us.exec(n),o=us.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===i){Fa(t,l===void 0?new Vd(a,s,e):new Wd(a,s,e));break}else{let h=t.map[a];h===void 0&&(h=new Xd(a),Fa(t,h)),t=h}}}class Tr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,35718);for(let i=0;i<n;++i){const r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);qd(r,o,this)}}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){const a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const o=e[i];o.id in t&&n.push(o)}return n}}function Oa(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}let Yd=0;function Zd(s,e){const t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}function jd(s){switch(s){case An:return["Linear","( value )"];case st:return["sRGB","( value )"];default:return console.warn("THREE.WebGLProgram: Unsupported encoding:",s),["Linear","( value )"]}}function za(s,e,t){const n=s.getShaderParameter(e,35713),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";const r=/ERROR: 0:(\d+)/.exec(i);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+Zd(s.getShaderSource(e),o)}else return i}function $d(s,e){const t=jd(e);return"vec4 "+s+"( vec4 value ) { return LinearTo"+t[0]+t[1]+"; }"}function Kd(s,e){let t;switch(e){case pl:t="Linear";break;case ml:t="Reinhard";break;case gl:t="OptimizedCineon";break;case _l:t="ACESFilmic";break;case xl:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Jd(s){return[s.extensionDerivatives||s.envMapCubeUVHeight||s.bumpMap||s.tangentSpaceNormalMap||s.clearcoatNormalMap||s.flatShading||s.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(s.extensionFragDepth||s.logarithmicDepthBuffer)&&s.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",s.extensionDrawBuffers&&s.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(s.extensionShaderTextureLOD||s.envMap||s.transmission)&&s.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Bi).join(`
`)}function Qd(s){const e=[];for(const t in s){const n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function ef(s,e){const t={},n=s.getProgramParameter(e,35721);for(let i=0;i<n;i++){const r=s.getActiveAttrib(e,i),o=r.name;let a=1;r.type===35674&&(a=2),r.type===35675&&(a=3),r.type===35676&&(a=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:a}}return t}function Bi(s){return s!==""}function Ba(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ka(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const tf=/^[ \t]*#include +<([\w\d./]+)>/gm;function Es(s){return s.replace(tf,nf)}function nf(s,e){const t=qe[e];if(t===void 0)throw new Error("Can not resolve #include <"+e+">");return Es(t)}const rf=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ga(s){return s.replace(rf,sf)}function sf(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Ha(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function af(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===Ls?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===qo?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===zi&&(e="SHADOWMAP_TYPE_VSM"),e}function of(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case bi:case wi:e="ENVMAP_TYPE_CUBE";break;case Cr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function lf(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case wi:e="ENVMAP_MODE_REFRACTION";break}return e}function cf(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case uo:e="ENVMAP_BLENDING_MULTIPLY";break;case dl:e="ENVMAP_BLENDING_MIX";break;case fl:e="ENVMAP_BLENDING_ADD";break}return e}function uf(s){const e=s.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function hf(s,e,t,n){const i=s.getContext(),r=t.defines;let o=t.vertexShader,a=t.fragmentShader;const c=af(t),l=of(t),u=lf(t),h=cf(t),d=uf(t),g=t.isWebGL2?"":Jd(t),x=Qd(r),m=i.createProgram();let f,M,C=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=[x].filter(Bi).join(`
`),f.length>0&&(f+=`
`),M=[g,x].filter(Bi).join(`
`),M.length>0&&(M+=`
`)):(f=[Ha(t),"#define SHADER_NAME "+t.shaderName,x,t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.supportsVertexTextures?"#define VERTEX_TEXTURES":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.displacementMap&&t.supportsVertexTextures?"#define USE_DISPLACEMENTMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Bi).join(`
`),M=[g,Ha(t),"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.physicallyCorrectLights?"#define PHYSICALLY_CORRECT_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==En?"#define TONE_MAPPING":"",t.toneMapping!==En?qe.tonemapping_pars_fragment:"",t.toneMapping!==En?Kd("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",qe.encodings_pars_fragment,$d("linearToOutputTexel",t.outputEncoding),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Bi).join(`
`)),o=Es(o),o=Ba(o,t),o=ka(o,t),a=Es(a),a=Ba(a,t),a=ka(a,t),o=Ga(o),a=Ga(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(C=`#version 300 es
`,f=["precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,M=["#define varying in",t.glslVersion===ha?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ha?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+M);const w=C+f+o,T=C+M+a,E=Oa(i,35633,w),N=Oa(i,35632,T);if(i.attachShader(m,E),i.attachShader(m,N),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m),s.debug.checkShaderErrors){const R=i.getProgramInfoLog(m).trim(),H=i.getShaderInfoLog(E).trim(),ne=i.getShaderInfoLog(N).trim();let ae=!0,z=!0;if(i.getProgramParameter(m,35714)===!1){ae=!1;const U=za(i,E,"vertex"),ee=za(i,N,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,35715)+`

Program Info Log: `+R+`
`+U+`
`+ee)}else R!==""?console.warn("THREE.WebGLProgram: Program Info Log:",R):(H===""||ne==="")&&(z=!1);z&&(this.diagnostics={runnable:ae,programLog:R,vertexShader:{log:H,prefix:f},fragmentShader:{log:ne,prefix:M}})}i.deleteShader(E),i.deleteShader(N);let B;this.getUniforms=function(){return B===void 0&&(B=new Tr(i,m)),B};let v;return this.getAttributes=function(){return v===void 0&&(v=ef(i,m)),v},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.name=t.shaderName,this.id=Yd++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=E,this.fragmentShader=N,this}let df=0;class ff{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new pf(e),t.set(e,n)),n}}class pf{constructor(e){this.id=df++,this.code=e,this.usedTimes=0}}function mf(s,e,t,n,i,r,o){const a=new So,c=new ff,l=[],u=i.isWebGL2,h=i.logarithmicDepthBuffer,d=i.vertexTextures;let g=i.precision;const x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(v,R,H,ne,ae){const z=ne.fog,U=ae.geometry,ee=v.isMeshStandardMaterial?ne.environment:null,oe=(v.isMeshStandardMaterial?t:e).get(v.envMap||ee),ue=oe&&oe.mapping===Cr?oe.image.height:null,te=x[v.type];v.precision!==null&&(g=i.getMaxPrecision(v.precision),g!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",g,"instead."));const ge=U.morphAttributes.position||U.morphAttributes.normal||U.morphAttributes.color,re=ge!==void 0?ge.length:0;let Z=0;U.morphAttributes.position!==void 0&&(Z=1),U.morphAttributes.normal!==void 0&&(Z=2),U.morphAttributes.color!==void 0&&(Z=3);let q,le,me,Se;if(te){const $e=dn[te];q=$e.vertexShader,le=$e.fragmentShader}else q=v.vertexShader,le=v.fragmentShader,c.update(v),me=c.getVertexShaderID(v),Se=c.getFragmentShaderID(v);const X=s.getRenderTarget(),He=v.alphaTest>0,be=v.clearcoat>0,Oe=v.iridescence>0;return{isWebGL2:u,shaderID:te,shaderName:v.type,vertexShader:q,fragmentShader:le,defines:v.defines,customVertexShaderID:me,customFragmentShaderID:Se,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:g,instancing:ae.isInstancedMesh===!0,instancingColor:ae.isInstancedMesh===!0&&ae.instanceColor!==null,supportsVertexTextures:d,outputEncoding:X===null?s.outputEncoding:X.isXRRenderTarget===!0?X.texture.encoding:An,map:!!v.map,matcap:!!v.matcap,envMap:!!oe,envMapMode:oe&&oe.mapping,envMapCubeUVHeight:ue,lightMap:!!v.lightMap,aoMap:!!v.aoMap,emissiveMap:!!v.emissiveMap,bumpMap:!!v.bumpMap,normalMap:!!v.normalMap,objectSpaceNormalMap:v.normalMapType===zl,tangentSpaceNormalMap:v.normalMapType===Ol,decodeVideoTexture:!!v.map&&v.map.isVideoTexture===!0&&v.map.encoding===st,clearcoat:be,clearcoatMap:be&&!!v.clearcoatMap,clearcoatRoughnessMap:be&&!!v.clearcoatRoughnessMap,clearcoatNormalMap:be&&!!v.clearcoatNormalMap,iridescence:Oe,iridescenceMap:Oe&&!!v.iridescenceMap,iridescenceThicknessMap:Oe&&!!v.iridescenceThicknessMap,displacementMap:!!v.displacementMap,roughnessMap:!!v.roughnessMap,metalnessMap:!!v.metalnessMap,specularMap:!!v.specularMap,specularIntensityMap:!!v.specularIntensityMap,specularColorMap:!!v.specularColorMap,opaque:v.transparent===!1&&v.blending===Mi,alphaMap:!!v.alphaMap,alphaTest:He,gradientMap:!!v.gradientMap,sheen:v.sheen>0,sheenColorMap:!!v.sheenColorMap,sheenRoughnessMap:!!v.sheenRoughnessMap,transmission:v.transmission>0,transmissionMap:!!v.transmissionMap,thicknessMap:!!v.thicknessMap,combine:v.combine,vertexTangents:!!v.normalMap&&!!U.attributes.tangent,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!U.attributes.color&&U.attributes.color.itemSize===4,vertexUvs:!!v.map||!!v.bumpMap||!!v.normalMap||!!v.specularMap||!!v.alphaMap||!!v.emissiveMap||!!v.roughnessMap||!!v.metalnessMap||!!v.clearcoatMap||!!v.clearcoatRoughnessMap||!!v.clearcoatNormalMap||!!v.iridescenceMap||!!v.iridescenceThicknessMap||!!v.displacementMap||!!v.transmissionMap||!!v.thicknessMap||!!v.specularIntensityMap||!!v.specularColorMap||!!v.sheenColorMap||!!v.sheenRoughnessMap,uvsVertexOnly:!(v.map||v.bumpMap||v.normalMap||v.specularMap||v.alphaMap||v.emissiveMap||v.roughnessMap||v.metalnessMap||v.clearcoatNormalMap||v.iridescenceMap||v.iridescenceThicknessMap||v.transmission>0||v.transmissionMap||v.thicknessMap||v.specularIntensityMap||v.specularColorMap||v.sheen>0||v.sheenColorMap||v.sheenRoughnessMap)&&!!v.displacementMap,fog:!!z,useFog:v.fog===!0,fogExp2:z&&z.isFogExp2,flatShading:!!v.flatShading,sizeAttenuation:v.sizeAttenuation,logarithmicDepthBuffer:h,skinning:ae.isSkinnedMesh===!0,morphTargets:U.morphAttributes.position!==void 0,morphNormals:U.morphAttributes.normal!==void 0,morphColors:U.morphAttributes.color!==void 0,morphTargetsCount:re,morphTextureStride:Z,numDirLights:R.directional.length,numPointLights:R.point.length,numSpotLights:R.spot.length,numSpotLightMaps:R.spotLightMap.length,numRectAreaLights:R.rectArea.length,numHemiLights:R.hemi.length,numDirLightShadows:R.directionalShadowMap.length,numPointLightShadows:R.pointShadowMap.length,numSpotLightShadows:R.spotShadowMap.length,numSpotLightShadowsWithMaps:R.numSpotLightShadowsWithMaps,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:v.dithering,shadowMapEnabled:s.shadowMap.enabled&&H.length>0,shadowMapType:s.shadowMap.type,toneMapping:v.toneMapped?s.toneMapping:En,physicallyCorrectLights:s.physicallyCorrectLights,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Ds,flipSided:v.side===Jt,useDepthPacking:!!v.depthPacking,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionDerivatives:v.extensions&&v.extensions.derivatives,extensionFragDepth:v.extensions&&v.extensions.fragDepth,extensionDrawBuffers:v.extensions&&v.extensions.drawBuffers,extensionShaderTextureLOD:v.extensions&&v.extensions.shaderTextureLOD,rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),customProgramCacheKey:v.customProgramCacheKey()}}function f(v){const R=[];if(v.shaderID?R.push(v.shaderID):(R.push(v.customVertexShaderID),R.push(v.customFragmentShaderID)),v.defines!==void 0)for(const H in v.defines)R.push(H),R.push(v.defines[H]);return v.isRawShaderMaterial===!1&&(M(R,v),C(R,v),R.push(s.outputEncoding)),R.push(v.customProgramCacheKey),R.join()}function M(v,R){v.push(R.precision),v.push(R.outputEncoding),v.push(R.envMapMode),v.push(R.envMapCubeUVHeight),v.push(R.combine),v.push(R.vertexUvs),v.push(R.fogExp2),v.push(R.sizeAttenuation),v.push(R.morphTargetsCount),v.push(R.morphAttributeCount),v.push(R.numDirLights),v.push(R.numPointLights),v.push(R.numSpotLights),v.push(R.numSpotLightMaps),v.push(R.numHemiLights),v.push(R.numRectAreaLights),v.push(R.numDirLightShadows),v.push(R.numPointLightShadows),v.push(R.numSpotLightShadows),v.push(R.numSpotLightShadowsWithMaps),v.push(R.shadowMapType),v.push(R.toneMapping),v.push(R.numClippingPlanes),v.push(R.numClipIntersection),v.push(R.depthPacking)}function C(v,R){a.disableAll(),R.isWebGL2&&a.enable(0),R.supportsVertexTextures&&a.enable(1),R.instancing&&a.enable(2),R.instancingColor&&a.enable(3),R.map&&a.enable(4),R.matcap&&a.enable(5),R.envMap&&a.enable(6),R.lightMap&&a.enable(7),R.aoMap&&a.enable(8),R.emissiveMap&&a.enable(9),R.bumpMap&&a.enable(10),R.normalMap&&a.enable(11),R.objectSpaceNormalMap&&a.enable(12),R.tangentSpaceNormalMap&&a.enable(13),R.clearcoat&&a.enable(14),R.clearcoatMap&&a.enable(15),R.clearcoatRoughnessMap&&a.enable(16),R.clearcoatNormalMap&&a.enable(17),R.iridescence&&a.enable(18),R.iridescenceMap&&a.enable(19),R.iridescenceThicknessMap&&a.enable(20),R.displacementMap&&a.enable(21),R.specularMap&&a.enable(22),R.roughnessMap&&a.enable(23),R.metalnessMap&&a.enable(24),R.gradientMap&&a.enable(25),R.alphaMap&&a.enable(26),R.alphaTest&&a.enable(27),R.vertexColors&&a.enable(28),R.vertexAlphas&&a.enable(29),R.vertexUvs&&a.enable(30),R.vertexTangents&&a.enable(31),R.uvsVertexOnly&&a.enable(32),v.push(a.mask),a.disableAll(),R.fog&&a.enable(0),R.useFog&&a.enable(1),R.flatShading&&a.enable(2),R.logarithmicDepthBuffer&&a.enable(3),R.skinning&&a.enable(4),R.morphTargets&&a.enable(5),R.morphNormals&&a.enable(6),R.morphColors&&a.enable(7),R.premultipliedAlpha&&a.enable(8),R.shadowMapEnabled&&a.enable(9),R.physicallyCorrectLights&&a.enable(10),R.doubleSided&&a.enable(11),R.flipSided&&a.enable(12),R.useDepthPacking&&a.enable(13),R.dithering&&a.enable(14),R.specularIntensityMap&&a.enable(15),R.specularColorMap&&a.enable(16),R.transmission&&a.enable(17),R.transmissionMap&&a.enable(18),R.thicknessMap&&a.enable(19),R.sheen&&a.enable(20),R.sheenColorMap&&a.enable(21),R.sheenRoughnessMap&&a.enable(22),R.decodeVideoTexture&&a.enable(23),R.opaque&&a.enable(24),v.push(a.mask)}function w(v){const R=x[v.type];let H;if(R){const ne=dn[R];H=Ts.clone(ne.uniforms)}else H=v.uniforms;return H}function T(v,R){let H;for(let ne=0,ae=l.length;ne<ae;ne++){const z=l[ne];if(z.cacheKey===R){H=z,++H.usedTimes;break}}return H===void 0&&(H=new hf(s,R,v,r),l.push(H)),H}function E(v){if(--v.usedTimes===0){const R=l.indexOf(v);l[R]=l[l.length-1],l.pop(),v.destroy()}}function N(v){c.remove(v)}function B(){c.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:w,acquireProgram:T,releaseProgram:E,releaseShaderCache:N,programs:l,dispose:B}}function gf(){let s=new WeakMap;function e(r){let o=s.get(r);return o===void 0&&(o={},s.set(r,o)),o}function t(r){s.delete(r)}function n(r,o,a){s.get(r)[o]=a}function i(){s=new WeakMap}return{get:e,remove:t,update:n,dispose:i}}function _f(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function Va(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function Wa(){const s=[];let e=0;const t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(h,d,g,x,m,f){let M=s[e];return M===void 0?(M={id:h.id,object:h,geometry:d,material:g,groupOrder:x,renderOrder:h.renderOrder,z:m,group:f},s[e]=M):(M.id=h.id,M.object=h,M.geometry=d,M.material=g,M.groupOrder=x,M.renderOrder=h.renderOrder,M.z=m,M.group=f),e++,M}function a(h,d,g,x,m,f){const M=o(h,d,g,x,m,f);g.transmission>0?n.push(M):g.transparent===!0?i.push(M):t.push(M)}function c(h,d,g,x,m,f){const M=o(h,d,g,x,m,f);g.transmission>0?n.unshift(M):g.transparent===!0?i.unshift(M):t.unshift(M)}function l(h,d){t.length>1&&t.sort(h||_f),n.length>1&&n.sort(d||Va),i.length>1&&i.sort(d||Va)}function u(){for(let h=e,d=s.length;h<d;h++){const g=s[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:a,unshift:c,finish:u,sort:l}}function xf(){let s=new WeakMap;function e(n,i){const r=s.get(n);let o;return r===void 0?(o=new Wa,s.set(n,[o])):i>=r.length?(o=new Wa,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function vf(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new W,color:new je};break;case"SpotLight":t={position:new W,direction:new W,color:new je,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new W,color:new je,distance:0,decay:0};break;case"HemisphereLight":t={direction:new W,skyColor:new je,groundColor:new je};break;case"RectAreaLight":t={color:new je,position:new W,halfWidth:new W,halfHeight:new W};break}return s[e.id]=t,t}}}function Sf(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let Mf=0;function yf(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function bf(s,e){const t=new vf,n=Sf(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0};for(let u=0;u<9;u++)i.probe.push(new W);const r=new W,o=new vt,a=new vt;function c(u,h){let d=0,g=0,x=0;for(let ne=0;ne<9;ne++)i.probe[ne].set(0,0,0);let m=0,f=0,M=0,C=0,w=0,T=0,E=0,N=0,B=0,v=0;u.sort(yf);const R=h!==!0?Math.PI:1;for(let ne=0,ae=u.length;ne<ae;ne++){const z=u[ne],U=z.color,ee=z.intensity,oe=z.distance,ue=z.shadow&&z.shadow.map?z.shadow.map.texture:null;if(z.isAmbientLight)d+=U.r*ee*R,g+=U.g*ee*R,x+=U.b*ee*R;else if(z.isLightProbe)for(let te=0;te<9;te++)i.probe[te].addScaledVector(z.sh.coefficients[te],ee);else if(z.isDirectionalLight){const te=t.get(z);if(te.color.copy(z.color).multiplyScalar(z.intensity*R),z.castShadow){const ge=z.shadow,re=n.get(z);re.shadowBias=ge.bias,re.shadowNormalBias=ge.normalBias,re.shadowRadius=ge.radius,re.shadowMapSize=ge.mapSize,i.directionalShadow[m]=re,i.directionalShadowMap[m]=ue,i.directionalShadowMatrix[m]=z.shadow.matrix,T++}i.directional[m]=te,m++}else if(z.isSpotLight){const te=t.get(z);te.position.setFromMatrixPosition(z.matrixWorld),te.color.copy(U).multiplyScalar(ee*R),te.distance=oe,te.coneCos=Math.cos(z.angle),te.penumbraCos=Math.cos(z.angle*(1-z.penumbra)),te.decay=z.decay,i.spot[M]=te;const ge=z.shadow;if(z.map&&(i.spotLightMap[B]=z.map,B++,ge.updateMatrices(z),z.castShadow&&v++),i.spotLightMatrix[M]=ge.matrix,z.castShadow){const re=n.get(z);re.shadowBias=ge.bias,re.shadowNormalBias=ge.normalBias,re.shadowRadius=ge.radius,re.shadowMapSize=ge.mapSize,i.spotShadow[M]=re,i.spotShadowMap[M]=ue,N++}M++}else if(z.isRectAreaLight){const te=t.get(z);te.color.copy(U).multiplyScalar(ee),te.halfWidth.set(z.width*.5,0,0),te.halfHeight.set(0,z.height*.5,0),i.rectArea[C]=te,C++}else if(z.isPointLight){const te=t.get(z);if(te.color.copy(z.color).multiplyScalar(z.intensity*R),te.distance=z.distance,te.decay=z.decay,z.castShadow){const ge=z.shadow,re=n.get(z);re.shadowBias=ge.bias,re.shadowNormalBias=ge.normalBias,re.shadowRadius=ge.radius,re.shadowMapSize=ge.mapSize,re.shadowCameraNear=ge.camera.near,re.shadowCameraFar=ge.camera.far,i.pointShadow[f]=re,i.pointShadowMap[f]=ue,i.pointShadowMatrix[f]=z.shadow.matrix,E++}i.point[f]=te,f++}else if(z.isHemisphereLight){const te=t.get(z);te.skyColor.copy(z.color).multiplyScalar(ee*R),te.groundColor.copy(z.groundColor).multiplyScalar(ee*R),i.hemi[w]=te,w++}}C>0&&(e.isWebGL2||s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ve.LTC_FLOAT_1,i.rectAreaLTC2=ve.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=ve.LTC_HALF_1,i.rectAreaLTC2=ve.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=d,i.ambient[1]=g,i.ambient[2]=x;const H=i.hash;(H.directionalLength!==m||H.pointLength!==f||H.spotLength!==M||H.rectAreaLength!==C||H.hemiLength!==w||H.numDirectionalShadows!==T||H.numPointShadows!==E||H.numSpotShadows!==N||H.numSpotMaps!==B)&&(i.directional.length=m,i.spot.length=M,i.rectArea.length=C,i.point.length=f,i.hemi.length=w,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.pointShadow.length=E,i.pointShadowMap.length=E,i.spotShadow.length=N,i.spotShadowMap.length=N,i.directionalShadowMatrix.length=T,i.pointShadowMatrix.length=E,i.spotLightMatrix.length=N+B-v,i.spotLightMap.length=B,i.numSpotLightShadowsWithMaps=v,H.directionalLength=m,H.pointLength=f,H.spotLength=M,H.rectAreaLength=C,H.hemiLength=w,H.numDirectionalShadows=T,H.numPointShadows=E,H.numSpotShadows=N,H.numSpotMaps=B,i.version=Mf++)}function l(u,h){let d=0,g=0,x=0,m=0,f=0;const M=h.matrixWorldInverse;for(let C=0,w=u.length;C<w;C++){const T=u[C];if(T.isDirectionalLight){const E=i.directional[d];E.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(M),d++}else if(T.isSpotLight){const E=i.spot[x];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),E.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(M),x++}else if(T.isRectAreaLight){const E=i.rectArea[m];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),a.identity(),o.copy(T.matrixWorld),o.premultiply(M),a.extractRotation(o),E.halfWidth.set(T.width*.5,0,0),E.halfHeight.set(0,T.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),m++}else if(T.isPointLight){const E=i.point[g];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(M),g++}else if(T.isHemisphereLight){const E=i.hemi[f];E.direction.setFromMatrixPosition(T.matrixWorld),E.direction.transformDirection(M),f++}}}return{setup:c,setupView:l,state:i}}function Xa(s,e){const t=new bf(s,e),n=[],i=[];function r(){n.length=0,i.length=0}function o(h){n.push(h)}function a(h){i.push(h)}function c(h){t.setup(n,h)}function l(h){t.setupView(n,h)}return{init:r,state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:c,setupLightsView:l,pushLight:o,pushShadow:a}}function wf(s,e){let t=new WeakMap;function n(r,o=0){const a=t.get(r);let c;return a===void 0?(c=new Xa(s,e),t.set(r,[c])):o>=a.length?(c=new Xa(s,e),a.push(c)):c=a[o],c}function i(){t=new WeakMap}return{get:n,dispose:i}}class Tf extends Rr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ul,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Ef extends Rr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.referencePosition=new W,this.nearDistance=1,this.farDistance=1e3,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.referencePosition.copy(e.referencePosition),this.nearDistance=e.nearDistance,this.farDistance=e.farDistance,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Af=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Cf=`uniform sampler2D shadow_pass;
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
}`;function Rf(s,e,t){let n=new Is;const i=new Ge,r=new Ge,o=new Et,a=new Tf({depthPacking:Fl}),c=new Ef,l={},u=t.maxTextureSize,h={0:Jt,1:jn,2:Ds},d=new ln({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ge},radius:{value:4}},vertexShader:Af,fragmentShader:Cf}),g=d.clone();g.defines.HORIZONTAL_PASS=1;const x=new Cn;x.setAttribute("position",new jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const m=new on(x,d),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ls,this.render=function(T,E,N){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||T.length===0)return;const B=s.getRenderTarget(),v=s.getActiveCubeFace(),R=s.getActiveMipmapLevel(),H=s.state;H.setBlending(Fn),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);for(let ne=0,ae=T.length;ne<ae;ne++){const z=T[ne],U=z.shadow;if(U===void 0){console.warn("THREE.WebGLShadowMap:",z,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;i.copy(U.mapSize);const ee=U.getFrameExtents();if(i.multiply(ee),r.copy(U.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(r.x=Math.floor(u/ee.x),i.x=r.x*ee.x,U.mapSize.x=r.x),i.y>u&&(r.y=Math.floor(u/ee.y),i.y=r.y*ee.y,U.mapSize.y=r.y)),U.map===null){const ue=this.type!==zi?{minFilter:wt,magFilter:wt}:{};U.map=new Kn(i.x,i.y,ue),U.map.texture.name=z.name+".shadowMap",U.camera.updateProjectionMatrix()}s.setRenderTarget(U.map),s.clear();const oe=U.getViewportCount();for(let ue=0;ue<oe;ue++){const te=U.getViewport(ue);o.set(r.x*te.x,r.y*te.y,r.x*te.z,r.y*te.w),H.viewport(o),U.updateMatrices(z,ue),n=U.getFrustum(),w(E,N,U.camera,z,this.type)}U.isPointLightShadow!==!0&&this.type===zi&&M(U,N),U.needsUpdate=!1}f.needsUpdate=!1,s.setRenderTarget(B,v,R)};function M(T,E){const N=e.update(m);d.defines.VSM_SAMPLES!==T.blurSamples&&(d.defines.VSM_SAMPLES=T.blurSamples,g.defines.VSM_SAMPLES=T.blurSamples,d.needsUpdate=!0,g.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new Kn(i.x,i.y)),d.uniforms.shadow_pass.value=T.map.texture,d.uniforms.resolution.value=T.mapSize,d.uniforms.radius.value=T.radius,s.setRenderTarget(T.mapPass),s.clear(),s.renderBufferDirect(E,null,N,d,m,null),g.uniforms.shadow_pass.value=T.mapPass.texture,g.uniforms.resolution.value=T.mapSize,g.uniforms.radius.value=T.radius,s.setRenderTarget(T.map),s.clear(),s.renderBufferDirect(E,null,N,g,m,null)}function C(T,E,N,B,v,R){let H=null;const ne=N.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(ne!==void 0)H=ne;else if(H=N.isPointLight===!0?c:a,s.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){const ae=H.uuid,z=E.uuid;let U=l[ae];U===void 0&&(U={},l[ae]=U);let ee=U[z];ee===void 0&&(ee=H.clone(),U[z]=ee),H=ee}return H.visible=E.visible,H.wireframe=E.wireframe,R===zi?H.side=E.shadowSide!==null?E.shadowSide:E.side:H.side=E.shadowSide!==null?E.shadowSide:h[E.side],H.alphaMap=E.alphaMap,H.alphaTest=E.alphaTest,H.map=E.map,H.clipShadows=E.clipShadows,H.clippingPlanes=E.clippingPlanes,H.clipIntersection=E.clipIntersection,H.displacementMap=E.displacementMap,H.displacementScale=E.displacementScale,H.displacementBias=E.displacementBias,H.wireframeLinewidth=E.wireframeLinewidth,H.linewidth=E.linewidth,N.isPointLight===!0&&H.isMeshDistanceMaterial===!0&&(H.referencePosition.setFromMatrixPosition(N.matrixWorld),H.nearDistance=B,H.farDistance=v),H}function w(T,E,N,B,v){if(T.visible===!1)return;if(T.layers.test(E.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&v===zi)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,T.matrixWorld);const ne=e.update(T),ae=T.material;if(Array.isArray(ae)){const z=ne.groups;for(let U=0,ee=z.length;U<ee;U++){const oe=z[U],ue=ae[oe.materialIndex];if(ue&&ue.visible){const te=C(T,ue,B,N.near,N.far,v);s.renderBufferDirect(N,null,ne,te,T,oe)}}}else if(ae.visible){const z=C(T,ae,B,N.near,N.far,v);s.renderBufferDirect(N,null,ne,z,T,null)}}const H=T.children;for(let ne=0,ae=H.length;ne<ae;ne++)w(H[ne],E,N,B,v)}}function Lf(s,e,t){const n=t.isWebGL2;function i(){let I=!1;const P=new Et;let he=null;const Ae=new Et(0,0,0,0);return{setMask:function(Ie){he!==Ie&&!I&&(s.colorMask(Ie,Ie,Ie,Ie),he=Ie)},setLocked:function(Ie){I=Ie},setClear:function(Ie,Je,mt,yt,pn){pn===!0&&(Ie*=yt,Je*=yt,mt*=yt),P.set(Ie,Je,mt,yt),Ae.equals(P)===!1&&(s.clearColor(Ie,Je,mt,yt),Ae.copy(P))},reset:function(){I=!1,he=null,Ae.set(-1,0,0,0)}}}function r(){let I=!1,P=null,he=null,Ae=null;return{setTest:function(Ie){Ie?He(2929):be(2929)},setMask:function(Ie){P!==Ie&&!I&&(s.depthMask(Ie),P=Ie)},setFunc:function(Ie){if(he!==Ie){switch(Ie){case sl:s.depthFunc(512);break;case al:s.depthFunc(519);break;case ol:s.depthFunc(513);break;case vs:s.depthFunc(515);break;case ll:s.depthFunc(514);break;case cl:s.depthFunc(518);break;case ul:s.depthFunc(516);break;case hl:s.depthFunc(517);break;default:s.depthFunc(515)}he=Ie}},setLocked:function(Ie){I=Ie},setClear:function(Ie){Ae!==Ie&&(s.clearDepth(Ie),Ae=Ie)},reset:function(){I=!1,P=null,he=null,Ae=null}}}function o(){let I=!1,P=null,he=null,Ae=null,Ie=null,Je=null,mt=null,yt=null,pn=null;return{setTest:function(nt){I||(nt?He(2960):be(2960))},setMask:function(nt){P!==nt&&!I&&(s.stencilMask(nt),P=nt)},setFunc:function(nt,Qt,Ot){(he!==nt||Ae!==Qt||Ie!==Ot)&&(s.stencilFunc(nt,Qt,Ot),he=nt,Ae=Qt,Ie=Ot)},setOp:function(nt,Qt,Ot){(Je!==nt||mt!==Qt||yt!==Ot)&&(s.stencilOp(nt,Qt,Ot),Je=nt,mt=Qt,yt=Ot)},setLocked:function(nt){I=nt},setClear:function(nt){pn!==nt&&(s.clearStencil(nt),pn=nt)},reset:function(){I=!1,P=null,he=null,Ae=null,Ie=null,Je=null,mt=null,yt=null,pn=null}}}const a=new i,c=new r,l=new o,u=new WeakMap,h=new WeakMap;let d={},g={},x=new WeakMap,m=[],f=null,M=!1,C=null,w=null,T=null,E=null,N=null,B=null,v=null,R=!1,H=null,ne=null,ae=null,z=null,U=null;const ee=s.getParameter(35661);let oe=!1,ue=0;const te=s.getParameter(7938);te.indexOf("WebGL")!==-1?(ue=parseFloat(/^WebGL (\d)/.exec(te)[1]),oe=ue>=1):te.indexOf("OpenGL ES")!==-1&&(ue=parseFloat(/^OpenGL ES (\d)/.exec(te)[1]),oe=ue>=2);let ge=null,re={};const Z=s.getParameter(3088),q=s.getParameter(2978),le=new Et().fromArray(Z),me=new Et().fromArray(q);function Se(I,P,he){const Ae=new Uint8Array(4),Ie=s.createTexture();s.bindTexture(I,Ie),s.texParameteri(I,10241,9728),s.texParameteri(I,10240,9728);for(let Je=0;Je<he;Je++)s.texImage2D(P+Je,0,6408,1,1,0,6408,5121,Ae);return Ie}const X={};X[3553]=Se(3553,3553,1),X[34067]=Se(34067,34069,6),a.setClear(0,0,0,1),c.setClear(1),l.setClear(0),He(2929),c.setFunc(vs),pt(!1),Ct(Fs),He(2884),ut(Fn);function He(I){d[I]!==!0&&(s.enable(I),d[I]=!0)}function be(I){d[I]!==!1&&(s.disable(I),d[I]=!1)}function Oe(I,P){return g[I]!==P?(s.bindFramebuffer(I,P),g[I]=P,n&&(I===36009&&(g[36160]=P),I===36160&&(g[36009]=P)),!0):!1}function Re(I,P){let he=m,Ae=!1;if(I)if(he=x.get(P),he===void 0&&(he=[],x.set(P,he)),I.isWebGLMultipleRenderTargets){const Ie=I.texture;if(he.length!==Ie.length||he[0]!==36064){for(let Je=0,mt=Ie.length;Je<mt;Je++)he[Je]=36064+Je;he.length=Ie.length,Ae=!0}}else he[0]!==36064&&(he[0]=36064,Ae=!0);else he[0]!==1029&&(he[0]=1029,Ae=!0);Ae&&(t.isWebGL2?s.drawBuffers(he):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(he))}function $e(I){return f!==I?(s.useProgram(I),f=I,!0):!1}const Xe={[_i]:32774,[Zo]:32778,[jo]:32779};if(n)Xe[ks]=32775,Xe[Gs]=32776;else{const I=e.get("EXT_blend_minmax");I!==null&&(Xe[ks]=I.MIN_EXT,Xe[Gs]=I.MAX_EXT)}const Fe={[$o]:0,[Ko]:1,[Jo]:768,[lo]:770,[rl]:776,[nl]:774,[el]:772,[Qo]:769,[co]:771,[il]:775,[tl]:773};function ut(I,P,he,Ae,Ie,Je,mt,yt){if(I===Fn){M===!0&&(be(3042),M=!1);return}if(M===!1&&(He(3042),M=!0),I!==Yo){if(I!==C||yt!==R){if((w!==_i||N!==_i)&&(s.blendEquation(32774),w=_i,N=_i),yt)switch(I){case Mi:s.blendFuncSeparate(1,771,1,771);break;case Os:s.blendFunc(1,1);break;case zs:s.blendFuncSeparate(0,769,0,1);break;case Bs:s.blendFuncSeparate(0,768,0,770);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}else switch(I){case Mi:s.blendFuncSeparate(770,771,1,771);break;case Os:s.blendFunc(770,1);break;case zs:s.blendFuncSeparate(0,769,0,1);break;case Bs:s.blendFunc(0,768);break;default:console.error("THREE.WebGLState: Invalid blending: ",I);break}T=null,E=null,B=null,v=null,C=I,R=yt}return}Ie=Ie||P,Je=Je||he,mt=mt||Ae,(P!==w||Ie!==N)&&(s.blendEquationSeparate(Xe[P],Xe[Ie]),w=P,N=Ie),(he!==T||Ae!==E||Je!==B||mt!==v)&&(s.blendFuncSeparate(Fe[he],Fe[Ae],Fe[Je],Fe[mt]),T=he,E=Ae,B=Je,v=mt),C=I,R=!1}function ht(I,P){I.side===Ds?be(2884):He(2884);let he=I.side===Jt;P&&(he=!he),pt(he),I.blending===Mi&&I.transparent===!1?ut(Fn):ut(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.premultipliedAlpha),c.setFunc(I.depthFunc),c.setTest(I.depthTest),c.setMask(I.depthWrite),a.setMask(I.colorWrite);const Ae=I.stencilWrite;l.setTest(Ae),Ae&&(l.setMask(I.stencilWriteMask),l.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),l.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),Ke(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?He(32926):be(32926)}function pt(I){H!==I&&(I?s.frontFace(2304):s.frontFace(2305),H=I)}function Ct(I){I!==Wo?(He(2884),I!==ne&&(I===Fs?s.cullFace(1029):I===Xo?s.cullFace(1028):s.cullFace(1032))):be(2884),ne=I}function lt(I){I!==ae&&(oe&&s.lineWidth(I),ae=I)}function Ke(I,P,he){I?(He(32823),(z!==P||U!==he)&&(s.polygonOffset(P,he),z=P,U=he)):be(32823)}function Ft(I){I?He(3089):be(3089)}function Lt(I){I===void 0&&(I=33984+ee-1),ge!==I&&(s.activeTexture(I),ge=I)}function A(I,P,he){he===void 0&&(ge===null?he=33984+ee-1:he=ge);let Ae=re[he];Ae===void 0&&(Ae={type:void 0,texture:void 0},re[he]=Ae),(Ae.type!==I||Ae.texture!==P)&&(ge!==he&&(s.activeTexture(he),ge=he),s.bindTexture(I,P||X[I]),Ae.type=I,Ae.texture=P)}function S(){const I=re[ge];I!==void 0&&I.type!==void 0&&(s.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function $(){try{s.compressedTexImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function de(){try{s.compressedTexImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function _e(){try{s.texSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function ye(){try{s.texSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function D(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function K(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Y(){try{s.texStorage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Te(){try{s.texStorage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Le(){try{s.texImage2D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function we(){try{s.texImage3D.apply(s,arguments)}catch(I){console.error("THREE.WebGLState:",I)}}function Ee(I){le.equals(I)===!1&&(s.scissor(I.x,I.y,I.z,I.w),le.copy(I))}function Pe(I){me.equals(I)===!1&&(s.viewport(I.x,I.y,I.z,I.w),me.copy(I))}function ze(I,P){let he=h.get(P);he===void 0&&(he=new WeakMap,h.set(P,he));let Ae=he.get(I);Ae===void 0&&(Ae=s.getUniformBlockIndex(P,I.name),he.set(I,Ae))}function Be(I,P){const Ae=h.get(P).get(I);u.get(P)!==Ae&&(s.uniformBlockBinding(P,Ae,I.__bindingPointIndex),u.set(P,Ae))}function Ye(){s.disable(3042),s.disable(2884),s.disable(2929),s.disable(32823),s.disable(3089),s.disable(2960),s.disable(32926),s.blendEquation(32774),s.blendFunc(1,0),s.blendFuncSeparate(1,0,1,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(513),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(519,0,4294967295),s.stencilOp(7680,7680,7680),s.clearStencil(0),s.cullFace(1029),s.frontFace(2305),s.polygonOffset(0,0),s.activeTexture(33984),s.bindFramebuffer(36160,null),n===!0&&(s.bindFramebuffer(36009,null),s.bindFramebuffer(36008,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),d={},ge=null,re={},g={},x=new WeakMap,m=[],f=null,M=!1,C=null,w=null,T=null,E=null,N=null,B=null,v=null,R=!1,H=null,ne=null,ae=null,z=null,U=null,le.set(0,0,s.canvas.width,s.canvas.height),me.set(0,0,s.canvas.width,s.canvas.height),a.reset(),c.reset(),l.reset()}return{buffers:{color:a,depth:c,stencil:l},enable:He,disable:be,bindFramebuffer:Oe,drawBuffers:Re,useProgram:$e,setBlending:ut,setMaterial:ht,setFlipSided:pt,setCullFace:Ct,setLineWidth:lt,setPolygonOffset:Ke,setScissorTest:Ft,activeTexture:Lt,bindTexture:A,unbindTexture:S,compressedTexImage2D:$,compressedTexImage3D:de,texImage2D:Le,texImage3D:we,updateUBOMapping:ze,uniformBlockBinding:Be,texStorage2D:Y,texStorage3D:Te,texSubImage2D:_e,texSubImage3D:ye,compressedTexSubImage2D:D,compressedTexSubImage3D:K,scissor:Ee,viewport:Pe,reset:Ye}}function Df(s,e,t,n,i,r,o){const a=i.isWebGL2,c=i.maxTextures,l=i.maxCubemapSize,u=i.maxTextureSize,h=i.maxSamples,d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,g=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),x=new WeakMap;let m;const f=new WeakMap;let M=!1;try{M=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function C(A,S){return M?new OffscreenCanvas(A,S):Ar("canvas")}function w(A,S,$,de){let _e=1;if((A.width>de||A.height>de)&&(_e=de/Math.max(A.width,A.height)),_e<1||S===!0)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){const ye=S?ws:Math.floor,D=ye(_e*A.width),K=ye(_e*A.height);m===void 0&&(m=C(D,K));const Y=$?C(D,K):m;return Y.width=D,Y.height=K,Y.getContext("2d").drawImage(A,0,0,D,K),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+A.width+"x"+A.height+") to ("+D+"x"+K+")."),Y}else return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+A.width+"x"+A.height+")."),A;return A}function T(A){return fa(A.width)&&fa(A.height)}function E(A){return a?!1:A.wrapS!==qt||A.wrapT!==qt||A.minFilter!==wt&&A.minFilter!==Tt}function N(A,S){return A.generateMipmaps&&S&&A.minFilter!==wt&&A.minFilter!==Tt}function B(A){s.generateMipmap(A)}function v(A,S,$,de,_e=!1){if(a===!1)return S;if(A!==null){if(s[A]!==void 0)return s[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ye=S;return S===6403&&($===5126&&(ye=33326),$===5131&&(ye=33325),$===5121&&(ye=33321)),S===33319&&($===5126&&(ye=33328),$===5131&&(ye=33327),$===5121&&(ye=33323)),S===6408&&($===5126&&(ye=34836),$===5131&&(ye=34842),$===5121&&(ye=de===st&&_e===!1?35907:32856),$===32819&&(ye=32854),$===32820&&(ye=32855)),(ye===33325||ye===33326||ye===33327||ye===33328||ye===34842||ye===34836)&&e.get("EXT_color_buffer_float"),ye}function R(A,S,$){return N(A,$)===!0||A.isFramebufferTexture&&A.minFilter!==wt&&A.minFilter!==Tt?Math.log2(Math.max(S.width,S.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?S.mipmaps.length:1}function H(A){return A===wt||A===Hs||A===Nr?9728:9729}function ne(A){const S=A.target;S.removeEventListener("dispose",ne),z(S),S.isVideoTexture&&x.delete(S)}function ae(A){const S=A.target;S.removeEventListener("dispose",ae),ee(S)}function z(A){const S=n.get(A);if(S.__webglInit===void 0)return;const $=A.source,de=f.get($);if(de){const _e=de[S.__cacheKey];_e.usedTimes--,_e.usedTimes===0&&U(A),Object.keys(de).length===0&&f.delete($)}n.remove(A)}function U(A){const S=n.get(A);s.deleteTexture(S.__webglTexture);const $=A.source,de=f.get($);delete de[S.__cacheKey],o.memory.textures--}function ee(A){const S=A.texture,$=n.get(A),de=n.get(S);if(de.__webglTexture!==void 0&&(s.deleteTexture(de.__webglTexture),o.memory.textures--),A.depthTexture&&A.depthTexture.dispose(),A.isWebGLCubeRenderTarget)for(let _e=0;_e<6;_e++)s.deleteFramebuffer($.__webglFramebuffer[_e]),$.__webglDepthbuffer&&s.deleteRenderbuffer($.__webglDepthbuffer[_e]);else{if(s.deleteFramebuffer($.__webglFramebuffer),$.__webglDepthbuffer&&s.deleteRenderbuffer($.__webglDepthbuffer),$.__webglMultisampledFramebuffer&&s.deleteFramebuffer($.__webglMultisampledFramebuffer),$.__webglColorRenderbuffer)for(let _e=0;_e<$.__webglColorRenderbuffer.length;_e++)$.__webglColorRenderbuffer[_e]&&s.deleteRenderbuffer($.__webglColorRenderbuffer[_e]);$.__webglDepthRenderbuffer&&s.deleteRenderbuffer($.__webglDepthRenderbuffer)}if(A.isWebGLMultipleRenderTargets)for(let _e=0,ye=S.length;_e<ye;_e++){const D=n.get(S[_e]);D.__webglTexture&&(s.deleteTexture(D.__webglTexture),o.memory.textures--),n.remove(S[_e])}n.remove(S),n.remove(A)}let oe=0;function ue(){oe=0}function te(){const A=oe;return A>=c&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+c),oe+=1,A}function ge(A){const S=[];return S.push(A.wrapS),S.push(A.wrapT),S.push(A.wrapR||0),S.push(A.magFilter),S.push(A.minFilter),S.push(A.anisotropy),S.push(A.internalFormat),S.push(A.format),S.push(A.type),S.push(A.generateMipmaps),S.push(A.premultiplyAlpha),S.push(A.flipY),S.push(A.unpackAlignment),S.push(A.encoding),S.join()}function re(A,S){const $=n.get(A);if(A.isVideoTexture&&Ft(A),A.isRenderTargetTexture===!1&&A.version>0&&$.__version!==A.version){const de=A.image;if(de===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(de.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{be($,A,S);return}}t.bindTexture(3553,$.__webglTexture,33984+S)}function Z(A,S){const $=n.get(A);if(A.version>0&&$.__version!==A.version){be($,A,S);return}t.bindTexture(35866,$.__webglTexture,33984+S)}function q(A,S){const $=n.get(A);if(A.version>0&&$.__version!==A.version){be($,A,S);return}t.bindTexture(32879,$.__webglTexture,33984+S)}function le(A,S){const $=n.get(A);if(A.version>0&&$.__version!==A.version){Oe($,A,S);return}t.bindTexture(34067,$.__webglTexture,33984+S)}const me={[Er]:10497,[qt]:33071,[ys]:33648},Se={[wt]:9728,[Hs]:9984,[Nr]:9986,[Tt]:9729,[vl]:9985,[Ti]:9987};function X(A,S,$){if($?(s.texParameteri(A,10242,me[S.wrapS]),s.texParameteri(A,10243,me[S.wrapT]),(A===32879||A===35866)&&s.texParameteri(A,32882,me[S.wrapR]),s.texParameteri(A,10240,Se[S.magFilter]),s.texParameteri(A,10241,Se[S.minFilter])):(s.texParameteri(A,10242,33071),s.texParameteri(A,10243,33071),(A===32879||A===35866)&&s.texParameteri(A,32882,33071),(S.wrapS!==qt||S.wrapT!==qt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),s.texParameteri(A,10240,H(S.magFilter)),s.texParameteri(A,10241,H(S.minFilter)),S.minFilter!==wt&&S.minFilter!==Tt&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),e.has("EXT_texture_filter_anisotropic")===!0){const de=e.get("EXT_texture_filter_anisotropic");if(S.magFilter===wt||S.minFilter!==Nr&&S.minFilter!==Ti||S.type===an&&e.has("OES_texture_float_linear")===!1||a===!1&&S.type===Tn&&e.has("OES_texture_half_float_linear")===!1)return;(S.anisotropy>1||n.get(S).__currentAnisotropy)&&(s.texParameterf(A,de.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy)}}function He(A,S){let $=!1;A.__webglInit===void 0&&(A.__webglInit=!0,S.addEventListener("dispose",ne));const de=S.source;let _e=f.get(de);_e===void 0&&(_e={},f.set(de,_e));const ye=ge(S);if(ye!==A.__cacheKey){_e[ye]===void 0&&(_e[ye]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,$=!0),_e[ye].usedTimes++;const D=_e[A.__cacheKey];D!==void 0&&(_e[A.__cacheKey].usedTimes--,D.usedTimes===0&&U(S)),A.__cacheKey=ye,A.__webglTexture=_e[ye].texture}return $}function be(A,S,$){let de=3553;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(de=35866),S.isData3DTexture&&(de=32879);const _e=He(A,S),ye=S.source;t.bindTexture(de,A.__webglTexture,33984+$);const D=n.get(ye);if(ye.version!==D.__version||_e===!0){t.activeTexture(33984+$),s.pixelStorei(37440,S.flipY),s.pixelStorei(37441,S.premultiplyAlpha),s.pixelStorei(3317,S.unpackAlignment),s.pixelStorei(37443,0);const K=E(S)&&T(S.image)===!1;let Y=w(S.image,K,!1,u);Y=Lt(S,Y);const Te=T(Y)||a,Le=r.convert(S.format,S.encoding);let we=r.convert(S.type),Ee=v(S.internalFormat,Le,we,S.encoding,S.isVideoTexture);X(de,S,Te);let Pe;const ze=S.mipmaps,Be=a&&S.isVideoTexture!==!0,Ye=D.__version===void 0||_e===!0,I=R(S,Y,Te);if(S.isDepthTexture)Ee=6402,a?S.type===an?Ee=36012:S.type===Xn?Ee=33190:S.type===yi?Ee=35056:Ee=33189:S.type===an&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),S.format===qn&&Ee===6402&&S.type!==fo&&S.type!==Xn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),S.type=Xn,we=r.convert(S.type)),S.format===Ei&&Ee===6402&&(Ee=34041,S.type!==yi&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),S.type=yi,we=r.convert(S.type))),Ye&&(Be?t.texStorage2D(3553,1,Ee,Y.width,Y.height):t.texImage2D(3553,0,Ee,Y.width,Y.height,0,Le,we,null));else if(S.isDataTexture)if(ze.length>0&&Te){Be&&Ye&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let P=0,he=ze.length;P<he;P++)Pe=ze[P],Be?t.texSubImage2D(3553,P,0,0,Pe.width,Pe.height,Le,we,Pe.data):t.texImage2D(3553,P,Ee,Pe.width,Pe.height,0,Le,we,Pe.data);S.generateMipmaps=!1}else Be?(Ye&&t.texStorage2D(3553,I,Ee,Y.width,Y.height),t.texSubImage2D(3553,0,0,0,Y.width,Y.height,Le,we,Y.data)):t.texImage2D(3553,0,Ee,Y.width,Y.height,0,Le,we,Y.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Be&&Ye&&t.texStorage3D(35866,I,Ee,ze[0].width,ze[0].height,Y.depth);for(let P=0,he=ze.length;P<he;P++)Pe=ze[P],S.format!==Yt?Le!==null?Be?t.compressedTexSubImage3D(35866,P,0,0,0,Pe.width,Pe.height,Y.depth,Le,Pe.data,0,0):t.compressedTexImage3D(35866,P,Ee,Pe.width,Pe.height,Y.depth,0,Pe.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?t.texSubImage3D(35866,P,0,0,0,Pe.width,Pe.height,Y.depth,Le,we,Pe.data):t.texImage3D(35866,P,Ee,Pe.width,Pe.height,Y.depth,0,Le,we,Pe.data)}else{Be&&Ye&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let P=0,he=ze.length;P<he;P++)Pe=ze[P],S.format!==Yt?Le!==null?Be?t.compressedTexSubImage2D(3553,P,0,0,Pe.width,Pe.height,Le,Pe.data):t.compressedTexImage2D(3553,P,Ee,Pe.width,Pe.height,0,Pe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Be?t.texSubImage2D(3553,P,0,0,Pe.width,Pe.height,Le,we,Pe.data):t.texImage2D(3553,P,Ee,Pe.width,Pe.height,0,Le,we,Pe.data)}else if(S.isDataArrayTexture)Be?(Ye&&t.texStorage3D(35866,I,Ee,Y.width,Y.height,Y.depth),t.texSubImage3D(35866,0,0,0,0,Y.width,Y.height,Y.depth,Le,we,Y.data)):t.texImage3D(35866,0,Ee,Y.width,Y.height,Y.depth,0,Le,we,Y.data);else if(S.isData3DTexture)Be?(Ye&&t.texStorage3D(32879,I,Ee,Y.width,Y.height,Y.depth),t.texSubImage3D(32879,0,0,0,0,Y.width,Y.height,Y.depth,Le,we,Y.data)):t.texImage3D(32879,0,Ee,Y.width,Y.height,Y.depth,0,Le,we,Y.data);else if(S.isFramebufferTexture){if(Ye)if(Be)t.texStorage2D(3553,I,Ee,Y.width,Y.height);else{let P=Y.width,he=Y.height;for(let Ae=0;Ae<I;Ae++)t.texImage2D(3553,Ae,Ee,P,he,0,Le,we,null),P>>=1,he>>=1}}else if(ze.length>0&&Te){Be&&Ye&&t.texStorage2D(3553,I,Ee,ze[0].width,ze[0].height);for(let P=0,he=ze.length;P<he;P++)Pe=ze[P],Be?t.texSubImage2D(3553,P,0,0,Le,we,Pe):t.texImage2D(3553,P,Ee,Le,we,Pe);S.generateMipmaps=!1}else Be?(Ye&&t.texStorage2D(3553,I,Ee,Y.width,Y.height),t.texSubImage2D(3553,0,0,0,Le,we,Y)):t.texImage2D(3553,0,Ee,Le,we,Y);N(S,Te)&&B(de),D.__version=ye.version,S.onUpdate&&S.onUpdate(S)}A.__version=S.version}function Oe(A,S,$){if(S.image.length!==6)return;const de=He(A,S),_e=S.source;t.bindTexture(34067,A.__webglTexture,33984+$);const ye=n.get(_e);if(_e.version!==ye.__version||de===!0){t.activeTexture(33984+$),s.pixelStorei(37440,S.flipY),s.pixelStorei(37441,S.premultiplyAlpha),s.pixelStorei(3317,S.unpackAlignment),s.pixelStorei(37443,0);const D=S.isCompressedTexture||S.image[0].isCompressedTexture,K=S.image[0]&&S.image[0].isDataTexture,Y=[];for(let P=0;P<6;P++)!D&&!K?Y[P]=w(S.image[P],!1,!0,l):Y[P]=K?S.image[P].image:S.image[P],Y[P]=Lt(S,Y[P]);const Te=Y[0],Le=T(Te)||a,we=r.convert(S.format,S.encoding),Ee=r.convert(S.type),Pe=v(S.internalFormat,we,Ee,S.encoding),ze=a&&S.isVideoTexture!==!0,Be=ye.__version===void 0||de===!0;let Ye=R(S,Te,Le);X(34067,S,Le);let I;if(D){ze&&Be&&t.texStorage2D(34067,Ye,Pe,Te.width,Te.height);for(let P=0;P<6;P++){I=Y[P].mipmaps;for(let he=0;he<I.length;he++){const Ae=I[he];S.format!==Yt?we!==null?ze?t.compressedTexSubImage2D(34069+P,he,0,0,Ae.width,Ae.height,we,Ae.data):t.compressedTexImage2D(34069+P,he,Pe,Ae.width,Ae.height,0,Ae.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ze?t.texSubImage2D(34069+P,he,0,0,Ae.width,Ae.height,we,Ee,Ae.data):t.texImage2D(34069+P,he,Pe,Ae.width,Ae.height,0,we,Ee,Ae.data)}}}else{I=S.mipmaps,ze&&Be&&(I.length>0&&Ye++,t.texStorage2D(34067,Ye,Pe,Y[0].width,Y[0].height));for(let P=0;P<6;P++)if(K){ze?t.texSubImage2D(34069+P,0,0,0,Y[P].width,Y[P].height,we,Ee,Y[P].data):t.texImage2D(34069+P,0,Pe,Y[P].width,Y[P].height,0,we,Ee,Y[P].data);for(let he=0;he<I.length;he++){const Ie=I[he].image[P].image;ze?t.texSubImage2D(34069+P,he+1,0,0,Ie.width,Ie.height,we,Ee,Ie.data):t.texImage2D(34069+P,he+1,Pe,Ie.width,Ie.height,0,we,Ee,Ie.data)}}else{ze?t.texSubImage2D(34069+P,0,0,0,we,Ee,Y[P]):t.texImage2D(34069+P,0,Pe,we,Ee,Y[P]);for(let he=0;he<I.length;he++){const Ae=I[he];ze?t.texSubImage2D(34069+P,he+1,0,0,we,Ee,Ae.image[P]):t.texImage2D(34069+P,he+1,Pe,we,Ee,Ae.image[P])}}}N(S,Le)&&B(34067),ye.__version=_e.version,S.onUpdate&&S.onUpdate(S)}A.__version=S.version}function Re(A,S,$,de,_e){const ye=r.convert($.format,$.encoding),D=r.convert($.type),K=v($.internalFormat,ye,D,$.encoding);n.get(S).__hasExternalTextures||(_e===32879||_e===35866?t.texImage3D(_e,0,K,S.width,S.height,S.depth,0,ye,D,null):t.texImage2D(_e,0,K,S.width,S.height,0,ye,D,null)),t.bindFramebuffer(36160,A),Ke(S)?d.framebufferTexture2DMultisampleEXT(36160,de,_e,n.get($).__webglTexture,0,lt(S)):(_e===3553||_e>=34069&&_e<=34074)&&s.framebufferTexture2D(36160,de,_e,n.get($).__webglTexture,0),t.bindFramebuffer(36160,null)}function $e(A,S,$){if(s.bindRenderbuffer(36161,A),S.depthBuffer&&!S.stencilBuffer){let de=33189;if($||Ke(S)){const _e=S.depthTexture;_e&&_e.isDepthTexture&&(_e.type===an?de=36012:_e.type===Xn&&(de=33190));const ye=lt(S);Ke(S)?d.renderbufferStorageMultisampleEXT(36161,ye,de,S.width,S.height):s.renderbufferStorageMultisample(36161,ye,de,S.width,S.height)}else s.renderbufferStorage(36161,de,S.width,S.height);s.framebufferRenderbuffer(36160,36096,36161,A)}else if(S.depthBuffer&&S.stencilBuffer){const de=lt(S);$&&Ke(S)===!1?s.renderbufferStorageMultisample(36161,de,35056,S.width,S.height):Ke(S)?d.renderbufferStorageMultisampleEXT(36161,de,35056,S.width,S.height):s.renderbufferStorage(36161,34041,S.width,S.height),s.framebufferRenderbuffer(36160,33306,36161,A)}else{const de=S.isWebGLMultipleRenderTargets===!0?S.texture:[S.texture];for(let _e=0;_e<de.length;_e++){const ye=de[_e],D=r.convert(ye.format,ye.encoding),K=r.convert(ye.type),Y=v(ye.internalFormat,D,K,ye.encoding),Te=lt(S);$&&Ke(S)===!1?s.renderbufferStorageMultisample(36161,Te,Y,S.width,S.height):Ke(S)?d.renderbufferStorageMultisampleEXT(36161,Te,Y,S.width,S.height):s.renderbufferStorage(36161,Y,S.width,S.height)}}s.bindRenderbuffer(36161,null)}function Xe(A,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(36160,A),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(S.depthTexture).__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),re(S.depthTexture,0);const de=n.get(S.depthTexture).__webglTexture,_e=lt(S);if(S.depthTexture.format===qn)Ke(S)?d.framebufferTexture2DMultisampleEXT(36160,36096,3553,de,0,_e):s.framebufferTexture2D(36160,36096,3553,de,0);else if(S.depthTexture.format===Ei)Ke(S)?d.framebufferTexture2DMultisampleEXT(36160,33306,3553,de,0,_e):s.framebufferTexture2D(36160,33306,3553,de,0);else throw new Error("Unknown depthTexture format")}function Fe(A){const S=n.get(A),$=A.isWebGLCubeRenderTarget===!0;if(A.depthTexture&&!S.__autoAllocateDepthBuffer){if($)throw new Error("target.depthTexture not supported in Cube render targets");Xe(S.__webglFramebuffer,A)}else if($){S.__webglDepthbuffer=[];for(let de=0;de<6;de++)t.bindFramebuffer(36160,S.__webglFramebuffer[de]),S.__webglDepthbuffer[de]=s.createRenderbuffer(),$e(S.__webglDepthbuffer[de],A,!1)}else t.bindFramebuffer(36160,S.__webglFramebuffer),S.__webglDepthbuffer=s.createRenderbuffer(),$e(S.__webglDepthbuffer,A,!1);t.bindFramebuffer(36160,null)}function ut(A,S,$){const de=n.get(A);S!==void 0&&Re(de.__webglFramebuffer,A,A.texture,36064,3553),$!==void 0&&Fe(A)}function ht(A){const S=A.texture,$=n.get(A),de=n.get(S);A.addEventListener("dispose",ae),A.isWebGLMultipleRenderTargets!==!0&&(de.__webglTexture===void 0&&(de.__webglTexture=s.createTexture()),de.__version=S.version,o.memory.textures++);const _e=A.isWebGLCubeRenderTarget===!0,ye=A.isWebGLMultipleRenderTargets===!0,D=T(A)||a;if(_e){$.__webglFramebuffer=[];for(let K=0;K<6;K++)$.__webglFramebuffer[K]=s.createFramebuffer()}else{if($.__webglFramebuffer=s.createFramebuffer(),ye)if(i.drawBuffers){const K=A.texture;for(let Y=0,Te=K.length;Y<Te;Y++){const Le=n.get(K[Y]);Le.__webglTexture===void 0&&(Le.__webglTexture=s.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&A.samples>0&&Ke(A)===!1){const K=ye?S:[S];$.__webglMultisampledFramebuffer=s.createFramebuffer(),$.__webglColorRenderbuffer=[],t.bindFramebuffer(36160,$.__webglMultisampledFramebuffer);for(let Y=0;Y<K.length;Y++){const Te=K[Y];$.__webglColorRenderbuffer[Y]=s.createRenderbuffer(),s.bindRenderbuffer(36161,$.__webglColorRenderbuffer[Y]);const Le=r.convert(Te.format,Te.encoding),we=r.convert(Te.type),Ee=v(Te.internalFormat,Le,we,Te.encoding,A.isXRRenderTarget===!0),Pe=lt(A);s.renderbufferStorageMultisample(36161,Pe,Ee,A.width,A.height),s.framebufferRenderbuffer(36160,36064+Y,36161,$.__webglColorRenderbuffer[Y])}s.bindRenderbuffer(36161,null),A.depthBuffer&&($.__webglDepthRenderbuffer=s.createRenderbuffer(),$e($.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(36160,null)}}if(_e){t.bindTexture(34067,de.__webglTexture),X(34067,S,D);for(let K=0;K<6;K++)Re($.__webglFramebuffer[K],A,S,36064,34069+K);N(S,D)&&B(34067),t.unbindTexture()}else if(ye){const K=A.texture;for(let Y=0,Te=K.length;Y<Te;Y++){const Le=K[Y],we=n.get(Le);t.bindTexture(3553,we.__webglTexture),X(3553,Le,D),Re($.__webglFramebuffer,A,Le,36064+Y,3553),N(Le,D)&&B(3553)}t.unbindTexture()}else{let K=3553;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(a?K=A.isWebGL3DRenderTarget?32879:35866:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(K,de.__webglTexture),X(K,S,D),Re($.__webglFramebuffer,A,S,36064,K),N(S,D)&&B(K),t.unbindTexture()}A.depthBuffer&&Fe(A)}function pt(A){const S=T(A)||a,$=A.isWebGLMultipleRenderTargets===!0?A.texture:[A.texture];for(let de=0,_e=$.length;de<_e;de++){const ye=$[de];if(N(ye,S)){const D=A.isWebGLCubeRenderTarget?34067:3553,K=n.get(ye).__webglTexture;t.bindTexture(D,K),B(D),t.unbindTexture()}}}function Ct(A){if(a&&A.samples>0&&Ke(A)===!1){const S=A.isWebGLMultipleRenderTargets?A.texture:[A.texture],$=A.width,de=A.height;let _e=16384;const ye=[],D=A.stencilBuffer?33306:36096,K=n.get(A),Y=A.isWebGLMultipleRenderTargets===!0;if(Y)for(let Te=0;Te<S.length;Te++)t.bindFramebuffer(36160,K.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Te,36161,null),t.bindFramebuffer(36160,K.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Te,3553,null,0);t.bindFramebuffer(36008,K.__webglMultisampledFramebuffer),t.bindFramebuffer(36009,K.__webglFramebuffer);for(let Te=0;Te<S.length;Te++){ye.push(36064+Te),A.depthBuffer&&ye.push(D);const Le=K.__ignoreDepthValues!==void 0?K.__ignoreDepthValues:!1;if(Le===!1&&(A.depthBuffer&&(_e|=256),A.stencilBuffer&&(_e|=1024)),Y&&s.framebufferRenderbuffer(36008,36064,36161,K.__webglColorRenderbuffer[Te]),Le===!0&&(s.invalidateFramebuffer(36008,[D]),s.invalidateFramebuffer(36009,[D])),Y){const we=n.get(S[Te]).__webglTexture;s.framebufferTexture2D(36009,36064,3553,we,0)}s.blitFramebuffer(0,0,$,de,0,0,$,de,_e,9728),g&&s.invalidateFramebuffer(36008,ye)}if(t.bindFramebuffer(36008,null),t.bindFramebuffer(36009,null),Y)for(let Te=0;Te<S.length;Te++){t.bindFramebuffer(36160,K.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(36160,36064+Te,36161,K.__webglColorRenderbuffer[Te]);const Le=n.get(S[Te]).__webglTexture;t.bindFramebuffer(36160,K.__webglFramebuffer),s.framebufferTexture2D(36009,36064+Te,3553,Le,0)}t.bindFramebuffer(36009,K.__webglMultisampledFramebuffer)}}function lt(A){return Math.min(h,A.samples)}function Ke(A){const S=n.get(A);return a&&A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Ft(A){const S=o.render.frame;x.get(A)!==S&&(x.set(A,S),A.update())}function Lt(A,S){const $=A.encoding,de=A.format,_e=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||A.format===bs||$!==An&&($===st?a===!1?e.has("EXT_sRGB")===!0&&de===Yt?(A.format=bs,A.minFilter=Tt,A.generateMipmaps=!1):S=_o.sRGBToLinear(S):(de!==Yt||_e!==$n)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture encoding:",$)),S}this.allocateTextureUnit=te,this.resetTextureUnits=ue,this.setTexture2D=re,this.setTexture2DArray=Z,this.setTexture3D=q,this.setTextureCube=le,this.rebindTextures=ut,this.setupRenderTarget=ht,this.updateRenderTargetMipmap=pt,this.updateMultisampleRenderTarget=Ct,this.setupDepthRenderbuffer=Fe,this.setupFrameBufferTexture=Re,this.useMultisampledRTT=Ke}function Pf(s,e,t){const n=t.isWebGL2;function i(r,o=null){let a;if(r===$n)return 5121;if(r===wl)return 32819;if(r===Tl)return 32820;if(r===Ml)return 5120;if(r===yl)return 5122;if(r===fo)return 5123;if(r===bl)return 5124;if(r===Xn)return 5125;if(r===an)return 5126;if(r===Tn)return n?5131:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(r===El)return 6406;if(r===Yt)return 6408;if(r===Cl)return 6409;if(r===Rl)return 6410;if(r===qn)return 6402;if(r===Ei)return 34041;if(r===Al)return console.warn("THREE.WebGLRenderer: THREE.RGBFormat has been removed. Use THREE.RGBAFormat instead. https://github.com/mrdoob/three.js/pull/23228"),6408;if(r===bs)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(r===po)return 6403;if(r===Ll)return 36244;if(r===Dl)return 33319;if(r===Pl)return 33320;if(r===Il)return 36249;if(r===Ur||r===Fr||r===Or||r===zr)if(o===st)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(r===Ur)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===Fr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===Or)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===zr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(r===Ur)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===Fr)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===Or)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===zr)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Vs||r===Ws||r===Xs||r===qs)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(r===Vs)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Ws)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===Xs)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===qs)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Nl)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===Ys||r===Zs)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(r===Ys)return o===st?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(r===Zs)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===js||r===$s||r===Ks||r===Js||r===Qs||r===ea||r===ta||r===na||r===ia||r===ra||r===sa||r===aa||r===oa||r===la)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(r===js)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===$s)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===Ks)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===Js)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Qs)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===ea)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===ta)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===na)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===ia)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===ra)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===sa)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===aa)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===oa)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===la)return o===st?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===ca)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(r===ca)return o===st?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT}else return null;return r===yi?n?34042:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):s[r]!==void 0?s[r]:null}return{convert:i}}class If extends sn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class xr extends At{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Nf={type:"move"};class hs{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new xr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new xr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new W,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new W),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new xr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new W,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new W),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(const m of e.hand.values()){const f=t.getJointPose(m,n),M=this._getHandJoint(l,m);f!==null&&(M.matrix.fromArray(f.transform.matrix),M.matrix.decompose(M.position,M.rotation,M.scale),M.jointRadius=f.radius),M.visible=f!==null}const u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],d=u.position.distanceTo(h.position),g=.02,x=.005;l.inputState.pinching&&d>g+x?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=g-x&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Nf)))}return a!==null&&(a.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new xr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Uf extends Ut{constructor(e,t,n,i,r,o,a,c,l,u){if(u=u!==void 0?u:qn,u!==qn&&u!==Ei)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===qn&&(n=Xn),n===void 0&&u===Ei&&(n=yi),super(null,i,r,o,a,c,u,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:wt,this.minFilter=c!==void 0?c:wt,this.flipY=!1,this.generateMipmaps=!1}}class Ff extends Jn{constructor(e,t){super();const n=this;let i=null,r=1,o=null,a="local-floor",c=null,l=null,u=null,h=null,d=null,g=null;const x=t.getContextAttributes();let m=null,f=null;const M=[],C=[],w=new Set,T=new Map,E=new sn;E.layers.enable(1),E.viewport=new Et;const N=new sn;N.layers.enable(2),N.viewport=new Et;const B=[E,N],v=new If;v.layers.enable(1),v.layers.enable(2);let R=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let q=M[Z];return q===void 0&&(q=new hs,M[Z]=q),q.getTargetRaySpace()},this.getControllerGrip=function(Z){let q=M[Z];return q===void 0&&(q=new hs,M[Z]=q),q.getGripSpace()},this.getHand=function(Z){let q=M[Z];return q===void 0&&(q=new hs,M[Z]=q),q.getHandSpace()};function ne(Z){const q=C.indexOf(Z.inputSource);if(q===-1)return;const le=M[q];le!==void 0&&le.dispatchEvent({type:Z.type,data:Z.inputSource})}function ae(){i.removeEventListener("select",ne),i.removeEventListener("selectstart",ne),i.removeEventListener("selectend",ne),i.removeEventListener("squeeze",ne),i.removeEventListener("squeezestart",ne),i.removeEventListener("squeezeend",ne),i.removeEventListener("end",ae),i.removeEventListener("inputsourceschange",z);for(let Z=0;Z<M.length;Z++){const q=C[Z];q!==null&&(C[Z]=null,M[Z].disconnect(q))}R=null,H=null,e.setRenderTarget(m),d=null,h=null,u=null,i=null,f=null,re.stop(),n.isPresenting=!1,n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){a=Z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return h!==null?h:d},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",ne),i.addEventListener("selectstart",ne),i.addEventListener("selectend",ne),i.addEventListener("squeeze",ne),i.addEventListener("squeezestart",ne),i.addEventListener("squeezeend",ne),i.addEventListener("end",ae),i.addEventListener("inputsourceschange",z),x.xrCompatible!==!0&&await t.makeXRCompatible(),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const q={antialias:i.renderState.layers===void 0?x.antialias:!0,alpha:x.alpha,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(i,t,q),i.updateRenderState({baseLayer:d}),f=new Kn(d.framebufferWidth,d.framebufferHeight,{format:Yt,type:$n,encoding:e.outputEncoding,stencilBuffer:x.stencil})}else{let q=null,le=null,me=null;x.depth&&(me=x.stencil?35056:33190,q=x.stencil?Ei:qn,le=x.stencil?yi:Xn);const Se={colorFormat:32856,depthFormat:me,scaleFactor:r};u=new XRWebGLBinding(i,t),h=u.createProjectionLayer(Se),i.updateRenderState({layers:[h]}),f=new Kn(h.textureWidth,h.textureHeight,{format:Yt,type:$n,depthTexture:new Uf(h.textureWidth,h.textureHeight,le,void 0,void 0,void 0,void 0,void 0,void 0,q),stencilBuffer:x.stencil,encoding:e.outputEncoding,samples:x.antialias?4:0});const X=e.properties.get(f);X.__ignoreDepthValues=h.ignoreDepthValues}f.isXRRenderTarget=!0,this.setFoveation(1),c=null,o=await i.requestReferenceSpace(a),re.setContext(i),re.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}};function z(Z){for(let q=0;q<Z.removed.length;q++){const le=Z.removed[q],me=C.indexOf(le);me>=0&&(C[me]=null,M[me].disconnect(le))}for(let q=0;q<Z.added.length;q++){const le=Z.added[q];let me=C.indexOf(le);if(me===-1){for(let X=0;X<M.length;X++)if(X>=C.length){C.push(le),me=X;break}else if(C[X]===null){C[X]=le,me=X;break}if(me===-1)break}const Se=M[me];Se&&Se.connect(le)}}const U=new W,ee=new W;function oe(Z,q,le){U.setFromMatrixPosition(q.matrixWorld),ee.setFromMatrixPosition(le.matrixWorld);const me=U.distanceTo(ee),Se=q.projectionMatrix.elements,X=le.projectionMatrix.elements,He=Se[14]/(Se[10]-1),be=Se[14]/(Se[10]+1),Oe=(Se[9]+1)/Se[5],Re=(Se[9]-1)/Se[5],$e=(Se[8]-1)/Se[0],Xe=(X[8]+1)/X[0],Fe=He*$e,ut=He*Xe,ht=me/(-$e+Xe),pt=ht*-$e;q.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(pt),Z.translateZ(ht),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert();const Ct=He+ht,lt=be+ht,Ke=Fe-pt,Ft=ut+(me-pt),Lt=Oe*be/lt*Ct,A=Re*be/lt*Ct;Z.projectionMatrix.makePerspective(Ke,Ft,Lt,A,Ct,lt)}function ue(Z,q){q===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(q.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;v.near=N.near=E.near=Z.near,v.far=N.far=E.far=Z.far,(R!==v.near||H!==v.far)&&(i.updateRenderState({depthNear:v.near,depthFar:v.far}),R=v.near,H=v.far);const q=Z.parent,le=v.cameras;ue(v,q);for(let Se=0;Se<le.length;Se++)ue(le[Se],q);v.matrixWorld.decompose(v.position,v.quaternion,v.scale),Z.matrix.copy(v.matrix),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale);const me=Z.children;for(let Se=0,X=me.length;Se<X;Se++)me[Se].updateMatrixWorld(!0);le.length===2?oe(v,E,N):v.projectionMatrix.copy(E.projectionMatrix)},this.getCamera=function(){return v},this.getFoveation=function(){if(h!==null)return h.fixedFoveation;if(d!==null)return d.fixedFoveation},this.setFoveation=function(Z){h!==null&&(h.fixedFoveation=Z),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=Z)},this.getPlanes=function(){return w};let te=null;function ge(Z,q){if(l=q.getViewerPose(c||o),g=q,l!==null){const le=l.views;d!==null&&(e.setRenderTargetFramebuffer(f,d.framebuffer),e.setRenderTarget(f));let me=!1;le.length!==v.cameras.length&&(v.cameras.length=0,me=!0);for(let Se=0;Se<le.length;Se++){const X=le[Se];let He=null;if(d!==null)He=d.getViewport(X);else{const Oe=u.getViewSubImage(h,X);He=Oe.viewport,Se===0&&(e.setRenderTargetTextures(f,Oe.colorTexture,h.ignoreDepthValues?void 0:Oe.depthStencilTexture),e.setRenderTarget(f))}let be=B[Se];be===void 0&&(be=new sn,be.layers.enable(Se),be.viewport=new Et,B[Se]=be),be.matrix.fromArray(X.transform.matrix),be.projectionMatrix.fromArray(X.projectionMatrix),be.viewport.set(He.x,He.y,He.width,He.height),Se===0&&v.matrix.copy(be.matrix),me===!0&&v.cameras.push(be)}}for(let le=0;le<M.length;le++){const me=C[le],Se=M[le];me!==null&&Se!==void 0&&Se.update(me,q,c||o)}if(te&&te(Z,q),q.detectedPlanes){n.dispatchEvent({type:"planesdetected",data:q.detectedPlanes});let le=null;for(const me of w)q.detectedPlanes.has(me)||(le===null&&(le=[]),le.push(me));if(le!==null)for(const me of le)w.delete(me),T.delete(me),n.dispatchEvent({type:"planeremoved",data:me});for(const me of q.detectedPlanes)if(!w.has(me))w.add(me),T.set(me,q.lastChangedTime),n.dispatchEvent({type:"planeadded",data:me});else{const Se=T.get(me);me.lastChangedTime>Se&&(T.set(me,me.lastChangedTime),n.dispatchEvent({type:"planechanged",data:me}))}}g=null}const re=new Ao;re.setAnimationLoop(ge),this.setAnimationLoop=function(Z){te=Z},this.dispose=function(){}}}function Of(s,e){function t(m,f){f.color.getRGB(m.fogColor.value,wo(s)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function n(m,f,M,C,w){f.isMeshBasicMaterial||f.isMeshLambertMaterial?i(m,f):f.isMeshToonMaterial?(i(m,f),u(m,f)):f.isMeshPhongMaterial?(i(m,f),l(m,f)):f.isMeshStandardMaterial?(i(m,f),h(m,f),f.isMeshPhysicalMaterial&&d(m,f,w)):f.isMeshMatcapMaterial?(i(m,f),g(m,f)):f.isMeshDepthMaterial?i(m,f):f.isMeshDistanceMaterial?(i(m,f),x(m,f)):f.isMeshNormalMaterial?i(m,f):f.isLineBasicMaterial?(r(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?a(m,f,M,C):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function i(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map),f.alphaMap&&(m.alphaMap.value=f.alphaMap),f.bumpMap&&(m.bumpMap.value=f.bumpMap,m.bumpScale.value=f.bumpScale,f.side===Jt&&(m.bumpScale.value*=-1)),f.displacementMap&&(m.displacementMap.value=f.displacementMap,m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap),f.normalMap&&(m.normalMap.value=f.normalMap,m.normalScale.value.copy(f.normalScale),f.side===Jt&&m.normalScale.value.negate()),f.specularMap&&(m.specularMap.value=f.specularMap),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const M=e.get(f).envMap;if(M&&(m.envMap.value=M,m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap){m.lightMap.value=f.lightMap;const T=s.physicallyCorrectLights!==!0?Math.PI:1;m.lightMapIntensity.value=f.lightMapIntensity*T}f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity);let C;f.map?C=f.map:f.specularMap?C=f.specularMap:f.displacementMap?C=f.displacementMap:f.normalMap?C=f.normalMap:f.bumpMap?C=f.bumpMap:f.roughnessMap?C=f.roughnessMap:f.metalnessMap?C=f.metalnessMap:f.alphaMap?C=f.alphaMap:f.emissiveMap?C=f.emissiveMap:f.clearcoatMap?C=f.clearcoatMap:f.clearcoatNormalMap?C=f.clearcoatNormalMap:f.clearcoatRoughnessMap?C=f.clearcoatRoughnessMap:f.iridescenceMap?C=f.iridescenceMap:f.iridescenceThicknessMap?C=f.iridescenceThicknessMap:f.specularIntensityMap?C=f.specularIntensityMap:f.specularColorMap?C=f.specularColorMap:f.transmissionMap?C=f.transmissionMap:f.thicknessMap?C=f.thicknessMap:f.sheenColorMap?C=f.sheenColorMap:f.sheenRoughnessMap&&(C=f.sheenRoughnessMap),C!==void 0&&(C.isWebGLRenderTarget&&(C=C.texture),C.matrixAutoUpdate===!0&&C.updateMatrix(),m.uvTransform.value.copy(C.matrix));let w;f.aoMap?w=f.aoMap:f.lightMap&&(w=f.lightMap),w!==void 0&&(w.isWebGLRenderTarget&&(w=w.texture),w.matrixAutoUpdate===!0&&w.updateMatrix(),m.uv2Transform.value.copy(w.matrix))}function r(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function a(m,f,M,C){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*M,m.scale.value=C*.5,f.map&&(m.map.value=f.map),f.alphaMap&&(m.alphaMap.value=f.alphaMap),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let w;f.map?w=f.map:f.alphaMap&&(w=f.alphaMap),w!==void 0&&(w.matrixAutoUpdate===!0&&w.updateMatrix(),m.uvTransform.value.copy(w.matrix))}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map),f.alphaMap&&(m.alphaMap.value=f.alphaMap),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let M;f.map?M=f.map:f.alphaMap&&(M=f.alphaMap),M!==void 0&&(M.matrixAutoUpdate===!0&&M.updateMatrix(),m.uvTransform.value.copy(M.matrix))}function l(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function h(m,f){m.roughness.value=f.roughness,m.metalness.value=f.metalness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap),f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap),e.get(f).envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function d(m,f,M){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap)),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap),f.clearcoatNormalMap&&(m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),m.clearcoatNormalMap.value=f.clearcoatNormalMap,f.side===Jt&&m.clearcoatNormalScale.value.negate())),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap)),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap)}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function x(m,f){m.referencePosition.value.copy(f.referencePosition),m.nearDistance.value=f.nearDistance,m.farDistance.value=f.farDistance}return{refreshFogUniforms:t,refreshMaterialUniforms:n}}function zf(s,e,t,n){let i={},r={},o=[];const a=t.isWebGL2?s.getParameter(35375):0;function c(C,w){const T=w.program;n.uniformBlockBinding(C,T)}function l(C,w){let T=i[C.id];T===void 0&&(x(C),T=u(C),i[C.id]=T,C.addEventListener("dispose",f));const E=w.program;n.updateUBOMapping(C,E);const N=e.render.frame;r[C.id]!==N&&(d(C),r[C.id]=N)}function u(C){const w=h();C.__bindingPointIndex=w;const T=s.createBuffer(),E=C.__size,N=C.usage;return s.bindBuffer(35345,T),s.bufferData(35345,E,N),s.bindBuffer(35345,null),s.bindBufferBase(35345,w,T),T}function h(){for(let C=0;C<a;C++)if(o.indexOf(C)===-1)return o.push(C),C;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(C){const w=i[C.id],T=C.uniforms,E=C.__cache;s.bindBuffer(35345,w);for(let N=0,B=T.length;N<B;N++){const v=T[N];if(g(v,N,E)===!0){const R=v.__offset,H=Array.isArray(v.value)?v.value:[v.value];let ne=0;for(let ae=0;ae<H.length;ae++){const z=H[ae],U=m(z);typeof z=="number"?(v.__data[0]=z,s.bufferSubData(35345,R+ne,v.__data)):z.isMatrix3?(v.__data[0]=z.elements[0],v.__data[1]=z.elements[1],v.__data[2]=z.elements[2],v.__data[3]=z.elements[0],v.__data[4]=z.elements[3],v.__data[5]=z.elements[4],v.__data[6]=z.elements[5],v.__data[7]=z.elements[0],v.__data[8]=z.elements[6],v.__data[9]=z.elements[7],v.__data[10]=z.elements[8],v.__data[11]=z.elements[0]):(z.toArray(v.__data,ne),ne+=U.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(35345,R,v.__data)}}s.bindBuffer(35345,null)}function g(C,w,T){const E=C.value;if(T[w]===void 0){if(typeof E=="number")T[w]=E;else{const N=Array.isArray(E)?E:[E],B=[];for(let v=0;v<N.length;v++)B.push(N[v].clone());T[w]=B}return!0}else if(typeof E=="number"){if(T[w]!==E)return T[w]=E,!0}else{const N=Array.isArray(T[w])?T[w]:[T[w]],B=Array.isArray(E)?E:[E];for(let v=0;v<N.length;v++){const R=N[v];if(R.equals(B[v])===!1)return R.copy(B[v]),!0}}return!1}function x(C){const w=C.uniforms;let T=0;const E=16;let N=0;for(let B=0,v=w.length;B<v;B++){const R=w[B],H={boundary:0,storage:0},ne=Array.isArray(R.value)?R.value:[R.value];for(let ae=0,z=ne.length;ae<z;ae++){const U=ne[ae],ee=m(U);H.boundary+=ee.boundary,H.storage+=ee.storage}if(R.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),R.__offset=T,B>0){N=T%E;const ae=E-N;N!==0&&ae-H.boundary<0&&(T+=E-N,R.__offset=T)}T+=H.storage}return N=T%E,N>0&&(T+=E-N),C.__size=T,C.__cache={},this}function m(C){const w={boundary:0,storage:0};return typeof C=="number"?(w.boundary=4,w.storage=4):C.isVector2?(w.boundary=8,w.storage=8):C.isVector3||C.isColor?(w.boundary=16,w.storage=12):C.isVector4?(w.boundary=16,w.storage=16):C.isMatrix3?(w.boundary=48,w.storage=48):C.isMatrix4?(w.boundary=64,w.storage=64):C.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",C),w}function f(C){const w=C.target;w.removeEventListener("dispose",f);const T=o.indexOf(w.__bindingPointIndex);o.splice(T,1),s.deleteBuffer(i[w.id]),delete i[w.id],delete r[w.id]}function M(){for(const C in i)s.deleteBuffer(i[C]);o=[],i={},r={}}return{bind:c,update:l,dispose:M}}function Bf(){const s=Ar("canvas");return s.style.display="block",s}function Po(s={}){this.isWebGLRenderer=!0;const e=s.canvas!==void 0?s.canvas:Bf(),t=s.context!==void 0?s.context:null,n=s.depth!==void 0?s.depth:!0,i=s.stencil!==void 0?s.stencil:!0,r=s.antialias!==void 0?s.antialias:!1,o=s.premultipliedAlpha!==void 0?s.premultipliedAlpha:!0,a=s.preserveDrawingBuffer!==void 0?s.preserveDrawingBuffer:!1,c=s.powerPreference!==void 0?s.powerPreference:"default",l=s.failIfMajorPerformanceCaveat!==void 0?s.failIfMajorPerformanceCaveat:!1;let u;t!==null?u=t.getContextAttributes().alpha:u=s.alpha!==void 0?s.alpha:!1;let h=null,d=null;const g=[],x=[];this.domElement=e,this.debug={checkShaderErrors:!0},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.outputEncoding=An,this.physicallyCorrectLights=!1,this.toneMapping=En,this.toneMappingExposure=1;const m=this;let f=!1,M=0,C=0,w=null,T=-1,E=null;const N=new Et,B=new Et;let v=null,R=e.width,H=e.height,ne=1,ae=null,z=null;const U=new Et(0,0,R,H),ee=new Et(0,0,R,H);let oe=!1;const ue=new Is;let te=!1,ge=!1,re=null;const Z=new vt,q=new Ge,le=new W,me={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Se(){return w===null?ne:1}let X=t;function He(y,G){for(let k=0;k<y.length;k++){const O=y[k],Q=e.getContext(O,G);if(Q!==null)return Q}return null}try{const y={alpha:!0,depth:n,stencil:i,antialias:r,premultipliedAlpha:o,preserveDrawingBuffer:a,powerPreference:c,failIfMajorPerformanceCaveat:l};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Rs}`),e.addEventListener("webglcontextlost",Ee,!1),e.addEventListener("webglcontextrestored",Pe,!1),e.addEventListener("webglcontextcreationerror",ze,!1),X===null){const G=["webgl2","webgl","experimental-webgl"];if(m.isWebGL1Renderer===!0&&G.shift(),X=He(G,y),X===null)throw He(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}X.getShaderPrecisionFormat===void 0&&(X.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let be,Oe,Re,$e,Xe,Fe,ut,ht,pt,Ct,lt,Ke,Ft,Lt,A,S,$,de,_e,ye,D,K,Y,Te;function Le(){be=new jh(X),Oe=new Vh(X,be,s),be.init(Oe),K=new Pf(X,be,Oe),Re=new Lf(X,be,Oe),$e=new Jh,Xe=new gf,Fe=new Df(X,be,Re,Xe,Oe,K,$e),ut=new Xh(m),ht=new Zh(m),pt=new oc(X,Oe),Y=new Gh(X,be,pt,Oe),Ct=new $h(X,pt,$e,Y),lt=new nd(X,Ct,pt,$e),_e=new td(X,Oe,Fe),S=new Wh(Xe),Ke=new mf(m,ut,ht,be,Oe,Y,S),Ft=new Of(m,Xe),Lt=new xf,A=new wf(be,Oe),de=new kh(m,ut,ht,Re,lt,u,o),$=new Rf(m,lt,Oe),Te=new zf(X,$e,Oe,Re),ye=new Hh(X,be,$e,Oe),D=new Kh(X,be,$e,Oe),$e.programs=Ke.programs,m.capabilities=Oe,m.extensions=be,m.properties=Xe,m.renderLists=Lt,m.shadowMap=$,m.state=Re,m.info=$e}Le();const we=new Ff(m,X);this.xr=we,this.getContext=function(){return X},this.getContextAttributes=function(){return X.getContextAttributes()},this.forceContextLoss=function(){const y=be.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=be.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(y){y!==void 0&&(ne=y,this.setSize(R,H,!1))},this.getSize=function(y){return y.set(R,H)},this.setSize=function(y,G,k){if(we.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}R=y,H=G,e.width=Math.floor(y*ne),e.height=Math.floor(G*ne),k!==!1&&(e.style.width=y+"px",e.style.height=G+"px"),this.setViewport(0,0,y,G)},this.getDrawingBufferSize=function(y){return y.set(R*ne,H*ne).floor()},this.setDrawingBufferSize=function(y,G,k){R=y,H=G,ne=k,e.width=Math.floor(y*k),e.height=Math.floor(G*k),this.setViewport(0,0,y,G)},this.getCurrentViewport=function(y){return y.copy(N)},this.getViewport=function(y){return y.copy(U)},this.setViewport=function(y,G,k,O){y.isVector4?U.set(y.x,y.y,y.z,y.w):U.set(y,G,k,O),Re.viewport(N.copy(U).multiplyScalar(ne).floor())},this.getScissor=function(y){return y.copy(ee)},this.setScissor=function(y,G,k,O){y.isVector4?ee.set(y.x,y.y,y.z,y.w):ee.set(y,G,k,O),Re.scissor(B.copy(ee).multiplyScalar(ne).floor())},this.getScissorTest=function(){return oe},this.setScissorTest=function(y){Re.setScissorTest(oe=y)},this.setOpaqueSort=function(y){ae=y},this.setTransparentSort=function(y){z=y},this.getClearColor=function(y){return y.copy(de.getClearColor())},this.setClearColor=function(){de.setClearColor.apply(de,arguments)},this.getClearAlpha=function(){return de.getClearAlpha()},this.setClearAlpha=function(){de.setClearAlpha.apply(de,arguments)},this.clear=function(y=!0,G=!0,k=!0){let O=0;y&&(O|=16384),G&&(O|=256),k&&(O|=1024),X.clear(O)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Ee,!1),e.removeEventListener("webglcontextrestored",Pe,!1),e.removeEventListener("webglcontextcreationerror",ze,!1),Lt.dispose(),A.dispose(),Xe.dispose(),ut.dispose(),ht.dispose(),lt.dispose(),Y.dispose(),Te.dispose(),Ke.dispose(),we.dispose(),we.removeEventListener("sessionstart",Ae),we.removeEventListener("sessionend",Ie),re&&(re.dispose(),re=null),Je.stop()};function Ee(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),f=!0}function Pe(){console.log("THREE.WebGLRenderer: Context Restored."),f=!1;const y=$e.autoReset,G=$.enabled,k=$.autoUpdate,O=$.needsUpdate,Q=$.type;Le(),$e.autoReset=y,$.enabled=G,$.autoUpdate=k,$.needsUpdate=O,$.type=Q}function ze(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Be(y){const G=y.target;G.removeEventListener("dispose",Be),Ye(G)}function Ye(y){I(y),Xe.remove(y)}function I(y){const G=Xe.get(y).programs;G!==void 0&&(G.forEach(function(k){Ke.releaseProgram(k)}),y.isShaderMaterial&&Ke.releaseShaderCache(y))}this.renderBufferDirect=function(y,G,k,O,Q,p){G===null&&(G=me);const _=Q.isMesh&&Q.matrixWorld.determinant()<0,b=Pr(y,G,k,O,Q);Re.setMaterial(O,_);let L=k.index,V=1;O.wireframe===!0&&(L=Ct.getWireframeAttribute(k),V=2);const F=k.drawRange,j=k.attributes.position;let se=F.start*V,fe=(F.start+F.count)*V;p!==null&&(se=Math.max(se,p.start*V),fe=Math.min(fe,(p.start+p.count)*V)),L!==null?(se=Math.max(se,0),fe=Math.min(fe,L.count)):j!=null&&(se=Math.max(se,0),fe=Math.min(fe,j.count));const ie=fe-se;if(ie<0||ie===1/0)return;Y.setup(Q,O,b,k,L);let pe,xe=ye;if(L!==null&&(pe=pt.get(L),xe=D,xe.setIndex(pe)),Q.isMesh)O.wireframe===!0?(Re.setLineWidth(O.wireframeLinewidth*Se()),xe.setMode(1)):xe.setMode(4);else if(Q.isLine){let ce=O.linewidth;ce===void 0&&(ce=1),Re.setLineWidth(ce*Se()),Q.isLineSegments?xe.setMode(1):Q.isLineLoop?xe.setMode(2):xe.setMode(3)}else Q.isPoints?xe.setMode(0):Q.isSprite&&xe.setMode(4);if(Q.isInstancedMesh)xe.renderInstances(se,ie,Q.count);else if(k.isInstancedBufferGeometry){const ce=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,Ue=Math.min(k.instanceCount,ce);xe.renderInstances(se,ie,Ue)}else xe.render(se,ie)},this.compile=function(y,G){function k(O,Q,p){O.transparent===!0&&O.side===Ji?(O.side=Jt,O.needsUpdate=!0,Ot(O,Q,p),O.side=jn,O.needsUpdate=!0,Ot(O,Q,p),O.side=Ji):Ot(O,Q,p)}d=A.get(y),d.init(),x.push(d),y.traverseVisible(function(O){O.isLight&&O.layers.test(G.layers)&&(d.pushLight(O),O.castShadow&&d.pushShadow(O))}),d.setupLights(m.physicallyCorrectLights),y.traverse(function(O){const Q=O.material;if(Q)if(Array.isArray(Q))for(let p=0;p<Q.length;p++){const _=Q[p];k(_,y,O)}else k(Q,y,O)}),x.pop(),d=null};let P=null;function he(y){P&&P(y)}function Ae(){Je.stop()}function Ie(){Je.start()}const Je=new Ao;Je.setAnimationLoop(he),typeof self<"u"&&Je.setContext(self),this.setAnimationLoop=function(y){P=y,we.setAnimationLoop(y),y===null?Je.stop():Je.start()},we.addEventListener("sessionstart",Ae),we.addEventListener("sessionend",Ie),this.render=function(y,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(f===!0)return;y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),we.enabled===!0&&we.isPresenting===!0&&(we.cameraAutoUpdate===!0&&we.updateCamera(G),G=we.getCamera()),y.isScene===!0&&y.onBeforeRender(m,y,G,w),d=A.get(y,x.length),d.init(),x.push(d),Z.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),ue.setFromProjectionMatrix(Z),ge=this.localClippingEnabled,te=S.init(this.clippingPlanes,ge,G),h=Lt.get(y,g.length),h.init(),g.push(h),mt(y,G,0,m.sortObjects),h.finish(),m.sortObjects===!0&&h.sort(ae,z),te===!0&&S.beginShadows();const k=d.state.shadowsArray;if($.render(k,y,G),te===!0&&S.endShadows(),this.info.autoReset===!0&&this.info.reset(),de.render(h,y),d.setupLights(m.physicallyCorrectLights),G.isArrayCamera){const O=G.cameras;for(let Q=0,p=O.length;Q<p;Q++){const _=O[Q];yt(h,y,_,_.viewport)}}else yt(h,y,G);w!==null&&(Fe.updateMultisampleRenderTarget(w),Fe.updateRenderTargetMipmap(w)),y.isScene===!0&&y.onAfterRender(m,y,G),Y.resetDefaultState(),T=-1,E=null,x.pop(),x.length>0?d=x[x.length-1]:d=null,g.pop(),g.length>0?h=g[g.length-1]:h=null};function mt(y,G,k,O){if(y.visible===!1)return;if(y.layers.test(G.layers)){if(y.isGroup)k=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(G);else if(y.isLight)d.pushLight(y),y.castShadow&&d.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||ue.intersectsSprite(y)){O&&le.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Z);const _=lt.update(y),b=y.material;b.visible&&h.push(y,_,b,k,le.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(y.isSkinnedMesh&&y.skeleton.frame!==$e.render.frame&&(y.skeleton.update(),y.skeleton.frame=$e.render.frame),!y.frustumCulled||ue.intersectsObject(y))){O&&le.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Z);const _=lt.update(y),b=y.material;if(Array.isArray(b)){const L=_.groups;for(let V=0,F=L.length;V<F;V++){const j=L[V],se=b[j.materialIndex];se&&se.visible&&h.push(y,_,se,k,le.z,j)}}else b.visible&&h.push(y,_,b,k,le.z,null)}}const p=y.children;for(let _=0,b=p.length;_<b;_++)mt(p[_],G,k,O)}function yt(y,G,k,O){const Q=y.opaque,p=y.transmissive,_=y.transparent;d.setupLightsView(k),p.length>0&&pn(Q,G,k),O&&Re.viewport(N.copy(O)),Q.length>0&&nt(Q,G,k),p.length>0&&nt(p,G,k),_.length>0&&nt(_,G,k),Re.buffers.depth.setTest(!0),Re.buffers.depth.setMask(!0),Re.buffers.color.setMask(!0),Re.setPolygonOffset(!1)}function pn(y,G,k){const O=Oe.isWebGL2;re===null&&(re=new Kn(1,1,{generateMipmaps:!0,type:be.has("EXT_color_buffer_half_float")?Tn:$n,minFilter:Ti,samples:O&&r===!0?4:0})),m.getDrawingBufferSize(q),O?re.setSize(q.x,q.y):re.setSize(ws(q.x),ws(q.y));const Q=m.getRenderTarget();m.setRenderTarget(re),m.clear();const p=m.toneMapping;m.toneMapping=En,nt(y,G,k),m.toneMapping=p,Fe.updateMultisampleRenderTarget(re),Fe.updateRenderTargetMipmap(re),m.setRenderTarget(Q)}function nt(y,G,k){const O=G.isScene===!0?G.overrideMaterial:null;for(let Q=0,p=y.length;Q<p;Q++){const _=y[Q],b=_.object,L=_.geometry,V=O===null?_.material:O,F=_.group;b.layers.test(k.layers)&&Qt(b,G,k,L,V,F)}}function Qt(y,G,k,O,Q,p){y.onBeforeRender(m,G,k,O,Q,p),y.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),Q.onBeforeRender(m,G,k,O,y,p),Q.transparent===!0&&Q.side===Ji?(Q.side=Jt,Q.needsUpdate=!0,m.renderBufferDirect(k,G,O,Q,y,p),Q.side=jn,Q.needsUpdate=!0,m.renderBufferDirect(k,G,O,Q,y,p),Q.side=Ji):m.renderBufferDirect(k,G,O,Q,y,p),y.onAfterRender(m,G,k,O,Q,p)}function Ot(y,G,k){G.isScene!==!0&&(G=me);const O=Xe.get(y),Q=d.state.lights,p=d.state.shadowsArray,_=Q.state.version,b=Ke.getParameters(y,Q.state,p,G,k),L=Ke.getProgramCacheKey(b);let V=O.programs;O.environment=y.isMeshStandardMaterial?G.environment:null,O.fog=G.fog,O.envMap=(y.isMeshStandardMaterial?ht:ut).get(y.envMap||O.environment),V===void 0&&(y.addEventListener("dispose",Be),V=new Map,O.programs=V);let F=V.get(L);if(F!==void 0){if(O.currentProgram===F&&O.lightsStateVersion===_)return $i(y,b),F}else b.uniforms=Ke.getUniforms(y),y.onBuild(k,b,m),y.onBeforeCompile(b,m),F=Ke.acquireProgram(b,L),V.set(L,F),O.uniforms=b.uniforms;const j=O.uniforms;(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(j.clippingPlanes=S.uniform),$i(y,b),O.needsLights=Ir(y),O.lightsStateVersion=_,O.needsLights&&(j.ambientLightColor.value=Q.state.ambient,j.lightProbe.value=Q.state.probe,j.directionalLights.value=Q.state.directional,j.directionalLightShadows.value=Q.state.directionalShadow,j.spotLights.value=Q.state.spot,j.spotLightShadows.value=Q.state.spotShadow,j.rectAreaLights.value=Q.state.rectArea,j.ltc_1.value=Q.state.rectAreaLTC1,j.ltc_2.value=Q.state.rectAreaLTC2,j.pointLights.value=Q.state.point,j.pointLightShadows.value=Q.state.pointShadow,j.hemisphereLights.value=Q.state.hemi,j.directionalShadowMap.value=Q.state.directionalShadowMap,j.directionalShadowMatrix.value=Q.state.directionalShadowMatrix,j.spotShadowMap.value=Q.state.spotShadowMap,j.spotLightMatrix.value=Q.state.spotLightMatrix,j.spotLightMap.value=Q.state.spotLightMap,j.pointShadowMap.value=Q.state.pointShadowMap,j.pointShadowMatrix.value=Q.state.pointShadowMatrix);const se=F.getUniforms(),fe=Tr.seqWithValue(se.seq,j);return O.currentProgram=F,O.uniformsList=fe,F}function $i(y,G){const k=Xe.get(y);k.outputEncoding=G.outputEncoding,k.instancing=G.instancing,k.skinning=G.skinning,k.morphTargets=G.morphTargets,k.morphNormals=G.morphNormals,k.morphColors=G.morphColors,k.morphTargetsCount=G.morphTargetsCount,k.numClippingPlanes=G.numClippingPlanes,k.numIntersection=G.numClipIntersection,k.vertexAlphas=G.vertexAlphas,k.vertexTangents=G.vertexTangents,k.toneMapping=G.toneMapping}function Pr(y,G,k,O,Q){G.isScene!==!0&&(G=me),Fe.resetTextureUnits();const p=G.fog,_=O.isMeshStandardMaterial?G.environment:null,b=w===null?m.outputEncoding:w.isXRRenderTarget===!0?w.texture.encoding:An,L=(O.isMeshStandardMaterial?ht:ut).get(O.envMap||_),V=O.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,F=!!O.normalMap&&!!k.attributes.tangent,j=!!k.morphAttributes.position,se=!!k.morphAttributes.normal,fe=!!k.morphAttributes.color,ie=O.toneMapped?m.toneMapping:En,pe=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,xe=pe!==void 0?pe.length:0,ce=Xe.get(O),Ue=d.state.lights;if(te===!0&&(ge===!0||y!==E)){const ke=y===E&&O.id===T;S.setState(O,y,ke)}let De=!1;O.version===ce.__version?(ce.needsLights&&ce.lightsStateVersion!==Ue.state.version||ce.outputEncoding!==b||Q.isInstancedMesh&&ce.instancing===!1||!Q.isInstancedMesh&&ce.instancing===!0||Q.isSkinnedMesh&&ce.skinning===!1||!Q.isSkinnedMesh&&ce.skinning===!0||ce.envMap!==L||O.fog===!0&&ce.fog!==p||ce.numClippingPlanes!==void 0&&(ce.numClippingPlanes!==S.numPlanes||ce.numIntersection!==S.numIntersection)||ce.vertexAlphas!==V||ce.vertexTangents!==F||ce.morphTargets!==j||ce.morphNormals!==se||ce.morphColors!==fe||ce.toneMapping!==ie||Oe.isWebGL2===!0&&ce.morphTargetsCount!==xe)&&(De=!0):(De=!0,ce.__version=O.version);let Ce=ce.currentProgram;De===!0&&(Ce=Ot(O,G,Q));let Ne=!1,Ve=!1,it=!1;const Ze=Ce.getUniforms(),dt=ce.uniforms;if(Re.useProgram(Ce.program)&&(Ne=!0,Ve=!0,it=!0),O.id!==T&&(T=O.id,Ve=!0),Ne||E!==y){if(Ze.setValue(X,"projectionMatrix",y.projectionMatrix),Oe.logarithmicDepthBuffer&&Ze.setValue(X,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),E!==y&&(E=y,Ve=!0,it=!0),O.isShaderMaterial||O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshStandardMaterial||O.envMap){const ke=Ze.map.cameraPosition;ke!==void 0&&ke.setValue(X,le.setFromMatrixPosition(y.matrixWorld))}(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial)&&Ze.setValue(X,"isOrthographic",y.isOrthographicCamera===!0),(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial||O.isShadowMaterial||Q.isSkinnedMesh)&&Ze.setValue(X,"viewMatrix",y.matrixWorldInverse)}if(Q.isSkinnedMesh){Ze.setOptional(X,Q,"bindMatrix"),Ze.setOptional(X,Q,"bindMatrixInverse");const ke=Q.skeleton;ke&&(Oe.floatVertexTextures?(ke.boneTexture===null&&ke.computeBoneTexture(),Ze.setValue(X,"boneTexture",ke.boneTexture,Fe),Ze.setValue(X,"boneTextureSize",ke.boneTextureSize)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}const Qe=k.morphAttributes;if((Qe.position!==void 0||Qe.normal!==void 0||Qe.color!==void 0&&Oe.isWebGL2===!0)&&_e.update(Q,k,O,Ce),(Ve||ce.receiveShadow!==Q.receiveShadow)&&(ce.receiveShadow=Q.receiveShadow,Ze.setValue(X,"receiveShadow",Q.receiveShadow)),O.isMeshGouraudMaterial&&O.envMap!==null&&(dt.envMap.value=L,dt.flipEnvMap.value=L.isCubeTexture&&L.isRenderTargetTexture===!1?-1:1),Ve&&(Ze.setValue(X,"toneMappingExposure",m.toneMappingExposure),ce.needsLights&&Qn(dt,it),p&&O.fog===!0&&Ft.refreshFogUniforms(dt,p),Ft.refreshMaterialUniforms(dt,O,ne,H,re),Tr.upload(X,ce.uniformsList,dt,Fe)),O.isShaderMaterial&&O.uniformsNeedUpdate===!0&&(Tr.upload(X,ce.uniformsList,dt,Fe),O.uniformsNeedUpdate=!1),O.isSpriteMaterial&&Ze.setValue(X,"center",Q.center),Ze.setValue(X,"modelViewMatrix",Q.modelViewMatrix),Ze.setValue(X,"normalMatrix",Q.normalMatrix),Ze.setValue(X,"modelMatrix",Q.matrixWorld),O.isShaderMaterial||O.isRawShaderMaterial){const ke=O.uniformsGroups;for(let ct=0,zt=ke.length;ct<zt;ct++)if(Oe.isWebGL2){const ft=ke[ct];Te.update(ft,Ce),Te.bind(ft,Ce)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Ce}function Qn(y,G){y.ambientLightColor.needsUpdate=G,y.lightProbe.needsUpdate=G,y.directionalLights.needsUpdate=G,y.directionalLightShadows.needsUpdate=G,y.pointLights.needsUpdate=G,y.pointLightShadows.needsUpdate=G,y.spotLights.needsUpdate=G,y.spotLightShadows.needsUpdate=G,y.rectAreaLights.needsUpdate=G,y.hemisphereLights.needsUpdate=G}function Ir(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return M},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(y,G,k){Xe.get(y.texture).__webglTexture=G,Xe.get(y.depthTexture).__webglTexture=k;const O=Xe.get(y);O.__hasExternalTextures=!0,O.__hasExternalTextures&&(O.__autoAllocateDepthBuffer=k===void 0,O.__autoAllocateDepthBuffer||be.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),O.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(y,G){const k=Xe.get(y);k.__webglFramebuffer=G,k.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(y,G=0,k=0){w=y,M=G,C=k;let O=!0,Q=null,p=!1,_=!1;if(y){const L=Xe.get(y);L.__useDefaultFramebuffer!==void 0?(Re.bindFramebuffer(36160,null),O=!1):L.__webglFramebuffer===void 0?Fe.setupRenderTarget(y):L.__hasExternalTextures&&Fe.rebindTextures(y,Xe.get(y.texture).__webglTexture,Xe.get(y.depthTexture).__webglTexture);const V=y.texture;(V.isData3DTexture||V.isDataArrayTexture||V.isCompressedArrayTexture)&&(_=!0);const F=Xe.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Q=F[G],p=!0):Oe.isWebGL2&&y.samples>0&&Fe.useMultisampledRTT(y)===!1?Q=Xe.get(y).__webglMultisampledFramebuffer:Q=F,N.copy(y.viewport),B.copy(y.scissor),v=y.scissorTest}else N.copy(U).multiplyScalar(ne).floor(),B.copy(ee).multiplyScalar(ne).floor(),v=oe;if(Re.bindFramebuffer(36160,Q)&&Oe.drawBuffers&&O&&Re.drawBuffers(y,Q),Re.viewport(N),Re.scissor(B),Re.setScissorTest(v),p){const L=Xe.get(y.texture);X.framebufferTexture2D(36160,36064,34069+G,L.__webglTexture,k)}else if(_){const L=Xe.get(y.texture),V=G||0;X.framebufferTextureLayer(36160,36064,L.__webglTexture,k||0,V)}T=-1},this.readRenderTargetPixels=function(y,G,k,O,Q,p,_){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let b=Xe.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&_!==void 0&&(b=b[_]),b){Re.bindFramebuffer(36160,b);try{const L=y.texture,V=L.format,F=L.type;if(V!==Yt&&K.convert(V)!==X.getParameter(35739)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const j=F===Tn&&(be.has("EXT_color_buffer_half_float")||Oe.isWebGL2&&be.has("EXT_color_buffer_float"));if(F!==$n&&K.convert(F)!==X.getParameter(35738)&&!(F===an&&(Oe.isWebGL2||be.has("OES_texture_float")||be.has("WEBGL_color_buffer_float")))&&!j){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=y.width-O&&k>=0&&k<=y.height-Q&&X.readPixels(G,k,O,Q,K.convert(V),K.convert(F),p)}finally{const L=w!==null?Xe.get(w).__webglFramebuffer:null;Re.bindFramebuffer(36160,L)}}},this.copyFramebufferToTexture=function(y,G,k=0){const O=Math.pow(2,-k),Q=Math.floor(G.image.width*O),p=Math.floor(G.image.height*O);Fe.setTexture2D(G,0),X.copyTexSubImage2D(3553,k,0,0,y.x,y.y,Q,p),Re.unbindTexture()},this.copyTextureToTexture=function(y,G,k,O=0){const Q=G.image.width,p=G.image.height,_=K.convert(k.format),b=K.convert(k.type);Fe.setTexture2D(k,0),X.pixelStorei(37440,k.flipY),X.pixelStorei(37441,k.premultiplyAlpha),X.pixelStorei(3317,k.unpackAlignment),G.isDataTexture?X.texSubImage2D(3553,O,y.x,y.y,Q,p,_,b,G.image.data):G.isCompressedTexture?X.compressedTexSubImage2D(3553,O,y.x,y.y,G.mipmaps[0].width,G.mipmaps[0].height,_,G.mipmaps[0].data):X.texSubImage2D(3553,O,y.x,y.y,_,b,G.image),O===0&&k.generateMipmaps&&X.generateMipmap(3553),Re.unbindTexture()},this.copyTextureToTexture3D=function(y,G,k,O,Q=0){if(m.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const p=y.max.x-y.min.x+1,_=y.max.y-y.min.y+1,b=y.max.z-y.min.z+1,L=K.convert(O.format),V=K.convert(O.type);let F;if(O.isData3DTexture)Fe.setTexture3D(O,0),F=32879;else if(O.isDataArrayTexture)Fe.setTexture2DArray(O,0),F=35866;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}X.pixelStorei(37440,O.flipY),X.pixelStorei(37441,O.premultiplyAlpha),X.pixelStorei(3317,O.unpackAlignment);const j=X.getParameter(3314),se=X.getParameter(32878),fe=X.getParameter(3316),ie=X.getParameter(3315),pe=X.getParameter(32877),xe=k.isCompressedTexture?k.mipmaps[0]:k.image;X.pixelStorei(3314,xe.width),X.pixelStorei(32878,xe.height),X.pixelStorei(3316,y.min.x),X.pixelStorei(3315,y.min.y),X.pixelStorei(32877,y.min.z),k.isDataTexture||k.isData3DTexture?X.texSubImage3D(F,Q,G.x,G.y,G.z,p,_,b,L,V,xe.data):k.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),X.compressedTexSubImage3D(F,Q,G.x,G.y,G.z,p,_,b,L,xe.data)):X.texSubImage3D(F,Q,G.x,G.y,G.z,p,_,b,L,V,xe),X.pixelStorei(3314,j),X.pixelStorei(32878,se),X.pixelStorei(3316,fe),X.pixelStorei(3315,ie),X.pixelStorei(32877,pe),Q===0&&O.generateMipmaps&&X.generateMipmap(F),Re.unbindTexture()},this.initTexture=function(y){y.isCubeTexture?Fe.setTextureCube(y,0):y.isData3DTexture?Fe.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?Fe.setTexture2DArray(y,0):Fe.setTexture2D(y,0),Re.unbindTexture()},this.resetState=function(){M=0,C=0,w=null,Re.reset(),Y.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}class kf extends Po{}kf.prototype.isWebGL1Renderer=!0;class Gf extends At{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.backgroundIntensity=this.backgroundIntensity),t}get autoUpdate(){return console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate}set autoUpdate(e){console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate=e}}class Io extends Ut{constructor(e=null,t=1,n=1,i,r,o,a,c,l=wt,u=wt,h,d){super(null,o,a,c,l,u,i,r,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class In extends jt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const qa={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};class Hf{constructor(e,t,n){const i=this;let r=!1,o=0,a=0,c;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(u){a++,r===!1&&i.onStart!==void 0&&i.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,i.onProgress!==void 0&&i.onProgress(u,o,a),o===a&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){const h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=l.length;h<d;h+=2){const g=l[h],x=l[h+1];if(g.global&&(g.lastIndex=0),g.test(u))return x}return null}}}const Vf=new Hf;let No=class{constructor(e){this.manager=e!==void 0?e:Vf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};const Mn={};class Wf extends Error{constructor(e,t){super(e),this.response=t}}class Xf extends No{constructor(e){super(e)}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=qa.get(e);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(Mn[e]!==void 0){Mn[e].push({onLoad:t,onProgress:n,onError:i});return}Mn[e]=[],Mn[e].push({onLoad:t,onProgress:n,onError:i});const o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const u=Mn[e],h=l.body.getReader(),d=l.headers.get("Content-Length")||l.headers.get("X-File-Size"),g=d?parseInt(d):0,x=g!==0;let m=0;const f=new ReadableStream({start(M){C();function C(){h.read().then(({done:w,value:T})=>{if(w)M.close();else{m+=T.byteLength;const E=new ProgressEvent("progress",{lengthComputable:x,loaded:m,total:g});for(let N=0,B=u.length;N<B;N++){const v=u[N];v.onProgress&&v.onProgress(E)}M.enqueue(T),C()}})}}});return new Response(f)}else throw new Wf(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return l.json();default:if(a===void 0)return l.text();{const h=/charset="?([^;"\s]*)"?/i.exec(a),d=h&&h[1]?h[1].toLowerCase():void 0,g=new TextDecoder(d);return l.arrayBuffer().then(x=>g.decode(x))}}}).then(l=>{qa.add(e,l);const u=Mn[e];delete Mn[e];for(let h=0,d=u.length;h<d;h++){const g=u[h];g.onLoad&&g.onLoad(l)}}).catch(l=>{const u=Mn[e];if(u===void 0)throw this.manager.itemError(e),l;delete Mn[e];for(let h=0,d=u.length;h<d;h++){const g=u[h];g.onError&&g.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class qf extends No{constructor(e){super(e)}load(e,t,n,i){const r=this,o=new Io,a=new Xf(this.manager);return a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setPath(this.path),a.setWithCredentials(r.withCredentials),a.load(e,function(c){const l=r.parse(c);l&&(l.image!==void 0?o.image=l.image:l.data!==void 0&&(o.image.width=l.width,o.image.height=l.height,o.image.data=l.data),o.wrapS=l.wrapS!==void 0?l.wrapS:qt,o.wrapT=l.wrapT!==void 0?l.wrapT:qt,o.magFilter=l.magFilter!==void 0?l.magFilter:Tt,o.minFilter=l.minFilter!==void 0?l.minFilter:Tt,o.anisotropy=l.anisotropy!==void 0?l.anisotropy:1,l.encoding!==void 0&&(o.encoding=l.encoding),l.flipY!==void 0&&(o.flipY=l.flipY),l.format!==void 0&&(o.format=l.format),l.type!==void 0&&(o.type=l.type),l.mipmaps!==void 0&&(o.mipmaps=l.mipmaps,o.minFilter=Ti),l.mipmapCount===1&&(o.minFilter=Tt),l.generateMipmaps!==void 0&&(o.generateMipmaps=l.generateMipmaps),o.needsUpdate=!0,t&&t(o,l))},n,i),o}}class Yf extends At{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new je(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}const ds=new vt,Ya=new W,Za=new W;class Zf{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ge(512,512),this.map=null,this.mapPass=null,this.matrix=new vt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Is,this._frameExtents=new Ge(1,1),this._viewportCount=1,this._viewports=[new Et(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Ya.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ya),Za.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Za),t.updateMatrixWorld(),ds.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ds),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ds)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class jf extends Zf{constructor(){super(new Ns(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class $f extends Yf{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(At.DefaultUp),this.updateMatrix(),this.target=new At,this.shadow=new jf}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Kf extends Cn{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}class ja{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Nt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const wn=Jf();function Jf(){const s=new ArrayBuffer(4),e=new Float32Array(s),t=new Uint32Array(s),n=new Uint32Array(512),i=new Uint32Array(512);for(let c=0;c<256;++c){const l=c-127;l<-27?(n[c]=0,n[c|256]=32768,i[c]=24,i[c|256]=24):l<-14?(n[c]=1024>>-l-14,n[c|256]=1024>>-l-14|32768,i[c]=-l-1,i[c|256]=-l-1):l<=15?(n[c]=l+15<<10,n[c|256]=l+15<<10|32768,i[c]=13,i[c|256]=13):l<128?(n[c]=31744,n[c|256]=64512,i[c]=24,i[c|256]=24):(n[c]=31744,n[c|256]=64512,i[c]=13,i[c|256]=13)}const r=new Uint32Array(2048),o=new Uint32Array(64),a=new Uint32Array(64);for(let c=1;c<1024;++c){let l=c<<13,u=0;for(;!(l&8388608);)l<<=1,u-=8388608;l&=-8388609,u+=947912704,r[c]=l|u}for(let c=1024;c<2048;++c)r[c]=939524096+(c-1024<<13);for(let c=1;c<31;++c)o[c]=c<<23;o[31]=1199570944,o[32]=2147483648;for(let c=33;c<63;++c)o[c]=2147483648+(c-32<<23);o[63]=3347054592;for(let c=1;c<64;++c)c!==32&&(a[c]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:i,mantissaTable:r,exponentTable:o,offsetTable:a}}function Qf(s){Math.abs(s)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),s=Nt(s,-65504,65504),wn.floatView[0]=s;const e=wn.uint32View[0],t=e>>23&511;return wn.baseTable[t]+((e&8388607)>>wn.shiftTable[t])}function ep(s){const e=s>>10;return wn.uint32View[0]=wn.mantissaTable[wn.offsetTable[e]+(s&1023)]+wn.exponentTable[e],wn.floatView[0]}var $a=Object.freeze({__proto__:null,toHalfFloat:Qf,fromHalfFloat:ep});typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Rs}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Rs);/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.6.9
*/var Ka=function(s){return URL.createObjectURL(new Blob([s],{type:"text/javascript"}))};try{URL.revokeObjectURL(Ka(""))}catch{Ka=function(e){return"data:application/javascript;charset=UTF-8,"+encodeURI(e)}}var Kt=Uint8Array,Un=Uint16Array,As=Uint32Array,Uo=new Kt([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Fo=new Kt([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),tp=new Kt([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Oo=function(s,e){for(var t=new Un(31),n=0;n<31;++n)t[n]=e+=1<<s[n-1];for(var i=new As(t[30]),n=1;n<30;++n)for(var r=t[n];r<t[n+1];++r)i[r]=r-t[n]<<5|n;return[t,i]},zo=Oo(Uo,2),Bo=zo[0],np=zo[1];Bo[28]=258,np[258]=28;var ip=Oo(Fo,0),rp=ip[0],Cs=new Un(32768);for(var at=0;at<32768;++at){var Nn=(at&43690)>>>1|(at&21845)<<1;Nn=(Nn&52428)>>>2|(Nn&13107)<<2,Nn=(Nn&61680)>>>4|(Nn&3855)<<4,Cs[at]=((Nn&65280)>>>8|(Nn&255)<<8)>>>1}var Gi=function(s,e,t){for(var n=s.length,i=0,r=new Un(e);i<n;++i)++r[s[i]-1];var o=new Un(e);for(i=0;i<e;++i)o[i]=o[i-1]+r[i-1]<<1;var a;if(t){a=new Un(1<<e);var c=15-e;for(i=0;i<n;++i)if(s[i])for(var l=i<<4|s[i],u=e-s[i],h=o[s[i]-1]++<<u,d=h|(1<<u)-1;h<=d;++h)a[Cs[h]>>>c]=l}else for(a=new Un(n),i=0;i<n;++i)s[i]&&(a[i]=Cs[o[s[i]-1]++]>>>15-s[i]);return a},Zi=new Kt(288);for(var at=0;at<144;++at)Zi[at]=8;for(var at=144;at<256;++at)Zi[at]=9;for(var at=256;at<280;++at)Zi[at]=7;for(var at=280;at<288;++at)Zi[at]=8;var ko=new Kt(32);for(var at=0;at<32;++at)ko[at]=5;var sp=Gi(Zi,9,1),ap=Gi(ko,5,1),fs=function(s){for(var e=s[0],t=1;t<s.length;++t)s[t]>e&&(e=s[t]);return e},rn=function(s,e,t){var n=e/8|0;return(s[n]|s[n+1]<<8)>>(e&7)&t},ps=function(s,e){var t=e/8|0;return(s[t]|s[t+1]<<8|s[t+2]<<16)>>(e&7)},op=function(s){return(s/8|0)+(s&7&&1)},lp=function(s,e,t){(t==null||t>s.length)&&(t=s.length);var n=new(s instanceof Un?Un:s instanceof As?As:Kt)(t-e);return n.set(s.subarray(e,t)),n},cp=function(s,e,t){var n=s.length;if(!n||t&&!t.l&&n<5)return e||new Kt(0);var i=!e||t,r=!t||t.i;t||(t={}),e||(e=new Kt(n*3));var o=function(X){var He=e.length;if(X>He){var be=new Kt(Math.max(He*2,X));be.set(e),e=be}},a=t.f||0,c=t.p||0,l=t.b||0,u=t.l,h=t.d,d=t.m,g=t.n,x=n*8;do{if(!u){t.f=a=rn(s,c,1);var m=rn(s,c+1,3);if(c+=3,m)if(m==1)u=sp,h=ap,d=9,g=5;else if(m==2){var w=rn(s,c,31)+257,T=rn(s,c+10,15)+4,E=w+rn(s,c+5,31)+1;c+=14;for(var N=new Kt(E),B=new Kt(19),v=0;v<T;++v)B[tp[v]]=rn(s,c+v*3,7);c+=T*3;for(var R=fs(B),H=(1<<R)-1,ne=Gi(B,R,1),v=0;v<E;){var ae=ne[rn(s,c,H)];c+=ae&15;var f=ae>>>4;if(f<16)N[v++]=f;else{var z=0,U=0;for(f==16?(U=3+rn(s,c,3),c+=2,z=N[v-1]):f==17?(U=3+rn(s,c,7),c+=3):f==18&&(U=11+rn(s,c,127),c+=7);U--;)N[v++]=z}}var ee=N.subarray(0,w),oe=N.subarray(w);d=fs(ee),g=fs(oe),u=Gi(ee,d,1),h=Gi(oe,g,1)}else throw"invalid block type";else{var f=op(c)+4,M=s[f-4]|s[f-3]<<8,C=f+M;if(C>n){if(r)throw"unexpected EOF";break}i&&o(l+M),e.set(s.subarray(f,C),l),t.b=l+=M,t.p=c=C*8;continue}if(c>x){if(r)throw"unexpected EOF";break}}i&&o(l+131072);for(var ue=(1<<d)-1,te=(1<<g)-1,ge=c;;ge=c){var z=u[ps(s,c)&ue],re=z>>>4;if(c+=z&15,c>x){if(r)throw"unexpected EOF";break}if(!z)throw"invalid length/literal";if(re<256)e[l++]=re;else if(re==256){ge=c,u=null;break}else{var Z=re-254;if(re>264){var v=re-257,q=Uo[v];Z=rn(s,c,(1<<q)-1)+Bo[v],c+=q}var le=h[ps(s,c)&te],me=le>>>4;if(!le)throw"invalid distance";c+=le&15;var oe=rp[me];if(me>3){var q=Fo[me];oe+=ps(s,c)&(1<<q)-1,c+=q}if(c>x){if(r)throw"unexpected EOF";break}i&&o(l+131072);for(var Se=l+Z;l<Se;l+=4)e[l]=e[l-oe],e[l+1]=e[l+1-oe],e[l+2]=e[l+2-oe],e[l+3]=e[l+3-oe];l=Se}}t.l=u,t.p=ge,t.b=l,u&&(a=1,t.m=d,t.d=h,t.n=g)}while(!a);return l==e.length?e:lp(e,0,l)},up=new Kt(0),hp=function(s){if((s[0]&15)!=8||s[0]>>>4>7||(s[0]<<8|s[1])%31)throw"invalid zlib data";if(s[1]&32)throw"invalid zlib data: preset dictionaries not supported"};function vr(s,e){return cp((hp(s),s.subarray(2,-4)),e)}var dp=typeof TextDecoder<"u"&&new TextDecoder,fp=0;try{dp.decode(up,{stream:!0}),fp=1}catch{}class pp extends qf{constructor(e){super(e),this.type=Tn}parse(e){const R=Math.pow(2.7182818,2.2);function H(p,_){let b=0;for(let V=0;V<65536;++V)(V==0||p[V>>3]&1<<(V&7))&&(_[b++]=V);const L=b-1;for(;b<65536;)_[b++]=0;return L}function ne(p){for(let _=0;_<16384;_++)p[_]={},p[_].len=0,p[_].lit=0,p[_].p=null}const ae={l:0,c:0,lc:0};function z(p,_,b,L,V){for(;b<p;)_=_<<8|Pe(L,V),b+=8;b-=p,ae.l=_>>b&(1<<p)-1,ae.c=_,ae.lc=b}const U=new Array(59);function ee(p){for(let b=0;b<=58;++b)U[b]=0;for(let b=0;b<65537;++b)U[p[b]]+=1;let _=0;for(let b=58;b>0;--b){const L=_+U[b]>>1;U[b]=_,_=L}for(let b=0;b<65537;++b){const L=p[b];L>0&&(p[b]=L|U[L]++<<6)}}function oe(p,_,b,L,V,F){const j=_;let se=0,fe=0;for(;L<=V;L++){if(j.value-_.value>b)return!1;z(6,se,fe,p,j);const ie=ae.l;if(se=ae.c,fe=ae.lc,F[L]=ie,ie==63){if(j.value-_.value>b)throw new Error("Something wrong with hufUnpackEncTable");z(8,se,fe,p,j);let pe=ae.l+6;if(se=ae.c,fe=ae.lc,L+pe>V+1)throw new Error("Something wrong with hufUnpackEncTable");for(;pe--;)F[L++]=0;L--}else if(ie>=59){let pe=ie-59+2;if(L+pe>V+1)throw new Error("Something wrong with hufUnpackEncTable");for(;pe--;)F[L++]=0;L--}}ee(F)}function ue(p){return p&63}function te(p){return p>>6}function ge(p,_,b,L){for(;_<=b;_++){const V=te(p[_]),F=ue(p[_]);if(V>>F)throw new Error("Invalid table entry");if(F>14){const j=L[V>>F-14];if(j.len)throw new Error("Invalid table entry");if(j.lit++,j.p){const se=j.p;j.p=new Array(j.lit);for(let fe=0;fe<j.lit-1;++fe)j.p[fe]=se[fe]}else j.p=new Array(1);j.p[j.lit-1]=_}else if(F){let j=0;for(let se=1<<14-F;se>0;se--){const fe=L[(V<<14-F)+j];if(fe.len||fe.p)throw new Error("Invalid table entry");fe.len=F,fe.lit=_,j++}}}return!0}const re={c:0,lc:0};function Z(p,_,b,L){p=p<<8|Pe(b,L),_+=8,re.c=p,re.lc=_}const q={c:0,lc:0};function le(p,_,b,L,V,F,j,se,fe){if(p==_){L<8&&(Z(b,L,V,F),b=re.c,L=re.lc),L-=8;let ie=b>>L;if(ie=new Uint8Array([ie])[0],se.value+ie>fe)return!1;const pe=j[se.value-1];for(;ie-- >0;)j[se.value++]=pe}else if(se.value<fe)j[se.value++]=p;else return!1;q.c=b,q.lc=L}function me(p){return p&65535}function Se(p){const _=me(p);return _>32767?_-65536:_}const X={a:0,b:0};function He(p,_){const b=Se(p),V=Se(_),F=b+(V&1)+(V>>1),j=F,se=F-V;X.a=j,X.b=se}function be(p,_){const b=me(p),L=me(_),V=b-(L>>1)&65535,F=L+V-32768&65535;X.a=F,X.b=V}function Oe(p,_,b,L,V,F,j){const se=j<16384,fe=b>V?V:b;let ie=1,pe,xe;for(;ie<=fe;)ie<<=1;for(ie>>=1,pe=ie,ie>>=1;ie>=1;){xe=0;const ce=xe+F*(V-pe),Ue=F*ie,De=F*pe,Ce=L*ie,Ne=L*pe;let Ve,it,Ze,dt;for(;xe<=ce;xe+=De){let Qe=xe;const ke=xe+L*(b-pe);for(;Qe<=ke;Qe+=Ne){const ct=Qe+Ce,zt=Qe+Ue,ft=zt+Ce;se?(He(p[Qe+_],p[zt+_]),Ve=X.a,Ze=X.b,He(p[ct+_],p[ft+_]),it=X.a,dt=X.b,He(Ve,it),p[Qe+_]=X.a,p[ct+_]=X.b,He(Ze,dt),p[zt+_]=X.a,p[ft+_]=X.b):(be(p[Qe+_],p[zt+_]),Ve=X.a,Ze=X.b,be(p[ct+_],p[ft+_]),it=X.a,dt=X.b,be(Ve,it),p[Qe+_]=X.a,p[ct+_]=X.b,be(Ze,dt),p[zt+_]=X.a,p[ft+_]=X.b)}if(b&ie){const ct=Qe+Ue;se?He(p[Qe+_],p[ct+_]):be(p[Qe+_],p[ct+_]),Ve=X.a,p[ct+_]=X.b,p[Qe+_]=Ve}}if(V&ie){let Qe=xe;const ke=xe+L*(b-pe);for(;Qe<=ke;Qe+=Ne){const ct=Qe+Ce;se?He(p[Qe+_],p[ct+_]):be(p[Qe+_],p[ct+_]),Ve=X.a,p[ct+_]=X.b,p[Qe+_]=Ve}}pe=ie,ie>>=1}return xe}function Re(p,_,b,L,V,F,j,se,fe){let ie=0,pe=0;const xe=j,ce=Math.trunc(L.value+(V+7)/8);for(;L.value<ce;)for(Z(ie,pe,b,L),ie=re.c,pe=re.lc;pe>=14;){const De=ie>>pe-14&16383,Ce=_[De];if(Ce.len)pe-=Ce.len,le(Ce.lit,F,ie,pe,b,L,se,fe,xe),ie=q.c,pe=q.lc;else{if(!Ce.p)throw new Error("hufDecode issues");let Ne;for(Ne=0;Ne<Ce.lit;Ne++){const Ve=ue(p[Ce.p[Ne]]);for(;pe<Ve&&L.value<ce;)Z(ie,pe,b,L),ie=re.c,pe=re.lc;if(pe>=Ve&&te(p[Ce.p[Ne]])==(ie>>pe-Ve&(1<<Ve)-1)){pe-=Ve,le(Ce.p[Ne],F,ie,pe,b,L,se,fe,xe),ie=q.c,pe=q.lc;break}}if(Ne==Ce.lit)throw new Error("hufDecode issues")}}const Ue=8-V&7;for(ie>>=Ue,pe-=Ue;pe>0;){const De=_[ie<<14-pe&16383];if(De.len)pe-=De.len,le(De.lit,F,ie,pe,b,L,se,fe,xe),ie=q.c,pe=q.lc;else throw new Error("hufDecode issues")}return!0}function $e(p,_,b,L,V,F){const j={value:0},se=b.value,fe=Ee(_,b),ie=Ee(_,b);b.value+=4;const pe=Ee(_,b);if(b.value+=4,fe<0||fe>=65537||ie<0||ie>=65537)throw new Error("Something wrong with HUF_ENCSIZE");const xe=new Array(65537),ce=new Array(16384);ne(ce);const Ue=L-(b.value-se);if(oe(p,b,Ue,fe,ie,xe),pe>8*(L-(b.value-se)))throw new Error("Something wrong with hufUncompress");ge(xe,fe,ie,ce),Re(xe,ce,p,b,pe,ie,F,V,j)}function Xe(p,_,b){for(let L=0;L<b;++L)_[L]=p[_[L]]}function Fe(p){for(let _=1;_<p.length;_++){const b=p[_-1]+p[_]-128;p[_]=b}}function ut(p,_){let b=0,L=Math.floor((p.length+1)/2),V=0;const F=p.length-1;for(;!(V>F||(_[V++]=p[b++],V>F));)_[V++]=p[L++]}function ht(p){let _=p.byteLength;const b=new Array;let L=0;const V=new DataView(p);for(;_>0;){const F=V.getInt8(L++);if(F<0){const j=-F;_-=j+1;for(let se=0;se<j;se++)b.push(V.getUint8(L++))}else{const j=F;_-=2;const se=V.getUint8(L++);for(let fe=0;fe<j+1;fe++)b.push(se)}}return b}function pt(p,_,b,L,V,F){let j=new DataView(F.buffer);const se=b[p.idx[0]].width,fe=b[p.idx[0]].height,ie=3,pe=Math.floor(se/8),xe=Math.ceil(se/8),ce=Math.ceil(fe/8),Ue=se-(xe-1)*8,De=fe-(ce-1)*8,Ce={value:0},Ne=new Array(ie),Ve=new Array(ie),it=new Array(ie),Ze=new Array(ie),dt=new Array(ie);for(let ke=0;ke<ie;++ke)dt[ke]=_[p.idx[ke]],Ne[ke]=ke<1?0:Ne[ke-1]+xe*ce,Ve[ke]=new Float32Array(64),it[ke]=new Uint16Array(64),Ze[ke]=new Uint16Array(xe*64);for(let ke=0;ke<ce;++ke){let ct=8;ke==ce-1&&(ct=De);let zt=8;for(let et=0;et<xe;++et){et==xe-1&&(zt=Ue);for(let rt=0;rt<ie;++rt)it[rt].fill(0),it[rt][0]=V[Ne[rt]++],Ct(Ce,L,it[rt]),lt(it[rt],Ve[rt]),Ke(Ve[rt]);Ft(Ve);for(let rt=0;rt<ie;++rt)Lt(Ve[rt],Ze[rt],et*64)}let ft=0;for(let et=0;et<ie;++et){const rt=b[p.idx[et]].type;for(let mn=8*ke;mn<8*ke+ct;++mn){ft=dt[et][mn];for(let Ri=0;Ri<pe;++Ri){const un=Ri*64+(mn&7)*8;j.setUint16(ft+0*2*rt,Ze[et][un+0],!0),j.setUint16(ft+1*2*rt,Ze[et][un+1],!0),j.setUint16(ft+2*2*rt,Ze[et][un+2],!0),j.setUint16(ft+3*2*rt,Ze[et][un+3],!0),j.setUint16(ft+4*2*rt,Ze[et][un+4],!0),j.setUint16(ft+5*2*rt,Ze[et][un+5],!0),j.setUint16(ft+6*2*rt,Ze[et][un+6],!0),j.setUint16(ft+7*2*rt,Ze[et][un+7],!0),ft+=8*2*rt}}if(pe!=xe)for(let mn=8*ke;mn<8*ke+ct;++mn){const Ri=dt[et][mn]+8*pe*2*rt,un=pe*64+(mn&7)*8;for(let Ki=0;Ki<zt;++Ki)j.setUint16(Ri+Ki*2*rt,Ze[et][un+Ki],!0)}}}const Qe=new Uint16Array(se);j=new DataView(F.buffer);for(let ke=0;ke<ie;++ke){b[p.idx[ke]].decoded=!0;const ct=b[p.idx[ke]].type;if(b[ke].type==2)for(let zt=0;zt<fe;++zt){const ft=dt[ke][zt];for(let et=0;et<se;++et)Qe[et]=j.getUint16(ft+et*2*ct,!0);for(let et=0;et<se;++et)j.setFloat32(ft+et*2*ct,P(Qe[et]),!0)}}}function Ct(p,_,b){let L,V=1;for(;V<64;)L=_[p.value],L==65280?V=64:L>>8==255?V+=L&255:(b[V]=L,V++),p.value++}function lt(p,_){_[0]=P(p[0]),_[1]=P(p[1]),_[2]=P(p[5]),_[3]=P(p[6]),_[4]=P(p[14]),_[5]=P(p[15]),_[6]=P(p[27]),_[7]=P(p[28]),_[8]=P(p[2]),_[9]=P(p[4]),_[10]=P(p[7]),_[11]=P(p[13]),_[12]=P(p[16]),_[13]=P(p[26]),_[14]=P(p[29]),_[15]=P(p[42]),_[16]=P(p[3]),_[17]=P(p[8]),_[18]=P(p[12]),_[19]=P(p[17]),_[20]=P(p[25]),_[21]=P(p[30]),_[22]=P(p[41]),_[23]=P(p[43]),_[24]=P(p[9]),_[25]=P(p[11]),_[26]=P(p[18]),_[27]=P(p[24]),_[28]=P(p[31]),_[29]=P(p[40]),_[30]=P(p[44]),_[31]=P(p[53]),_[32]=P(p[10]),_[33]=P(p[19]),_[34]=P(p[23]),_[35]=P(p[32]),_[36]=P(p[39]),_[37]=P(p[45]),_[38]=P(p[52]),_[39]=P(p[54]),_[40]=P(p[20]),_[41]=P(p[22]),_[42]=P(p[33]),_[43]=P(p[38]),_[44]=P(p[46]),_[45]=P(p[51]),_[46]=P(p[55]),_[47]=P(p[60]),_[48]=P(p[21]),_[49]=P(p[34]),_[50]=P(p[37]),_[51]=P(p[47]),_[52]=P(p[50]),_[53]=P(p[56]),_[54]=P(p[59]),_[55]=P(p[61]),_[56]=P(p[35]),_[57]=P(p[36]),_[58]=P(p[48]),_[59]=P(p[49]),_[60]=P(p[57]),_[61]=P(p[58]),_[62]=P(p[62]),_[63]=P(p[63])}function Ke(p){const _=.5*Math.cos(.7853975),b=.5*Math.cos(3.14159/16),L=.5*Math.cos(3.14159/8),V=.5*Math.cos(3*3.14159/16),F=.5*Math.cos(5*3.14159/16),j=.5*Math.cos(3*3.14159/8),se=.5*Math.cos(7*3.14159/16),fe=new Array(4),ie=new Array(4),pe=new Array(4),xe=new Array(4);for(let ce=0;ce<8;++ce){const Ue=ce*8;fe[0]=L*p[Ue+2],fe[1]=j*p[Ue+2],fe[2]=L*p[Ue+6],fe[3]=j*p[Ue+6],ie[0]=b*p[Ue+1]+V*p[Ue+3]+F*p[Ue+5]+se*p[Ue+7],ie[1]=V*p[Ue+1]-se*p[Ue+3]-b*p[Ue+5]-F*p[Ue+7],ie[2]=F*p[Ue+1]-b*p[Ue+3]+se*p[Ue+5]+V*p[Ue+7],ie[3]=se*p[Ue+1]-F*p[Ue+3]+V*p[Ue+5]-b*p[Ue+7],pe[0]=_*(p[Ue+0]+p[Ue+4]),pe[3]=_*(p[Ue+0]-p[Ue+4]),pe[1]=fe[0]+fe[3],pe[2]=fe[1]-fe[2],xe[0]=pe[0]+pe[1],xe[1]=pe[3]+pe[2],xe[2]=pe[3]-pe[2],xe[3]=pe[0]-pe[1],p[Ue+0]=xe[0]+ie[0],p[Ue+1]=xe[1]+ie[1],p[Ue+2]=xe[2]+ie[2],p[Ue+3]=xe[3]+ie[3],p[Ue+4]=xe[3]-ie[3],p[Ue+5]=xe[2]-ie[2],p[Ue+6]=xe[1]-ie[1],p[Ue+7]=xe[0]-ie[0]}for(let ce=0;ce<8;++ce)fe[0]=L*p[16+ce],fe[1]=j*p[16+ce],fe[2]=L*p[48+ce],fe[3]=j*p[48+ce],ie[0]=b*p[8+ce]+V*p[24+ce]+F*p[40+ce]+se*p[56+ce],ie[1]=V*p[8+ce]-se*p[24+ce]-b*p[40+ce]-F*p[56+ce],ie[2]=F*p[8+ce]-b*p[24+ce]+se*p[40+ce]+V*p[56+ce],ie[3]=se*p[8+ce]-F*p[24+ce]+V*p[40+ce]-b*p[56+ce],pe[0]=_*(p[ce]+p[32+ce]),pe[3]=_*(p[ce]-p[32+ce]),pe[1]=fe[0]+fe[3],pe[2]=fe[1]-fe[2],xe[0]=pe[0]+pe[1],xe[1]=pe[3]+pe[2],xe[2]=pe[3]-pe[2],xe[3]=pe[0]-pe[1],p[0+ce]=xe[0]+ie[0],p[8+ce]=xe[1]+ie[1],p[16+ce]=xe[2]+ie[2],p[24+ce]=xe[3]+ie[3],p[32+ce]=xe[3]-ie[3],p[40+ce]=xe[2]-ie[2],p[48+ce]=xe[1]-ie[1],p[56+ce]=xe[0]-ie[0]}function Ft(p){for(let _=0;_<64;++_){const b=p[0][_],L=p[1][_],V=p[2][_];p[0][_]=b+1.5747*V,p[1][_]=b-.1873*L-.4682*V,p[2][_]=b+1.8556*L}}function Lt(p,_,b){for(let L=0;L<64;++L)_[b+L]=$a.toHalfFloat(A(p[L]))}function A(p){return p<=1?Math.sign(p)*Math.pow(Math.abs(p),2.2):Math.sign(p)*Math.pow(R,Math.abs(p)-1)}function S(p){return new DataView(p.array.buffer,p.offset.value,p.size)}function $(p){const _=p.viewer.buffer.slice(p.offset.value,p.offset.value+p.size),b=new Uint8Array(ht(_)),L=new Uint8Array(b.length);return Fe(b),ut(b,L),new DataView(L.buffer)}function de(p){const _=p.array.slice(p.offset.value,p.offset.value+p.size),b=vr(_),L=new Uint8Array(b.length);return Fe(b),ut(b,L),new DataView(L.buffer)}function _e(p){const _=p.viewer,b={value:p.offset.value},L=new Uint16Array(p.width*p.scanlineBlockSize*(p.channels*p.type)),V=new Uint8Array(8192);let F=0;const j=new Array(p.channels);for(let De=0;De<p.channels;De++)j[De]={},j[De].start=F,j[De].end=j[De].start,j[De].nx=p.width,j[De].ny=p.lines,j[De].size=p.type,F+=j[De].nx*j[De].ny*j[De].size;const se=he(_,b),fe=he(_,b);if(fe>=8192)throw new Error("Something is wrong with PIZ_COMPRESSION BITMAP_SIZE");if(se<=fe)for(let De=0;De<fe-se+1;De++)V[De+se]=ze(_,b);const ie=new Uint16Array(65536),pe=H(V,ie),xe=Ee(_,b);$e(p.array,_,b,xe,L,F);for(let De=0;De<p.channels;++De){const Ce=j[De];for(let Ne=0;Ne<j[De].size;++Ne)Oe(L,Ce.start+Ne,Ce.nx,Ce.size,Ce.ny,Ce.nx*Ce.size,pe)}Xe(ie,L,F);let ce=0;const Ue=new Uint8Array(L.buffer.byteLength);for(let De=0;De<p.lines;De++)for(let Ce=0;Ce<p.channels;Ce++){const Ne=j[Ce],Ve=Ne.nx*Ne.size,it=new Uint8Array(L.buffer,Ne.end*2,Ve*2);Ue.set(it,ce),ce+=Ve*2,Ne.end+=Ve}return new DataView(Ue.buffer)}function ye(p){const _=p.array.slice(p.offset.value,p.offset.value+p.size),b=vr(_),L=p.lines*p.channels*p.width,V=p.type==1?new Uint16Array(L):new Uint32Array(L);let F=0,j=0;const se=new Array(4);for(let fe=0;fe<p.lines;fe++)for(let ie=0;ie<p.channels;ie++){let pe=0;switch(p.type){case 1:se[0]=F,se[1]=se[0]+p.width,F=se[1]+p.width;for(let xe=0;xe<p.width;++xe){const ce=b[se[0]++]<<8|b[se[1]++];pe+=ce,V[j]=pe,j++}break;case 2:se[0]=F,se[1]=se[0]+p.width,se[2]=se[1]+p.width,F=se[2]+p.width;for(let xe=0;xe<p.width;++xe){const ce=b[se[0]++]<<24|b[se[1]++]<<16|b[se[2]++]<<8;pe+=ce,V[j]=pe,j++}break}}return new DataView(V.buffer)}function D(p){const _=p.viewer,b={value:p.offset.value},L=new Uint8Array(p.width*p.lines*(p.channels*p.type*2)),V={version:Be(_,b),unknownUncompressedSize:Be(_,b),unknownCompressedSize:Be(_,b),acCompressedSize:Be(_,b),dcCompressedSize:Be(_,b),rleCompressedSize:Be(_,b),rleUncompressedSize:Be(_,b),rleRawSize:Be(_,b),totalAcUncompressedCount:Be(_,b),totalDcUncompressedCount:Be(_,b),acCompression:Be(_,b)};if(V.version<2)throw new Error("EXRLoader.parse: "+G.compression+" version "+V.version+" is unsupported");const F=new Array;let j=he(_,b)-2;for(;j>0;){const Ce=K(_.buffer,b),Ne=ze(_,b),Ve=Ne>>2&3,it=(Ne>>4)-1,Ze=new Int8Array([it])[0],dt=ze(_,b);F.push({name:Ce,index:Ze,type:dt,compression:Ve}),j-=Ce.length+3}const se=G.channels,fe=new Array(p.channels);for(let Ce=0;Ce<p.channels;++Ce){const Ne=fe[Ce]={},Ve=se[Ce];Ne.name=Ve.name,Ne.compression=0,Ne.decoded=!1,Ne.type=Ve.pixelType,Ne.pLinear=Ve.pLinear,Ne.width=p.width,Ne.height=p.lines}const ie={idx:new Array(3)};for(let Ce=0;Ce<p.channels;++Ce){const Ne=fe[Ce];for(let Ve=0;Ve<F.length;++Ve){const it=F[Ve];Ne.name==it.name&&(Ne.compression=it.compression,it.index>=0&&(ie.idx[it.index]=Ce),Ne.offset=Ce)}}let pe,xe,ce;if(V.acCompressedSize>0)switch(V.acCompression){case 0:pe=new Uint16Array(V.totalAcUncompressedCount),$e(p.array,_,b,V.acCompressedSize,pe,V.totalAcUncompressedCount);break;case 1:const Ce=p.array.slice(b.value,b.value+V.totalAcUncompressedCount),Ne=vr(Ce);pe=new Uint16Array(Ne.buffer),b.value+=V.totalAcUncompressedCount;break}if(V.dcCompressedSize>0){const Ce={array:p.array,offset:b,size:V.dcCompressedSize};xe=new Uint16Array(de(Ce).buffer),b.value+=V.dcCompressedSize}if(V.rleRawSize>0){const Ce=p.array.slice(b.value,b.value+V.rleCompressedSize),Ne=vr(Ce);ce=ht(Ne.buffer),b.value+=V.rleCompressedSize}let Ue=0;const De=new Array(fe.length);for(let Ce=0;Ce<De.length;++Ce)De[Ce]=new Array;for(let Ce=0;Ce<p.lines;++Ce)for(let Ne=0;Ne<fe.length;++Ne)De[Ne].push(Ue),Ue+=fe[Ne].width*p.type*2;pt(ie,De,fe,pe,xe,L);for(let Ce=0;Ce<fe.length;++Ce){const Ne=fe[Ce];if(!Ne.decoded)switch(Ne.compression){case 2:let Ve=0,it=0;for(let Ze=0;Ze<p.lines;++Ze){let dt=De[Ce][Ve];for(let Qe=0;Qe<Ne.width;++Qe){for(let ke=0;ke<2*Ne.type;++ke)L[dt++]=ce[it+ke*Ne.width*Ne.height];it++}Ve++}break;case 1:default:throw new Error("EXRLoader.parse: unsupported channel compression")}}return new DataView(L.buffer)}function K(p,_){const b=new Uint8Array(p);let L=0;for(;b[_.value+L]!=0;)L+=1;const V=new TextDecoder().decode(b.slice(_.value,_.value+L));return _.value=_.value+L+1,V}function Y(p,_,b){const L=new TextDecoder().decode(new Uint8Array(p).slice(_.value,_.value+b));return _.value=_.value+b,L}function Te(p,_){const b=we(p,_),L=Ee(p,_);return[b,L]}function Le(p,_){const b=Ee(p,_),L=Ee(p,_);return[b,L]}function we(p,_){const b=p.getInt32(_.value,!0);return _.value=_.value+4,b}function Ee(p,_){const b=p.getUint32(_.value,!0);return _.value=_.value+4,b}function Pe(p,_){const b=p[_.value];return _.value=_.value+1,b}function ze(p,_){const b=p.getUint8(_.value);return _.value=_.value+1,b}const Be=function(p,_){const b=Number(p.getBigInt64(_.value,!0));return _.value+=8,b};function Ye(p,_){const b=p.getFloat32(_.value,!0);return _.value+=4,b}function I(p,_){return $a.toHalfFloat(Ye(p,_))}function P(p){const _=(p&31744)>>10,b=p&1023;return(p>>15?-1:1)*(_?_===31?b?NaN:1/0:Math.pow(2,_-15)*(1+b/1024):6103515625e-14*(b/1024))}function he(p,_){const b=p.getUint16(_.value,!0);return _.value+=2,b}function Ae(p,_){return P(he(p,_))}function Ie(p,_,b,L){const V=b.value,F=[];for(;b.value<V+L-1;){const j=K(_,b),se=we(p,b),fe=ze(p,b);b.value+=3;const ie=we(p,b),pe=we(p,b);F.push({name:j,pixelType:se,pLinear:fe,xSampling:ie,ySampling:pe})}return b.value+=1,F}function Je(p,_){const b=Ye(p,_),L=Ye(p,_),V=Ye(p,_),F=Ye(p,_),j=Ye(p,_),se=Ye(p,_),fe=Ye(p,_),ie=Ye(p,_);return{redX:b,redY:L,greenX:V,greenY:F,blueX:j,blueY:se,whiteX:fe,whiteY:ie}}function mt(p,_){const b=["NO_COMPRESSION","RLE_COMPRESSION","ZIPS_COMPRESSION","ZIP_COMPRESSION","PIZ_COMPRESSION","PXR24_COMPRESSION","B44_COMPRESSION","B44A_COMPRESSION","DWAA_COMPRESSION","DWAB_COMPRESSION"],L=ze(p,_);return b[L]}function yt(p,_){const b=Ee(p,_),L=Ee(p,_),V=Ee(p,_),F=Ee(p,_);return{xMin:b,yMin:L,xMax:V,yMax:F}}function pn(p,_){const b=["INCREASING_Y"],L=ze(p,_);return b[L]}function nt(p,_){const b=Ye(p,_),L=Ye(p,_);return[b,L]}function Qt(p,_){const b=Ye(p,_),L=Ye(p,_),V=Ye(p,_);return[b,L,V]}function Ot(p,_,b,L,V){if(L==="string"||L==="stringvector"||L==="iccProfile")return Y(_,b,V);if(L==="chlist")return Ie(p,_,b,V);if(L==="chromaticities")return Je(p,b);if(L==="compression")return mt(p,b);if(L==="box2i")return yt(p,b);if(L==="lineOrder")return pn(p,b);if(L==="float")return Ye(p,b);if(L==="v2f")return nt(p,b);if(L==="v3f")return Qt(p,b);if(L==="int")return we(p,b);if(L==="rational")return Te(p,b);if(L==="timecode")return Le(p,b);if(L==="preview")return b.value+=V,"skipped";b.value+=V}function $i(p,_,b){const L={};if(p.getUint32(0,!0)!=20000630)throw new Error("THREE.EXRLoader: provided file doesn't appear to be in OpenEXR format.");L.version=p.getUint8(4);const V=p.getUint8(5);L.spec={singleTile:!!(V&2),longName:!!(V&4),deepFormat:!!(V&8),multiPart:!!(V&16)},b.value=8;let F=!0;for(;F;){const j=K(_,b);if(j==0)F=!1;else{const se=K(_,b),fe=Ee(p,b),ie=Ot(p,_,b,se,fe);ie===void 0?console.warn(`EXRLoader.parse: skipped unknown header attribute type '${se}'.`):L[j]=ie}}if(V&-5)throw console.error("EXRHeader:",L),new Error("THREE.EXRLoader: provided file is currently unsupported.");return L}function Pr(p,_,b,L,V){const F={size:0,viewer:_,array:b,offset:L,width:p.dataWindow.xMax-p.dataWindow.xMin+1,height:p.dataWindow.yMax-p.dataWindow.yMin+1,channels:p.channels.length,bytesPerLine:null,lines:null,inputSize:null,type:p.channels[0].pixelType,uncompress:null,getter:null,format:null,encoding:null};switch(p.compression){case"NO_COMPRESSION":F.lines=1,F.uncompress=S;break;case"RLE_COMPRESSION":F.lines=1,F.uncompress=$;break;case"ZIPS_COMPRESSION":F.lines=1,F.uncompress=de;break;case"ZIP_COMPRESSION":F.lines=16,F.uncompress=de;break;case"PIZ_COMPRESSION":F.lines=32,F.uncompress=_e;break;case"PXR24_COMPRESSION":F.lines=16,F.uncompress=ye;break;case"DWAA_COMPRESSION":F.lines=32,F.uncompress=D;break;case"DWAB_COMPRESSION":F.lines=256,F.uncompress=D;break;default:throw new Error("EXRLoader.parse: "+p.compression+" is unsupported")}if(F.scanlineBlockSize=F.lines,F.type==1)switch(V){case an:F.getter=Ae,F.inputSize=2;break;case Tn:F.getter=he,F.inputSize=2;break}else if(F.type==2)switch(V){case an:F.getter=Ye,F.inputSize=4;break;case Tn:F.getter=I,F.inputSize=4}else throw new Error("EXRLoader.parse: unsupported pixelType "+F.type+" for "+p.compression+".");F.blockCount=(p.dataWindow.yMax+1)/F.scanlineBlockSize;for(let se=0;se<F.blockCount;se++)Be(_,L);F.outputChannels=F.channels==3?4:F.channels;const j=F.width*F.height*F.outputChannels;switch(V){case an:F.byteArray=new Float32Array(j),F.channels<F.outputChannels&&F.byteArray.fill(1,0,j);break;case Tn:F.byteArray=new Uint16Array(j),F.channels<F.outputChannels&&F.byteArray.fill(15360,0,j);break;default:console.error("THREE.EXRLoader: unsupported type: ",V);break}return F.bytesPerLine=F.width*F.inputSize*F.channels,F.outputChannels==4?(F.format=Yt,F.encoding=An):(F.format=po,F.encoding=An),F}const Qn=new DataView(e),Ir=new Uint8Array(e),y={value:0},G=$i(Qn,e,y),k=Pr(G,Qn,Ir,y,this.type),O={value:0},Q={R:0,G:1,B:2,A:3,Y:0};for(let p=0;p<k.height/k.scanlineBlockSize;p++){const _=Ee(Qn,y);k.size=Ee(Qn,y),k.lines=_+k.scanlineBlockSize>k.height?k.height-_:k.scanlineBlockSize;const L=k.size<k.lines*k.bytesPerLine?k.uncompress(k):S(k);y.value+=k.size;for(let V=0;V<k.scanlineBlockSize;V++){const F=V+p*k.scanlineBlockSize;if(F>=k.height)break;for(let j=0;j<k.channels;j++){const se=Q[G.channels[j].name];for(let fe=0;fe<k.width;fe++){O.value=(V*(k.channels*k.width)+j*k.width+fe)*k.inputSize;const ie=(k.height-1-F)*(k.width*k.outputChannels)+fe*k.outputChannels+se;k.byteArray[ie]=k.getter(L,O)}}}}return{header:G,width:k.width,height:k.height,data:k.byteArray,format:k.format,encoding:k.encoding,type:this.type}}setDataType(e){return this.type=e,this}load(e,t,n,i){function r(o,a){o.encoding=a.encoding,o.minFilter=Tt,o.magFilter=Tt,o.generateMipmaps=!1,o.flipY=!1,t&&t(o,a)}return super.load(e,r,n,i)}}class mp{constructor(){J(this,"APP_ID","glApp");J(this,"ASSETS_PATH","/assets/");J(this,"DPR",Math.min(2,window.devicePixelRatio||1));J(this,"USE_PIXEL_LIMIT",!0);J(this,"MAX_PIXEL_COUNT",2560*1440);J(this,"DEFAULT_POSITION",[20,18,20]);J(this,"DEFAULT_LOOKAT_POSITION",[0,0,0]);J(this,"WEBGL_OPTS",{antialias:!0,alpha:!1});J(this,"SIMULATION_SPEED_SCALE",2);J(this,"FREE_BLOCKS_COUNT",12);if(window.URLSearchParams){const t=(n=>[...n].reduce((i,[r,o])=>(i[r]=o===""?!0:o,i),{}))(new URLSearchParams(window.location.search));this.override(t)}}override(e){for(const t in e)if(this[t]!==void 0){const n=e[t].toString();typeof this[t]=="boolean"?this[t]=!(n==="0"||n===!1):typeof this[t]=="number"?this[t]=parseFloat(n):typeof this[t]=="string"&&(this[t]=n)}}}const xt=new mp;class gp{constructor(){J(this,"time",0);J(this,"deltaTime",0);J(this,"width",0);J(this,"height",0);J(this,"viewportWidth",0);J(this,"viewportHeight",0);J(this,"cameraZoom",1);J(this,"cameraOffsetX",0);J(this,"cameraOffsetY",0);J(this,"renderer",null);J(this,"scene",null);J(this,"camera",null);J(this,"orbitControls",null);J(this,"orbitCamera",null);J(this,"postprocessing",null);J(this,"resolution",new Ge);J(this,"viewportResolution",new Ge);J(this,"bgColor",new je("#d0d0d0"));J(this,"canvas",null);J(this,"sharedUniforms",{u_time:{value:0},u_deltaTime:{value:1},u_resolution:{value:this.resolution},u_viewportResolution:{value:this.viewportResolution},u_bgColor1:{value:new je},u_bgColor2:{value:new je}});J(this,"loadList",[]);J(this,"animationSpeed",1);J(this,"startColor","#1E90FF");J(this,"endColor","#30ff2A");J(this,"errorColor","#FF006A");J(this,"defaultColor","#fefbff");J(this,"bgColor1","#ffffff");J(this,"bgColor2","#d0d0d0");J(this,"freeAnimationSpeed",1);J(this,"resultAnimationSpeed",1);J(this,"activeBlocksCount",0)}}const Me=new gp;class _p{constructor(){J(this,"list",[]);J(this,"onLoadCallback")}loadBuf(e,t){this.list.push(()=>{fetch(e).then(n=>n.arrayBuffer()).then(n=>{let i=new Uint32Array(n,0,1)[0],r=JSON.parse(String.fromCharCode.apply(null,new Uint8Array(n,4,i))),o=r.vertexCount,a=r.indexCount,c=4+i,l=new Cn,u=r.attributes;for(let h=0,d=u.length;h<d;h++){let g=u[h],x=g.id,m=x==="indices"?a:o,f=g.componentSize,M=window[g.storageType],C=new M(n,c,m*f),w=M.BYTES_PER_ELEMENT,T;if(g.needsPack){let E=g.packedComponents,N=E.length,B=g.storageType.indexOf("Int")===0,v=1<<w*8,R=B?v*.5:0,H=1/v;T=new Float32Array(m*f);for(let ne=0,ae=0;ne<m;ne++)for(let z=0;z<N;z++){let U=E[z];T[ae]=(C[ae]+R)*H*U.delta+U.from,ae++}}else T=C;x==="indices"?l.setIndex(new jt(T,1)):l.setAttribute(x,new jt(T,f)),c+=m*f*w}t&&t(l),this._onLoad()})})}loadExr(e,t){this.list.push(()=>{new pp().load(e,i=>{t&&t(i),this._onLoad()})})}loadTexture(e,t){this.list.push(()=>{const n=new Image;n.onload=()=>{const i=new Ut(n);i.minFilter=Sl,i.magFilter=Tt,i.generateMipmaps=!0,i.anisotropy=Me.renderer.capabilities.getMaxAnisotropy(),i.flipY=!0,t&&t(i),this._onLoad()},n.src=e})}start(e){this.loadedCount=0,this.onLoadCallback=e;for(let t=0;t<this.list.length;t++)this.list[t]()}_onLoad(){this.loadedCount++,this.loadedCount===this.list.length&&(this.list.length=0,this.onLoadCallback&&this.onLoadCallback())}}const Si=new _p,Ja={type:"change"},ms={type:"start"},Qa={type:"end"};class xp extends Jn{constructor(e,t){super(),t===void 0&&console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.'),t===document&&console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new W,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minPolarAngle=Math.PI*.2,this.maxPolarAngle=Math.PI*.45,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.15,this.enableZoom=!1,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=.5,this.enablePan=!1,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ei.ROTATE,MIDDLE:ei.DOLLY,RIGHT:ei.PAN},this.touches={ONE:ti.ROTATE,TWO:ti.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.scale=1,this._domElementKeyEvents=null,this.getPolarAngle=function(){return a.phi},this.getAzimuthalAngle=function(){return a.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(D){D.addEventListener("keydown",Ft),this._domElementKeyEvents=D},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.scale=1,n.object.updateProjectionMatrix(),n.dispatchEvent(Ja),n.update(),r=i.NONE},this.update=function(){const D=new W,K=new cn().setFromUnitVectors(e.up,new W(0,1,0)),Y=K.clone().invert(),Te=new W,Le=new cn,we=2*Math.PI;return function(){const Pe=n.object.position;D.copy(Pe).sub(n.target),D.applyQuaternion(K),a.setFromVector3(D),n.autoRotate&&r===i.NONE&&v(N()),n.enableDamping?(a.theta+=c.theta*n.dampingFactor,a.phi+=c.phi*n.dampingFactor):(a.theta+=c.theta,a.phi+=c.phi);let ze=n.minAzimuthAngle,Be=n.maxAzimuthAngle;isFinite(ze)&&isFinite(Be)&&(ze<-Math.PI?ze+=we:ze>Math.PI&&(ze-=we),Be<-Math.PI?Be+=we:Be>Math.PI&&(Be-=we),ze<=Be?a.theta=Math.max(ze,Math.min(Be,a.theta)):a.theta=a.theta>(ze+Be)/2?Math.max(ze,a.theta):Math.min(Be,a.theta)),a.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,a.phi)),a.makeSafe();let Ye=n.enableDamping?(n.scale-1)*n.dampingFactor+1:n.scale;return a.radius*=Ye,a.radius=Math.max(n.minDistance,Math.min(n.maxDistance,a.radius)),n.enableDamping===!0?n.target.addScaledVector(l,n.dampingFactor):n.target.add(l),D.setFromSpherical(a),D.applyQuaternion(Y),Pe.copy(n.target).add(D),n.object.lookAt(n.target),n.enableDamping===!0?(c.theta*=1-n.dampingFactor,c.phi*=1-n.dampingFactor,l.multiplyScalar(1-n.dampingFactor)):(c.set(0,0,0),l.set(0,0,0)),n.scale=n.scale/Ye,u||Te.distanceToSquared(n.object.position)>o||8*(1-Le.dot(n.object.quaternion))>o?(n.dispatchEvent(Ja),Te.copy(n.object.position),Le.copy(n.object.quaternion),u=!1,!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",S),n.domElement.removeEventListener("pointerdown",Fe),n.domElement.removeEventListener("pointercancel",pt),n.domElement.removeEventListener("wheel",Ke),n.domElement.removeEventListener("pointermove",ut),n.domElement.removeEventListener("pointerup",ht),n._domElementKeyEvents!==null&&n._domElementKeyEvents.removeEventListener("keydown",Ft)};const n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let r=i.NONE;const o=1e-6,a=new ja,c=new ja,l=new W;let u=!1;const h=new Ge,d=new Ge,g=new Ge,x=new Ge,m=new Ge,f=new Ge,M=new Ge,C=new Ge,w=new Ge,T=[],E={};function N(){return 2*Math.PI/60/60*n.autoRotateSpeed}function B(){return Math.pow(.95,n.zoomSpeed)}function v(D){c.theta-=D}function R(D){c.phi-=D}const H=function(){const D=new W;return function(Y,Te){D.setFromMatrixColumn(Te,0),D.multiplyScalar(-Y),l.add(D)}}(),ne=function(){const D=new W;return function(Y,Te){n.screenSpacePanning===!0?D.setFromMatrixColumn(Te,1):(D.setFromMatrixColumn(Te,0),D.crossVectors(n.object.up,D)),D.multiplyScalar(Y),l.add(D)}}(),ae=function(){const D=new W;return function(Y,Te){const Le=n.domElement;if(n.object.isPerspectiveCamera){const we=n.object.position;D.copy(we).sub(n.target);let Ee=D.length();Ee*=Math.tan(n.object.fov/2*Math.PI/180),H(2*Y*Ee/Le.clientHeight,n.object.matrix),ne(2*Te*Ee/Le.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(H(Y*(n.object.right-n.object.left)/n.object.zoom/Le.clientWidth,n.object.matrix),ne(Te*(n.object.top-n.object.bottom)/n.object.zoom/Le.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function z(D){n.object.isPerspectiveCamera?n.scale/=D:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom*D)),n.object.updateProjectionMatrix(),u=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function U(D){n.object.isPerspectiveCamera?n.scale*=D:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/D)),n.object.updateProjectionMatrix(),u=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function ee(D){h.set(D.clientX,D.clientY)}function oe(D){M.set(D.clientX,D.clientY)}function ue(D){x.set(D.clientX,D.clientY)}function te(D){d.set(D.clientX,D.clientY),g.subVectors(d,h).multiplyScalar(n.rotateSpeed);const K=n.domElement;v(2*Math.PI*g.x/K.clientHeight),R(2*Math.PI*g.y/K.clientHeight),h.copy(d),n.update()}function ge(D){C.set(D.clientX,D.clientY),w.subVectors(C,M),w.y>0?z(B()):w.y<0&&U(B()),M.copy(C),n.update()}function re(D){m.set(D.clientX,D.clientY),f.subVectors(m,x).multiplyScalar(n.panSpeed),ae(f.x,f.y),x.copy(m),n.update()}function Z(D){D.deltaY<0?U(B()):D.deltaY>0&&z(B()),n.update()}function q(D){let K=!1;switch(D.code){case n.keys.UP:ae(0,n.keyPanSpeed),K=!0;break;case n.keys.BOTTOM:ae(0,-n.keyPanSpeed),K=!0;break;case n.keys.LEFT:ae(n.keyPanSpeed,0),K=!0;break;case n.keys.RIGHT:ae(-n.keyPanSpeed,0),K=!0;break}K&&(D.preventDefault(),n.update())}function le(){if(T.length===1)h.set(T[0].pageX,T[0].pageY);else{const D=.5*(T[0].pageX+T[1].pageX),K=.5*(T[0].pageY+T[1].pageY);h.set(D,K)}}function me(){if(T.length===1)x.set(T[0].pageX,T[0].pageY);else{const D=.5*(T[0].pageX+T[1].pageX),K=.5*(T[0].pageY+T[1].pageY);x.set(D,K)}}function Se(){const D=T[0].pageX-T[1].pageX,K=T[0].pageY-T[1].pageY,Y=Math.sqrt(D*D+K*K);M.set(0,Y)}function X(){n.enableZoom&&Se(),n.enablePan&&me()}function He(){n.enableZoom&&Se(),n.enableRotate&&le()}function be(D){if(T.length==1)d.set(D.pageX,D.pageY);else{const Y=ye(D),Te=.5*(D.pageX+Y.x),Le=.5*(D.pageY+Y.y);d.set(Te,Le)}g.subVectors(d,h).multiplyScalar(n.rotateSpeed);const K=n.domElement;v(2*Math.PI*g.x/K.clientHeight),R(2*Math.PI*g.y/K.clientHeight),h.copy(d)}function Oe(D){if(T.length===1)m.set(D.pageX,D.pageY);else{const K=ye(D),Y=.5*(D.pageX+K.x),Te=.5*(D.pageY+K.y);m.set(Y,Te)}f.subVectors(m,x).multiplyScalar(n.panSpeed),ae(f.x,f.y),x.copy(m)}function Re(D){const K=ye(D),Y=D.pageX-K.x,Te=D.pageY-K.y,Le=Math.sqrt(Y*Y+Te*Te);C.set(0,Le),w.set(0,Math.pow(C.y/M.y,n.zoomSpeed)),z(w.y),M.copy(C)}function $e(D){n.enableZoom&&Re(D),n.enablePan&&Oe(D)}function Xe(D){n.enableZoom&&Re(D),n.enableRotate&&be(D)}function Fe(D){n.enabled!==!1&&(T.length===0&&(n.domElement.setPointerCapture(D.pointerId),n.domElement.addEventListener("pointermove",ut),n.domElement.addEventListener("pointerup",ht)),$(D),D.pointerType==="touch"?Lt(D):Ct(D))}function ut(D){n.enabled!==!1&&(D.pointerType==="touch"?A(D):lt(D))}function ht(D){de(D),T.length===0&&(n.domElement.releasePointerCapture(D.pointerId),n.domElement.removeEventListener("pointermove",ut),n.domElement.removeEventListener("pointerup",ht)),n.dispatchEvent(Qa),r=i.NONE}function pt(D){de(D)}function Ct(D){let K;switch(D.button){case 0:K=n.mouseButtons.LEFT;break;case 1:K=n.mouseButtons.MIDDLE;break;case 2:K=n.mouseButtons.RIGHT;break;default:K=-1}switch(K){case ei.DOLLY:if(n.enableZoom===!1)return;oe(D),r=i.DOLLY;break;case ei.ROTATE:if(D.ctrlKey||D.metaKey||D.shiftKey){if(n.enablePan===!1)return;ue(D),r=i.PAN}else{if(n.enableRotate===!1)return;ee(D),r=i.ROTATE}break;case ei.PAN:if(D.ctrlKey||D.metaKey||D.shiftKey){if(n.enableRotate===!1)return;ee(D),r=i.ROTATE}else{if(n.enablePan===!1)return;ue(D),r=i.PAN}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ms)}function lt(D){if(n.enabled!==!1)switch(r){case i.ROTATE:if(n.enableRotate===!1)return;te(D);break;case i.DOLLY:if(n.enableZoom===!1)return;ge(D);break;case i.PAN:if(n.enablePan===!1)return;re(D);break}}function Ke(D){n.enabled===!1||n.enableZoom===!1||r!==i.NONE||(n.dispatchEvent(ms),Z(D),n.dispatchEvent(Qa))}function Ft(D){n.enabled===!1||n.enablePan===!1||q(D)}function Lt(D){switch(_e(D),T.length){case 1:switch(n.touches.ONE){case ti.ROTATE:if(n.enableRotate===!1)return;le(),r=i.TOUCH_ROTATE;break;case ti.PAN:if(n.enablePan===!1)return;me(),r=i.TOUCH_PAN;break;default:r=i.NONE}break;case 2:switch(n.touches.TWO){case ti.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;X(),r=i.TOUCH_DOLLY_PAN;break;case ti.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;He(),r=i.TOUCH_DOLLY_ROTATE;break;default:r=i.NONE}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ms)}function A(D){switch(_e(D),r){case i.TOUCH_ROTATE:if(n.enableRotate===!1)return;be(D),n.update();break;case i.TOUCH_PAN:if(n.enablePan===!1)return;Oe(D),n.update();break;case i.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;$e(D),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Xe(D),n.update();break;default:r=i.NONE}}function S(D){n.enabled}function $(D){T.push(D)}function de(D){delete E[D.pointerId];for(let K=0;K<T.length;K++)if(T[K].pointerId==D.pointerId){T.splice(K,1);return}}function _e(D){let K=E[D.pointerId];K===void 0&&(K=new Ge,E[D.pointerId]=K),K.set(D.pageX,D.pageY)}function ye(D){const K=D.pointerId===T[0].pointerId?T[1]:T[0];return E[K.pointerId]}n.domElement.addEventListener("contextmenu",S),n.domElement.addEventListener("pointerdown",Fe),n.domElement.addEventListener("pointercancel",pt),n.domElement.addEventListener("wheel",Ke,{passive:!1}),this.update()}}const vp=`#define GLSLIFY 1
uniform sampler2D u_blueNoiseTexture;
uniform vec2 u_blueNoiseTexelSize;
uniform vec2 u_blueNoiseCoordOffset;

// getBlueNoise(gl_FragCoord.xy)
vec3 getBlueNoise (vec2 coord) {
	return texture2D(u_blueNoiseTexture, coord * u_blueNoiseTexelSize + u_blueNoiseCoordOffset).rgb;
}
`;class Sp{constructor(){J(this,"sharedUniforms",{u_blueNoiseTexture:{value:null},u_blueNoiseTexelSize:{value:null},u_blueNoiseCoordOffset:{value:new Ge}});J(this,"TEXTURE_SIZE",128)}preInit(){Si.loadTexture(xt.ASSETS_PATH+"textures/LDR_RGB1_0.png",e=>{e.generateMipmaps=!1,e.minFilter=e.magFilter=wt,e.wrapS=e.wrapT=Er,e.needsUpdate=!0,this.sharedUniforms.u_blueNoiseTexture.value=e,this.sharedUniforms.u_blueNoiseTexelSize.value=new Ge(1/this.TEXTURE_SIZE,1/this.TEXTURE_SIZE)}),qe.getBlueNoise=vp}update(e){this.sharedUniforms.u_blueNoiseCoordOffset.value.set(Math.random(),Math.random())}}const Vi=new Sp,gs=`#define GLSLIFY 1
attribute vec3 instancePos;
attribute vec4 instanceOrient;
attribute float instanceShowRatio;
attribute vec3 instanceSpinPivot;
attribute vec4 instanceSpinOrient;
attribute vec3 instanceColor;
attribute float instanceIsActive;
attribute vec2 instanceNextDirection;

varying vec3 v_modelPosition;
varying vec3 v_viewPosition;
varying vec3 v_worldPosition;

varying vec3 v_viewNormal;
varying vec3 v_worldNormal;

varying vec2 v_uv;

varying float v_ao;
varying vec3 v_color;
varying float v_clipY;

uniform sampler2D u_infoTexture;
uniform float u_endAnimationRatio;
uniform float u_restartAnimationRatio;

vec3 qrotate(vec4 q, vec3 v) {
	return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

float linearstep(float edge0, float edge1, float x) {
    return  clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
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

    v_viewNormal = normalMatrix * nor;
    v_worldNormal = inverseTransformDirection(viewNormal, viewMatrix);

    v_color = instanceColor;

    #if defined( USE_SHADOWMAP )
        #if NUM_DIR_LIGHT_SHADOWS > 0
            // Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.
            vec4 shadowWorldPosition;

            // shadowWorldPosition = worldPosition + vec4( v_worldNormal * directionalLightShadows[0].shadowNormalBias, 0 );

            #ifdef IS_BASE
                shadowWorldPosition = vec4((position - vec3(0., -2.5, 0.)) * 1.005 + vec3(0., -2.5, 0.), 1.);
                shadowWorldPosition = modelMatrix * shadowWorldPosition;
            #else
                shadowWorldPosition = vec4(position * 1.02, 1.);
                shadowWorldPosition.y += instanceShowRatio - 1.;
                shadowWorldPosition.xyz = qrotate(instanceSpinOrient, shadowWorldPosition.xyz - instanceSpinPivot) + instanceSpinPivot;
                shadowWorldPosition.xyz = qrotate(instanceOrient, shadowWorldPosition.xyz) + instancePos;
                shadowWorldPosition = modelMatrix * shadowWorldPosition;
            #endif
            vDirectionalShadowCoord[0] = directionalShadowMatrix[0] * shadowWorldPosition;
        #endif
    #endif

    #ifndef IS_BASE
        v_uv = (instancePos.xz + 2.5) / 5.0;
    #else
        v_uv = (position.xz + 2.5) / 5.0;
    #endif

    // ao
    float ao = 0.0;
    vec4 infoTexture = texture2D(u_infoTexture, vec2(1.0 - v_uv.y, v_uv.x));
    #ifndef IS_BASE
        float texel = 1.0 / 5.0;

        vec2 infoTextureUv = vec2(1.0 - v_uv.y, v_uv.x);
        vec2 infoTextureUvNext = infoTextureUv + texel * vec2(instanceNextDirection.y, instanceNextDirection.x);

        vec3 texelVec = vec3(texel, -texel, 0.0);
        float activeRatio = mix(1.0, infoTexture.x, instanceIsActive);

        vec4 infoTextureTop = vec4(1.0);
        vec4 infoTextureRight = vec4(1.0);
        vec4 infoTextureBottom = vec4(1.0);
        vec4 infoTextureLeft = vec4(1.0);

        if (instanceIsActive > 0.5) {
            infoTextureTop = mix(texture2D(u_infoTexture, infoTextureUv + texelVec.xz), texture2D(u_infoTexture, infoTextureUvNext + texelVec.xz), 1. - activeRatio);
            infoTextureRight = mix(texture2D(u_infoTexture, infoTextureUv + texelVec.zx), texture2D(u_infoTexture, infoTextureUvNext + texelVec.zx), 1. - activeRatio);
            infoTextureBottom = mix(texture2D(u_infoTexture, infoTextureUv + texelVec.yz), texture2D(u_infoTexture, infoTextureUvNext + texelVec.yz), 1. - activeRatio);
            infoTextureLeft = mix(texture2D(u_infoTexture, infoTextureUv + texelVec.zy), texture2D(u_infoTexture, infoTextureUvNext + texelVec.zy), 1. - activeRatio);
        }
        ao = v_uv.y < texel ? 0.0 : infoTextureTop.x * max(-normal.z, 0.0);
        ao += v_uv.x > 1.0 - texel ? 0.0 : infoTextureRight.x * max(normal.x, 0.0);
        ao += v_uv.y > 1.0 - texel ? 0.0 : infoTextureBottom.x * max(normal.z, 0.0);
        ao += v_uv.x < texel ? 0.0 : infoTextureLeft.x * max(-normal.x, 0.0);
        ao = 1.0 - ao * 0.8;
        ao *= smoothstep(-1., 0., v_worldNormal.y);

    #else
        float aoThreshold = 2.5;
        float depth = 0.025;
        ao = linearstep(aoThreshold - depth, aoThreshold, abs(v_modelPosition.x));
        ao += linearstep(aoThreshold - depth, aoThreshold, abs(v_modelPosition.z));
        aoThreshold = 0.5;
        ao += linearstep(aoThreshold + depth, aoThreshold, -v_modelPosition.y + depth * (u_endAnimationRatio - 0.65 * u_restartAnimationRatio) * 0.75);
        ao = min(1.0, ao);
    #endif

    v_ao = ao;

    #ifdef IS_DEPTH
        vHighPrecisionZW = gl_Position.zw;
    #endif
}
`,eo=`#define GLSLIFY 1
uniform vec3 u_lightPosition;
uniform sampler2D u_matcap;
uniform sampler2D u_infoTexture;

#ifdef IS_BASE
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor1;
    uniform vec3 u_bgColor2;
    uniform vec3 u_color;
    uniform vec3 u_blocksColor;
    uniform float u_yDisplacement;
    uniform float u_endAnimationRatio;
#endif

varying vec3 v_modelPosition;
varying vec3 v_viewPosition;
varying vec3 v_worldPosition;

varying vec3 v_viewNormal;
varying vec3 v_worldNormal;

varying vec2 v_uv;

varying float v_ao;
varying vec3 v_color;
varying float v_clipY;

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

vec3 aces_tonemap(vec3 color){
	mat3 m1 = mat3(
        0.59719, 0.07600, 0.02840,
        0.35458, 0.90834, 0.13383,
        0.04823, 0.01566, 0.83777
	);
	mat3 m2 = mat3(
        1.60475, -0.10208, -0.00327,
        -0.53108,  1.10813, -0.07276,
        -0.07367, -0.00605,  1.07602
	);
	vec3 v = m1 * color;
	vec3 a = v * (v + 0.0245786) - 0.000090537;
	vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
	return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
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
    if (v_clipY < 0.0) discard;
    #endif

    #ifdef IS_BASE
    vec4 infoTexture = texture2D(u_infoTexture, vec2(1.0 - v_uv.y, v_uv.x));
    #endif

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
    float ao = v_ao;

    // shadows
    float shadowMask = 1.0;
    #ifdef USE_SHADOWMAP
        #if NUM_DIR_LIGHT_SHADOWS > 0
            DirectionalLightShadow directionalLight;
            #pragma unroll_loop_start
            for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
                directionalLight = directionalLightShadows[ i ];
                vec3 noises = getBlueNoise(gl_FragCoord.xy);
                shadowMask = getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias + noises.z * -0.001, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] + vec4((noises.xy - 0.5) / directionalLight.shadowMapSize, 0.0, 0.0));
            }
            #pragma unroll_loop_end
        #endif

        #ifdef IS_BASE
            shadowMask -= 0.9 * infoTexture.x * linearstep(-0.525, -0.5, v_modelPosition.y);
        #endif

    #endif

    // final
    #ifdef IS_BASE
        vec3 albedo = SRGBtoLinear(u_color);
    #else
        vec3 albedo = SRGBtoLinear(v_color);
    #endif

    vec3 matcapMap = SRGBtoLinear(texture2D(u_matcap, uv).rgb);
    float matcapDiff = matcapMap.r;
    float matcapSpec = matcapMap.b;

	vec3 color = albedo * (matcapDiff * 0.25 + 0.75);
	color += clamp(N.y, 0.0, 0.5);
    color += 0.5 * shadowMask * matcapSpec;
    color *= attenuation;
    color += 0.5 * (1.0 - NdV);
    color *= 0.4 + 0.6 * ao;
    color *= 0.7 + 0.3 * shadowMask;

    #ifdef IS_BASE
        color += SRGBtoLinear(u_blocksColor) * 0.2 * (1.0 - u_endAnimationRatio) * infoTexture.y * infoTexture.x * linearstep(-0.55, -0.5, v_modelPosition.y);
    #endif

    #ifdef IS_BASE
        vec2 screenUv = gl_FragCoord.xy / u_resolution;
        float alpha = smoothstep(-6.0, -3.0, v_modelPosition.y + u_yDisplacement);
        color = mix(mix(u_bgColor1, u_bgColor2, screenUv.y), color, alpha);
    #endif

	float luma = dot(color, vec3(0.299, 0.587, 0.114));
	color = mix(vec3(luma), color, 1.75);

	gl_FragColor = vec4(linearToSRGB(color), 1.);

}

`,Mp=`#define GLSLIFY 1
#include <common>
#include <packing>
varying vec2 vHighPrecisionZW;
varying float v_clipY;
void main() {
    #ifndef IS_BASE
    if (v_clipY < 0.0) discard;
    #endif
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
    gl_FragColor = packDepthToRGBA( fragCoordZ );
}
`;let yp=new W,bp=class{constructor(){J(this,"animation",0);J(this,"boardDir",new Ge(0,0));J(this,"boardPos",new Ge(0,0));J(this,"pos",new W(0,0,0));J(this,"orient",new cn);J(this,"showRatio",0);J(this,"spinPivot",new W(0,0,0));J(this,"spinOrient",new cn)}reset(){this.animation=0,this.boardDir.set(0,0),this.boardPos.set(0,0),this.pos.set(0,0,0),this.orient.set(0,0,0,1),this.showRatio=0,this.spinPivot.set(0,0,0),this.spinOrient.set(0,0,0,1)}update(e){this.pos.set(this.boardPos.x,0,-this.boardPos.y),this.spinPivot.set(this.boardDir.x*.5,-.5,-this.boardDir.y*.5),this.spinOrient.setFromAxisAngle(yp.set(-this.boardDir.y,0,-this.boardDir.x),this.animation*Math.PI/2)}};const to=(s,e)=>Math.sqrt(Math.pow(s,2)+Math.pow(e,2));class wp{constructor(e=0,t=0,n=0){J(this,"id",-1);J(this,"row",0);J(this,"col",0);J(this,"priority",0);J(this,"ringIndex",0);J(this,"isMain",!1);J(this,"isBorder",!1);J(this,"isOccupied",!1);J(this,"willBeOccupied",!1);J(this,"domEl",null);J(this,"neighbours",null);J(this,"reachableNeighbours",null);J(this,"prioritySortedReachableNeighbours",null);J(this,"activeRatio",0);J(this,"MAX_DISTANCE",to(Bt,Bt));J(this,"loseAnimationPositionArray",null);J(this,"loseAnimationOrientArray",null);J(this,"randomDelay",0);this.id=e,this.row=t,this.col=n,this.distance=to(t,n),this.priority=this.MAX_DISTANCE-this.distance,this.ringIndex=Math.floor(this.distance),this.isMain=t===0&&n===0,this.isBorder=Math.abs(t)===2||Math.abs(n)===2,this.randomDelay=Math.random()*.5+(this.MAX_DISTANCE-this.priority)*.5}init(){this.reachableNeighbours=this.neighbours.filter(e=>e.row===this.row||e.col===this.col),this.prioritySortedReachableNeighbours=this.reachableNeighbours.toSorted((e,t)=>e.priority-t.priority)}shuffleReachableNeighbours(){let e=this.reachableNeighbours.length;for(;e!=0;){let t=Math.floor(Math.random()*e);e--,[this.reachableNeighbours[e],this.reachableNeighbours[t]]=[this.reachableNeighbours[t],this.reachableNeighbours[e]]}this.prioritySortedReachableNeighbours=this.reachableNeighbours.toSorted((t,n)=>t.priority-n.priority)}reset(){this.isOccupied=!1,this.willBeOccupied=!1,this.activeRatio=0}update(e){this.domEl&&(this.domEl.style.backgroundColor=`rgba(255, 0, 0, ${this.activeRatio})`)}}const It=5,Bt=Math.floor(It/2),Xt=It*It;class Tp{constructor(){J(this,"tiles",new Map);J(this,"mainTile",null)}init(){this.domEl=xt.USE_BOARD_DEBUG?document.querySelector("#board"):0;let e=0;for(let t=0;t<It;t++){let n;this.domEl&&(n=document.createElement("div"),n.classList.add("row"),this.domEl.appendChild(n));const i=t-Bt,r=new Map;this.tiles.set(i,r);for(let o=0;o<It;o++){let a;this.domEl&&(a=document.createElement("div"),a.classList.add("tile"),n.appendChild(a));const c=o-Bt,l=new wp(e,i,c);this.domEl&&(l.domEl=a),r.set(c,l),e++}}for(let t=0;t<It;t++)for(let n=0;n<It;n++){const i=this.getTile(t-Bt,n-Bt),r=this.getNeighbouringTiles(t-Bt,n-Bt);i.neighbours=r,i.init()}this.mainTile=this.getTile(0,0)}getTile(e,t){const n=this.tiles.get(e);return n?n.get(t):null}getRandomFreeTile(){const e=[];return this.tiles.forEach(t=>{t.forEach(n=>{n.isOccupied||e.push(n)})}),e.length===0?null:e[Math.floor(Math.random()*e.length)]}getNeighbouringTiles(e,t){const n=[];for(let i=-1;i<=1;i++)for(let r=-1;r<=1;r++){if(i===0&&r===0)continue;const o=this.getTile(e+i,t+r);o&&n.push(o)}return n}reset(){this.tiles.forEach(e=>{e.forEach(t=>{t.reset()})})}update(e){this.tiles.forEach(t=>{t.forEach(n=>{n.update(e)})})}}const fn=new Tp;class Ep{constructor(){J(this,"PI",Math.PI);J(this,"PI2",this.PI*2);J(this,"HALF_PI",this.PI*.5);J(this,"DEG2RAD",this.PI/180);J(this,"RAD2DEG",180/this.PI)}clamp(e,t,n){return e<t?t:e>n?n:e}mix(e,t,n){return e+(t-e)*n}cUnMix(e,t,n){return this.clamp((n-e)/(t-e),0,1)}saturate(e){return this.clamp(e,0,1)}fit(e,t,n,i,r){return e=this.cUnMix(t,n,e),i+e*(r-i)}}function Ap(s,e,t,n,i){function r(c,l,u,h,d){const g=3*(u-l),x=3*(h-u)-g;return(((d-l-g-x)*c+x)*c+g)*c+l}function o(c,l,u,h=1e-6){let d=0,g=1,x=c;for(;d<g;){const m=r(x,0,l,u,1);if(Math.abs(m-c)<h)return x;m<c?d=x:g=x,x=(d+g)/2}return x}const a=o(s,e,n);return r(a,0,t,i,1)}const xi=new Ep;function Cp(s){return s&&s.__esModule&&Object.prototype.hasOwnProperty.call(s,"default")?s.default:s}var Go={exports:{}};(function(s){(function(e){function t(){this._listeners=[],this.dispatchCount=0}var n=t.prototype;n.add=a,n.addOnce=c,n.remove=l,n.dispatch=u;var i="Callback function is missing!",r=Array.prototype.slice;function o(h){h.sort(function(d,g){return d=d.p,g=g.p,g<d?1:g>d?-1:0})}function a(h,d,g,x){if(!h)throw i;g=g||0;for(var m=this._listeners,f,M,C,w=m.length;w--;)if(f=m[w],f.f===h&&f.c===d)return!1;typeof g=="function"&&(M=g,g=x,C=4),m.unshift({f:h,c:d,p:g,r:M||h,a:r.call(arguments,C||3),j:0}),o(m)}function c(h,d,g,x){if(!h)throw i;var m=this,f=function(){return m.remove.call(m,h,d),h.apply(d,r.call(arguments,0))};x=r.call(arguments,0),x.length===1&&x.push(e),x.splice(2,0,f),a.apply(m,x)}function l(h,d){if(!h)return this._listeners.length=0,!0;for(var g=this._listeners,x,m=g.length;m--;)if(x=g[m],x.f===h&&(!d||x.c===d))return x.j=0,g.splice(m,1),!0;return!1}function u(h){h=r.call(arguments,0),this.dispatchCount++;for(var d=this.dispatchCount,g=this._listeners,x,m,f=g.length;f--;)if(x=g[f],x&&x.j<d&&(x.j=d,x.r.apply(x.c,x.a.concat(h))===!1)){m=x;break}for(g=this._listeners,f=g.length;f--;)g[f].j=0;return m}s.exports=t})()})(Go);var Rp=Go.exports;const Sr=Cp(Rp),ot={NOT_STARTED:"not-started",STARTED:"started",FREE:"free",RESULT:"result",RESULT_ANIMATION:"result_animation",RESTART_ANIMATION:"restart_animation",RESTART:"restart"},Mr=[ot.NOT_STARTED,ot.STARTED,ot.FREE,ot.RESULT,ot.RESULT_ANIMATION,ot.RESTART_ANIMATION,ot.RESTART],Wt={NONE:"none",PAUSE:"pause",STOP:"stop",COMPLETED:"completed",FAILED:"failed"};class Lp{constructor(){J(this,"statusIndex",0);J(this,"status",Mr[this.statusIndex]);J(this,"result",Wt.NONE);J(this,"stateSignal",new Sr);J(this,"spawnSignal",new Sr);J(this,"endCycleSignal",new Sr);J(this,"gameEndedSignal",new Sr);J(this,"statusUpdateQueue",[])}init(){this.updateFlags()}updateAfterCycle(){this.isStart&&this.setFree(),this.isResult&&this.setResultAnimation();const e=this.statusUpdateQueue.shift();e&&typeof e=="function"&&e()}updateFlags(){this.hasNotStarted=this.status===ot.NOT_STARTED,this.isStart=this.status===ot.STARTED,this.isFree=this.status===ot.FREE,this.isResult=this.status===ot.RESULT,this.isResultAnimation=this.status===ot.RESULT_ANIMATION,this.isRestartAnimation=this.status===ot.RESTART_ANIMATION,this.isRestart=this.status===ot.RESTART,this.isSuccessResult=(this.isResult||this.isResultAnimation)&&this.result===Wt.COMPLETED,this.isFailResult=(this.isResult||this.isResultAnimation)&&this.result===Wt.FAILED,this.isPaused=(this.isResult||this.isResultAnimation)&&this.result===Wt.PAUSE,this.isStopped=(this.isResult||this.isResultAnimation)&&this.result===Wt.STOP}updateStatus(e,t=!1){const n=Mr.indexOf(e);return(this.statusIndex+1)%Mr.length===n?(this.statusIndex=n,this.status=Mr[this.statusIndex],t||(this.updateFlags(),this.stateSignal.dispatch(this.status,this.result)),!0):!1}updateStatusAndResult(e,t){this.updateStatus(e,!0)&&(this.result=t,this.updateFlags(),this.stateSignal.dispatch(this.status,this.result))}reset(){this.statusUpdateQueue.push(()=>this.updateStatusAndResult(ot.NOT_STARTED,Wt.NONE))}setStart(){this.statusUpdateQueue.push(()=>this.updateStatus(ot.STARTED))}setFree(){this.statusUpdateQueue.push(()=>this.updateStatus(ot.FREE))}setPause(){this.statusUpdateQueue.push(()=>this.updateStatusAndResult(ot.RESULT,Wt.PAUSE))}setStop(){this.statusUpdateQueue.push(()=>this.updateStatusAndResult(ot.RESULT,Wt.STOP))}setComplete(){this.statusUpdateQueue.push(()=>this.updateStatusAndResult(ot.RESULT,Wt.COMPLETED))}setFail(){this.statusUpdateQueue.push(()=>this.updateStatusAndResult(ot.RESULT,Wt.FAILED))}setResultAnimation(){this.statusUpdateQueue.push(()=>this.updateStatus(ot.RESULT_ANIMATION))}setRestartAnimation(){this.statusUpdateQueue.push(()=>this.updateStatus(ot.RESTART_ANIMATION))}setRestart(){this.statusUpdateQueue.push(()=>{this.updateStatus(ot.RESTART)&&this.gameEndedSignal.dispatch()})}}const We=new Lp;class no{constructor(e){J(this,"id",-1);J(this,"isMoving",!1);J(this,"hasBeenSpawned",!1);J(this,"hasAnimationEnded",!1);J(this,"hasBeenEvaluated",!1);J(this,"currentTile",null);J(this,"targetTile",null);J(this,"moveAnimationRatio",0);J(this,"spawnAnimationRatio",0);J(this,"spawnAnimationRatioUnclamped",-Math.random());J(this,"easedAnimationRatio",0);J(this,"randomVec",{x:Math.random()-.5,y:Math.random()-.5});J(this,"lifeCycle",0);this.id=e}init(){this.setNewEasingFunction()}updateTile(){this.currentTile.isOccupied=!0,this.currentTile.willBeOccupied=!1,this.currentTile.domEl&&(this.currentTile.domEl.innerHTML=this.id)}setNewEasingFunction(){const e=Math.random(),t=.25;this.easingFunction=n=>Ap(xi.fit(n,e*t,e*t+(1-t),0,1),.3,0,0,1)}moveToNextTile(e=!1,t=0){this.hasBeenEvaluated=!0,this.moveAnimationRatio=-t;let n;this.currentTile.shuffleReachableNeighbours(),e?n=this.currentTile.reachableNeighbours:n=this.currentTile.prioritySortedReachableNeighbours;let i=n.find(r=>{let o=!r.isOccupied&&!r.willBeOccupied&&!r.isMain;return e||(o=o&&this.currentTile.priority>=r.priority),o});!this.currentTile.isMain&&Math.random()>.8&&(i=null),i?(this.targetTile=i,this.targetTile.willBeOccupied=!0,this.isMoving=!0):this.hasAnimationEnded=!0}endMove(){this.moveAnimationRatio=1,this.currentTile.domEl&&(this.currentTile.domEl.innerHTML=""),this.currentTile.isOccupied=!1,this.currentTile=this.targetTile,this.targetTile=null,this.hasAnimationEnded=!0,this.updateTile()}resetAfterCycle(){this.hasBeenEvaluated=!1,this.hasAnimationEnded=!1,this.moveAnimationRatio=0,this.easedAnimationRatio=0,this.isMoving=!1,this.lifeCycle++,this.setNewEasingFunction(),this.updateTile()}reset(){this.id=-1,this.isMoving=!1,this.hasBeenSpawned=!1,this.hasAnimationEnded=!1,this.hasBeenEvaluated=!1,this.currentTile=null,this.targetTile=null,this.moveAnimationRatio=0,this.spawnAnimationRatio=0,this.spawnAnimationRatioUnclamped=-Math.random(),this.easedAnimationRatio=0,this.lifeCycle=0}update(e){let t=!1;this.hasBeenSpawned?(this.isMoving&&!this.hasAnimationEnded||We.isResultAnimation)&&(this.moveAnimationRatio+=.5*xt.SIMULATION_SPEED_SCALE*Me.animationSpeed*e,this.moveAnimationRatio=Math.min(1,this.moveAnimationRatio),this.easedAnimationRatio=this.easingFunction(Math.max(0,this.moveAnimationRatio)),this.easedAnimationRatio===1&&(We.isFree||We.isResult)&&(t=!0)):(this.spawnAnimationRatioUnclamped+=xt.SIMULATION_SPEED_SCALE*Me.animationSpeed*e,this.spawnAnimationRatio=Math.max(0,Math.min(1,this.spawnAnimationRatioUnclamped)),this.spawnAnimationRatio===1&&(this.hasBeenSpawned=!0));const n=Math.max(0,Math.min(1,this.hasBeenSpawned?this.easedAnimationRatio:this.spawnAnimationRatio));this.currentTile.activeRatio=this.hasBeenSpawned?this.targetTile?1-n:1:this.spawnAnimationRatio,this.targetTile&&(this.targetTile.activeRatio=n),t&&this.endMove()}}class Dp{constructor(){J(this,"blocks",[]);J(this,"lastSpawnedBlock",null);J(this,"cycleIndex",0);J(this,"animationSpeedRatio",0);J(this,"restartAnimationRatio",0);J(this,"preEndAnimationRatio",0);J(this,"endSpawnAnimationRatioUnclamped",-.1);J(this,"endSpawnAnimationRatio",0);J(this,"endFloatingAnimationRatioUnclamped",0);J(this,"endFloatingAnimationRatio",0);J(this,"endAnimationRatio",0)}init(){We.init(),fn.init()}spawnBlock(){if(!(We.isFailResult||We.isStopped)){if(this.blocks.length>=Xt){We.setResultAnimation();return}if(!(this.blocks.length===Xt-5&&We.isFree)&&!(fn.mainTile.isOccupied&&!We.isSuccessResult)){if(We.isSuccessResult)for(let e=0;e<Xt-Me.activeBlocksCount;e++){const t=fn.getRandomFreeTile();if(t){const n=new no(this.blocks.length);n.currentTile=t,n.init(),n.updateTile(),this.blocks=[n,...this.blocks]}}else{const e=new no(this.blocks.length);e.currentTile=fn.mainTile,this.lastSpawnedBlock=e,e.init(),e.updateTile()}We.spawnSignal.dispatch()}}}startNewCycle(){We.updateAfterCycle(),!We.hasNotStarted&&(We.isRestartAnimation||We.isRestart||We.isStart||(this.lastSpawnedBlock&&(this.blocks=[this.lastSpawnedBlock,...this.blocks],this.lastSpawnedBlock=null),Me.activeBlocksCount=this.blocks.length,!We.isFailResult&&(We.isStopped||(this.blocks.forEach(e=>{e.resetAfterCycle()}),We.endCycleSignal.dispatch(),this.cycleIndex++,this.spawnBlock(),this.calculatePaths()))))}calculatePaths(){this.lastSpawnedBlock&&this.lastSpawnedBlock.hasBeenSpawned&&this.lastSpawnedBlock.moveToNextTile(We.isFree,0),this.blocks.forEach((e,t)=>{!e.hasBeenEvaluated&&e.hasBeenSpawned&&e.moveToNextTile(We.isFree,t*.2)})}reset(){this.blocks.forEach(e=>{e.reset()}),ki.reset(),fn.reset(),this.blocks=[],this.lastSpawnedBlock=null,this.cycleIndex=0,this.animationSpeedRatio=0,this.preEndAnimationRatio=0,this.endAnimationRatio=0,this.endSpawnAnimationRatio=0,this.endSpawnAnimationRatioUnclamped=0,this.endFloatingAnimationRatioUnclamped=0,this.endFloatingAnimationRatio=0,this.restartAnimationRatio=0,We.reset(),this.startNewCycle()}update(e){if(this.animationSpeedRatio=this.animationSpeedRatio+e*(We.isResult?1:0),this.animationSpeedRatio=Math.min(1,this.animationSpeedRatio),Me.animationSpeed=Me.freeAnimationSpeed+(Me.resultAnimationSpeed-Me.freeAnimationSpeed)*this.animationSpeedRatio,this.preEndAnimationRatio+=(We.isFailResult?2:1e4)*e*(We.isResultAnimation?1:0),this.preEndAnimationRatio=Math.max(0,Math.min(1,this.preEndAnimationRatio)),this.endSpawnAnimationRatioUnclamped+=3*e*(this.preEndAnimationRatio===1?1:0),this.endSpawnAnimationRatio=Math.max(0,Math.min(1,this.endSpawnAnimationRatioUnclamped)),this.endFloatingAnimationRatioUnclamped+=(We.isSuccessResult?.25:1e4)*e*(this.endSpawnAnimationRatio===1?1:0),this.endFloatingAnimationRatio=Math.max(0,Math.min(1,this.endFloatingAnimationRatioUnclamped)),this.endAnimationRatio+=(We.isSuccessResult?1e4:.75)*e*(this.endFloatingAnimationRatioUnclamped>1.1?1:0),this.endAnimationRatio=Math.max(0,Math.min(1,this.endAnimationRatio)),this.restartAnimationRatio=Math.min(1,this.restartAnimationRatio+2*e*(We.isRestartAnimation&&this.endAnimationRatio===1?1:0)),We.hasNotStarted){this.startNewCycle();return}if(We.isRestart){this.reset();return}if(this.restartAnimationRatio===1){We.setRestart(),this.startNewCycle();return}if(We.isResultAnimation){let n=!0;this.blocks.forEach(i=>{n=n&&this.endAnimationRatio===1}),n&&We.setRestartAnimation()}this.lastSpawnedBlock&&this.lastSpawnedBlock.update(e),this.blocks.forEach(n=>{n.update(e)}),fn.update(e);let t=!0;this.lastSpawnedBlock&&(t=t&&this.lastSpawnedBlock.hasBeenSpawned),this.blocks.forEach(n=>{n.lifeCycle>0?(t=t&&n.hasBeenEvaluated,t=t&&n.hasAnimationEnded):t=t&&n.spawnAnimationRatio===1}),t=t||We.isResultAnimation||We.isFailResult||We.isStopped,t&&this.startNewCycle()}}const tt=new Dp;class Pp{quadIn(e){return e*e}quadOut(e){return e*(2-e)}quadInOut(e){return(e*=2)<1?.5*e*e:-.5*(--e*(e-2)-1)}cubicIn(e){return e*e*e}cubicOut(e){return--e*e*e+1}cubicInOut(e){return(e*=2)<1?.5*e*e*e:.5*((e-=2)*e*e+2)}quartIn(e){return e*e*e*e}quartOut(e){return 1- --e*e*e*e}quartInOut(e){return(e*=2)<1?.5*e*e*e*e:-.5*((e-=2)*e*e*e-2)}quintIn(e){return e*e*e*e*e}quintOut(e){return--e*e*e*e*e+1}quintInOut(e){return(e*=2)<1?.5*e*e*e*e*e:.5*((e-=2)*e*e*e*e+2)}sineIn(e){return 1-Math.cos(e*Math.PI/2)}sineOut(e){return Math.sin(e*Math.PI/2)}sineInOut(e){return .5*(1-Math.cos(Math.PI*e))}expoIn(e){return e===0?0:Math.pow(1024,e-1)}expoOut(e){return e===1?1:1-Math.pow(2,-10*e)}expoInOut(e){return e===0?0:e===1?1:(e*=2)<1?.5*Math.pow(1024,e-1):.5*(-Math.pow(2,-10*(e-1))+2)}circIn(e){return 1-Math.sqrt(1-e*e)}circOut(e){return Math.sqrt(1- --e*e)}circInOut(e){return(e*=2)<1?-.5*(Math.sqrt(1-e*e)-1):.5*(Math.sqrt(1-(e-=2)*e)+1)}elasticIn(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),-(n*Math.pow(2,10*(e-=1))*Math.sin((e-t)*2*Math.PI/i)))}elasticOut(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),n*Math.pow(2,-10*e)*Math.sin((e-t)*2*Math.PI/i)+1)}elasticInOut(e){let t,n=.1,i=.4;return e===0?0:e===1?1:(!n||n<1?(n=1,t=i/4):t=i*Math.asin(1/n)/(2*Math.PI),(e*=2)<1?-.5*n*Math.pow(2,10*(e-=1))*Math.sin((e-t)*2*Math.PI/i):n*Math.pow(2,-10*(e-=1))*Math.sin((e-t)*2*Math.PI/i)*.5+1)}backIn(e){let t=1.70158;return e*e*((t+1)*e-t)}backOut(e){let t=1.70158;return--e*e*((t+1)*e+t)+1}backInOut(e){let t=2.5949095;return(e*=2)<1?.5*e*e*((t+1)*e-t):.5*((e-=2)*e*((t+1)*e+t)+2)}bounceIn(e){return 1-this.bounceOut(1-e)}bounceOut(e){return e<1/2.75?7.5625*e*e:e<2/2.75?7.5625*(e-=1.5/2.75)*e+.75:e<2.5/2.75?7.5625*(e-=2.25/2.75)*e+.9375:7.5625*(e-=2.625/2.75)*e+.984375}bounceInOut(e){return e<.5?this.bounceIn(e*2)*.5:this.bounceOut(e*2-1)*.5+.5}}const Oi=new Pp,Vt=2*Xt,yn=new Ge,yr=new Ge,br=new W,io=new W,_s=new cn,ro=new cn,so=new je,ao=new je,oo=new je,gi=new je,Gn=new je;class Ip{constructor(){J(this,"container",new At);J(this,"_baseMesh");J(this,"_blocksMesh");J(this,"_blockList",[]);J(this,"_blockRenderList",[]);J(this,"_blockUpdateRange",{start:0,count:0});J(this,"sharedUniforms",{u_lightPosition:{value:new W(-2,6,-4)},u_matcap:{value:null},u_infoTexture:{value:null},u_restartAnimationRatio:{value:0}});J(this,"colorRatio",0);J(this,"infoTexture",null)}preload(){for(let e=0;e<Vt;e++){let t=new bp;this._blockList.push(t),this._blockRenderList.push(t)}Si.loadBuf(xt.ASSETS_PATH+"models/BASE.buf",e=>{this._onBaseBlocksLoaded(e)}),Si.loadBuf(xt.ASSETS_PATH+"models/BOX.buf",e=>{this._onBoxLoaded(e)}),Si.loadBuf(xt.ASSETS_PATH+"models/lose_animation.buf",e=>{const{position:t,orient:n}=e.attributes;this.animationTotalFrames=t.count/Xt,this.loseAnimationPositionArray=t.array,this.loseAnimationOrientArray=n.array}),Si.loadExr(xt.ASSETS_PATH+"textures/matcap.exr",e=>{this.sharedUniforms.u_matcap.value=e})}_onBaseBlocksLoaded(e){let t=this._baseMesh=new on(e,new ln({uniforms:Object.assign({u_lightPosition:this.sharedUniforms.u_lightPosition,u_infoTexture:this.sharedUniforms.u_infoTexture,u_matcap:this.sharedUniforms.u_matcap,u_color:{value:new je(this.defaultColor)},u_blocksColor:{value:new je},u_bgColor1:Me.sharedUniforms.u_bgColor1,u_bgColor2:Me.sharedUniforms.u_bgColor2,u_resolution:Me.sharedUniforms.u_resolution,u_yDisplacement:{value:0},u_endAnimationRatio:{value:0},u_restartAnimationRatio:this.sharedUniforms.u_restartAnimationRatio},Ts.merge([ve.lights]),Vi.sharedUniforms),vertexShader:gs,fragmentShader:eo,lights:!0}));t.receiveShadow=!0,t.castShadow=!0,t.frustumCulled=!1,t.material.defines.IS_BASE=!0,this.container.add(t)}_onBoxLoaded(e){let t=new Kf;t.index=e.index;for(let i in e.attributes)t.setAttribute(i,e.attributes[i]);t.instanceCount=Vt,t.setAttribute("instancePos",new In(this._instancePosArray=new Float32Array(Vt*3),3)),t.setAttribute("instanceOrient",new In(this._instanceOrientArray=new Float32Array(Vt*4),4)),t.setAttribute("instanceShowRatio",new In(this._instanceShowRatioArray=new Float32Array(Vt*1),1)),t.setAttribute("instanceSpinPivot",new In(this._instanceSpinPivotArray=new Float32Array(Vt*3),3)),t.setAttribute("instanceSpinOrient",new In(this._instanceSpinOrientArray=new Float32Array(Vt*4),4)),t.setAttribute("instanceColor",new In(this._instanceColorArray=new Float32Array(Vt*3),3)),t.setAttribute("instanceIsActive",new In(this._instanceIsActiveArray=new Float32Array(Vt),1)),t.setAttribute("instanceNextDirection",new In(this._instanceNextDirectionArray=new Float32Array(Vt*2),2)),t.attributes.instancePos.setUsage(On),t.attributes.instanceOrient.setUsage(On),t.attributes.instanceShowRatio.setUsage(On),t.attributes.instanceSpinPivot.setUsage(On),t.attributes.instanceSpinOrient.setUsage(On),t.attributes.instanceIsActive.setUsage(On),t.attributes.instanceNextDirection.setUsage(On);let n=this._blocksMesh=new on(t,new ln({uniforms:Object.assign({},this.sharedUniforms,Vi.sharedUniforms,Ts.merge([ve.lights])),vertexShader:gs,fragmentShader:eo,lights:!0}));n.frustumCulled=!1,n.customDepthMaterial=new ln({uniforms:Object.assign({},this.sharedUniforms),vertexShader:gs,fragmentShader:Mp}),n.customDepthMaterial.defines.IS_DEPTH=!0,n.castShadow=!0,n.receiveShadow=!0,this.container.add(n)}init(){this.directLight=new $f(16777215,1),this.directLight.position.copy(this.sharedUniforms.u_lightPosition.value),this.directLight.castShadow=!0,this.directLight.shadow.camera.near=1,this.directLight.shadow.camera.far=20,this.directLight.shadow.camera.right=5,this.directLight.shadow.camera.left=-5,this.directLight.shadow.camera.top=5,this.directLight.shadow.camera.bottom=-5,this.directLight.shadow.mapSize.width=768,this.directLight.shadow.mapSize.height=768,this.directLight.shadow.bias=.0035,this.container.add(this.directLight),this.container.add(this.directLight.target),this._assignFinalAnimationToTiles(),this.infoTexture=new Io(new Float32Array(Xt*4),It,It,Yt,an),this.sharedUniforms.u_infoTexture.value=this.infoTexture}_assignFinalAnimationToTiles(){let e=0;for(let t=0;t<It;t++)for(let n=0;n<It;n++){const i=fn.getTile(n-Bt,-(t-Bt));i.loseAnimationPositionArray=new Float32Array(this.animationTotalFrames*3),i.loseAnimationOrientArray=new Float32Array(this.animationTotalFrames*4);for(let r=0;r<this.animationTotalFrames;r++){let o=r*Xt*3+e*3;i.loseAnimationPositionArray[r*3+0]=this.loseAnimationPositionArray[o+0],i.loseAnimationPositionArray[r*3+1]=this.loseAnimationPositionArray[o+1],i.loseAnimationPositionArray[r*3+2]=this.loseAnimationPositionArray[o+2],o=r*Xt*4+e*4,i.loseAnimationOrientArray[r*4+0]=this.loseAnimationOrientArray[o+0],i.loseAnimationOrientArray[r*4+1]=this.loseAnimationOrientArray[o+1],i.loseAnimationOrientArray[r*4+2]=this.loseAnimationOrientArray[o+2],i.loseAnimationOrientArray[r*4+3]=this.loseAnimationOrientArray[o+3]}e++}}reset(){this._blockList.forEach(e=>e.reset())}updateColors(e){so.set(Me.startColor).convertSRGBToLinear(),ao.set(Me.endColor).convertSRGBToLinear(),oo.set(Me.errorColor).convertSRGBToLinear(),gi.set(Me.defaultColor).convertSRGBToLinear(),this.colorRatio=Math.min(tt.blocks.length/Xt,this.colorRatio+.5*e),Gn.lerpColors(so,ao,this.colorRatio),Gn.lerp(gi,tt.restartAnimationRatio),We.isFailResult&&tt.endSpawnAnimationRatio===1&&Gn.copy(oo);for(let t=0;t<Vt;t++)t<tt.blocks.length+(tt.lastSpawnedBlock?1:0)?(this._instanceColorArray[t*3+0]=Gn.r,this._instanceColorArray[t*3+1]=Gn.g,this._instanceColorArray[t*3+2]=Gn.b,this._instanceIsActiveArray[t]=1):(this._instanceColorArray[t*3+0]=gi.r,this._instanceColorArray[t*3+1]=gi.g,this._instanceColorArray[t*3+2]=gi.b,this._instanceIsActiveArray[t]=0);this._baseMesh.material.uniforms.u_color.value.copy(gi),this._baseMesh.material.uniforms.u_blocksColor.value.copy(Gn)}updateInfoTexture(){fn.tiles.forEach(e=>{e.forEach(t=>{let n=t.id*4;this.infoTexture.image.data[n+0]=t.activeRatio,this.infoTexture.image.data[n+1]=t.isOccupied||t.willBeOccupied?1:0,this.infoTexture.image.data[n+2]=t.isMain?1:0,this.infoTexture.image.data[n+3]=t.isBorder?1:0})}),this.infoTexture.needsUpdate=!0}updateFreeBlocks(e){if(tt.lastSpawnedBlock){let t=this._blockList[tt.lastSpawnedBlock.id];t.boardPos.set(tt.lastSpawnedBlock.currentTile.row,tt.lastSpawnedBlock.currentTile.col),t.showRatio=Math.max(0,Math.min(1,tt.lastSpawnedBlock.spawnAnimationRatioUnclamped))}tt.blocks.forEach(t=>{let n=this._blockList[t.id];if(n){if(n.showRatio=Math.max(0,Math.min(1,t.spawnAnimationRatioUnclamped)),n.boardPos.set(t.currentTile.row,t.currentTile.col),t.targetTile){const i=t.targetTile.row-t.currentTile.row,r=t.targetTile.col-t.currentTile.col;n.boardDir.set(i,r)}n.animation=t.hasAnimationEnded?0:t.easedAnimationRatio}})}updateAttributes(e){for(let t=0;t<Vt;t++){let n=this._blockRenderList[t];n.showRatio>0&&(n.pos.toArray(this._instancePosArray,t*3),n.orient.toArray(this._instanceOrientArray,t*4),this._instanceShowRatioArray[t]=Oi.quartInOut(n.showRatio),n.spinPivot.toArray(this._instanceSpinPivotArray,t*3),n.spinOrient.toArray(this._instanceSpinOrientArray,t*4),this._instanceNextDirectionArray[t*2+0]=n.boardDir.x,this._instanceNextDirectionArray[t*2+1]=n.boardDir.y)}for(let t in this._blocksMesh.geometry.attributes){let n=this._blocksMesh.geometry.attributes[t];n.isInstancedBufferAttribute&&(n.updateRange.count=e*n.updateRange.itemSize,n.needsUpdate=!0)}this._blocksMesh.geometry.instanceCount=e}updateStopAnimation(e,t){if(We.result===Wt.STOP&&t>=Xt){const n=t-Xt,i=n%It-Bt,r=Math.floor(n/It)-Bt,o=fn.getTile(r,i);if(!o.isOccupied){const a=Math.max(0,Math.min(1,tt.endSpawnAnimationRatioUnclamped-o.randomDelay));o.activeRatio=a,e.showRatio=a,e.boardPos.set(r,i)}}}updateFailAnimation(e,t,n){if(We.result===Wt.FAILED){if(e){const i=e.currentTile;if(tt.endAnimationRatio>0){const r=Math.floor(tt.endAnimationRatio*this.animationTotalFrames),o=Math.min(r+1,this.animationTotalFrames-1),a=tt.endAnimationRatio*this.animationTotalFrames-r;br.fromArray(i.loseAnimationPositionArray,r*3),io.fromArray(i.loseAnimationPositionArray,o*3),br.lerp(io,a),br.y*=.5,t.pos.copy(br),_s.fromArray(i.loseAnimationOrientArray,r*4),ro.fromArray(i.loseAnimationOrientArray,o*4),_s.slerp(ro,a),t.orient.copy(_s)}if(tt.preEndAnimationRatio>0){const r=xi.fit(tt.preEndAnimationRatio,0,1,0,1,Oi.sineOut);if(yn.set(i.row,i.col),yn.normalize(),yn.multiplyScalar(.1*r),t.pos.x+=yn.x,t.pos.z-=yn.y,tt.preEndAnimationRatio<1){const o=r*xi.fit(tt.preEndAnimationRatio,.5,.8,1,0);yn.set(e.randomVec.x,e.randomVec.y),yn.normalize(),yn.multiplyScalar(o),yr.set(0,0),yr.addScaledVector(yn,.08*o*Math.sin(o*40)),t.pos.x+=yr.x,t.pos.z+=yr.y}}}if(n>=Xt){const i=n-Xt,r=i%It-Bt,o=Math.floor(i/It)-Bt,a=fn.getTile(o,r),c=Math.max(0,Math.min(1,tt.endSpawnAnimationRatioUnclamped-a.randomDelay));a.isOccupied||(a.activeRatio=c),t.showRatio=c,t.boardPos.set(o,r)}}}updateFloatAnimation(e,t,n){if(We.result===Wt.COMPLETED&&e){const r=.05*e.currentTile.randomDelay,o=tt.endFloatingAnimationRatioUnclamped-r,a=xi.fit(o,.9,1,1,0,Oi.quadOut),c=a*xi.fit(o,-r,.1+r,0,1,Oi.expoIn);t.pos.y+=2*c*a,t.pos.y+=.2*Math.sin(o*Math.PI*8)*xi.fit(c,.9,1,0,1)}}update(e){this.updateFreeBlocks(e),this.updateColors(e);let t=0;for(let i=0;i<Vt;i++){let r=this._blockList[i];r.update(e);let o=tt.blocks.filter(a=>a.id===i)[0];r.showRatio>0&&(this._blockRenderList[t++]=r),this.updateFailAnimation(o,r,i),this.updateStopAnimation(r,i),this.updateFloatAnimation(o,r,i)}this.updateInfoTexture(),this.updateAttributes(t);const n=-Oi.circOut(tt.restartAnimationRatio);this.container.position.y=n,this._baseMesh.material.uniforms.u_yDisplacement.value=n,this._baseMesh.material.uniforms.u_endAnimationRatio.value=tt.endAnimationRatio,this.sharedUniforms.u_restartAnimationRatio.value=tt.restartAnimationRatio}}const ki=new Ip,Np=`#define GLSLIFY 1
varying vec2 v_uv;
void main() {
gl_Position = vec4(position.xy, 1.0, 1.0);
v_uv = uv;
}
`,Up=`#define GLSLIFY 1
uniform vec2 u_resolution;
uniform vec3 u_bgColor1;
uniform vec3 u_bgColor2;

varying vec2 v_uv;

vec3 linearToSRGB(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

#include <getBlueNoise>

void main() {
    vec3 color = mix(u_bgColor1, u_bgColor2, v_uv.y);
    gl_FragColor = vec4(linearToSRGB(color) + getBlueNoise(gl_FragCoord.xy) * .004, 1.0);
}
`;class Fp{constructor(){J(this,"container",new At)}init(){const e=new ln({uniforms:Object.assign({u_resolution:Me.sharedUniforms.u_resolution,u_bgColor1:Me.sharedUniforms.u_bgColor1,u_bgColor2:Me.sharedUniforms.u_bgColor2},Vi.sharedUniforms),vertexShader:Np,fragmentShader:Up});this.mesh=new on(new Lr(2,2),e),this.mesh.renderOrder=1,this.container.add(this.mesh)}resize(){}update(e){}}const xs=new Fp;class Op{preload(e,t){xt.override(e),xt.WEBGL_OPTS.canvas=Me.canvas=e.canvas,Me.orbitTarget=e.orbitTarget,ki.preload(),Vi.preInit(),Me.renderer=new Po(xt.WEBGL_OPTS),Si.start(t)}init(){Me.renderer.shadowMap.enabled=!0,Me.renderer.shadowMap.type=Ls,Me.scene=new Gf,Me.camera=new Ns(-1,1,1,-1,1,60),Me.scene.add(Me.camera),Me.camera.position.fromArray(xt.DEFAULT_POSITION),Me.orbitCamera=Me.camera.clone();let e=Me.orbitControls=new xp(Me.orbitCamera,Me.orbitTarget);e.enableDamping=!0,e.enableDamping=!0,e.target0.fromArray(xt.DEFAULT_LOOKAT_POSITION),e.reset(),tt.init(),ki.init(),xs.init(),Me.scene.add(ki.container),Me.scene.add(xs.container)}setSize(e,t){Me.viewportWidth=e,Me.viewportHeight=t,Me.viewportResolution.set(e,window.innerHeight);let n=e*xt.DPR,i=t*xt.DPR;if(xt.USE_PIXEL_LIMIT===!0&&n*i>xt.MAX_PIXEL_COUNT){let r=n/i;i=Math.sqrt(xt.MAX_PIXEL_COUNT/r),n=Math.ceil(i*r),i=Math.ceil(i)}Me.width=n,Me.height=i,Me.resolution.set(n,i),Me.camera.aspect=n/i,Me.camera.updateProjectionMatrix(),Me.renderer.setSize(n,i),Me.canvas.style.width=`${e}px`,Me.canvas.style.height=`${t}px`}render(e){Me.time+=e,Me.deltaTime=e,Me.sharedUniforms.u_time.value=Me.time,Me.sharedUniforms.u_deltaTime.value=e;let t=Me.sharedUniforms.u_bgColor1.value,n=Me.sharedUniforms.u_bgColor2.value;t.set(Me.bgColor1).convertSRGBToLinear(),n.set(Me.bgColor2).convertSRGBToLinear();let i=Me.viewportWidth,r=Me.viewportHeight,o=Me.cameraZoom*r/10,a=Me.cameraOffsetX,c=Me.cameraOffsetY;Me.camera.zoom=o,Me.camera.left=-i/2-a*i/o/2,Me.camera.right=i/2-a*i/o/2,Me.camera.top=r/2-c*r/o/2,Me.camera.bottom=-r/2-c*r/o/2,Me.camera.updateProjectionMatrix(),Vi.update(e),tt.update(e);let l=Me.camera;Me.orbitControls.update(),Me.orbitCamera.updateMatrix(),Me.orbitCamera.matrix.decompose(l.position,l.quaternion,l.scale),l.matrix.compose(l.position,l.quaternion,l.scale),ki.update(e),xs.update(e),Me.renderer.setClearColor(Me.bgColor,1),Me.renderer.render(Me.scene,Me.camera)}setResult(e){}}let ji=new Op;ji.properties=Me;ji.stateManager=We;ji.STATUS=We.STATUS;ji.RESULT=We.RESULT;window[xt.APP_ID]=ji;
