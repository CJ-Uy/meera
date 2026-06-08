/* ===== Meera landing sections ===== */

/* ---------- NAV ---------- */
function Nav({onDemo}){
  const [scrolled,setScrolled]=React.useState(false);
  React.useEffect(()=>{
    const f=()=>setScrolled(window.scrollY>24); f();
    window.addEventListener("scroll",f,{passive:true}); return ()=>window.removeEventListener("scroll",f);
  },[]);
  const links=[["Meeror","#meeror"],["Handoff","#handoff"],["Lookout","#lookout"],["Use cases","#usecases"]];
  return (
    <header style={{position:"sticky",top:0,zIndex:40,transition:"all .25s",
      background:scrolled?"rgba(251,246,238,.86)":"transparent",
      backdropFilter:scrolled?"saturate(180%) blur(12px)":"none",
      borderBottom:scrolled?"1px solid var(--line)":"1px solid transparent"}}>
      <div className="wrap" style={{display:"flex",alignItems:"center",gap:24,height:70}}>
        <Logo/>
        <nav style={{display:"flex",gap:4,marginLeft:14}} className="nav-links">
          {links.map(([t,h])=>(
            <a key={t} href={h} style={{fontSize:14.5,fontWeight:600,color:"var(--ink-2)",padding:"8px 13px",borderRadius:99}}>{t}</a>
          ))}
        </nav>
        <span style={{flex:1}}/>
        <a href="#" style={{fontSize:14.5,fontWeight:600,color:"var(--ink-2)"}} className="nav-signin">Sign in</a>
        <button onClick={onDemo} className="btn btn-primary btn-sm" style={{padding:"10px 18px"}}>Book a demo</button>
      </div>
    </header>
  );
}

/* ---------- floating chips scene around mascot ---------- */
function FloatChip({children,style,delay=0,tint}){
  const tints={teal:"var(--teal-100)",sand:"var(--sand-050)",white:"var(--line)"};
  return (
    <div style={{position:"absolute",background:"#fff",borderRadius:14,padding:"10px 13px",
      boxShadow:"var(--sh-md)",border:`1px solid ${tints[tint]||"var(--line)"}`,
      animation:`bob 4.5s ${delay}s ease-in-out infinite`, ...style}}>{children}</div>
  );
}
function MeeraScene({size=420,chips=true}){
  return (
    <div style={{position:"relative",width:"100%",maxWidth:size,margin:"0 auto"}}>
      {/* soft halo */}
      <div style={{position:"absolute",inset:"6% 4% 10%",borderRadius:"50%",
        background:"radial-gradient(circle at 50% 45%, var(--teal-050), transparent 70%)"}}/>
      <div style={{position:"absolute",left:"50%",bottom:"4%",transform:"translateX(-50%)",
        width:"78%",height:34,borderRadius:"50%",background:"rgba(28,51,73,.10)",filter:"blur(11px)"}}/>
      <img src="assets/meera-wave.png" alt="Meera, the meerkat support guide, waving" style={{position:"relative",width:"100%"}}/>
      {/* chips */}
      {chips && <React.Fragment>
      <FloatChip tint="teal" delay={0} style={{top:"6%",left:"-6%",maxWidth:186}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{width:30,height:30,borderRadius:8,background:"var(--teal-050)",display:"grid",placeItems:"center",color:"var(--teal-700)"}}><Icon name="cursor" size={16}/></span>
          <div>
            <div style={{fontSize:12.5,fontWeight:700,lineHeight:1.2}}>Click “Submit”</div>
            <div className="mono" style={{fontSize:10,color:"var(--muted)"}}>step 4 of 4</div>
          </div>
        </div>
      </FloatChip>
      <FloatChip tint="sand" delay={1.1} style={{top:"40%",right:"-9%",maxWidth:176}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{width:30,height:30,borderRadius:8,background:"var(--sand-050)",display:"grid",placeItems:"center",color:"var(--sand-600)"}}><Icon name="ticket" size={16}/></span>
          <div>
            <div style={{fontSize:12.5,fontWeight:700,lineHeight:1.2}}>Ticket #NV-4827</div>
            <div className="mono" style={{fontSize:10,color:"var(--muted)"}}>routed · Bursar</div>
          </div>
        </div>
      </FloatChip>
      <FloatChip tint="white" delay={.6} style={{bottom:"7%",left:"-3%"}}>
        <Confidence value={97} label="confidence"/>
      </FloatChip>
      </React.Fragment>}
    </div>
  );
}

/* ---------- HERO (3 layouts) ---------- */
function HeroText({align="left",onDemo}){
  const c = align==="center";
  return (
    <div style={{textAlign:c?"center":"left",maxWidth:c?720:560,margin:c?"0 auto":0}}>
      <div className="eyebrow" style={{marginBottom:18}}>AI support guide · universities &amp; IT</div>
      <h1 className="h-display" style={{marginBottom:20}}>AI support that <span style={{color:"var(--teal)"}}>shows users</span> exactly what to do.</h1>
      <p className="lede" style={{maxWidth:520,margin:c?"0 auto 30px":"0 0 30px"}}>
        Meera is the AI guide that walks students and staff through any issue — right on their screen.
        When she can’t solve it herself, she writes the ticket for you.
      </p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:c?"center":"flex-start"}}>
        <button onClick={onDemo} className="btn btn-primary">Book a demo</button>
        <a href="#meeror" className="btn btn-ghost">See Meeror in action <Icon name="arrow" size={16} sw={2.2}/></a>
      </div>
      <div style={{display:"flex",gap:22,flexWrap:"wrap",marginTop:34,justifyContent:c?"center":"flex-start"}}>
        {[["71%","resolved without a human"],["28s","to the first guided step"],["9","campus systems connected"]].map(([n,l])=>(
          <div key={l} style={{textAlign:c?"center":"left"}}>
            <div style={{fontSize:26,fontWeight:800,letterSpacing:"-.03em",color:"var(--ink)"}} className="tnum">{n}</div>
            <div className="mono" style={{fontSize:11,color:"var(--muted)",letterSpacing:".02em"}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function Hero({layout="split",chips=true,onDemo}){
  if(layout==="centered"){
    return (
      <section id="top" className="section" style={{paddingTop:48,paddingBottom:60,textAlign:"center"}}>
        <div className="wrap">
          <HeroText align="center" onDemo={onDemo}/>
          <div style={{marginTop:24}}><MeeraScene size={400} chips={chips}/></div>
        </div>
      </section>
    );
  }
  if(layout==="stage"){
    return (
      <section id="top" className="section" style={{paddingTop:44,paddingBottom:64}}>
        <div className="wrap">
          <div style={{position:"relative",borderRadius:34,overflow:"hidden",padding:"56px 56px 0",
            background:"linear-gradient(160deg,#1C3349,#22425b 60%,#2a5066)"}}>
            <div style={{position:"absolute",inset:0,opacity:.5,background:"radial-gradient(60% 50% at 78% 30%, rgba(46,156,142,.4), transparent 70%)"}}/>
            <div style={{position:"relative",display:"grid",gridTemplateColumns:"1.05fr .95fr",gap:30,alignItems:"end"}} className="hero-stage-grid">
              <div style={{paddingBottom:56}}>
                <div className="eyebrow" style={{marginBottom:18,color:"#9fe3d6"}}>AI support guide · universities &amp; IT</div>
                <h1 className="h-display" style={{color:"#fff",marginBottom:20}}>AI support that <span style={{color:"#7fd9c9"}}>shows users</span> what to do.</h1>
                <p className="lede" style={{color:"#cdd8e0",maxWidth:460,marginBottom:30}}>
                  Meera walks people through any issue right on their screen — and when she can’t fix it, she writes the ticket for you.
                </p>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <button onClick={onDemo} className="btn btn-primary">Book a demo</button>
                  <a href="#meeror" className="btn" style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1.5px solid rgba(255,255,255,.25)"}}>See Meeror <Icon name="arrow" size={16} sw={2.2}/></a>
                </div>
              </div>
              <div style={{position:"relative"}}>
                <img src="assets/meera-wave.png" alt="Meera waving" style={{width:"100%",display:"block",filter:"drop-shadow(0 24px 40px rgba(0,0,0,.3))"}}/>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  // split (default)
  return (
    <section id="top" className="section" style={{paddingTop:40,paddingBottom:56}}>
      <div className="wrap" style={{display:"grid",gridTemplateColumns:"1.02fr .98fr",gap:48,alignItems:"center"}} >
        <div className="hero-split-grid" style={{display:"contents"}}>
          <HeroText onDemo={onDemo}/>
          <MeeraScene size={440} chips={chips}/>
        </div>
      </div>
    </section>
  );
}

/* ---------- section intro ---------- */
function Intro({eyebrow,sand,title,lede,align="center"}){
  const c=align==="center";
  return (
    <div className="reveal" style={{textAlign:c?"center":"left",maxWidth:c?720:560,margin:c?"0 auto 44px":"0 0 36px"}}>
      <div className={"eyebrow"+(sand?" sand":"")} style={{marginBottom:15}}>{eyebrow}</div>
      <h2 className="h-2" style={{marginBottom:16}}>{title}</h2>
      <p className="lede" style={{maxWidth:c?620:"none",margin:c?"0 auto":0}}>{lede}</p>
    </div>
  );
}
function FeatureGrid({items}){
  return (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${items.length},1fr)`,gap:22,marginTop:42}} className="feat-grid">
      {items.map((f,i)=>(
        <div key={i} className="reveal" style={{transitionDelay:`${i*70}ms`}}>
          <IconChip name={f.icon} tint={f.tint||"teal"} size={42} isize={20}/>
          <h4 style={{fontSize:16.5,margin:"13px 0 6px"}}>{f.t}</h4>
          <p style={{fontSize:14,color:"var(--muted)",lineHeight:1.5}}>{f.d}</p>
        </div>
      ))}
    </div>
  );
}
function Bullets({items}){
  return (
    <div style={{display:"grid",gap:16,marginTop:26}}>
      {items.map((b,i)=>(
        <div key={i} style={{display:"flex",gap:13}}>
          <IconChip name={b.icon} tint={b.tint||"teal"} size={38} isize={18}/>
          <div>
            <div style={{fontWeight:700,fontSize:15.5,marginBottom:2}}>{b.t}</div>
            <div style={{fontSize:14,color:"var(--muted)",lineHeight:1.5}}>{b.d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 1. MEEROR ---------- */
function MeerorSection(){
  return (
    <section id="meeror" className="section" style={{background:"var(--cream-2)",borderTop:"1px solid var(--line)",borderBottom:"1px solid var(--line)"}}>
      <div className="wrap">
        <Intro sand
          eyebrow="Meeror · guided on-screen support"
          title="Like screen-sharing, but the AI guides you."
          lede="Start a Meeror session and Meera sees what you see. She drops highlights, arrows and popups right onto the page — showing you exactly where to click, one step at a time."/>
        <div className="reveal"><MeerorDemo/></div>
        <FeatureGrid items={[
          {icon:"cursor",tint:"teal",t:"Points at the real screen",d:"Highlights the exact button or field — no “go to settings, then…” guesswork."},
          {icon:"layers",tint:"sand",t:"Step-by-step progress",d:"A clear path with progress dots, so people always know what’s next."},
          {icon:"eye",tint:"gold",t:"Confidence you can see",d:"Every step shows how sure Meera is, so trust is earned, not assumed."},
          {icon:"shield",tint:"green",t:"You control sharing",d:"Share one tab, pause anytime, escalate to a human in one tap."},
        ]}/>
      </div>
    </section>
  );
}

/* ---------- 2. HANDOFF (chat→ticket) ---------- */
function HandoffSection(){
  return (
    <section id="handoff" className="section">
      <div className="wrap" style={{display:"grid",gridTemplateColumns:".82fr 1.18fr",gap:54,alignItems:"center"}}>
        <div className="reveal handoff-copy">
          <div className="eyebrow" style={{marginBottom:15}}>Handoff · chat that closes the loop</div>
          <h2 className="h-2" style={{marginBottom:16}}>When chat can’t fix it, Meera writes the ticket.</h2>
          <p className="lede">Meera diagnoses by asking the right questions. If a human is needed, she hands off a ready-to-action ticket — no one repeats themselves.</p>
          <Bullets items={[
            {icon:"sparkle",tint:"teal",t:"Diagnoses, not just chats",d:"Runs real checks before deciding a human is needed."},
            {icon:"ticket",tint:"sand",t:"Tickets that write themselves",d:"Summary, attempted fixes, context and urgency — filled in automatically."},
            {icon:"route",tint:"gold",t:"Routed to the right desk",d:"Sent to the team that can actually resolve it, with next steps attached."},
          ]}/>
        </div>
        <div className="reveal"><ChatTicketDemo/></div>
      </div>
    </section>
  );
}

/* ---------- 3. LOOKOUT (dashboard) ---------- */
function LookoutSection(){
  return (
    <section id="lookout" className="section" style={{background:"var(--cream-2)",borderTop:"1px solid var(--line)",borderBottom:"1px solid var(--line)"}}>
      <div className="wrap">
        <Intro
          eyebrow="Lookout · support intelligence for admins"
          title="A meerkat keeps watch over the whole burrow."
          lede="Lookout turns every conversation into intelligence. Admins see AI summaries, suggested fixes, smart routing and the recurring issues quietly costing the most time."/>
        <div className="reveal"><DashboardPreview/></div>
        <FeatureGrid items={[
          {icon:"wand",tint:"teal",t:"Approve, edit or escalate",d:"Meera drafts the response; your team stays in control of what goes out."},
          {icon:"alert",tint:"rose",t:"Cross-department warnings",d:"Catches dependencies between teams before they bounce a ticket around."},
          {icon:"trend",tint:"gold",t:"Recurring-issue insight",d:"Surfaces the systems and flows that generate the most tickets."},
          {icon:"book",tint:"green",t:"Builds your knowledge base",d:"Turns repeated questions into ready-to-publish help articles."},
        ]}/>
      </div>
    </section>
  );
}

/* ---------- USE CASES ---------- */
function UseCases(){
  const cases=[
    { tag:"Universities & student services", icon:"building", tint:"teal", lead:true,
      title:"From confused students to completed forms.",
      points:["Course registration, financial aid & portal navigation","Guides students through forms instead of long FAQ pages","Cuts the first-week support queue dramatically"],
      img:"assets/meera-laptop.png" },
    { tag:"Enterprise IT departments", icon:"plug", tint:"sand",
      title:"Tier-1 tickets, handled before they pile up.",
      points:["VPN, software setup, password & access issues","Deflects repetitive tickets with guided fixes","Routes the rest with full context to the right team"],
      img:"assets/meera-connect.png" },
  ];
  return (
    <section id="usecases" className="section">
      <div className="wrap">
        <Intro
          eyebrow="Built for the people who answer the questions"
          title="One guide, made for universities and IT."
          lede="Whether it’s a first-year stuck on registration or staff blocked by a VPN, Meera meets them where they are."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:26}} className="usecase-grid">
          {cases.map((c,i)=>(
            <div key={i} className="reveal card" style={{padding:"30px 30px 0",overflow:"hidden",transitionDelay:`${i*80}ms`,
              border:c.lead?"1.5px solid var(--teal-100)":"1px solid var(--line)",display:"flex",flexDirection:"column"}}>
              <div className={"eyebrow"+(c.tint==="sand"?" sand":"")} style={{marginBottom:14}}>{c.tag}</div>
              <h3 className="h-3" style={{marginBottom:16}}>{c.title}</h3>
              <div style={{display:"grid",gap:10,marginBottom:18}}>
                {c.points.map((p,j)=>(
                  <div key={j} style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:14.5,color:"var(--ink-2)"}}>
                    <span style={{color:`var(--${c.tint})`,marginTop:2,flexShrink:0}}><Icon name="check" size={17} sw={2.2}/></span>{p}
                  </div>
                ))}
              </div>
              <div style={{marginTop:"auto",display:"flex",justifyContent:"center",alignItems:"flex-end",height:150,
                background:`radial-gradient(circle at 50% 90%, var(--${c.tint==="sand"?"sand-050":"teal-050"}), transparent 72%)`}}>
                <img src={c.img} alt="" style={{height:158,objectFit:"contain",objectPosition:"bottom"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- BENEFITS ---------- */
function Benefits(){
  const b=[
    {icon:"bolt",tint:"teal",t:"Faster resolutions",d:"Most issues solved in the moment — no queue, no waiting for a reply."},
    {icon:"users",tint:"sand",t:"Lighter load on staff",d:"Routine questions are deflected, so your team works the ones that matter."},
    {icon:"globe",tint:"gold",t:"Available 24/7",d:"Meera guides students and staff at 2am the same way she does at 2pm."},
    {icon:"layers",tint:"green",t:"Full context, always",d:"Every handoff carries the session, screenshots and what’s been tried."},
    {icon:"trend",tint:"teal",t:"Insight that compounds",d:"Each ticket makes routing, answers and the knowledge base smarter."},
    {icon:"shield",tint:"rose",t:"Private by design",d:"Users choose what to share; sensitive data stays where it belongs."},
  ];
  return (
    <section className="section" style={{background:"var(--cream-2)",borderTop:"1px solid var(--line)",borderBottom:"1px solid var(--line)"}}>
      <div className="wrap">
        <Intro
          eyebrow="Why teams choose Meera"
          title="Not a chatbot. A support intelligence layer."
          lede="Meera acts like an autonomous guide for your users and a co-pilot for your support team — at the same time."/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}} className="benefit-grid">
          {b.map((x,i)=>(
            <div key={i} className="reveal card" style={{padding:"24px 24px 26px",transitionDelay:`${(i%3)*70}ms`}}>
              <IconChip name={x.icon} tint={x.tint} size={44} isize={21}/>
              <h4 style={{fontSize:17,margin:"15px 0 7px"}}>{x.t}</h4>
              <p style={{fontSize:14,color:"var(--muted)",lineHeight:1.55}}>{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- BRAND / MASCOT ---------- */
function BrandSection(){
  return (
    <section className="section">
      <div className="wrap">
        <div style={{display:"grid",gridTemplateColumns:".9fr 1.1fr",gap:50,alignItems:"center"}} className="brand-grid">
          <div className="reveal" style={{position:"relative",display:"flex",justifyContent:"center"}}>
            <div style={{position:"absolute",inset:"8% 10%",borderRadius:"50%",background:"radial-gradient(circle,var(--gold-050),transparent 70%)"}}/>
            <img src="assets/meera-celebrate.png" alt="Meera celebrating" style={{position:"relative",width:"78%",maxWidth:360}}/>
          </div>
          <div className="reveal">
            <div className="eyebrow" style={{marginBottom:15}}>Meet Meera</div>
            <h2 className="h-2" style={{marginBottom:18}}>Why a meerkat?</h2>
            <p className="lede" style={{marginBottom:18}}>
              Meerkats are sentinels. One always stands tall, watching over the whole group — and the moment something’s wrong, it speaks up and shows the way to safety.
            </p>
            <p style={{fontSize:16,color:"var(--ink-2)",lineHeight:1.6,marginBottom:26}}>
              That’s exactly how Meera works. Calm, alert and always looking out for your users — guiding them through, and keeping watch so no one gets stuck.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[["Helpful","teal"],["Calm","gold"],["Trustworthy","green"],["A little playful","sand"]].map(([t,c])=>(
                <span key={t} className="pill" style={{background:`var(--${c==="sand"?"sand-050":c==="gold"?"gold-050":c==="green"?"green-050":"teal-050"})`,
                  borderColor:"transparent",color:c==="sand"?"var(--sand-600)":c==="gold"?"#A9781F":c==="green"?"#5E9438":"var(--teal-700)"}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA({onDemo}){
  return (
    <section className="section" style={{paddingBottom:120}}>
      <div className="wrap">
        <div className="reveal" style={{position:"relative",borderRadius:34,overflow:"hidden",padding:"60px 56px",
          background:"linear-gradient(155deg,#1C3349,#23445e 55%,#2c5468)"}}>
          <div style={{position:"absolute",inset:0,opacity:.55,background:"radial-gradient(50% 60% at 85% 20%, rgba(46,156,142,.45), transparent 70%)"}}/>
          <div style={{position:"relative",maxWidth:560}}>
            <div className="eyebrow" style={{color:"#9fe3d6",marginBottom:16}}>Get started</div>
            <h2 className="h-2" style={{color:"#fff",marginBottom:16,fontSize:"clamp(30px,4vw,44px)"}}>From confused users to resolved tickets — automatically.</h2>
            <p className="lede" style={{color:"#cdd8e0",marginBottom:30,maxWidth:440}}>See how Meera guides your users and lightens your support team’s load. Book a 20-minute walkthrough.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button onClick={onDemo} className="btn btn-primary">Book a demo</button>
              <a href="#meeror" className="btn" style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1.5px solid rgba(255,255,255,.25)"}}>Explore the product</a>
            </div>
          </div>
          <img src="assets/meera-clipboard.png" alt="" className="cta-mascot" style={{position:"absolute",right:48,bottom:-6,width:240,filter:"drop-shadow(0 20px 36px rgba(0,0,0,.3))"}}/>
        </div>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer(){
  const cols=[
    ["Product",["Meeror","Handoff","Lookout","Integrations","Security"]],
    ["Solutions",["Universities","Student services","Enterprise IT","Help desks"]],
    ["Company",["About","Careers","Blog","Contact"]],
  ];
  return (
    <footer style={{background:"var(--navy-deep)",color:"#aebbc6",padding:"60px 0 36px"}}>
      <div className="wrap">
        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:34}} className="footer-grid">
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <MeerkatMark size={34}/>
              <span style={{fontWeight:800,fontSize:21,color:"#fff"}}>Meera</span>
            </div>
            <p style={{fontSize:14,maxWidth:260,lineHeight:1.55,color:"#8c9aa6"}}>The AI support guide that shows users what to do — and writes the ticket when it can’t.</p>
          </div>
          {cols.map(([h,items])=>(
            <div key={h}>
              <div className="mono" style={{fontSize:11,letterSpacing:".1em",color:"#6f7e8a",marginBottom:14}}>{h.toUpperCase()}</div>
              <div style={{display:"grid",gap:10}}>
                {items.map(it=><a key={it} href="#" style={{fontSize:14,color:"#aebbc6"}}>{it}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,
          marginTop:44,paddingTop:22,borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <span className="mono" style={{fontSize:12,color:"#6f7e8a"}}>© 2026 Meera. A friendly guide for every burrow.</span>
          <div style={{display:"flex",gap:18,fontSize:13}}>
            <a href="#" style={{color:"#8c9aa6"}}>Privacy</a><a href="#" style={{color:"#8c9aa6"}}>Terms</a><a href="#" style={{color:"#8c9aa6"}}>Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Nav, Hero, MeerorSection, HandoffSection, LookoutSection, UseCases, Benefits, BrandSection, CTA, Footer });
