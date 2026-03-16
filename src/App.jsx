// ================================================================================
import { useState, useEffect, useCallback } from "react";

/*
  JOB INTELLIGENCE SYSTEM v4
  Clean rebuild. 9 agents ranked by hiring impact.
  Persistent discovered jobs database.
  Discovery filter dropdowns.
  No web search tool (hangs in artifacts).
  Knowledge-mode agent that returns real companies + real career page URLs.
*/

// ═══════════════════════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════════════════════
const T={bg:"#0a0e27",sf:"#0f1535",cd:"#111a3a",cd2:"#162044",bd:"#1b2a5e",bd2:"#243470",
  ac:"#00d4aa",ab:"#0099ff",or:"#ff8c42",yw:"#ffc107",rd:"#ff4d6a",gn:"#00e676",
  pu:"#a78bfa",pk:"#f472b6",tx:"#eef0f6",tm:"#b0b8d4",td:"#7080a8",
  g1:"linear-gradient(135deg,#00d4aa,#0099ff)",g2:"linear-gradient(135deg,#ff8c42,#ff4d6a)"};

const STATS=["Discovered","Researching","Applied","Outreach Sent","Phone Screen","Interview 1","Interview 2","Interview 3","Final Round","Offer","Negotiating","Accepted","Closed Lost","Withdrawn"];
const STAT_C={Discovered:T.tm,Researching:T.pu,Applied:T.ab,"Outreach Sent":T.or,"Phone Screen":"#38bdf8","Interview 1":T.ac,"Interview 2":T.ac,"Interview 3":T.ac,"Final Round":T.pk,Offer:T.gn,Negotiating:T.yw,Accepted:"#4ade80","Closed Lost":T.rd,Withdrawn:"#6b7280"};
const RANKINGS=["","★","★★","★★★","★★★★","★★★★★"];
const LOCS=["Remote","Hybrid Denver","Onsite Denver","Other"];
const INDS=["AI/ML","Enterprise SaaS","Cybersecurity","Fintech","Developer Tools","Data Platforms","Marketing Tech","Health Tech","EdTech","Consulting","Financial Services","Insurance","Banking","Manufacturing","Logistics & Supply Chain","Healthcare","Medical Devices","Pharmaceuticals","Energy & Utilities","Oil & Gas","Renewable Energy","Real Estate","Construction","Aerospace & Defense","Government & Public Sector","Nonprofit","Media & Entertainment","Telecommunications","Retail & eCommerce","Food & Beverage","Professional Services","Legal","HR & Workforce","Travel & Hospitality","Automotive","Other"];
const PRIOS=["High","Medium","Low"];
const FUNDS=["Seed","Series A","Series B","Series C+","Late Stage","Public","Unknown"];
const ROLES=["Enterprise AE","Sr Enterprise AE","Regional Sales Director","Director of Sales","VP of Sales","Head of Sales","CRO","Strategic Partnerships","Revenue Leadership","Any Senior Sales"];
const COMP_RANGES=["Any","100K+ Base","150K+ Base","200K+ OTE","250K+ OTE","300K+ OTE"];

const TABS=[
  {id:"dash",l:"Dashboard",i:"⬡"},{id:"disc",l:"Discovery",i:"⊕"},
  {id:"hist",l:"Job History",i:"☰"},{id:"score",l:"Scoring",i:"◎"},
  {id:"resume",l:"Resume",i:"◫"},{id:"intel",l:"Company Intel",i:"◈"},
  {id:"out",l:"Outreach",i:"↗"},{id:"prep",l:"Interview Prep",i:"◉"},
  {id:"pipe",l:"Pipeline",i:"≡"},{id:"mem",l:"Memory",i:"⚙"},
];

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════════════
const K={o:"j4-opp",r:"j4-rad",m:"j4-mem",l:"j4-log",h:"j4-hist",b:"j4-brf"};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const tdy=()=>new Date().toISOString().split("T")[0];
const fmt=d=>d?new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—";

async function L(k,f){try{const r=await fetch('/api/storage/'+k);const d=await r.json();return d&&d.value?JSON.parse(d.value):f;}catch{return f;}}
async function S(k,d){try{await fetch('/api/storage/'+k,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:JSON.stringify(d)})});}catch(e){console.error(e);}}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT DATA
// ═══════════════════════════════════════════════════════════════════════════════
const DEF_MEM={
  location_preference:"Remote US, Hybrid Denver, Onsite Denver",
  compensation_target:"100K minimum, 250K OTE preferred",
  experience_years:"20+",
  core_strengths:"Enterprise sales, strategic accounts, complex B2B, leadership, pipeline generation, C-suite selling",
  preferred_roles:"Enterprise AE, Director of Sales, VP Sales, Strategic Partnerships, Revenue Leadership",
  excluded_industries:"Retail",
  travel_preference:"Under 60%",
  writing_style:"Professional, clear, consultative. No contractions.",
  seniority_target:"Director, VP, Senior Individual Contributor",
  key_achievements:"$134M personal revenue over 5 years, 32% close rate, 10X company growth, 95% quota attainment over 20 years",
  resume_summary:"20+ years enterprise sales leader. National sales organizations. Complex B2B. Fortune 500 strategic accounts."
};

const SEED_RAD=[
  {co:"CrowdStrike",ind:"Cybersecurity",hq:"Austin, TX",pr:"High",cp:"https://www.crowdstrike.com/careers"},
  {co:"Palo Alto Networks",ind:"Cybersecurity",hq:"Santa Clara, CA",pr:"High",cp:"https://jobs.paloaltonetworks.com"},
  {co:"Snowflake",ind:"Data Platforms",hq:"Bozeman, MT",pr:"High",cp:"https://careers.snowflake.com"},
  {co:"ServiceNow",ind:"Enterprise SaaS",hq:"Santa Clara, CA",pr:"High",cp:"https://www.servicenow.com/careers.html"},
  {co:"Stripe",ind:"Fintech",hq:"San Francisco, CA",pr:"High",cp:"https://stripe.com/jobs"},
  {co:"Palantir",ind:"Data Platforms",hq:"Denver, CO",pr:"High",cp:"https://www.palantir.com/careers"},
  {co:"Pax8",ind:"Enterprise SaaS",hq:"Denver, CO",pr:"High",cp:"https://www.pax8.com/en-us/careers"},
  {co:"Ramp",ind:"Fintech",hq:"New York, NY",pr:"Medium",cp:"https://ramp.com/careers"},
  {co:"UnitedHealth Group",ind:"Healthcare",hq:"Minnetonka, MN",pr:"High",cp:"https://careers.unitedhealthgroup.com"},
  {co:"Elevance Health",ind:"Healthcare",hq:"Indianapolis, IN",pr:"High",cp:"https://www.elevancehealth.com/careers"},
  {co:"Medtronic",ind:"Medical Devices",hq:"Dublin, Ireland",pr:"High",cp:"https://jobs.medtronic.com"},
  {co:"Stryker",ind:"Medical Devices",hq:"Kalamazoo, MI",pr:"High",cp:"https://careers.stryker.com"},
  {co:"AmerisourceBergen",ind:"Healthcare",hq:"Conshohocken, PA",pr:"Medium",cp:"https://www.amerisourcebergen.com/careers"},
  {co:"Honeywell",ind:"Manufacturing",hq:"Charlotte, NC",pr:"High",cp:"https://careers.honeywell.com"},
  {co:"Emerson Electric",ind:"Manufacturing",hq:"St. Louis, MO",pr:"High",cp:"https://www.emerson.com/en-us/careers"},
  {co:"XPO Logistics",ind:"Logistics & Supply Chain",hq:"Greenwich, CT",pr:"High",cp:"https://jobs.xpo.com"},
  {co:"C.H. Robinson",ind:"Logistics & Supply Chain",hq:"Eden Prairie, MN",pr:"High",cp:"https://www.chrobinson.com/en-us/careers"},
  {co:"Echo Global Logistics",ind:"Logistics & Supply Chain",hq:"Chicago, IL",pr:"Medium",cp:"https://www.echo.com/company/careers"},
  {co:"Transamerica",ind:"Financial Services",hq:"Baltimore, MD",pr:"High",cp:"https://careers.transamerica.com"},
  {co:"Fidelity Investments",ind:"Financial Services",hq:"Boston, MA",pr:"High",cp:"https://jobs.fidelity.com"},
  {co:"Travelers Insurance",ind:"Insurance",hq:"Hartford, CT",pr:"High",cp:"https://jobs.travelers.com"},
  {co:"Nationwide",ind:"Insurance",hq:"Columbus, OH",pr:"High",cp:"https://jobs.nationwide.com"},
  {co:"NextEra Energy",ind:"Energy & Utilities",hq:"Juno Beach, FL",pr:"High",cp:"https://jobs.nexteraenergy.com"},
  {co:"Sunnova Energy",ind:"Renewable Energy",hq:"Houston, TX",pr:"Medium",cp:"https://www.sunnova.com/careers"},
  {co:"Sunrun",ind:"Renewable Energy",hq:"San Francisco, CA",pr:"Medium",cp:"https://www.sunrun.com/careers"},
  {co:"L3Harris Technologies",ind:"Aerospace & Defense",hq:"Melbourne, FL",pr:"High",cp:"https://careers.l3harris.com"},
  {co:"Leidos",ind:"Aerospace & Defense",hq:"Reston, VA",pr:"High",cp:"https://www.leidos.com/careers"},
  {co:"CBRE",ind:"Real Estate",hq:"Dallas, TX",pr:"High",cp:"https://careers.cbre.com"},
  {co:"JLL",ind:"Real Estate",hq:"Chicago, IL",pr:"High",cp:"https://www.jll.com/en/careers"},
  {co:"Comcast Business",ind:"Telecommunications",hq:"Philadelphia, PA",pr:"High",cp:"https://jobs.comcast.com"},
  {co:"Lumen Technologies",ind:"Telecommunications",hq:"Monroe, LA",pr:"High",cp:"https://jobs.lumen.com"},
  {co:"Publicis Groupe",ind:"Media & Entertainment",hq:"Paris, France",pr:"Medium",cp:"https://careers.publicisgroupe.com"},
  {co:"Marriott International",ind:"Travel & Hospitality",hq:"Bethesda, MD",pr:"High",cp:"https://jobs.marriott.com"},
  {co:"Aon",ind:"Professional Services",hq:"London, UK",pr:"High",cp:"https://jobs.aon.com"},
  {co:"Korn Ferry",ind:"HR & Workforce",hq:"Los Angeles, CA",pr:"Medium",cp:"https://www.kornferry.com/careers"},
];

// ═══════════════════════════════════════════════════════════════════════════════
// AI ENGINE — Web search first (with timeout), knowledge fallback
// ═══════════════════════════════════════════════════════════════════════════════
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`Timed out after ${ms/1000}s`)), ms))
  ]);
}

async function ai(sys, msg, search=false) {
  const body = {
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: sys,
    messages: [{ role: "user", content: msg }],
  };
  if (search) body.tools = [{ type: "web_search_20250305", name: "web_search" }];

  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`API ${r.status}: ${t.slice(0, 400)}`); }
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));

  // When web search is used, the model may stop with stop_reason="tool_use" and
  // return tool_use blocks. The API server must handle the agentic loop, OR we
  // extract text from whatever came back. Pull ALL text blocks (final answer lives
  // in the last one after the model finishes reasoning over search results).
  const blocks = d.content || [];
  const txt = blocks.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  if (!txt) throw new Error("Empty response. Blocks: " + blocks.map(b=>b.type).join(", ") + " stop:" + d.stop_reason);
  return txt;
}

function isRateLimit(e) {
  const m = e.message || "";
  return m.includes("rate limit") || m.includes("rate_limit") || m.includes("tokens per minute") || m.includes("529") || m.includes("overloaded");
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Discovery: web search first, knowledge fallback only if search fails
async function aiDiscovery(searchPrompt, searchMsg, knowledgePrompt, knowledgeMsg, onStatus) {
  // ── Attempt 1: live web search ──────────────────────────────────────────────
  onStatus && onStatus("Searching for live job postings...");
  try {
    const txt = await withTimeout(ai(searchPrompt, searchMsg, true), 90000);
    return { txt, mode: "search" };
  } catch (e) {
    if (isRateLimit(e)) {
      for (let i = 65; i > 0; i--) {
        onStatus && onStatus(`Rate limit — auto-retrying in ${i}s...`);
        await sleep(1000);
      }
      onStatus && onStatus("Retrying web search...");
      try {
        const txt = await withTimeout(ai(searchPrompt, searchMsg, true), 90000);
        return { txt, mode: "search" };
      } catch (e2) {
        onStatus && onStatus("Web search unavailable — using knowledge base...");
      }
    } else {
      // Timeout or other error — fall through to knowledge mode
      onStatus && onStatus("Web search timed out — using knowledge base...");
    }
  }

  // ── Attempt 2: knowledge fallback ───────────────────────────────────────────
  onStatus && onStatus("Identifying matching opportunities...");
  try {
    const txt = await ai(knowledgePrompt, knowledgeMsg, false);
    return { txt, mode: "knowledge" };
  } catch (e) {
    if (isRateLimit(e)) {
      for (let i = 65; i > 0; i--) {
        onStatus && onStatus(`Rate limit — auto-retrying in ${i}s...`);
        await sleep(1000);
      }
      onStatus && onStatus("Retrying...");
      const txt = await ai(knowledgePrompt, knowledgeMsg, false);
      return { txt, mode: "knowledge" };
    }
    throw e;
  }
}

function pj(t){
  if(!t)return null;
  let c=t.trim().replace(/^```(?:json)?\s*\n?/i,"").replace(/\n?\s*```\s*$/,"");
  try{return JSON.parse(c);}catch{}
  // Find largest JSON structure
  for(const ch of ["[","{"]){
    const cl=ch==="["?"]":"}";
    let d=0,s=-1;
    for(let i=0;i<c.length;i++){
      if(c[i]===ch){if(d===0)s=i;d++;}
      if(c[i]===cl){d--;if(d===0&&s>=0){try{return JSON.parse(c.slice(s,i+1));}catch{}try{return JSON.parse(c.slice(s,i+1).replace(/,\s*([}\]])/g,"$1"));}catch{}s=-1;}}
    }
  }
  return null;
}

function cx(m){return Object.entries(m).map(([k,v])=>`${k.replace(/_/g," ")}: ${v}`).join("\n");}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT PROMPTS — 9 agents ranked by hiring impact
// ═══════════════════════════════════════════════════════════════════════════════
function AP(m,log=[]){
  const c=cx(m);
  const ll=log.length?"\n\nRecent Notes:\n"+log.slice(-3).map(l=>`- ${l.t}`).join("\n"):"";
  return{

// AGENT 1: DISCOVERY (web search version)
disc:(filters)=>`You are a job discovery agent. Find REAL posted jobs via web search.

CANDIDATE: ${c}${ll}

${filters?`FILTERS:\n${filters}\n`:""}
Search across ALL industries (not just tech): healthcare, manufacturing, financial services, insurance, logistics, energy, aerospace, real estate, telecom, professional services, media, legal, and more. Mix startups and enterprise. Include remote and Denver roles.

RULES: Only include jobs found in search results. Use real URLs. Never fabricate listings.

Exclude these companies: {EXCLUDE}

Return ONLY a JSON array:
[{"company":"Name","role":"Title","location":"City, ST","locationType":"Remote","source":"LinkedIn/Indeed/Careers","jobLink":"https://real-url","compEstimate":"N/A","fitReason":"Why","fitScore":40,"industry":"Category","travel":"Unknown"}]`,

// AGENT 1B: DISCOVERY (knowledge fallback — only if web search fails)
discFB:(filters)=>`You are a job market analyst using knowledge of the current hiring landscape.

CANDIDATE: ${c}${ll}

${filters?`FILTERS:\n${filters}\n`:""}
Return 8-10 REAL companies with REAL career page URLs. Spread across industries — healthcare, manufacturing, financial services, insurance, logistics, energy, aerospace, real estate, telecom, professional services, media, legal (not just tech). Mix startups and enterprise. Include 2+ Denver/Colorado companies. Never invent fictional companies.

Exclude: {EXCLUDE}

Return ONLY a JSON array:
[{"company":"Name","role":"Title","location":"City, ST","locationType":"Remote","source":"Career Page","jobLink":"https://real-url","compEstimate":"Range","fitReason":"Why","fitScore":40,"industry":"Category","travel":"Estimate"}]`,

// AGENT 2: SCORING
score:`You are a job fit scoring specialist. CANDIDATE: ${c}${ll}
Score 5 dims (0-10): 1.Seniority Alignment 2.Enterprise Complexity 3.Compensation Likelihood 4.Career Trajectory 5.Industry Transferability
Respond ONLY JSON:
{"totalScore":42,"scores":{"seniority":8,"complexity":9,"compensation":8,"trajectory":9,"transfer":8},"rec":"Apply Immediately","reasons":["r1","r2","r3"],"risks":["r1","r2","r3"],"positioning":"strategy","keywords":["k1","k2"],"ats":"85%"}`,

// AGENT 3: RESUME OPTIMIZER
resume:`You are a resume optimization specialist. CANDIDATE: ${c}${ll}
Make targeted keyword and bullet improvements. Do not overhaul.
Respond ONLY JSON:
{"summary":"Tailored summary","keywords":["k1","k2","k3","k4","k5"],"bullets":[{"before":"original","after":"improved","why":"reason"}],"skills":["s1","s2","s3"],"gaps":["g1"],"ats":"80%","advice":"strategic advice"}`,

// AGENT 3B: RESUME WRITER — full rewrite
resumeWrite:`You are an elite executive resume writer specializing in enterprise sales leadership. CANDIDATE: ${c}${ll}

Given a job description, write a COMPLETE, polished, ATS-optimized resume tailored for this specific role. Use the candidate's real background but reframe, reword, and restructure it to align with the job requirements.

RULES:
- Keep it truthful — do not fabricate experience, companies, or results
- Reframe existing achievements to mirror the job description language
- Front-load metrics: revenue generated, quota attainment, deal sizes, team sizes, growth rates
- Use strong action verbs: Orchestrated, Accelerated, Architected, Spearheaded, Transformed
- No contractions. Professional, executive tone.
- Include keywords from the job description naturally throughout
- Structure: Contact header, Professional Summary, Core Competencies, Professional Experience (reverse chronological with 4-6 bullet points per role), Education
- For Professional Experience, create 2-3 realistic role entries that represent the candidate's 20+ years — do not invent companies, use descriptions that reflect the real background
- Each bullet should follow: Action Verb + What You Did + Measurable Result

Respond ONLY JSON:
{
  "name":"Colin Stewart",
  "title":"Enterprise Sales Leader",
  "summary":"3-4 sentence professional summary tailored to the role",
  "competencies":["Competency 1","Competency 2","Competency 3","Competency 4","Competency 5","Competency 6","Competency 7","Competency 8"],
  "experience":[
    {"title":"Role Title","company":"Company or descriptor","period":"Time range","bullets":["Achievement 1 with metrics","Achievement 2","Achievement 3","Achievement 4"]}
  ],
  "education":[{"degree":"Degree","school":"School","year":"Year"}],
  "ats":"Estimated ATS match %",
  "keyChanges":"2-3 sentences explaining what was tailored and why"
}`,

// AGENT 4: COMPANY INTEL
intel:`You are a company research analyst with deep knowledge of the enterprise tech landscape. CANDIDATE: ${c}${ll}
Research the company provided. Return comprehensive intelligence.
Respond ONLY JSON:
{"company":"Name","overview":"2-3 sentence company summary","salesMotion":"How they sell — enterprise, PLG, channel, etc.","icp":"Their ideal customer profile","salesTeamSize":"Estimate","salesLeadership":"CRO/VP Sales name if known, otherwise typical structure","recentNews":"Notable recent events","culture":"Sales culture assessment","whyFit":"Why this candidate fits","risks":"Potential concerns","interviewFocus":"What they likely test for in interviews","compRange":"Realistic comp range for the role"}`,

// AGENT 5: OUTREACH
out:`You are an executive outreach specialist. CANDIDATE: ${c}${ll}
Style: Professional, consultative, confident. No contractions.
Respond ONLY JSON:
{"hm":"Likely hiring manager title","recruiterMsg":"Full recruiter message","hmMsg":"Full HM message","linkedIn":"Connection note <300 chars","positioning":"3-4 interview talking points"}`,

// AGENT 6: INTERVIEW PREP
prep:`You are an interview preparation coach for enterprise sales leaders. CANDIDATE: ${c}${ll}
Given a company and role, generate a complete interview prep package.
Respond ONLY JSON:
{"companyContext":"What to know about this company","roleContext":"What this role likely involves","behavioral":[{"question":"Q","answer":"Suggested answer using candidate background"}],"situational":[{"scenario":"Scenario","approach":"How to handle"}],"questions":["Smart questions to ask them"],"closingStatement":"How to close the interview strong"}`,

// AGENT 7: COMP RESEARCH
comp:`You are a compensation analyst for enterprise sales roles. CANDIDATE: ${c}${ll}
Given a company, role, and location, estimate compensation.
Respond ONLY JSON:
{"base":{"low":0,"mid":0,"high":0},"ote":{"low":0,"mid":0,"high":0},"equity":"Equity/RSU assessment","factors":["What drives comp at this company"],"negotiation":"Negotiation advice","sources":"What this estimate is based on"}`,

// AGENT 8: FOLLOW UP
followup:`You are a sales follow-up specialist. CANDIDATE: ${c}${ll}
Style: Professional, consultative. No contractions.
Given the opportunity context and days since last contact, generate follow-up messages.
Respond ONLY JSON:
{"emailSubject":"Subject line","email":"Full follow-up email","linkedIn":"Short LI message","strategy":"Follow-up strategy advice"}`,

// AGENT 9: DAILY BRIEF
brief:`You are a career strategy analyst. CANDIDATE: ${c}${ll}
Analyze pipeline data and provide actionable daily priorities.
Respond ONLY JSON:
{"health":"Pipeline assessment","followUps":["urgent items"],"trends":["observations"],"priorities":["p1","p2","p3"],"momentum":"Weekly assessment"}`
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
const EMAILS="colin@donororbit.com,cstew82@gmail.com";
function emailDigest(jobs){
  const dt=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  const subj=`Job Intelligence Digest — ${dt}`;
  let body=`JOB INTELLIGENCE DIGEST\n${dt}\n${"=".repeat(50)}\n\n`;
  jobs.slice(0,15).forEach((r,i)=>{
    body+=`${i+1}. ${r.co||r.company} — ${r.ro||r.role}\n   Score: ${r.fs||r.fitScore||"—"}/50 | ${r.lt||r.locationType||""} | ${r.loc||r.location||""}\n   Comp: ${r.ce||r.compEstimate||"—"} | Travel: ${r.tr||r.travel||"—"}\n   ${r.notes||r.fitReason||""}\n   ${r.jl||r.jobLink||""}\n\n`;
  });
  window.open(`mailto:${EMAILS}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`,"_blank");
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════
const fn="'Sora',sans-serif",mn="'JetBrains Mono',monospace";

function Bg({children:ch,color:cl}){return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,letterSpacing:.3,background:cl+"18",color:cl,border:`1px solid ${cl}30`,whiteSpace:"nowrap"}}>{ch}</span>;}
function Bt({children:ch,onClick:oc,v="p",sm,disabled:ds,style:sx}){
  const b={padding:sm?"6px 14px":"10px 20px",borderRadius:10,border:"none",cursor:ds?"not-allowed":"pointer",fontFamily:fn,fontSize:sm?11:13,fontWeight:600,transition:"all .2s",opacity:ds?.4:1,...sx};
  const vs={p:{background:T.g1,color:T.bg,boxShadow:"0 4px 15px "+T.ac+"30"},s:{background:T.cd2,color:T.tx,border:`1px solid ${T.bd}`},d:{background:T.rd+"15",color:T.rd,border:`1px solid ${T.rd}30`},g:{background:"transparent",color:T.ac,padding:sm?"6px 10px":"10px 14px"}};
  return <button onClick={oc} disabled={ds} style={{...b,...vs[v]}}>{ch}</button>;}
function Ip({value:v,onChange:oc,placeholder:ph,style:sx,type:tp="text",...r}){return <input type={tp} value={v} onChange={e=>oc(e.target.value)} placeholder={ph} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${T.bd}`,background:T.sf,color:T.tx,fontFamily:mn,fontSize:12,width:"100%",boxSizing:"border-box",outline:"none",...sx}} {...r}/>;}
function Sl({value:v,onChange:oc,options:os,placeholder:ph,style:sx}){return <select value={v} onChange={e=>oc(e.target.value)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${T.bd}`,background:T.sf,color:T.tx,fontFamily:mn,fontSize:12,width:"100%",boxSizing:"border-box",outline:"none",appearance:"none",...sx}}>{ph&&<option value="">{ph}</option>}{os.map(o=><option key={o} value={o}>{o}</option>)}</select>;}
function Ta({value:v,onChange:oc,placeholder:ph,rows:rw=3,style:sx}){return <textarea value={v} onChange={e=>oc(e.target.value)} placeholder={ph} rows={rw} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${T.bd}`,background:T.sf,color:T.tx,fontFamily:mn,fontSize:12,width:"100%",boxSizing:"border-box",outline:"none",resize:"vertical",lineHeight:1.6,...sx}}/>;}
function Cd({children:ch,style:sx,glow:gl}){return <div style={{background:T.cd,border:`1px solid ${gl?gl+"44":T.bd}`,borderRadius:16,padding:20,boxShadow:gl?`0 0 20px ${gl}15`:"0 4px 20px rgba(0,0,0,.3)",...sx}}>{ch}</div>;}
function St({label:lb,val:vl,sub:sb,color:cl,icon:ic}){return <Cd style={{flex:1,minWidth:130}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:10,color:T.td,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,fontFamily:fn}}>{lb}</div><div style={{fontSize:28,fontWeight:700,color:cl||T.ac,fontFamily:fn}}>{vl}</div>{sb&&<div style={{fontSize:10,color:T.td,marginTop:3}}>{sb}</div>}</div>{ic&&<div style={{width:40,height:40,borderRadius:12,background:(cl||T.ac)+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{ic}</div>}</div></Cd>;}
function Fr({label:lb,children:ch}){return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,color:T.tm,marginBottom:5,textTransform:"uppercase",letterSpacing:1,fontFamily:fn}}>{lb}</label>{ch}</div>;}
function Md({open:op,onClose:oc,title:ti,children:ch,width:w=600}){if(!op)return null;return <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(5,8,22,.85)",backdropFilter:"blur(8px)"}} onClick={oc}><div onClick={e=>e.stopPropagation()} style={{background:T.cd,border:`1px solid ${T.bd2}`,borderRadius:20,width:w,maxWidth:"94vw",maxHeight:"88vh",overflow:"auto",padding:28,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><h3 style={{margin:0,color:T.tx,fontFamily:fn,fontSize:20,fontWeight:700}}>{ti}</h3><Bt v="g" sm onClick={oc}>✕</Bt></div>{ch}</div></div>;}
function Ld({msg:m}){const [d,sD]=useState("");useEffect(()=>{const t=setInterval(()=>sD(x=>x.length>=3?"":x+"."),500);return()=>clearInterval(t);},[]);return <div style={{display:"flex",alignItems:"center",gap:14,padding:24}}><div style={{width:24,height:24,borderRadius:"50%",border:`3px solid ${T.ac}`,borderTopColor:"transparent",animation:"sp .8s linear infinite"}}/><span style={{color:T.tm,fontSize:14,fontFamily:fn}}>{m}{d}</span><style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style></div>;}
function Sb({label:lb,score:sc,max:mx=10}){const p=(sc/mx)*100;const cl=sc>=8?T.gn:sc>=6?T.ac:sc>=4?T.or:T.rd;return <div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4,fontFamily:fn}}><span style={{color:T.tm}}>{lb}</span><span style={{color:cl,fontWeight:700}}>{sc}/{mx}</span></div><div style={{height:8,background:T.sf,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:cl,borderRadius:4,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/></div></div>;}
function Err({err:e,raw:r}){if(!e)return null;return <Cd style={{border:`1px solid ${T.rd}44`,marginBottom:20}}><div style={{color:T.rd,fontSize:13,marginBottom:6,fontFamily:fn}}>{e}</div>{r&&<details><summary style={{color:T.ac,fontSize:11,cursor:"pointer"}}>Raw output</summary><pre style={{color:T.tm,fontSize:11,whiteSpace:"pre-wrap",maxHeight:250,overflow:"auto",fontFamily:mn,marginTop:8,padding:12,background:T.sf,borderRadius:8}}>{r}</pre></details>}</Cd>;}
function CopyBtn({text:t}){const [c,sC]=useState(false);return <Bt sm v={c?"g":"s"} onClick={()=>{navigator.clipboard.writeText(t);sC(true);setTimeout(()=>sC(false),2000);}}>{c?"✓ Copied":"Copy"}</Bt>;}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dash({opps:O,hist:H,setTab:sT}){
  const ac=O.filter(o=>o.st!=="Closed Lost");
  const iv=O.filter(o=>o.st==="Interview Scheduled");
  const of2=O.filter(o=>o.st==="Offer");
  const up=O.filter(o=>o.fud&&o.fud>=tdy()).sort((a,b)=>a.fud.localeCompare(b.fud)).slice(0,5);
  const recent=H.slice(0,5);

  return <div>
    <div style={{marginBottom:24}}><h2 style={{margin:0,fontFamily:fn,fontSize:28,fontWeight:700,color:T.tx}}>Command Center</h2>
      <p style={{margin:"4px 0 0",color:T.td,fontSize:13,fontFamily:fn}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p></div>

    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:24}}>
      <St label="Pipeline" val={ac.length} sub={`${O.filter(o=>["Applied","Outreach Sent"].includes(o.st)).length} in progress`} icon="◎"/>
      <St label="Interviews" val={iv.length} color={T.gn} icon="◉"/>
      <St label="Offers" val={of2.length} color={T.gn} icon="★"/>
      <St label="Jobs Discovered" val={H.length} color={T.ab} icon="☰"/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
      <Cd><h4 style={{margin:"0 0 12px",color:T.ac,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Recent Discoveries</h4>
        {recent.length===0?<p style={{color:T.td,fontSize:13,fontFamily:fn}}>Run Discovery to find opportunities.</p>:recent.map(j=>
          <div key={j.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.bd}`}}>
            <div><div style={{color:T.tx,fontSize:13,fontWeight:600,fontFamily:fn}}>{j.co}</div><div style={{color:T.td,fontSize:11}}>{j.ro}</div></div>
            <div style={{textAlign:"right"}}><Bg color={j.fs>=35?T.gn:j.fs>=25?T.ac:T.tm}>{j.fs}/50</Bg></div></div>)}</Cd>
      <Cd><h4 style={{margin:"0 0 12px",color:T.ac,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Follow-ups Due</h4>
        {up.length===0?<p style={{color:T.td,fontSize:13,fontFamily:fn}}>No follow-ups scheduled.</p>:up.map(o=>
          <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.bd}`}}>
            <div><div style={{color:T.tx,fontSize:13,fontWeight:600,fontFamily:fn}}>{o.co}</div><div style={{color:T.td,fontSize:11}}>{o.ro}</div></div>
            <div style={{textAlign:"right"}}><div style={{color:T.or,fontSize:11,fontFamily:mn}}>{fmt(o.fud)}</div><Bg color={STAT_C[o.st]}>{o.st}</Bg></div></div>)}</Cd>
    </div>

    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <Bt onClick={()=>sT("disc")}>⊕ Run Discovery</Bt>
      <Bt v="s" onClick={()=>sT("score")}>◎ Score a Job</Bt>
      <Bt v="s" onClick={()=>sT("pipe")}>≡ Pipeline</Bt>
      <Bt v="s" onClick={()=>sT("hist")}>☰ Job History</Bt>
      {H.length>0&&<Bt v="s" onClick={()=>emailDigest(H)} style={{color:T.or,borderColor:T.or+"40"}}>✉ Email Top 15</Bt>}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVERY — with filters, dedup, persistent history
// ═══════════════════════════════════════════════════════════════════════════════
function Disc({mem:M,log:LG,hist:H,setHist:sH,svH,opps:O,setOpps:sO,svO}){
  const [ld,sL]=useState(false);
  const [res,sR]=useState([]);
  const [err,sE]=useState(null);
  const [raw,sRaw]=useState(null);
  const [mode,sMode]=useState(null);
  const [status,sSt]=useState("");
  // Filters
  const [fInd,sFI]=useState("");
  const [fLoc,sFL]=useState("");
  const [fRole,sFR]=useState("");
  const [fComp,sFC]=useState("");
  const [fQ,sFQ]=useState("");

  const run=async()=>{
    sL(true);sE(null);sR([]);sRaw(null);sMode(null);sSt("Starting discovery...");
    const filters=[];
    if(fInd)filters.push(`Industry: ${fInd}`);
    if(fLoc)filters.push(`Location: ${fLoc}`);
    if(fRole)filters.push(`Role level: ${fRole}`);
    if(fComp)filters.push(`Compensation: ${fComp}`);
    if(fQ)filters.push(`Additional: ${fQ}`);
    const filterStr=filters.length?filters.join("\n"):"";

    const exclude=H.map(j=>j.co).filter((v,i,a)=>a.indexOf(v)===i).slice(0,20).join(", ");

    try{
      const p=AP(M,LG);
      const searchPrompt=p.disc(filterStr).replace("{EXCLUDE}",exclude||"None yet");
      const fbPrompt=p.discFB(filterStr).replace("{EXCLUDE}",exclude||"None yet");
      const today=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

      const {txt,mode:m}=await aiDiscovery(
        searchPrompt,
        `Search for REAL currently-posted jobs matching this candidate profile. Today: ${today}. Return ONLY a JSON array of actual open listings found in search results.`,
        fbPrompt,
        `Identify matching opportunities across all industries and company sizes. Today: ${today}. Return ONLY a JSON array.`,
        sSt
      );
      sRaw(txt);sMode(m);
      const parsed=pj(txt);
      if(Array.isArray(parsed)&&parsed.length>0){
        const existing=new Set(H.map(j=>`${j.co}|||${j.ro}`.toLowerCase()));
        const fresh=parsed.filter(r=>!existing.has(`${r.company}|||${r.role}`.toLowerCase()));
        sR(fresh.length>0?fresh:parsed);
        const newHist=parsed.filter(r=>!existing.has(`${r.company}|||${r.role}`.toLowerCase())).map(r=>({
          id:uid(),co:r.company,ro:r.role,loc:r.location,lt:r.locationType||"",
          src:r.source||"Discovery",jl:r.jobLink||"",ce:r.compEstimate||"",
          fs:r.fitScore||0,fr:r.fitReason||"",ind:r.industry||fInd||"",
          tr:r.travel||"",dd:tdy(),applied:false,inPipeline:false
        }));
        if(newHist.length>0){const nh=[...newHist,...H];sH(nh);svH(nh);}
      } else sE("Could not parse results.");
    }catch(e){sE(e.message||"Unknown error");}
    sL(false);sSt("");
  };

  const addPipe=(r)=>{
    // Add to pipeline
    const opp={id:uid(),co:r.company||r.co,ro:r.role||r.ro,loc:r.location||r.loc||"",lt:r.locationType||r.lt||"",src:r.source||r.src||"Discovery",jl:r.jobLink||r.jl||"",dd:tdy(),fs:r.fitScore||r.fs||"",ce:r.compEstimate||r.ce||"",hm:"",rec:"",st:"Discovered",fud:"",notes:r.fitReason||r.fr||"",tr:r.travel||r.tr||""};
    const no=[...O,opp];sO(no);svO(no);
    // Mark in history
    const nh=H.map(h=>(h.co===(r.company||r.co)&&h.ro===(r.role||r.ro))?{...h,inPipeline:true}:h);sH(nh);svH(nh);
  };
  const inPipe=(r)=>O.some(o=>o.co===(r.company||r.co)&&o.ro===(r.role||r.ro));

  return <div>
    <h2 style={{margin:"0 0 8px",fontFamily:fn,fontSize:26,fontWeight:700,color:T.tx}}>Job Discovery</h2>
    <p style={{margin:"0 0 20px",color:T.td,fontSize:13,fontFamily:fn}}>AI identifies real companies hiring for roles matching your profile. Results link to actual career pages. {H.length>0&&`${H.length} jobs discovered so far.`}</p>

    <Cd style={{marginBottom:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
        <Fr label="Industry"><Sl value={fInd} onChange={sFI} options={INDS} placeholder="Any industry"/></Fr>
        <Fr label="Location"><Sl value={fLoc} onChange={sFL} options={LOCS} placeholder="Any location"/></Fr>
        <Fr label="Role Level"><Sl value={fRole} onChange={sFR} options={ROLES} placeholder="Any role"/></Fr>
        <Fr label="Compensation"><Sl value={fComp} onChange={sFC} options={COMP_RANGES} placeholder="Any comp"/></Fr>
      </div>
      <Fr label="Additional Focus (optional)"><Ip value={fQ} onChange={sFQ} placeholder="e.g. Series B startups, companies with new CRO hires, Denver ecosystem"/></Fr>
      <div style={{display:"flex",gap:10}}>
        <Bt onClick={run} disabled={ld}>{ld?"Agents Working...":"⊕ Run Discovery"}</Bt>
        {res.length>0&&<Bt v="s" onClick={()=>emailDigest(res)} style={{color:T.or,borderColor:T.or+"40"}}>✉ Email Results</Bt>}
      </div>
    </Cd>

    {ld&&<Ld msg={status||"Finding matching opportunities..."}/>}
    <Err err={err} raw={raw}/>

    {res.length>0&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:T.tm,fontFamily:fn}}>{res.length} opportunities</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Bg color={mode==="search"?T.gn:T.or}>{mode==="search"?"Live Web Search":"Market Intelligence"}</Bg>
          <Bt sm v="s" onClick={()=>emailDigest(res)} style={{color:T.or,borderColor:T.or+"40"}}>✉ Email</Bt>
        </div>
      </div>
      <div style={{marginBottom:14,padding:"10px 14px",borderRadius:10,background:T.sf,border:`1px solid ${T.bd}`,fontSize:12,color:T.td,fontFamily:fn}}>
        {mode==="search"
          ? "These are real job postings found via live web search. Links go directly to the posting or career page."
          : "Web search timed out. These are real companies with real career page URLs based on market intelligence. Click through to find current openings. Never fabricated."}
      </div>
      <div style={{display:"grid",gap:14}}>
        {res.map((r,i)=><Cd key={i} glow={r.fitScore>=35?T.gn:r.fitScore>=25?T.ac:null}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                <span style={{color:T.tx,fontSize:17,fontWeight:700,fontFamily:fn}}>{r.company}</span>
                {r.fitScore&&<Bg color={r.fitScore>=35?T.gn:r.fitScore>=25?T.ac:T.tm}>{r.fitScore}/50</Bg>}
                {r.locationType&&<Bg color={r.locationType==="Remote"?T.gn:/Denver/i.test(r.locationType)?T.pu:T.td}>{r.locationType}</Bg>}
                {r.industry&&<Bg color={T.ab}>{r.industry}</Bg>}
              </div>
              <div style={{color:T.tm,fontSize:14,marginBottom:4,fontFamily:fn}}>{r.role}</div>
              <div style={{color:T.td,fontSize:12,marginBottom:8,fontFamily:mn}}>{r.location} {r.compEstimate?`· ${r.compEstimate}`:""} {r.travel?`· Travel: ${r.travel}`:""}</div>
              <div style={{color:T.tm,fontSize:13,lineHeight:1.6,fontFamily:fn}}>{r.fitReason}</div>
              {r.jobLink&&r.jobLink.startsWith("http")&&<a href={r.jobLink} target="_blank" rel="noopener noreferrer" style={{color:T.ac,fontSize:12,marginTop:8,display:"inline-block",fontFamily:fn}}>View Career Page →</a>}
            </div>
            <div style={{marginLeft:14,flexShrink:0}}>
              {inPipe(r)?<Bg color={T.gn}>✓ In Pipeline</Bg>:<Bt sm onClick={()=>addPipe(r)}>+ Pipeline</Bt>}
            </div>
          </div>
        </Cd>)}
      </div>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOB HISTORY — persistent database of all discovered jobs
// ═══════════════════════════════════════════════════════════════════════════════
function Hist({hist:H,setHist:sH,svH,opps:O,setOpps:sO,svO}){
  const [f,sF]=useState("");
  const [fi,sFI]=useState("");
  const filtered=H.filter(j=>{
    if(f&&!`${j.co} ${j.ro} ${j.fr}`.toLowerCase().includes(f.toLowerCase()))return false;
    if(fi&&j.ind!==fi)return false;
    return true;
  });

  const addPipe=(j)=>{
    const opp={id:uid(),co:j.co,ro:j.ro,loc:j.loc,lt:j.lt,src:j.src,jl:j.jl,dd:j.dd,fs:j.fs,ce:j.ce,hm:"",rec:"",st:"Discovered",fud:"",notes:j.fr,tr:j.tr};
    sO([...O,opp]);svO([...O,opp]);
    const nh=H.map(h=>h.id===j.id?{...h,inPipeline:true}:h);sH(nh);svH(nh);
  };
  const markApplied=(j)=>{const nh=H.map(h=>h.id===j.id?{...h,applied:true}:h);sH(nh);svH(nh);};
  const inPipe=(j)=>O.some(o=>o.co===j.co&&o.ro===j.ro);

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h2 style={{margin:0,fontFamily:fn,fontSize:26,fontWeight:700,color:T.tx}}>Job History</h2>
        <p style={{margin:"4px 0 0",color:T.td,fontSize:12,fontFamily:fn}}>{H.length} jobs discovered across all sessions</p></div>
      {H.length>0&&<Bt v="s" onClick={()=>emailDigest(H.sort((a,b)=>(b.fs||0)-(a.fs||0)))} style={{color:T.or,borderColor:T.or+"40"}}>✉ Email Top 15</Bt>}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <Ip value={f} onChange={sF} placeholder="Search..." style={{maxWidth:260}}/>
      <Sl value={fi} onChange={sFI} options={INDS} placeholder="All industries" style={{maxWidth:200}}/>
      {(f||fi)&&<Bt v="g" sm onClick={()=>{sF("");sFI("");}}>Clear</Bt>}
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:12}}>
        <thead><tr>{["Company","Role","Type","Score","Comp","Travel","Link","Status","Actions"].map(h=><th key={h} style={{textAlign:"left",padding:"10px",color:T.td,fontSize:10,textTransform:"uppercase",letterSpacing:1.5,borderBottom:`1px solid ${T.bd}`,fontFamily:fn}}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(j=><tr key={j.id} style={{borderBottom:`1px solid ${T.bd}22`}}>
          <td style={{padding:"12px 10px",color:T.tx,fontWeight:600,fontFamily:fn}}>{j.co}</td>
          <td style={{padding:"12px 10px",color:T.tm}}>{j.ro}</td>
          <td style={{padding:"12px 10px"}}>{j.lt&&<Bg color={j.lt==="Remote"?T.gn:/Denver/i.test(j.lt)?T.pu:T.td}>{j.lt}</Bg>}</td>
          <td style={{padding:"12px 10px",color:j.fs>=35?T.gn:j.fs>=25?T.ac:T.tm,fontWeight:600,fontFamily:mn}}>{j.fs?`${j.fs}/50`:"—"}</td>
          <td style={{padding:"12px 10px",color:T.tm,fontFamily:mn}}>{j.ce||"—"}</td>
          <td style={{padding:"12px 10px",color:T.td}}>{j.tr||"—"}</td>
          <td style={{padding:"12px 10px"}}>{j.jl&&<a href={j.jl} target="_blank" rel="noopener noreferrer" style={{color:T.ac,fontSize:11}}>→</a>}</td>
          <td style={{padding:"12px 10px"}}><div style={{display:"flex",gap:4}}>{j.applied&&<Bg color={T.gn}>Applied</Bg>}{j.inPipeline&&<Bg color={T.ab}>Pipeline</Bg>}</div></td>
          <td style={{padding:"12px 10px"}}><div style={{display:"flex",gap:4}}>
            {!inPipe(j)&&<Bt sm v="s" onClick={()=>addPipe(j)}>+ Pipe</Bt>}
            {!j.applied&&<Bt sm v="g" onClick={()=>markApplied(j)}>Applied</Bt>}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:T.td,fontFamily:fn}}>No jobs found. Run Discovery first.</div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERIC AGENT TAB — reusable for Score, Resume, Intel, Outreach, Prep, Comp, Follow-up
// ═══════════════════════════════════════════════════════════════════════════════
function AgentTab({title,desc,inputLabel,inputPH,btnLabel,btnIcon,agentKey,mem,log,opps,setOpps,svO,renderResult}){
  const [inp,sI]=useState("");const [ld2,sL]=useState(false);const [res,sR]=useState(null);const [err,sE]=useState(null);const [raw,sRaw]=useState(null);
  const [selOpp,sSO]=useState("");
  const [saved,sSaved]=useState(false);
  const actO=(opps||[]).filter(o=>!["Closed Lost","Withdrawn","Accepted"].includes(o.st));

  // Check if selected opp already has cached result for this agent
  const selData=selOpp?actO.find(o=>o.id===selOpp):null;
  const cached=selData?.agentData?.[agentKey];

  const run=async()=>{
    if(!inp.trim()&&!selOpp)return;
    sL(true);sE(null);sR(null);sRaw(null);sSaved(false);
    const opp=actO.find(o=>o.id===selOpp);
    const context=opp?`Company: ${opp.co}\nRole: ${opp.ro}\nLocation: ${opp.loc||opp.lt||""}\nComp: ${opp.ce||""}\nNotes: ${opp.notes||""}\n${inp?`Additional context: ${inp}`:""}`:inp;
    try{
      const p=AP(mem,log);
      const txt=await ai(p[agentKey],context);
      sRaw(txt);const parsed=pj(txt);
      if(parsed){
        sR(parsed);
        // Auto-save to pipeline opportunity if one was selected
        if(selOpp&&setOpps&&svO){
          const updated=(opps||[]).map(o=>{
            if(o.id!==selOpp)return o;
            const ad={...(o.agentData||{}), [agentKey]:{result:parsed,date:tdy()}};
            return {...o,agentData:ad};
          });
          setOpps(updated);svO(updated);sSaved(true);
        }
      }else sE("Could not parse response.");
    }catch(e){sE(e.message);}
    sL(false);
  };

  // Load cached result when selecting an opp that has one
  useEffect(()=>{if(cached&&!res){sR(cached.result);sSaved(true);}else{sR(null);sSaved(false);}},
    // eslint-disable-next-line
    [selOpp]);

  return <div>
    <h2 style={{margin:"0 0 8px",fontFamily:fn,fontSize:26,fontWeight:700,color:T.tx}}>{title}</h2>
    <p style={{margin:"0 0 20px",color:T.td,fontSize:13,fontFamily:fn}}>{desc}</p>
    <Cd style={{marginBottom:20}}>
      {actO.length>0&&<Fr label="Select from pipeline (optional)">
        <select value={selOpp} onChange={e=>{sSO(e.target.value);sR(null);sSaved(false);}} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${T.bd}`,background:T.sf,color:T.tx,fontFamily:mn,fontSize:12,width:"100%",boxSizing:"border-box",outline:"none",appearance:"none"}}>
          <option value="">— Select opportunity —</option>
          {actO.map(o=><option key={o.id} value={o.id}>{o.co} — {o.ro}{o.agentData?.[agentKey]?" ✓":""}</option>)}
        </select>
        {selOpp&&selData&&<div style={{marginTop:6,fontSize:12,color:T.tm,fontFamily:fn}}>{selData.co} — {selData.ro} · {selData.lt||""} · {selData.ce||""}
          {cached&&<Bg color={T.gn} style={{marginLeft:8}}>Cached from {cached.date}</Bg>}
        </div>}
      </Fr>}
      <Fr label={inputLabel}><Ta value={inp} onChange={sI} rows={agentKey==="score"||agentKey==="resume"?8:4} placeholder={inputPH}/></Fr>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <Bt onClick={run} disabled={ld2||(!inp.trim()&&!selOpp)}>{ld2?"Working...":btnIcon+" "+btnLabel}</Bt>
        {cached&&<Bt v="s" sm onClick={()=>{sR(cached.result);sSaved(true);}}>Load Cached</Bt>}
        {saved&&<Bg color={T.gn}>✓ Saved to pipeline</Bg>}
      </div>
    </Cd>
    {ld2&&<Ld msg={`Running ${title} agent`}/>}
    <Err err={err} raw={raw}/>
    {res&&renderResult(res)}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════
function ScoreResult({r}){
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <Cd glow={r.totalScore>=35?T.gn:r.totalScore>=25?T.ac:T.or}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h4 style={{margin:0,color:T.ac,fontSize:12,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Fit Score</h4>
        <div style={{fontSize:36,fontWeight:700,fontFamily:fn,color:r.totalScore>=35?T.gn:r.totalScore>=25?T.ac:T.rd}}>{r.totalScore}<span style={{fontSize:18,color:T.td}}>/50</span></div></div>
      {r.scores&&<>{["seniority","complexity","compensation","trajectory","transfer"].map(k=>r.scores[k]!==undefined&&<Sb key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} score={r.scores[k]}/>)}</>}
      <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:(r.rec?.includes("Apply")?T.gn:r.rec?.includes("Research")?T.ac:T.rd)+"15",border:`1px solid ${r.rec?.includes("Apply")?T.gn:r.rec?.includes("Research")?T.ac:T.rd}30`}}>
        <div style={{fontSize:14,fontWeight:700,color:r.rec?.includes("Apply")?T.gn:r.rec?.includes("Research")?T.ac:T.rd,fontFamily:fn}}>{r.rec}</div></div>
      {r.ats&&<div style={{marginTop:8,fontSize:12,color:T.td,fontFamily:mn}}>ATS Match: <span style={{color:T.ac,fontWeight:700}}>{r.ats}</span></div>}
    </Cd>
    <Cd>
      <h4 style={{margin:"0 0 10px",color:T.gn,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Why It Fits</h4>
      {r.reasons?.map((x,i)=><div key={i} style={{color:T.tx,fontSize:13,padding:"5px 0 5px 12px",borderLeft:`3px solid ${T.gn}`,marginBottom:5,fontFamily:fn}}>{x}</div>)}
      <h4 style={{margin:"16px 0 10px",color:T.rd,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Risks</h4>
      {r.risks?.map((x,i)=><div key={i} style={{color:T.tm,fontSize:13,padding:"5px 0 5px 12px",borderLeft:`3px solid ${T.rd}`,marginBottom:5,fontFamily:fn}}>{x}</div>)}
      <h4 style={{margin:"16px 0 10px",color:T.ac,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Positioning</h4>
      <div style={{color:T.tx,fontSize:13,lineHeight:1.6,fontFamily:fn}}>{r.positioning}</div>
      {r.keywords?.length>0&&<><h4 style={{margin:"16px 0 8px",color:T.pu,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Keywords</h4>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{r.keywords.map((k,i)=><Bg key={i} color={T.pu}>{k}</Bg>)}</div></>}
    </Cd></div>;
}

function ResumeResult({r}){
  return <div style={{display:"grid",gap:16}}>
    <Cd glow={T.ac}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <h4 style={{margin:0,color:T.ac,fontSize:12,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Tailored Summary</h4><CopyBtn text={r.summary}/></div>
      <div style={{color:T.tx,fontSize:14,lineHeight:1.8,background:T.sf,padding:16,borderRadius:12,border:`1px solid ${T.bd}`,fontFamily:fn}}>{r.summary}</div>
      {r.ats&&<div style={{marginTop:10,fontSize:12,color:T.td,fontFamily:mn}}>ATS: <span style={{color:T.ac,fontWeight:700}}>{r.ats}</span></div>}
    </Cd>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Cd><h4 style={{margin:"0 0 10px",color:T.pu,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Keywords</h4>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{r.keywords?.map((k,i)=><Bg key={i} color={T.pu}>{k}</Bg>)}</div></Cd>
      <Cd><h4 style={{margin:"0 0 10px",color:T.gn,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Skills</h4>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{r.skills?.map((k,i)=><Bg key={i} color={T.gn}>{k}</Bg>)}</div></Cd>
    </div>
    {r.bullets?.length>0&&<Cd>{r.bullets.map((b,i)=><div key={i} style={{marginBottom:16,padding:14,background:T.sf,borderRadius:12,border:`1px solid ${T.bd}`}}>
      {b.before&&<div style={{fontSize:12,color:T.rd,marginBottom:6,fontFamily:fn}}><span style={{textTransform:"uppercase",fontSize:10,marginRight:8}}>Before:</span>{b.before}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{fontSize:13,color:T.gn,flex:1,fontFamily:fn}}><span style={{textTransform:"uppercase",fontSize:10,marginRight:8}}>After:</span>{b.after}</div><CopyBtn text={b.after}/></div>
      {b.why&&<div style={{fontSize:11,color:T.td,marginTop:4,fontStyle:"italic",fontFamily:fn}}>{b.why}</div>}</div>)}</Cd>}
    {r.gaps?.length>0&&<Cd style={{border:`1px solid ${T.or}33`}}><h4 style={{margin:"0 0 10px",color:T.or,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Gaps</h4>
      {r.gaps.map((g,i)=><div key={i} style={{color:T.tm,fontSize:13,padding:"5px 0 5px 12px",borderLeft:`3px solid ${T.or}`,marginBottom:5,fontFamily:fn}}>{g}</div>)}</Cd>}
    {r.advice&&<Cd><h4 style={{margin:"0 0 8px",color:T.ac,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Advice</h4><div style={{color:T.tx,fontSize:14,lineHeight:1.7,fontFamily:fn}}>{r.advice}</div></Cd>}
  </div>;
}

function GenResult({r,sections}){
  return <div style={{display:"grid",gap:14}}>{sections.map(({key,label,color,copy})=>{
    const val=r[key];if(!val)return null;
    if(Array.isArray(val))return <Cd key={key}><h4 style={{margin:"0 0 10px",color:color||T.ac,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>{label}</h4>
      {val.map((v,i)=>{
        if(typeof v==="object"&&v.question)return <div key={i} style={{marginBottom:12,padding:12,background:T.sf,borderRadius:10}}>
          <div style={{color:T.tx,fontSize:13,fontWeight:600,fontFamily:fn,marginBottom:6}}>{v.question||v.scenario}</div>
          <div style={{color:T.tm,fontSize:13,lineHeight:1.6,fontFamily:fn}}>{v.answer||v.approach}</div></div>;
        if(typeof v==="object"&&v.scenario)return <div key={i} style={{marginBottom:12,padding:12,background:T.sf,borderRadius:10}}>
          <div style={{color:T.tx,fontSize:13,fontWeight:600,fontFamily:fn,marginBottom:6}}>{v.scenario}</div>
          <div style={{color:T.tm,fontSize:13,lineHeight:1.6,fontFamily:fn}}>{v.approach}</div></div>;
        return <div key={i} style={{color:T.tx,fontSize:13,padding:"5px 0 5px 12px",borderLeft:`3px solid ${color||T.ac}`,marginBottom:5,fontFamily:fn}}>{v}</div>;
      })}</Cd>;
    return <Cd key={key}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <h4 style={{margin:0,color:color||T.ac,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>{label}</h4>
      {copy&&<CopyBtn text={val}/>}</div>
      <div style={{color:T.tx,fontSize:14,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:fn}}>{typeof val==="object"?JSON.stringify(val,null,2):val}</div></Cd>;
  })}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME TAB — Dual mode: Optimize (tweak) or Rewrite (full resume)
// ═══════════════════════════════════════════════════════════════════════════════
function ResumeTab({mem,log,opps,setOpps,svO}){
  const [mode,sMode]=useState("optimize"); // "optimize" or "rewrite"
  const [jd,sJd]=useState("");
  const [ld2,sL]=useState(false);
  const [res,sR]=useState(null);
  const [err,sE]=useState(null);
  const [raw,sRaw]=useState(null);
  const [saved,sSaved]=useState(false);
  const [selOpp,sSO]=useState("");
  const actO=(opps||[]).filter(o=>!["Closed Lost","Withdrawn","Accepted"].includes(o.st));
  const selData=selOpp?actO.find(o=>o.id===selOpp):null;
  const cacheKey=mode==="optimize"?"resume":"resumeWrite";
  const cached=selData?.agentData?.[cacheKey];

  const run=async()=>{
    if(!jd.trim()&&!selOpp)return;
    sL(true);sE(null);sR(null);sRaw(null);sSaved(false);
    const opp=actO.find(o=>o.id===selOpp);
    const context=opp?`Company: ${opp.co}\nRole: ${opp.ro}\nLocation: ${opp.loc||opp.lt||""}\nComp: ${opp.ce||""}\n${jd?`Job Description:\n${jd}`:""}`:jd;
    try{
      const p=AP(mem,log);
      const txt=await ai(p[cacheKey],context);
      sRaw(txt);const parsed=pj(txt);
      if(parsed){
        sR(parsed);
        if(selOpp&&setOpps&&svO){
          const updated=(opps||[]).map(o=>{
            if(o.id!==selOpp)return o;
            return {...o,agentData:{...(o.agentData||{}),[cacheKey]:{result:parsed,date:tdy()}}};
          });
          setOpps(updated);svO(updated);sSaved(true);
        }
      }else sE("Could not parse response.");
    }catch(e){sE(e.message);}
    sL(false);
  };

  useEffect(()=>{if(cached&&!res){sR(cached.result);sSaved(true);}else{sR(null);sSaved(false);}},
    // eslint-disable-next-line
    [selOpp,mode]);

  const copyFullResume=(r)=>{
    let txt=`${r.name||"Colin Stewart"}\n${r.title||""}\n\n`;
    txt+=`PROFESSIONAL SUMMARY\n${r.summary}\n\n`;
    if(r.competencies?.length)txt+=`CORE COMPETENCIES\n${r.competencies.join(" · ")}\n\n`;
    txt+=`PROFESSIONAL EXPERIENCE\n`;
    r.experience?.forEach(ex=>{
      txt+=`\n${ex.title} | ${ex.company} | ${ex.period}\n`;
      ex.bullets?.forEach(b=>{txt+=`• ${b}\n`;});
    });
    if(r.education?.length){txt+=`\nEDUCATION\n`;r.education.forEach(ed=>{txt+=`${ed.degree} — ${ed.school} (${ed.year})\n`;});}
    navigator.clipboard.writeText(txt);
  };

  return <div>
    <h2 style={{margin:"0 0 8px",fontFamily:fn,fontSize:26,fontWeight:700,color:T.tx}}>Resume Builder</h2>
    <p style={{margin:"0 0 20px",color:T.td,fontSize:13,fontFamily:fn}}>Optimize your existing resume or generate a complete rewrite tailored for a specific role.</p>

    {/* Mode Toggle */}
    <div style={{display:"flex",gap:4,marginBottom:20,padding:4,background:T.sf,borderRadius:12,border:`1px solid ${T.bd}`,width:"fit-content"}}>
      {[{id:"optimize",label:"⚡ Optimize",desc:"Tweak keywords & bullets"},{id:"rewrite",label:"📄 Full Rewrite",desc:"Complete tailored resume"}].map(m=>
        <div key={m.id} onClick={()=>{sMode(m.id);sR(null);sSaved(false);}} style={{padding:"10px 20px",borderRadius:10,cursor:"pointer",background:mode===m.id?T.ac+"20":"transparent",border:mode===m.id?`1px solid ${T.ac}40`:"1px solid transparent",transition:"all .2s"}}>
          <div style={{fontSize:13,fontWeight:600,color:mode===m.id?T.ac:T.tm,fontFamily:fn}}>{m.label}</div>
          <div style={{fontSize:10,color:T.td,fontFamily:fn}}>{m.desc}</div>
        </div>
      )}
    </div>

    <Cd style={{marginBottom:20}}>
      {actO.length>0&&<Fr label="Select from pipeline (optional)">
        <select value={selOpp} onChange={e=>{sSO(e.target.value);sR(null);sSaved(false);}} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${T.bd}`,background:T.sf,color:T.tx,fontFamily:mn,fontSize:12,width:"100%",boxSizing:"border-box",outline:"none",appearance:"none"}}>
          <option value="">— Select opportunity —</option>
          {actO.map(o=><option key={o.id} value={o.id}>{o.co} — {o.ro}{o.agentData?.[cacheKey]?" ✓":""}</option>)}
        </select>
        {selOpp&&selData&&<div style={{marginTop:6,fontSize:12,color:T.tm,fontFamily:fn}}>{selData.co} — {selData.ro}
          {cached&&<span style={{marginLeft:8}}><Bg color={T.gn}>Cached {cached.date}</Bg></span>}
        </div>}
      </Fr>}
      <Fr label="Job Description"><Ta value={jd} onChange={sJd} rows={8} placeholder="Paste the full job description here..."/></Fr>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <Bt onClick={run} disabled={ld2||(!jd.trim()&&!selOpp)}>{ld2?"Working...":`◫ ${mode==="optimize"?"Optimize Resume":"Write Full Resume"}`}</Bt>
        {cached&&<Bt v="s" sm onClick={()=>{sR(cached.result);sSaved(true);}}>Load Cached</Bt>}
        {saved&&<Bg color={T.gn}>✓ Saved to pipeline</Bg>}
      </div>
    </Cd>

    {ld2&&<Ld msg={mode==="optimize"?"Optimizing keywords and bullets":"Writing your tailored resume"}/>}
    <Err err={err} raw={raw}/>

    {/* OPTIMIZE MODE RESULTS */}
    {res&&mode==="optimize"&&<ResumeResult r={res}/>}

    {/* REWRITE MODE RESULTS */}
    {res&&mode==="rewrite"&&<div style={{display:"grid",gap:16}}>
      {/* Full Resume Preview */}
      <Cd glow={T.ac}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h4 style={{margin:0,color:T.ac,fontSize:12,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Tailored Resume</h4>
          <div style={{display:"flex",gap:8}}>
            <CopyBtn text={(() => { let t=`${res.name||""}\n${res.title||""}\n\nPROFESSIONAL SUMMARY\n${res.summary||""}\n\nCORE COMPETENCIES\n${(res.competencies||[]).join(" · ")}\n\nPROFESSIONAL EXPERIENCE\n`;(res.experience||[]).forEach(ex=>{t+=`\n${ex.title} | ${ex.company} | ${ex.period}\n`;(ex.bullets||[]).forEach(b=>{t+=`• ${b}\n`;});});(res.education||[]).forEach(ed=>{t+=`\nEDUCATION\n${ed.degree} — ${ed.school} (${ed.year})\n`;});return t; })()}/>
          </div>
        </div>

        {res.ats&&<div style={{marginBottom:16,fontSize:12,color:T.td,fontFamily:mn}}>ATS Match: <span style={{color:T.ac,fontWeight:700}}>{res.ats}</span></div>}

        {/* Resume Content */}
        <div style={{background:T.sf,borderRadius:14,padding:24,border:`1px solid ${T.bd}`}}>
          {/* Header */}
          <div style={{textAlign:"center",marginBottom:20,paddingBottom:16,borderBottom:`2px solid ${T.ac}40`}}>
            <div style={{fontSize:24,fontWeight:700,color:T.tx,fontFamily:fn,letterSpacing:1}}>{res.name||"Colin Stewart"}</div>
            <div style={{fontSize:14,color:T.ac,fontFamily:fn,marginTop:4}}>{res.title||"Enterprise Sales Leader"}</div>
          </div>

          {/* Summary */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:T.ac,textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8,fontFamily:fn}}>Professional Summary</div>
            <div style={{color:T.tx,fontSize:13,lineHeight:1.8,fontFamily:fn}}>{res.summary}</div>
          </div>

          {/* Competencies */}
          {res.competencies?.length>0&&<div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:T.ac,textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8,fontFamily:fn}}>Core Competencies</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {res.competencies.map((c,i)=><span key={i} style={{padding:"4px 12px",borderRadius:6,background:T.cd2,color:T.tx,fontSize:12,fontFamily:fn,border:`1px solid ${T.bd}`}}>{c}</span>)}
            </div>
          </div>}

          {/* Experience */}
          {res.experience?.length>0&&<div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:T.ac,textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:12,fontFamily:fn}}>Professional Experience</div>
            {res.experience.map((ex,i)=><div key={i} style={{marginBottom:20,paddingBottom:16,borderBottom:i<res.experience.length-1?`1px solid ${T.bd}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.tx,fontFamily:fn}}>{ex.title}</div>
                  <div style={{fontSize:13,color:T.tm,fontFamily:fn}}>{ex.company}</div>
                </div>
                <div style={{fontSize:12,color:T.td,fontFamily:mn,flexShrink:0}}>{ex.period}</div>
              </div>
              {ex.bullets?.map((b,j)=><div key={j} style={{display:"flex",gap:8,marginBottom:6,paddingLeft:4}}>
                <span style={{color:T.ac,fontSize:10,marginTop:5,flexShrink:0}}>●</span>
                <span style={{color:T.tx,fontSize:13,lineHeight:1.6,fontFamily:fn}}>{b}</span>
              </div>)}
            </div>)}
          </div>}

          {/* Education */}
          {res.education?.length>0&&<div>
            <div style={{fontSize:11,color:T.ac,textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8,fontFamily:fn}}>Education</div>
            {res.education.map((ed,i)=><div key={i} style={{color:T.tx,fontSize:13,fontFamily:fn}}>{ed.degree} — {ed.school} ({ed.year})</div>)}
          </div>}
        </div>
      </Cd>

      {/* What Changed */}
      {res.keyChanges&&<Cd>
        <h4 style={{margin:"0 0 8px",color:T.or,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>What Was Tailored</h4>
        <div style={{color:T.tx,fontSize:14,lineHeight:1.7,fontFamily:fn}}>{res.keyChanges}</div>
      </Cd>}
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════
function Pipe({opps:O,setOpps:sO,svO}){
  const [md,sMd]=useState(false);const [ed,sEd]=useState(null);const [fm,sFm]=useState({});
  const [f,sF]=useState("");const [sf,sSf]=useState("");
  const bl={co:"",ro:"",loc:"",lt:"",src:"",jl:"",dd:tdy(),fs:"",ce:"",hm:"",rec:"",st:"Discovered",fud:"",notes:"",tr:""};
  const opN=()=>{sFm({...bl});sEd(null);sMd(true);};
  const opE=(o)=>{sFm({...o});sEd(o.id);sMd(true);};
  const doS=()=>{if(!fm.co)return;const n=ed?O.map(o=>o.id===ed?{...fm,id:ed}:o):[...O,{...fm,id:uid()}];sO(n);svO(n);sMd(false);};
  const doD=(id)=>{const n=O.filter(o=>o.id!==id);sO(n);svO(n);sMd(false);};
  const markApplied=(id)=>{const n=O.map(o=>o.id===id?{...o,st:"Applied",appliedDate:tdy()}:o);sO(n);svO(n);};
  const flt=O.filter(o=>{if(f&&!`${o.co} ${o.ro} ${o.notes}`.toLowerCase().includes(f.toLowerCase()))return false;if(sf&&o.st!==sf)return false;return true;}).sort((a,b)=>(b.dd||"").localeCompare(a.dd||""));

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h2 style={{margin:0,fontFamily:fn,fontSize:26,fontWeight:700,color:T.tx}}>Pipeline</h2><Bt onClick={opN}>+ Add</Bt></div>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <Ip value={f} onChange={sF} placeholder="Search..." style={{maxWidth:260}}/>
      <Sl value={sf} onChange={sSf} options={STATS} placeholder="All" style={{maxWidth:200}}/>
      {(f||sf)&&<Bt v="g" sm onClick={()=>{sF("");sSf("");}}>Clear</Bt>}
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:12}}>
        <thead><tr>{["Company","Role","Type","Score","Rank","Comp","Status","Follow-up","Link",""].map(h=><th key={h} style={{textAlign:"left",padding:"10px",color:T.td,fontSize:10,textTransform:"uppercase",letterSpacing:1.5,borderBottom:`1px solid ${T.bd}`,fontFamily:fn}}>{h}</th>)}</tr></thead>
        <tbody>{flt.map(o=><tr key={o.id} style={{cursor:"pointer",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=T.cd2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px",color:T.tx,fontWeight:600,fontFamily:fn}}>
            {o.co}
            {o.agentData&&<div style={{display:"flex",gap:3,marginTop:3}}>
              {o.agentData.score&&<span style={{width:6,height:6,borderRadius:3,background:T.gn,display:"inline-block"}} title="Scored"/>}
              {o.agentData.resume&&<span style={{width:6,height:6,borderRadius:3,background:T.pu,display:"inline-block"}} title="Resume optimized"/>}
              {o.agentData.resumeWrite&&<span style={{width:6,height:6,borderRadius:3,background:T.pk,display:"inline-block"}} title="Full resume written"/>}
              {o.agentData.intel&&<span style={{width:6,height:6,borderRadius:3,background:T.ab,display:"inline-block"}} title="Intel gathered"/>}
              {o.agentData.out&&<span style={{width:6,height:6,borderRadius:3,background:T.or,display:"inline-block"}} title="Outreach drafted"/>}
              {o.agentData.prep&&<span style={{width:6,height:6,borderRadius:3,background:T.pk,display:"inline-block"}} title="Interview prepped"/>}
            </div>}
          </td>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px",color:T.tm}}>{o.ro}</td>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px"}}>{o.lt&&<Bg color={o.lt==="Remote"?T.gn:/Denver/i.test(o.lt)?T.pu:T.td}>{o.lt}</Bg>}</td>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px",color:o.fs>=35?T.gn:o.fs>=25?T.ac:T.tm,fontWeight:600,fontFamily:mn}}>{o.fs?`${o.fs}/50`:"—"}</td>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px",color:T.yw,fontSize:13}}>{o.ranking||"—"}</td>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px",color:T.tm,fontFamily:mn}}>{o.ce||"—"}</td>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px"}}><Bg color={STAT_C[o.st]}>{o.st}</Bg>{o.appliedDate&&<div style={{fontSize:9,color:T.td,marginTop:2,fontFamily:mn}}>{o.appliedDate}</div>}</td>
          <td onClick={()=>opE(o)} style={{padding:"12px 10px",color:T.td,fontSize:11,fontFamily:mn}}>{fmt(o.fud)}</td>
          <td style={{padding:"12px 10px"}}>{o.jl&&<a href={o.jl} target="_blank" rel="noopener noreferrer" style={{color:T.ac,fontSize:11,fontWeight:600,textDecoration:"none",padding:"4px 10px",background:T.ac+"15",borderRadius:6,border:`1px solid ${T.ac}30`}} onClick={e=>e.stopPropagation()}>View Job →</a>}</td>
          <td style={{padding:"12px 10px"}}>
            {!["Applied","Outreach Sent","Phone Screen","Interview 1","Interview 2","Interview 3","Final Round","Offer","Negotiating","Accepted","Closed Lost","Withdrawn"].includes(o.st)
              ?<Bt sm v="s" onClick={e=>{e.stopPropagation();markApplied(o.id);}} style={{background:T.gn+"15",color:T.gn,border:`1px solid ${T.gn}30`,fontSize:10}}>✓ Applied</Bt>
              :null}
          </td>
        </tr>)}</tbody></table>
      {flt.length===0&&<div style={{textAlign:"center",padding:40,color:T.td,fontFamily:fn}}>No opportunities. Run Discovery or add manually.</div>}
    </div>
    <Md open={md} onClose={()=>sMd(false)} title={ed?`${fm.co} — ${fm.ro}`:"Add Opportunity"} width={700}>
      {ed&&fm.jl&&<a href={fm.jl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",marginBottom:16,borderRadius:12,background:T.ac+"12",border:`1px solid ${T.ac}30`,color:T.ac,fontSize:13,fontWeight:600,fontFamily:fn,textDecoration:"none",transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background=T.ac+"25"} onMouseLeave={e=>e.currentTarget.style.background=T.ac+"12"}>
        <span style={{fontSize:18}}>↗</span>
        <span>Open Job Posting / Career Page</span>
        <span style={{flex:1}}/>
        <span style={{fontSize:11,color:T.tm,fontFamily:mn,maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fm.jl}</span>
      </a>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <Fr label="Company *"><Ip value={fm.co||""} onChange={v=>sFm({...fm,co:v})}/></Fr>
        <Fr label="Role"><Ip value={fm.ro||""} onChange={v=>sFm({...fm,ro:v})}/></Fr>
        <Fr label="Location"><Ip value={fm.loc||""} onChange={v=>sFm({...fm,loc:v})}/></Fr>
        <Fr label="Type"><Sl value={fm.lt||""} onChange={v=>sFm({...fm,lt:v})} options={LOCS} placeholder="Select..."/></Fr>
        <Fr label="Source"><Ip value={fm.src||""} onChange={v=>sFm({...fm,src:v})}/></Fr>
        <Fr label="Job Link"><Ip value={fm.jl||""} onChange={v=>sFm({...fm,jl:v})}/></Fr>
        <Fr label="Date"><Ip type="date" value={fm.dd||""} onChange={v=>sFm({...fm,dd:v})}/></Fr>
        <Fr label="Score (0-50)"><Ip type="number" value={fm.fs||""} onChange={v=>sFm({...fm,fs:v})}/></Fr>
        <Fr label="Comp"><Ip value={fm.ce||""} onChange={v=>sFm({...fm,ce:v})}/></Fr>
        <Fr label="Status"><Sl value={fm.st||"Discovered"} onChange={v=>sFm({...fm,st:v})} options={STATS}/></Fr>
        <Fr label="Hiring Manager"><Ip value={fm.hm||""} onChange={v=>sFm({...fm,hm:v})}/></Fr>
        <Fr label="Recruiter"><Ip value={fm.rec||""} onChange={v=>sFm({...fm,rec:v})}/></Fr>
        <Fr label="Follow-up"><Ip type="date" value={fm.fud||""} onChange={v=>sFm({...fm,fud:v})}/></Fr>
        <Fr label="Applied Date"><Ip type="date" value={fm.appliedDate||""} onChange={v=>sFm({...fm,appliedDate:v})}/></Fr>
        <Fr label="Travel"><Ip value={fm.tr||""} onChange={v=>sFm({...fm,tr:v})}/></Fr>
        <Fr label="My Ranking"><Sl value={fm.ranking||""} onChange={v=>sFm({...fm,ranking:v})} options={RANKINGS} placeholder="Rate this opportunity"/></Fr>
      </div>
      <Fr label="Interview Notes"><Ta value={fm.interviewNotes||""} onChange={v=>sFm({...fm,interviewNotes:v})} rows={2} placeholder="Notes from interviews, key contacts, impressions..."/></Fr>
      <Fr label="Notes"><Ta value={fm.notes||""} onChange={v=>sFm({...fm,notes:v})}/></Fr>

      {/* Show saved agent data */}
      {fm.agentData&&Object.keys(fm.agentData).length>0&&<div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${T.bd}`}}>
        <h4 style={{margin:"0 0 12px",color:T.ac,fontSize:11,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Saved Agent Results</h4>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {fm.agentData.score&&<Bg color={T.gn}>Score: {fm.agentData.score.result?.totalScore}/50 ({fm.agentData.score.date})</Bg>}
          {fm.agentData.resume&&<Bg color={T.pu}>Resume optimized ({fm.agentData.resume.date})</Bg>}
          {fm.agentData.resumeWrite&&<Bg color={T.pk}>Full resume written ({fm.agentData.resumeWrite.date})</Bg>}
          {fm.agentData.intel&&<Bg color={T.ab}>Intel gathered ({fm.agentData.intel.date})</Bg>}
          {fm.agentData.out&&<Bg color={T.or}>Outreach drafted ({fm.agentData.out.date})</Bg>}
          {fm.agentData.prep&&<Bg color={T.pk}>Interview prep ({fm.agentData.prep.date})</Bg>}
        </div>
      </div>}

      <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
        <div>{ed&&<Bt v="d" onClick={()=>doD(ed)}>Delete</Bt>}</div>
        <div style={{display:"flex",gap:8}}><Bt v="s" onClick={()=>sMd(false)}>Cancel</Bt><Bt onClick={doS}>{ed?"Update":"Add"}</Bt></div>
      </div>
    </Md>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY
// ═══════════════════════════════════════════════════════════════════════════════
function Mem({mem:M,setMem:sM,svM,log:LG,setLog:sL,svL}){
  const [ek,sEk]=useState(null);const [ev,sEv]=useState("");const [nk,sNk]=useState("");const [nv,sNv]=useState("");const [nl,sNl]=useState("");
  return <div>
    <h2 style={{margin:"0 0 20px",fontFamily:fn,fontSize:26,fontWeight:700,color:T.tx}}>Memory & Learning</h2>
    <Cd style={{marginBottom:24}}>
      <h3 style={{margin:"0 0 14px",color:T.ac,fontSize:12,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Candidate Facts</h3>
      {Object.entries(M).map(([k,v])=><div key={k} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${T.bd}`}}>
        <div style={{width:150,flexShrink:0,fontSize:10,color:T.ac,textTransform:"uppercase",letterSpacing:.5,paddingTop:4,fontFamily:fn}}>{k.replace(/_/g," ")}</div>
        <div style={{flex:1}}>{ek===k?<div style={{display:"flex",gap:6}}><Ta value={ev} onChange={sEv} rows={2}/><div style={{display:"flex",flexDirection:"column",gap:4}}><Bt sm onClick={()=>{const n={...M,[ek]:ev};sM(n);svM(n);sEk(null);}}>Save</Bt><Bt sm v="g" onClick={()=>sEk(null)}>✕</Bt></div></div>
          :<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><span style={{color:T.tm,fontSize:13,lineHeight:1.6,fontFamily:fn}}>{v}</span>
            <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}><Bt v="g" sm onClick={()=>{sEk(k);sEv(v);}}>Edit</Bt><Bt v="g" sm onClick={()=>{const n={...M};delete n[k];sM(n);svM(n);}} style={{color:T.rd}}>✕</Bt></div></div>}
        </div></div>)}
      <div style={{marginTop:14,display:"flex",gap:8,alignItems:"flex-end"}}>
        <div style={{width:150}}><Fr label="Key"><Ip value={nk} onChange={sNk} placeholder="e.g. target_title"/></Fr></div>
        <div style={{flex:1}}><Fr label="Value"><Ip value={nv} onChange={sNv}/></Fr></div>
        <Bt sm onClick={()=>{if(!nk.trim())return;const n={...M,[nk.trim().toLowerCase().replace(/\s+/g,"_")]:nv};sM(n);svM(n);sNk("");sNv("");}} style={{marginBottom:14}}>Add</Bt>
      </div>
    </Cd>
    <Cd>
      <h3 style={{margin:"0 0 14px",color:T.ac,fontSize:12,textTransform:"uppercase",letterSpacing:1.5,fontFamily:fn}}>Learning Log</h3>
      <div style={{display:"flex",gap:8,marginBottom:14}}><Ta value={nl} onChange={sNl} rows={2} placeholder="Record patterns, wins, insights..."/><Bt sm onClick={()=>{if(!nl.trim())return;const n=[...LG,{d:tdy(),t:nl.trim(),id:uid()}];sL(n);svL(n);sNl("");}} style={{alignSelf:"flex-end"}}>Add</Bt></div>
      {LG.length===0?<p style={{color:T.td,fontSize:13,fontFamily:fn}}>No entries yet.</p>:[...LG].reverse().map(l=>
        <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.bd}`}}>
          <div><span style={{color:T.td,fontSize:10,marginRight:8,fontFamily:mn}}>{l.d}</span><span style={{color:T.tm,fontSize:13,fontFamily:fn}}>{l.t}</span></div>
          <Bt v="g" sm onClick={()=>{const n=LG.filter(x=>x.id!==l.id);sL(n);svL(n);}} style={{color:T.rd}}>✕</Bt></div>)}
    </Cd>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [tab,sTab]=useState("dash");
  const [init,sInit]=useState(true);
  const [O,sO]=useState([]); // pipeline opps
  const [H,sH]=useState([]); // discovery history
  const [M,sM]=useState(DEF_MEM);
  const [LG,sLG]=useState([]);

  useEffect(()=>{(async()=>{
    const [o,h,m,l]=await Promise.all([L(K.o,[]),L(K.h,[]),L(K.m,DEF_MEM),L(K.l,[])]);
    sO(o);sH(h);sM(m);sLG(l);sInit(false);
  })();},[]);

  const svO=d=>S(K.o,d),svH=d=>S(K.h,d),svM=d=>S(K.m,d),svL=d=>S(K.l,d);

  if(init)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,color:T.ac,fontFamily:fn,fontSize:18}}>
    <div style={{textAlign:"center"}}><div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${T.ac}`,borderTopColor:"transparent",animation:"sp .8s linear infinite",margin:"0 auto 16px"}}/>Loading...</div><style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style></div>;

  return <div style={{minHeight:"100vh",background:T.bg,color:T.tx,fontFamily:fn,fontSize:14}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:${T.sf}}::-webkit-scrollbar-thumb{background:${T.bd};border-radius:3px}
    *{box-sizing:border-box}::selection{background:${T.ac}30;color:${T.tx}}`}</style>

    <div style={{background:T.sf,borderBottom:`1px solid ${T.bd}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="38" height="38" rx="10" fill="#0a0e27"/>
          <rect x=".5" y=".5" width="37" height="37" rx="9.5" stroke="url(#lb)" strokeOpacity=".6"/>
          <defs><linearGradient id="lb" x1="0" y1="0" x2="38" y2="38"><stop stopColor="#00d4aa"/><stop offset="1" stopColor="#0099ff"/></linearGradient></defs>
          <circle cx="19" cy="15" r="3.5" fill="#00d4aa"/>
          <circle cx="11" cy="20" r="2.5" fill="#0099ff"/>
          <circle cx="27" cy="20" r="2.5" fill="#0099ff"/>
          <circle cx="14" cy="28" r="2" fill="#00d4aa" fillOpacity=".7"/>
          <circle cx="24" cy="28" r="2" fill="#00d4aa" fillOpacity=".7"/>
          <circle cx="19" cy="24" r="1.5" fill="#0099ff" fillOpacity=".5"/>
          <line x1="19" y1="15" x2="11" y2="20" stroke="#00d4aa" strokeWidth=".8" strokeOpacity=".5"/>
          <line x1="19" y1="15" x2="27" y2="20" stroke="#00d4aa" strokeWidth=".8" strokeOpacity=".5"/>
          <line x1="11" y1="20" x2="14" y2="28" stroke="#0099ff" strokeWidth=".8" strokeOpacity=".4"/>
          <line x1="27" y1="20" x2="24" y2="28" stroke="#0099ff" strokeWidth=".8" strokeOpacity=".4"/>
          <line x1="11" y1="20" x2="19" y2="24" stroke="#0099ff" strokeWidth=".6" strokeOpacity=".3"/>
          <line x1="27" y1="20" x2="19" y2="24" stroke="#0099ff" strokeWidth=".6" strokeOpacity=".3"/>
          <line x1="14" y1="28" x2="24" y2="28" stroke="#00d4aa" strokeWidth=".6" strokeOpacity=".3"/>
          <line x1="19" y1="24" x2="14" y2="28" stroke="#00d4aa" strokeWidth=".5" strokeOpacity=".25"/>
          <line x1="19" y1="24" x2="24" y2="28" stroke="#00d4aa" strokeWidth=".5" strokeOpacity=".25"/>
        </svg>
        <div><div style={{fontSize:17,fontWeight:700,color:T.tx,letterSpacing:.3}}>Colin AI</div><div style={{fontSize:10,color:T.td,letterSpacing:1.5,textTransform:"uppercase"}}>Job Intelligence</div></div></div>
      <div style={{fontSize:11,color:T.td,fontFamily:mn}}>{O.length} pipeline · {H.length} discovered</div>
    </div>

    <div style={{display:"flex",gap:2,padding:"0 24px",background:T.sf,borderBottom:`1px solid ${T.bd}`,overflowX:"auto"}}>
      {TABS.map(t=><div key={t.id} onClick={()=>sTab(t.id)} style={{padding:"12px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?T.ac:T.td,borderBottom:tab===t.id?`2px solid ${T.ac}`:"2px solid transparent",transition:"all .2s",whiteSpace:"nowrap",flexShrink:0}}>
        <span style={{marginRight:5,fontSize:13}}>{t.i}</span>{t.l}</div>)}
    </div>

    <div style={{padding:24,maxWidth:1240,margin:"0 auto"}}>
      {tab==="dash"&&<Dash opps={O} hist={H} setTab={sTab}/>}
      {tab==="disc"&&<Disc mem={M} log={LG} hist={H} setHist={sH} svH={svH} opps={O} setOpps={sO} svO={svO}/>}
      {tab==="hist"&&<Hist hist={H} setHist={sH} svH={svH} opps={O} setOpps={sO} svO={svO}/>}
      {tab==="score"&&<AgentTab title="Job Fit Scoring" desc="Paste a job description to score across 5 dimensions." inputLabel="Job Description" inputPH="Paste full JD..." btnLabel="Score" btnIcon="◎" agentKey="score" mem={M} log={LG} opps={O} setOpps={sO} svO={svO} renderResult={r=><ScoreResult r={r}/>}/>}
      {tab==="resume"&&<ResumeTab mem={M} log={LG} opps={O} setOpps={sO} svO={svO}/>}
      {tab==="intel"&&<AgentTab title="Company Intel" desc="Get deep intelligence on a target company — sales motion, ICP, leadership, culture, comp." inputLabel="Company and Role" inputPH="e.g. CrowdStrike — Regional Sales Director" btnLabel="Research" btnIcon="◈" agentKey="intel" mem={M} log={LG} opps={O} setOpps={sO} svO={svO} renderResult={r=><GenResult r={r} sections={[
        {key:"overview",label:"Overview",color:T.ac,copy:false},{key:"salesMotion",label:"Sales Motion",color:T.ab},
        {key:"icp",label:"ICP",color:T.pu},{key:"salesLeadership",label:"Sales Leadership",color:T.or},
        {key:"recentNews",label:"Recent News",color:T.yw},{key:"culture",label:"Culture",color:T.pk},
        {key:"whyFit",label:"Why You Fit",color:T.gn},{key:"risks",label:"Risks",color:T.rd},
        {key:"interviewFocus",label:"Interview Focus",color:T.ab},{key:"compRange",label:"Comp Range",color:T.ac,copy:true}
      ]}/>}/>}
      {tab==="out"&&<AgentTab title="Outreach Generator" desc="Generate recruiter, hiring manager, and LinkedIn messages." inputLabel="Company and Role Context" inputPH="e.g. VP Sales at Snowflake, remote..." btnLabel="Generate" btnIcon="↗" agentKey="out" mem={M} log={LG} opps={O} setOpps={sO} svO={svO} renderResult={r=><GenResult r={r} sections={[
        {key:"hm",label:"Likely Hiring Manager",color:T.ac},{key:"recruiterMsg",label:"Recruiter Message",color:T.ab,copy:true},
        {key:"hmMsg",label:"HM Message",color:T.or,copy:true},{key:"linkedIn",label:"LinkedIn Note",color:T.pu,copy:true},
        {key:"positioning",label:"Interview Positioning",color:T.gn,copy:true}
      ]}/>}/>}
      {tab==="prep"&&<AgentTab title="Interview Prep" desc="Get a complete interview prep package for a specific company and role." inputLabel="Company, Role, and Any Context" inputPH="e.g. CrowdStrike Regional Sales Director — 2nd round with VP Sales" btnLabel="Prepare" btnIcon="◉" agentKey="prep" mem={M} log={LG} opps={O} setOpps={sO} svO={svO} renderResult={r=><GenResult r={r} sections={[
        {key:"companyContext",label:"Company Context",color:T.ac},{key:"roleContext",label:"Role Context",color:T.ab},
        {key:"behavioral",label:"Behavioral Questions",color:T.gn},{key:"situational",label:"Situational Scenarios",color:T.or},
        {key:"questions",label:"Questions to Ask",color:T.pu},{key:"closingStatement",label:"Closing Statement",color:T.ac,copy:true}
      ]}/>}/>}
      {tab==="pipe"&&<Pipe opps={O} setOpps={sO} svO={svO}/>}
      {tab==="mem"&&<Mem mem={M} setMem={sM} svM={svM} log={LG} setLog={sLG} svL={svL}/>}
    </div>
  </div>;
}


