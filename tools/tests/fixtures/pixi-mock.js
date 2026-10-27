// Maquette de PixiJS 7 pour les tests du rendu (les tests n'ont pas de réseau, donc pas de PixiJS).
// Elle reproduit deux comportements de la vraie bibliothèque qui comptent pour le jeu :
// - Texture.from(canevas) range la texture dans un cache global (PIXI.utils.TextureCache) jusqu'à texture.destroy(true) ;
// - Renderer.destroy() perd son contexte WebGL ; le navigateur annonce « webglcontextlost » sur l'ancien canevas un peu plus tard.
(()=>{const P={x:0,y:0,set(a,b){this.x=a;this.y=b===undefined?a:b},copyFrom(o){this.x=o.x;this.y=o.y}};
const pt=()=>Object.create(P);
class DO{constructor(){this.anchor=pt();this.scale=pt();this.position=pt();this.visible=true;this.alpha=1;this.rotation=0;this.tint=0xffffff;this.children=[];this.width=0;this.height=0;PIXI.__live++}
  destroy(o){PIXI.__live--;if(o&&o.children)for(const c of this.children)c.destroy(o);this.children=[]}getChildIndex(c){return this.children.indexOf(c)}addChildAt(c,i){this.children.splice(i,0,c);return c}}
class Container extends DO{addChild(...c){this.children.push(...c);return c[0]}removeChildren(){const r=this.children;this.children=[];return r}}
class Sprite extends Container{constructor(t){super();if(!t)throw new Error('sprite sans texture');this.texture=t}}
class TilingSprite extends Sprite{}
class BitmapText extends Container{constructor(t,o){super();this.text=t;this.fontSize=o.fontSize}}
class Graphics extends Container{}
for(const m of['clear','lineStyle','beginFill','endFill','drawCircle','drawRect','drawEllipse','moveTo','lineTo','arc','closePath','drawPolygon','drawRoundedRect'])Graphics.prototype[m]=function(){return this};
const TextureCache={};let uid=0;
class Texture{constructor(src){this.src=src}destroy(){if(this.cacheId)delete TextureCache[this.cacheId];this.src=null;this.destroyed=true}
  static from(c){if(!c._pixiId)c._pixiId='pixiid_'+(++uid);let t=TextureCache[c._pixiId];if(!t){t=new Texture(c);t.cacheId=c._pixiId;TextureCache[c._pixiId]=t}return t}}
Texture.WHITE=new Texture(null);
class Renderer{constructor(){this.view=document.createElement('canvas');PIXI.__renderers++;this.gl={isContextLost:()=>false}}
  resize(){}render(){PIXI.__frames++}
  destroy(){PIXI.__renderers--;const v=this.view;this.gl={isContextLost:()=>true};setTimeout(()=>v.dispatchEvent(new Event('webglcontextlost',{cancelable:true})),0)}}
window.PIXI={Renderer,Container,Sprite,TilingSprite,BitmapText,Graphics,BLEND_MODES:{ADD:1},Texture,BitmapFont:{available:{},from(n){this.available[n]={}},uninstall(n){delete this.available[n]}},
  utils:{TextureCache},__live:0,__frames:0,__renderers:0};})();
