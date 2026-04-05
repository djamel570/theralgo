'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRive } from '@rive-app/react-canvas'

/* ── MindMarket exact tokens ── */
const GN='#8ED462', G='#72C15F', C='#F5F3EF', T='#1A1A1A', M='#6B7280'
const LV='#C4B5FD', YL='#FBD24D', RD='#FF6B6B', BL='#4F8EF7', PK='#EBC1FF'
const CHARCOAL='#2C2E2A', BEIGE='#F5F1E4'
const F="'Plus Jakarta Sans',system-ui,sans-serif"
const EASE_BOUNCE='cubic-bezier(.17,.67,.3,1.33)'
const EASE_SMOOTH='cubic-bezier(.38,.005,.215,1)'

/* ── Rive lazy ── */
function RivePlayer({src,style}:{src:string;style?:React.CSSProperties}){
  const{RiveComponent}=useRive({src,autoplay:true})
  return <div style={style}><RiveComponent/></div>
}
function LazyRive({src,cls,style}:{src:string;cls?:string;style?:React.CSSProperties}){
  const ref=useRef<HTMLDivElement>(null),[v,setV]=useState(false)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect()}},{rootMargin:'600px'})
    o.observe(el);return()=>o.disconnect()
  },[])
  return <div ref={ref} className={cls} style={style}>{v&&<RivePlayer src={src} style={{width:'100%',height:'100%'}}/>}</div>
}

/* ── Reveal (is-inview equivalent) ── */
function Reveal({children,delay=0,y=18}:{children:React.ReactNode;delay?:number;y?:number}){
  const ref=useRef<HTMLDivElement>(null),[v,setV]=useState(false)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect()}},{threshold:0.04})
    o.observe(el);return()=>o.disconnect()
  },[])
  return <div ref={ref} style={{opacity:v?1:0,transform:v?'none':`translateY(${y}px)`,transition:`opacity .5s ${delay}s ease,transform .5s ${delay}s ${EASE_SMOOTH}`}}>{children}</div>
}

/* ── Logo ── */
function Logo({light,onClick}:{light?:boolean;onClick?:()=>void}){
  return(
    <Link href="/" onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:10,textDecoration:'none',flexShrink:0}}>
      <svg width="34" height="30" viewBox="0 0 36 30" fill="none" aria-label="Theralgo">
        <path stroke={GN} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.3" d="M3.8 28.2C-3.5 6.4 15.2-1.7 16.2 10.9c.9 11.1-5.6 12.7-5.6 7.2s5.2-11.7 10.6-9.5c6 2.5 4 17-.5 15.4-3.3-1.2-.1-9.4 4.6-11.7 6.6-3.2 12.1 4.8 4.9 15.8"/>
        <circle cx="22.5" cy="2.7" r="2.7" fill={GN}/>
      </svg>
      <span style={{fontWeight:800,fontSize:'1rem',color:light?'#fff':CHARCOAL,letterSpacing:'-.04em',lineHeight:1}}>
        Ther<span style={{color:GN}}>algo</span>
      </span>
    </Link>
  )
}

/* ── Arrow icon ── */
function Ico({size=20,color='#fff',bg=CHARCOAL}:{size?:number;color?:string;bg?:string}){
  return(
    <span style={{width:size,height:size,borderRadius:'50%',background:bg,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <svg width={size*.5} height={size*.5} viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="m8 14 4-4-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

/* ── c-tile-animated — MindMarket exact clone ── */
function CTile({title,desc,color,cta,href}:{title:string;desc:string;color:string;cta:string;href:string}){
  const ref=useRef<HTMLDivElement>(null),[iv,setIv]=useState(false)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setIv(true);o.disconnect()}},{rootMargin:'50px',threshold:0.04})
    o.observe(el);return()=>o.disconnect()
  },[])
  const ease=EASE_BOUNCE
  return(
    <div ref={ref} style={{position:'relative',borderRadius:20,overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'#fff',borderRadius:20,transform:iv?'scale(1)':'scale(0)',transition:`transform .6s .2s ${ease}`}}/>
      <div style={{position:'absolute',inset:'1px',background:color,borderRadius:18,transform:iv?'scale(1)':'scale(0)',transition:`transform .6s ${ease}`}}/>
      <div style={{position:'relative',zIndex:1,padding:'clamp(1.25rem,2vw,2.5rem)',display:'flex',flexDirection:'column',gap:'.85rem',minHeight:'min(240px,50vw)'}}>
        <h3 style={{fontWeight:500,fontSize:'clamp(1.2rem,2vw,2rem)',color:CHARCOAL,letterSpacing:'-.06em',lineHeight:1.1,opacity:iv?1:0,transform:iv?'none':'translateY(-10px)',transition:`opacity .4s .28s ease,transform .4s .28s ${ease}`}}>{title}</h3>
        <p style={{fontSize:'clamp(.82rem,1.5vw,1rem)',color:'rgba(44,46,42,.7)',lineHeight:1.75,fontWeight:500,opacity:iv?1:0,transform:iv?'none':'translateY(-8px)',transition:`opacity .4s .34s ease,transform .4s .34s ${ease}`}}>{desc}</p>
        <div style={{marginTop:'auto',paddingTop:'.5rem',opacity:iv?1:0,transform:iv?'none':'translateY(-6px)',transition:`opacity .4s .43s ease,transform .4s .43s ${ease}`}}>
          <Link href={href}><button style={{display:'inline-flex',alignItems:'center',gap:8,padding:'.45rem .9rem .45rem .65rem',borderRadius:999,border:'1.5px solid rgba(44,46,42,.18)',background:'transparent',fontWeight:600,fontSize:'.8rem',color:CHARCOAL,cursor:'pointer',fontFamily:F,letterSpacing:'-.03em'}}><Ico size={20} bg={CHARCOAL}/> {cta}</button></Link>
        </div>
      </div>
    </div>
  )
}

/* ════ HOME ════ */
export default function Home(){
  const mainRef=useRef<SVGPathElement>(null),secRef=useRef<SVGPathElement>(null)
  const mobileRef=useRef<SVGPathElement>(null),mobSecRef=useRef<SVGPathElement>(null)
  const[menuOpen,setMenuOpen]=useState(false),[scrolled,setScrolled]=useState(false)
  const raf=useRef(0),busy=useRef(false)
  const close=useCallback(()=>setMenuOpen(false),[])

  /* scroll → SVG stroke-dashoffset */
  useEffect(()=>{
    const all=[mainRef,secRef,mobileRef,mobSecRef]
    const init=()=>all.forEach(r=>{if(!r.current)return;const l=r.current.getTotalLength();r.current.style.strokeDasharray=`${l}`;r.current.style.strokeDashoffset=`${l}`})
    init()
    const fn=()=>{
      if(busy.current)return;busy.current=true
      raf.current=requestAnimationFrame(()=>{
        busy.current=false
        setScrolled(window.scrollY>30)
        const dh=document.documentElement.scrollHeight-window.innerHeight
        const p=dh>0?window.scrollY/dh:0
        ;[mainRef,secRef].forEach(r=>{if(!r.current)return;const l=parseFloat(r.current.style.strokeDasharray);r.current.style.strokeDashoffset=`${l*(1-Math.min(p*2.2,1))}`})
        ;[mobileRef,mobSecRef].forEach((r,i)=>{if(!r.current)return;const l=parseFloat(r.current.style.strokeDasharray);const off=i===0?0:.42;r.current.style.strokeDashoffset=`${l*(1-Math.max(0,Math.min((p-off)*2.6,1)))}`})
      })
    }
    window.addEventListener('scroll',fn,{passive:true})
    return()=>{window.removeEventListener('scroll',fn);cancelAnimationFrame(raf.current)}
  },[])

  useEffect(()=>{document.body.style.overflow=menuOpen?'hidden':'';return()=>{document.body.style.overflow=''}},[menuOpen])

  const navLinks=[{href:'#systeme',label:'Le système'},{href:'#parcours',label:'Parcours'},{href:'#tarifs',label:'Tarifs'}]

  return(
    <div style={{fontFamily:F,background:G,overflowX:'hidden'}}>

      {/* ══ NAV DESKTOP — clone c-menu-desktop_bar ══
          Pill blanc fixe, logo gauche, liens centre, CTA droite */}
      <nav className="mm-nav-desktop" style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:100,width:'min(calc(100% - 32px),1160px)',display:'flex',alignItems:'center',justifyContent:'space-between',height:60,padding:'0 8px 0 20px',borderRadius:10,background:scrolled?'rgba(245,241,228,.97)':'rgba(245,241,228,.9)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',boxShadow:scrolled?'0 6px 28px rgba(0,0,0,.11)':'0 2px 10px rgba(0,0,0,.06)',transition:'box-shadow .35s,background .35s'}}>
        <Logo/>
        <div style={{display:'flex',alignItems:'center',gap:4,height:'100%'}}>
          {navLinks.map(l=>(
            <a key={l.href} href={l.href}
              style={{fontSize:'1.0625rem',fontWeight:500,letterSpacing:'-.04em',color:CHARCOAL,textDecoration:'none',padding:'0 16px',height:44,display:'inline-flex',alignItems:'center',borderRadius:999,transition:'background .15s'}}>
              {l.label}
            </a>
          ))}
        </div>
        <Link href="/signup">
          <button style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 12px 0 16px',height:44,borderRadius:999,border:'none',background:CHARCOAL,color:'#fff',fontWeight:600,fontSize:'1.0625rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
            Démarrer <Ico size={28} bg={GN} color={CHARCOAL}/>
          </button>
        </Link>
      </nav>

      {/* ══ NAV MOBILE — clone c-menu-mobile exact ══
          position:fixed, padding:16px, barre blanche radius-sm=10px
          logo gauche | droite: pill beige "Commencer" + cercle vert burger */}
      <div className="mm-nav-mobile" style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:16,pointerEvents:'none'}}>
        <div style={{pointerEvents:'auto',background:'#fff',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 8px 8px 14px',minHeight:60,boxShadow:'0 2px 16px rgba(0,0,0,.09)'}}>
          <Logo onClick={close}/>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* pill beige "Commencer" — c-menu-mobile_contact */}
            <Link href="/signup" style={{textDecoration:'none'}} onClick={close}>
              <span style={{display:'inline-flex',alignItems:'center',fontSize:'1.0625rem',fontWeight:500,letterSpacing:'-.04em',padding:'8px 12px',background:BEIGE,borderRadius:5,color:CHARCOAL,lineHeight:1.25}}>Commencer</span>
            </Link>
            {/* Burger — c-menu-mobile_burger: cercle vert, 2 lignes noires → croix */}
            <button onClick={()=>setMenuOpen(o=>!o)} aria-label={menuOpen?'Fermer':'Menu'}
              style={{width:40,height:40,borderRadius:'50%',border:'none',background:GN,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,cursor:'pointer',flexShrink:0,position:'relative'}}>
              {/* lignes du burger */}
              <span style={{display:'block',width:17,height:2,background:CHARCOAL,borderRadius:1,transition:`transform .3s ${EASE_SMOOTH}`,transform:menuOpen?'translateY(3.5px) rotate(45deg)':'none'}}/>
              <span style={{display:'block',width:17,height:2,background:CHARCOAL,borderRadius:1,transition:`transform .3s ${EASE_SMOOTH}`,transform:menuOpen?'translateY(-3.5px) rotate(-45deg)':'none'}}/>
            </button>
          </div>
        </div>
      </div>

      {/* ══ MENU MOBILE PANEL — clone c-menu-mobile_nav ══ */}
      <div aria-hidden={!menuOpen} style={{position:'fixed',inset:0,zIndex:99,pointerEvents:menuOpen?'all':'none'}}>
        <div onClick={close} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.35)',opacity:menuOpen?1:0,transition:'opacity .25s ease'}}/>
        <div style={{position:'absolute',top:92,left:16,right:16,background:'#fff',borderRadius:10,boxShadow:'0 12px 40px rgba(0,0,0,.14)',overflow:'hidden',transform:menuOpen?'none':'translateY(-10px)',opacity:menuOpen?1:0,transition:`transform .3s ${EASE_SMOOTH}, opacity .22s ease`,pointerEvents:menuOpen?'auto':'none'}}>
          {/* c-menu-mobile_list */}
          <div style={{padding:'12px 12px 8px'}}>
            <div style={{background:BEIGE,borderRadius:8,overflow:'hidden'}}>
              {navLinks.map((l,i)=>(
                <a key={l.href} href={l.href} onClick={close} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',color:CHARCOAL,textDecoration:'none',fontWeight:500,fontSize:'clamp(1.5rem,6vw,1.75rem)',letterSpacing:'-.06em',lineHeight:1.2,borderBottom:i<navLinks.length-1?`1px solid rgba(44,46,42,.1)`:'none'}}>
                  {l.label}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="m8 14 4-4-4-4" stroke={CHARCOAL} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </a>
              ))}
            </div>
          </div>
          <div style={{padding:'0 12px 16px',display:'flex',flexDirection:'column',gap:8}}>
            <Link href="/signup" onClick={close} style={{display:'block'}}>
              <button style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 16px',borderRadius:10,border:'none',background:CHARCOAL,color:'#fff',fontWeight:500,fontSize:'clamp(1.5rem,6vw,1.75rem)',letterSpacing:'-.06em',lineHeight:1.2,cursor:'pointer',fontFamily:F}}>
                Installer mon moteur
                <span style={{width:48,height:48,borderRadius:'50%',background:YL,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="m8 14 4-4-4-4" stroke={CHARCOAL} strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
              </button>
            </Link>
            <Link href="/login" onClick={close} style={{display:'block'}}>
              <button style={{width:'100%',padding:'14px',borderRadius:999,border:`1.5px solid rgba(44,46,42,.15)`,background:'transparent',color:CHARCOAL,fontWeight:500,fontSize:'1.0625rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
                Se connecter
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ══ HERO — clone c-hero-home exact ══ */}
      <div className="mm-hero" style={{minHeight:'calc(100svh + 50px)',marginBottom:-50,background:G,overflow:'hidden',position:'relative'}}>
        <div style={{paddingTop:'calc(60px + 2rem)',paddingBottom:'clamp(2.5rem,8vw,6rem)',display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100svh'}}>
          <div style={{textAlign:'center',padding:'0 clamp(1rem,15vw,22rem)',maxWidth:'none',width:'100%'}}>
            <Reveal>
              <h1 className="mm-hero-title" style={{fontWeight:500,letterSpacing:'-.06em',lineHeight:.95,color:CHARCOAL,margin:'0 0 clamp(.75rem,2vw,1.25rem)'}}>
                Vos patients<br/>vous attendent.
              </h1>
            </Reveal>
            <Reveal delay={.08}>
              <p className="mm-hero-tagline" style={{fontWeight:500,letterSpacing:'-.06em',lineHeight:1.2,color:CHARCOAL,opacity:.8}}>
                Ils ne le savent pas encore.
              </p>
            </Reveal>
            <Reveal delay={.15}>
              <div style={{marginTop:'clamp(1.5rem,4vw,3rem)',display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',alignItems:'center'}}>
                <Link href="/signup">
                  <button style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 12px 0 18px',height:56,borderRadius:999,border:'none',background:CHARCOAL,color:'#fff',fontWeight:600,fontSize:'1.0625rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
                    Installer mon moteur <Ico size={30} bg={GN} color={CHARCOAL}/>
                  </button>
                </Link>
                <Link href="/login">
                  <button style={{display:'inline-flex',alignItems:'center',height:56,padding:'0 20px',borderRadius:999,border:`2px solid rgba(44,46,42,.2)`,background:'transparent',color:CHARCOAL,fontWeight:500,fontSize:'1.0625rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
                    Se connecter
                  </button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ══ CREAM CONTAINER ══ */}
      <div id="systeme" style={{background:BEIGE,borderRadius:'50px 50px 0 0',position:'relative',zIndex:5,overflowX:'hidden'}}>

        {/* ── INTRO — Mobile: block (canvas → text), Desktop: flex row ── */}
        <div className="mm-intro" style={{position:'relative',zIndex:5}}>
          <div className="mm-intro-canvas">
            <div style={{aspectRatio:'1430/1022',position:'relative'}}>
              <img src="/timeline/hero-background-illustration.svg" alt="" aria-hidden style={{position:'absolute',width:'104%',maxWidth:'104%',top:'.5%',left:'-3%',zIndex:0}}/>
              <div style={{position:'absolute',inset:0,zIndex:1,pointerEvents:'none'}}>
                <LazyRive src="/rive/hero_animation.riv" style={{width:'100%',height:'100%'}}/>
              </div>
            </div>
          </div>
          <div className="mm-intro-text">
            <Reveal>
              <p style={{fontWeight:500,fontSize:'clamp(1.1rem,2.5vw,1.75rem)',letterSpacing:'-.04em',lineHeight:1.25,color:CHARCOAL,marginBottom:'clamp(1rem,2vw,2rem)',maxWidth:520}}>
                Theralgo construit et opère pour vous le système complet d&apos;acquisition patient — de la Signature Digitale au Partage Patient.
              </p>
            </Reveal>
            <Reveal delay={.08}>
              <Link href="/signup">
                <button style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 12px 0 18px',height:52,borderRadius:999,border:'none',background:GN,color:CHARCOAL,fontWeight:600,fontSize:'1.0625rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
                  Démarrer <Ico size={28} bg={CHARCOAL} color='#fff'/>
                </button>
              </Link>
            </Reveal>
          </div>
        </div>

        {/* ══ TIMELINE PATH ══ */}
        <div className="mm-path">

          {/* Desktop SVG — hidden mobile */}
          <svg className="mm-svg-desktop" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1944.2 6151.5" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="pg" x1="1020.4" x2="1550.5" y1="2766.3" y2="3624.5" gradientTransform="matrix(1 0 0 -1 -242 5807.4)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={GN}/><stop offset=".3" stopColor="#378e43"/><stop offset=".7" stopColor="#439745"/><stop offset="1" stopColor={GN}/>
              </linearGradient>
            </defs>
            <path ref={mainRef} fill="none" stroke={GN} strokeLinecap="round" strokeWidth="500" d="M1085 250c-868 126.5-961 907-29.5 1453S1397 3353 733 3318s-606-718-53.6-808"/>
            <path fill="none" stroke="url(#pg)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="500" d="M1055.5 1703C1987 2249 1397 3353 733 3318" opacity="1"/>
            <path ref={secRef} fill="none" stroke={GN} strokeLinecap="round" strokeWidth="500" d="M679.3 2510c552.3-90 1689.3 743.4 475.6 1689-985 767.5-234 1313-234 1702.5"/>
          </svg>

          {/* Mobile SVG — clone exact: mr-[-64%] ml-[-50%] max-md:block max-md:aspect-[847/4471] md:hidden
              sm breakpoint: mr-[-54%] ml-[-45%]
              Provides height to container on mobile */}
          <svg className="mm-svg-mobile" viewBox="0 0 847.9 4471" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
              <linearGradient id="mg" gradientUnits="userSpaceOnUse" x1="208.1" y1="2481.6" x2="627.8" y2="2783.1" gradientTransform="matrix(1 0 0 -1 0 4470)">
                <stop offset="0" stopColor={GN}/><stop offset=".33" stopColor="#368D32"/><stop offset=".74" stopColor="#439739"/><stop offset="1" stopColor={GN}/>
              </linearGradient>
            </defs>
            <path ref={mobileRef} style={{fill:'none',stroke:GN,strokeWidth:250,strokeLinecap:'round'} as React.CSSProperties} d="M508,131.1c-474,11.9-357.9,671.3-49,1079.1,308.8,407.8,263,1206.2-79.6,1206.2s-335.9-596.5-5.8-603.4"/>
            <path style={{opacity:.5,fill:'none',stroke:'url(#mg)',strokeWidth:250,strokeLinecap:'round',strokeLinejoin:'round'} as React.CSSProperties} d="M459,1210.2c308.8,407.8,265.5,1206.2-81.5,1206.2"/>
            <path ref={mobSecRef} style={{fill:'none',stroke:GN,strokeWidth:250,strokeLinecap:'round'} as React.CSSProperties} d="M373.6,1813c1.9,0,3.9-0.1,5.8-0.1c335.8,0,514.9,555.2,112.5,1261.5c-326.6,573.2-77.6,980.7-77.6,1271.6"/>
          </svg>

          {/* ── 4 TILES — clone c-homepage-timeline-cards ──
              positions EXACTES extraites du HTML MindMarket:
              Mobile: left/right = var(--unit-md) = 20px, width: auto
              Desktop: positions en % via grid 16 colonnes
              Tile 1 (RD): md:right=1/16, md:top=11%   | max-md: top=9%,  right=20px
              Tile 2 (YL): md:left=1/16, md:top=25.5%  | max-md: top=22%, left=20px
              Tile 3 (BL): md:left=1/16, md:top=44%    | max-md: top=45.5%, left=20px
              Tile 4 (PK): md:right=1/16, md:top=70%   | max-md: top=70%, right=20px */}
          <div className="mm-card mm-card-1">
            <CTile title="Votre Signature Digitale" desc="Notre équipe construit votre présence digitale sur-mesure : copywriting optimisé, positionnement et page d'acquisition conçus pour convertir vos futurs patients." color={RD+'cc'} cta="Découvrir" href="/signup"/>
          </div>
          <div className="mm-card mm-card-2">
            <CTile title="Vos futurs patients existent déjà" desc="Nos experts les trouvent via leurs comportements d'achat, leurs centres d'intérêt et leurs moments de vie — bien avant qu'ils pensent à vous chercher." color={YL+'dd'} cta="Découvrir" href="/signup"/>
          </div>
          <div className="mm-card mm-card-3">
            <CTile title="Campagnes en illimité" desc="Depuis votre dashboard, lancez autant de campagnes que vous voulez, à tout moment — séances, créneaux, offres. Aucune limite, aucun supplément." color={BL+'bb'} cta="Démarrer" href="/signup"/>
          </div>
          <div className="mm-card mm-card-4">
            <CTile title="Partage Patient" desc="Après chaque séance, votre patient reçoit un lien personnalisé. Il le partage avec un proche qui prend rendez-vous directement sur votre page." color={PK+'cc'} cta="Découvrir" href="/signup"/>
          </div>

          {/* ── RIVE CHARS — positions EXACTES du HTML MindMarket (Tailwind → inline CSS) ── */}
          {/* climber: max-md:top[2.8%] max-md:left[-16%] max-md:w[68%] md:top[10%] md:left[-3.2%] md:w[43%] */}
          <LazyRive src="/rive/climber.riv"     cls="mm-char mm-ch-climber"  style={{position:'absolute',zIndex:2,aspectRatio:'1000/1225'}}/>
          {/* shrug: max-md:top[20%] max-md:right[-3%] max-md:w[72%] md:top[19%] md:right[5%] md:w[45%] */}
          <LazyRive src="/rive/shrug.riv"       cls="mm-char mm-ch-shrug"    style={{position:'absolute',zIndex:2,aspectRatio:'1153/1188'}}/>
          {/* composer: max-md:top[35.5%] max-md:right[-15.5%] max-md:w[68%] md:top[32%] md:right[-5%] md:w[40%] */}
          <LazyRive src="/rive/composer.riv"    cls="mm-char mm-ch-composer" style={{position:'absolute',zIndex:3,aspectRatio:'1000/1151'}}/>
          {/* trumpeter_1: max-md:top[38%] max-md:left[-7%] max-md:w[56%] md:top[33.4%] md:left[14%] md:w[32%] */}
          <LazyRive src="/rive/trumpeter_1.riv" cls="mm-char mm-ch-t1"       style={{position:'absolute',zIndex:2,aspectRatio:'808/738',pointerEvents:'none'}}/>
          {/* trumpeter_2: max-md:top[41.5%] max-md:left[-4%] max-md:w[54%] md:top[35.5%] md:left[-2%] md:w[32%] */}
          <LazyRive src="/rive/trumpeter_2.riv" cls="mm-char mm-ch-t2"       style={{position:'absolute',zIndex:3,aspectRatio:'1/1'}}/>
          {/* gamer: max-md:top[55.5%] max-md:left[-3%] max-md:w[72%] md:top[45.35%] md:left[11.5%] md:w[31%] */}
          <LazyRive src="/rive/gamer.riv"       cls="mm-char mm-ch-gamer"    style={{position:'absolute',zIndex:2,aspectRatio:'1/1'}}/>
          {/* scientist: max-md:top[61%] max-md:w[68%] md:top[53%] md:right[0] md:w[34%] */}
          <LazyRive src="/rive/scientist.riv"   cls="mm-char mm-ch-scientist" style={{position:'absolute',zIndex:3,aspectRatio:'1000/1271'}}/>
          {/* soccer: max-md:top[81%] max-md:right[-5%] max-md:w[100%] md:top[63%] md:left[-3.5%] md:w[56.5%] */}
          <LazyRive src="/rive/soccer.riv"      cls="mm-char mm-ch-soccer"   style={{position:'absolute',zIndex:3,aspectRatio:'1789/1438'}}/>

          {/* ── END SECTION — c-homepage-timeline_end ──
              absolute bottom, height 60vw (desktop) / 120vw (mobile)
              binoculars, unicycle, basketball — positions MindMarket exactes */}
          <div className="mm-end">
            <LazyRive src="/rive/binoculars.riv"        cls="mm-bino"  style={{position:'absolute',aspectRatio:'1789/1438'}}/>
            <LazyRive src="/rive/unicycle.riv"          cls="mm-uni"   style={{position:'absolute',aspectRatio:'1694/1594'}}/>
            <LazyRive src="/rive/basketball_player.riv" cls="mm-bball" style={{position:'absolute',aspectRatio:'1608/1608'}}/>
          </div>

        </div>
        {/* /mm-path */}

        {/* ══ PARCOURS — après timeline ══ */}
        <section id="parcours" style={{background:BEIGE,padding:'clamp(4rem,7vw,7rem) clamp(1.25rem,6.25vw,5rem)',position:'relative',zIndex:10}}>
          <div style={{maxWidth:1200,margin:'0 auto'}}>
            <Reveal>
              <div style={{marginBottom:'clamp(2rem,4vw,4rem)'}}>
                <span style={{display:'inline-block',padding:'4px 12px',borderRadius:999,background:`${YL}55`,color:'#7A4F00',fontSize:'.72rem',fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:12}}>Le parcours</span>
                <h2 style={{fontWeight:500,fontSize:'clamp(2rem,5vw,5rem)',color:CHARCOAL,letterSpacing:'-.06em',lineHeight:.93,maxWidth:680}}>
                  De zéro à un cabinet plein — en 10 jours.
                </h2>
              </div>
            </Reveal>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'clamp(.75rem,1.5vw,1.25rem)'}}>
              {([
                {n:'01',c:GN, t:'Signature Digitale',   d:"Notre équipe crée votre copywriting, votre positionnement et votre page d'acquisition sur-mesure."},
                {n:'02',c:LV, t:'Ciblage & Campagnes',  d:"Nos experts configurent vos campagnes pour toucher vos futurs patients via leurs comportements et centres d'intérêt."},
                {n:'03',c:YL, t:'Campagnes Illimitées', d:"Depuis votre dashboard, lancez autant de campagnes que vous voulez — à tout moment, en quelques clics."},
                {n:'04',c:BL, t:"Page d'Acquisition",   d:"Page optimisée pour convertir : copywriting, vidéo, formulaire de prise de RDV intégré."},
                {n:'05',c:RD, t:'Partage Patient',       d:"Lien personnalisé automatique après chaque séance. Votre patient le partage — ce proche prend RDV."},
                {n:'06',c:PK, t:'Dashboard & Résultats',d:"Patients, RDV, revenus en temps réel depuis votre téléphone. Tout centralisé."},
              ] as {n:string,c:string,t:string,d:string}[]).map((s,i)=>(
                <Reveal key={s.n} delay={i*.06}>
                  <div style={{padding:'clamp(1rem,2vw,1.5rem)',background:'#fff',borderRadius:20,border:'1px solid rgba(44,46,42,.07)',height:'100%',display:'flex',flexDirection:'column',gap:'.85rem'}}>
                    <div style={{width:40,height:40,borderRadius:12,background:s.c,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'.72rem',color:CHARCOAL,flexShrink:0,letterSpacing:'.03em'}}>{s.n}</div>
                    <h3 style={{fontWeight:700,fontSize:'.95rem',color:CHARCOAL,letterSpacing:'-.03em',lineHeight:1.25}}>{s.t}</h3>
                    <p style={{fontSize:'.82rem',color:M,lineHeight:1.8}}>{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ NUMBERS STACK — clone c-numbers-stack exact ══
            background: BEIGE, border-radius: 50px, position:relative z-10
            sticky left title + 3 cards right (stacking avec translateY)
            card colors: -blue (white bg, blue text), -green (green bg, white), -red (red bg, white) */}
        <section style={{background:BEIGE,borderRadius:50,padding:'clamp(4rem,7vw,10rem) clamp(1.25rem,6.25vw,5rem)',position:'relative',zIndex:10,margin:'0'}}>
          <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr',gap:'3rem'}}>
            <div className="mm-numbers-layout">
              <div className="mm-numbers-sticky">
                <Reveal>
                  <h2 style={{fontWeight:500,fontSize:'clamp(2rem,4.5vw,4.75rem)',color:CHARCOAL,letterSpacing:'-.06em',lineHeight:.95,marginBottom:'1.5rem',maxWidth:500}}>
                    Quelques chiffres qui parlent d&apos;eux-mêmes.
                  </h2>
                  <p style={{fontSize:'clamp(.9rem,1.1vw,1.0625rem)',color:M,fontWeight:500,letterSpacing:'-.04em',lineHeight:1.5,maxWidth:340}}>
                    Ces chiffres représentent la réalité de nos thérapeutes, semaine après semaine.
                  </p>
                </Reveal>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'clamp(.75rem,1.5vw,1.25rem)'}}>
                {([
                  {bg:'#fff',    fg:BL,    stat:'120+',  label:'Thérapeutes actifs en France et en Belgique.'},
                  {bg:GN,        fg:'#fff', stat:'2 847', label:'Patients générés pour nos thérapeutes en 2025.'},
                  {bg:'#FF705D', fg:'#fff', stat:'97%',   label:'Taux de satisfaction après 3 mois.'},
                ] as {bg:string,fg:string,stat:string,label:string}[]).map((card,i)=>(
                  <Reveal key={i} delay={i*.1}>
                    <div style={{background:card.bg,borderRadius:36,padding:'clamp(1.5rem,3vw,2.5rem)',display:'flex',flexDirection:'column',gap:'clamp(1rem,2vw,1.5rem)',minHeight:'min(340px,80vw)',border:card.bg==='#fff'?'1px solid rgba(44,46,42,.1)':'none'}}>
                      <div style={{display:'flex',justifyContent:'flex-end'}}>
                        <div style={{width:60,height:60,borderRadius:'50%',background:card.fg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={card.bg} strokeWidth="2.5" strokeLinecap="round"/></svg>
                        </div>
                      </div>
                      <div style={{marginTop:'auto'}}>
                        <p style={{fontWeight:400,fontSize:'clamp(3.5rem,10vw,7.5rem)',color:card.fg,letterSpacing:'-.06em',lineHeight:.92,marginBottom:'.75rem'}}>{card.stat}</p>
                        <p style={{fontSize:'clamp(.9rem,1.1vw,1.0625rem)',color:card.fg,opacity:.78,fontWeight:500,letterSpacing:'-.04em',lineHeight:1.4,maxWidth:320}}>{card.label}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ TARIFS ══ */}
        <section id="tarifs" style={{background:BEIGE,padding:'clamp(4rem,7vw,7rem) clamp(1.25rem,6.25vw,5rem)'}}>
          <div style={{maxWidth:600,margin:'0 auto',textAlign:'center'}}>
            <Reveal>
              <span style={{display:'inline-block',padding:'4px 12px',borderRadius:999,background:`${GN}25`,color:'#2D7A1A',fontSize:'.72rem',fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:14}}>Offre unique</span>
              <h2 style={{fontWeight:500,fontSize:'clamp(2rem,5vw,5rem)',color:CHARCOAL,letterSpacing:'-.06em',lineHeight:.93,marginBottom:'clamp(1.5rem,3vw,3rem)'}}>Transparent.<br/>Sans surprise.</h2>
            </Reveal>
            <Reveal delay={.1}>
              <div style={{background:'#fff',borderRadius:32,padding:'clamp(1.5rem,3vw,2.5rem)',border:`2px solid ${GN}44`,textAlign:'left'}}>
                <div style={{display:'flex',gap:'1.25rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:130}}>
                    <p style={{fontSize:'.7rem',fontWeight:700,color:M,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Mise en place</p>
                    <p style={{fontWeight:800,fontSize:'clamp(2.2rem,5vw,3rem)',color:CHARCOAL,letterSpacing:'-.06em',lineHeight:.95}}>997€</p>
                  </div>
                  <div style={{width:1,background:'rgba(0,0,0,.1)',alignSelf:'stretch'}}/>
                  <div style={{flex:1,minWidth:130,textAlign:'right'}}>
                    <p style={{fontSize:'.7rem',fontWeight:700,color:M,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Puis / mois</p>
                    <p style={{fontWeight:800,fontSize:'clamp(2.2rem,5vw,3rem)',color:CHARCOAL,letterSpacing:'-.06em',lineHeight:.95}}>97€</p>
                  </div>
                </div>
                <p style={{fontSize:'.85rem',color:M,marginBottom:'1.25rem',lineHeight:1.8}}>Actif en 10 jours. Système clé en main, opéré par notre équipe.</p>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:'1.75rem'}}>
                  {['Page thérapeute (Signature Digitale)','Campagnes Meta ciblées par zone','Ciblage comportemental','Campagnes illimitées','Partage Patient automatique','Agenda connecté (Google, Apple, Outlook)','Dashboard patients temps réel','Support dédié'].map((f,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10}}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:`${GN}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3L9 1" stroke={GN} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <p style={{fontSize:'.84rem',color:CHARCOAL,fontWeight:500,lineHeight:1.4}}>{f}</p>
                    </div>
                  ))}
                </div>
                <Link href="/signup">
                  <button style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 16px',borderRadius:12,border:'none',background:CHARCOAL,color:'#fff',fontWeight:600,fontSize:'1.0625rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
                    Installer mon moteur
                    <Ico size={36} bg={GN} color={CHARCOAL}/>
                  </button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section style={{background:G,padding:'clamp(5rem,8vw,9rem) clamp(1.25rem,6.25vw,5rem)',position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',minHeight:'min(60vh,650px)'}}>
          <div className="mm-nav-desktop" style={{position:'absolute',left:0,bottom:0,width:'38%',pointerEvents:'none',zIndex:1}}>
            <LazyRive src="/rive/pop_up_girl.riv" style={{width:'100%',aspectRatio:'1979/1570'}}/>
          </div>
          <div style={{position:'relative',zIndex:2,textAlign:'center',maxWidth:640}}>
            <Reveal>
              <h2 style={{fontWeight:500,fontSize:'clamp(2.5rem,6.5vw,7rem)',color:CHARCOAL,letterSpacing:'-.06em',lineHeight:.92,marginBottom:'clamp(1rem,2vw,2rem)'}}>
                Votre cabinet mérite<br/>mieux que le hasard.
              </h2>
            </Reveal>
            <Reveal delay={.08}>
              <p style={{fontSize:'clamp(.85rem,1.1vw,.95rem)',color:CHARCOAL,opacity:.6,maxWidth:400,margin:'0 auto 2.5rem',lineHeight:1.8}}>
                Theralgo installe et opère pour vous le système complet — actif en 10 jours.
              </p>
            </Reveal>
            <Reveal delay={.14}>
              <Link href="/signup">
                <button style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 12px 0 20px',height:56,borderRadius:999,border:'none',background:CHARCOAL,color:'#fff',fontWeight:600,fontSize:'1.0625rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
                  Installer mon moteur <Ico size={30} bg={GN} color={CHARCOAL}/>
                </button>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer style={{background:CHARCOAL,padding:'clamp(4rem,7vw,7rem) clamp(1.25rem,6.25vw,5rem) 2rem'}}>
          <div className="mm-footer-grid">
            <div>
              <Logo light/>
              <p style={{fontSize:'.88rem',color:'rgba(255,255,255,.45)',lineHeight:1.8,marginTop:'1.5rem',maxWidth:360}}>
                Le système complet d&apos;acquisition patient pour thérapeutes. Installation en 10 jours.
              </p>
              <Link href="/signup" style={{display:'inline-block',marginTop:'2rem'}}>
                <button style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 12px 0 16px',height:44,borderRadius:999,border:`2px solid ${GN}`,background:'transparent',color:GN,fontWeight:600,fontSize:'.9rem',letterSpacing:'-.04em',cursor:'pointer',fontFamily:F}}>
                  Démarrer <Ico size={24} bg={GN} color={CHARCOAL}/>
                </button>
              </Link>
            </div>
            <div style={{display:'flex',gap:'clamp(2rem,5vw,4rem)',flexWrap:'wrap'}}>
              <div>
                <p style={{fontWeight:700,fontSize:'.7rem',color:'rgba(255,255,255,.35)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'1rem'}}>Produit</p>
                {([['Le système','#systeme'],['Parcours','#parcours'],['Tarifs','#tarifs']] as [string,string][]).map(([l,h])=>(
                  <a key={l} href={h} style={{display:'block',color:'rgba(255,255,255,.65)',textDecoration:'none',fontSize:'.9rem',marginBottom:'.6rem',fontWeight:500,letterSpacing:'-.03em'}}>{l}</a>
                ))}
              </div>
              <div>
                <p style={{fontWeight:700,fontSize:'.7rem',color:'rgba(255,255,255,.35)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'1rem'}}>Compte</p>
                {([['Se connecter','/login'],['Commencer','/signup'],['Dashboard','/dashboard']] as [string,string][]).map(([l,h])=>(
                  <a key={l} href={h} style={{display:'block',color:'rgba(255,255,255,.65)',textDecoration:'none',fontSize:'.9rem',marginBottom:'.6rem',fontWeight:500,letterSpacing:'-.03em'}}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.1)',marginTop:'3rem',paddingTop:'1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
            <p style={{fontSize:'.75rem',color:'rgba(255,255,255,.3)',fontWeight:500}}>© 2026 Theralgo — Tous droits réservés</p>
            <div style={{display:'flex',gap:'1.5rem'}}>
              {([['Mentions légales','/'],['Confidentialité','/']] as [string,string][]).map(([l,h])=>(
                <a key={l} href={h} style={{fontSize:'.75rem',color:'rgba(255,255,255,.3)',textDecoration:'none',fontWeight:500}}>{l}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
