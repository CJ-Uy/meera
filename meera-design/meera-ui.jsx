/* ===== Meera shared UI: icons, logo, primitives ===== */

const I_PATHS = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUR: <path d="M7 17 17 7M9 7h8v8" />,
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  chat: <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4z" />,
  sparkle: <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  shield: <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z M9 12l2 2 4-4" />,
  cursor: <path d="M5 4l14 7-6 1.6L10 18z" />,
  ticket: <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1.5a2 2 0 000 5V16a2 2 0 01-2 2H6a2 2 0 01-2-2v-1.5a2 2 0 000-5z M13 7v10" />,
  route: <path d="M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V11a4 4 0 014-4h8" />,
  alert: <path d="M12 4l9 16H3zM12 10v4M12 17.5v.01" />,
  book: <path d="M5 5.5A1.5 1.5 0 016.5 4H19v15H6.5A1.5 1.5 0 005 20.5zM19 16H6.5A1.5 1.5 0 005 17.5" />,
  users: <path d="M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3.5 19a5.5 5.5 0 0111 0M16 5.5a3.5 3.5 0 010 7M17 14c2.2.5 3.5 2.2 3.5 5" />,
  building: <path d="M5 21V5a1 1 0 011-1h7a1 1 0 011 1v16M14 9h4a1 1 0 011 1v11M3 21h18M8 8h2M8 12h2M8 16h2" />,
  bolt: <path d="M13 3L5 13h5l-1 8 8-10h-5z" />,
  eye: <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 15a3 3 0 100-6 3 3 0 000 6z" />,
  play: <path d="M7 5l12 7-12 7z" />,
  share: <path d="M4 6.5h16v10H4z M9.5 20h5 M12 16.5V20 M9.5 11.5L12 9l2.5 2.5M12 9v5" />,
  headset: <path d="M4 13v-1a8 8 0 1116 0v1M4 13a2 2 0 012 2v2a2 2 0 01-4 0v-2a2 2 0 012-2zM20 13a2 2 0 00-2 2v2a2 2 0 004 0v-2a2 2 0 00-2-2zM18 17v1.5a2.5 2.5 0 01-2.5 2.5H13" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  chevronD: <path d="M6 9l6 6 6-6" />,
  star: <path d="M12 3l2.6 6 6.4.5-4.9 4.2 1.5 6.3L12 16.8 6.4 20l1.5-6.3L3 9.5 9.4 9z" />,
  clock: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.5V12l3 2" />,
  globe: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z" />,
  layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 16.5l9 5 9-5" />,
  doc: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" />,
  trend: <path d="M4 17l5-5 3 3 7-7M15 8h5v5" />,
  lock: <path d="M6 11h12v9H6zM9 11V8a3 3 0 016 0v3M12 15v2" />,
  wand: <path d="M5 19l9-9M14 7l3-3 1 1-3 3zM17 4l.5-1.5M20 6l1.5-.5M19 9l1.5.5" />,
  plug: <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0zM12 16v5" />,
  flag: <path d="M6 21V4M6 4h11l-2 4 2 4H6" />,
  refresh: <path d="M4 12a8 8 0 0114-5.3L20 8M20 4v4h-4M20 12a8 8 0 01-14 5.3L4 16M4 20v-4h4" />,
  inbox: <path d="M4 13l2.5-7h11L20 13v6H4zM4 13h5l1.5 2.5h3L15 13h5" />,
};
function Icon({name, size=20, sw=1.7, style}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={style} aria-hidden="true">
      {I_PATHS[name] || null}
    </svg>
  );
}

/* meerkat mark used in the logo: avatar inside a soft sand badge */
function MeerkatMark({size=38}){
  return (
    <span style={{
      width:size, height:size, borderRadius:"36% 36% 42% 42%/40% 40% 44% 44%",
      background:"linear-gradient(160deg,#FBEADD,#F4D9C2)",
      border:"1.5px solid #EBC9A8", display:"inline-flex", overflow:"hidden",
      alignItems:"flex-end", justifyContent:"center", flexShrink:0,
      boxShadow:"inset 0 -2px 6px rgba(217,132,79,.12)"
    }}>
      <img src="assets/meera-avatar.png" alt="" style={{width:"112%", marginBottom:"-6%", transform:"translateX(1%)"}} />
    </span>
  );
}

function Logo({onClick}){
  return (
    <a href="#top" onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:10}}>
      <MeerkatMark size={36} />
      <span style={{fontWeight:800,fontSize:22,letterSpacing:"-.03em",color:"var(--ink)"}}>Meera</span>
    </a>
  );
}

/* soft tinted icon chip */
function IconChip({name, tint="teal", size=46, isize=22}){
  const map={
    teal:["var(--teal-050)","var(--teal-600)"],
    sand:["var(--sand-050)","var(--sand-600)"],
    gold:["var(--gold-050)","#B98427"],
    green:["var(--green-050)","#5E9438"],
    ink:["#EAEFF3","var(--ink)"],
    rose:["#FBE7E0","#C56646"],
  };
  const [bg,fg]=map[tint]||map.teal;
  return (
    <span style={{width:size,height:size,borderRadius:13,background:bg,color:fg,
      display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <Icon name={name} size={isize} sw={1.8} />
    </span>
  );
}

/* tiny confidence meter used across demos */
function Confidence({value=96, label="AI confidence"}){
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
      <span className="mono" style={{fontSize:11,letterSpacing:".06em",color:"var(--muted)"}}>{label}</span>
      <span style={{width:54,height:6,borderRadius:99,background:"#E7EEEC",overflow:"hidden",display:"inline-block"}}>
        <span style={{display:"block",height:"100%",width:value+"%",borderRadius:99,
          background:"linear-gradient(90deg,var(--teal),var(--green))"}} />
      </span>
      <span className="mono" style={{fontSize:11,fontWeight:500,color:"var(--teal-700)"}}>{value}%</span>
    </span>
  );
}

/* scroll reveal hook */
function useReveal(){
  React.useEffect(()=>{
    const els=document.querySelectorAll('.reveal:not(.in)');
    if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return;}
    const io=new IntersectionObserver((ents)=>{
      ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:.14, rootMargin:"0px 0px -8% 0px"});
    els.forEach(e=>io.observe(e));
    return ()=>io.disconnect();
  });
}

Object.assign(window, { Icon, MeerkatMark, Logo, IconChip, Confidence, useReveal });
