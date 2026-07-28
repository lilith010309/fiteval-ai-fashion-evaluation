"use client";

import { useMemo, useRef, useState } from "react";

type Page = "create" | "report" | "cases" | "dataset" | "models";
type Score = { name: string; value: number; reason: string; advice: string; confidence?: number };
type Evaluation = {
  taskId: string;
  model: string;
  scores: Score[];
  outfit: {
    title: string;
    summary: string;
    items: Array<{ name: string; detail: string }>;
    modelExplanation: string;
  };
  visualEvidence?: string[];
};
type BadCase = {
  id: string; score: number; type: string; scene: string; age: number;
  request: string; output: string; cause: string; solution: string; color: string;
};

const scores: Score[] = [
  { name: "场景匹配度", value: 86, reason: "西装外套与乐福鞋符合商务休闲场景，整体正式度控制得当。", advice: "可将手提包替换为结构感更强的通勤包，提升专业度。" },
  { name: "风格一致性", value: 92, reason: "极简、知性的风格表达完整，单品廓形和配饰语言统一。", advice: "维持低饱和配色，可加入一件金属配饰强化精致感。" },
  { name: "身材适配度", value: 74, reason: "高腰线有助于优化比例，但宽松西装对小个子用户略显压身高。", advice: "外套长度缩短 5–8cm，或选择微收腰版型以拉长下半身比例。" },
  { name: "色彩协调性", value: 89, reason: "燕麦色、炭灰与酒红形成稳定的主辅色层级，视觉协调。", advice: "鞋包色温可进一步统一，减少冷暖色之间的轻微跳跃。" },
  { name: "用户需求满足度", value: 83, reason: "满足通勤、显高与简约诉求，但对“轻松不拘谨”的表达略弱。", advice: "将衬衫换为垂感针织上衣，降低正式感并提升舒适度。" },
];

const cases: BadCase[] = [
  { id: "CASE-0241", score: 58, type: "身材比例理解错误", scene: "周末约会", age: 25, request: "158cm，小个子梨形身材；想要显高、遮胯，偏法式复古。", output: "长款宽松西装 + 低腰百褶长裙 + 厚底乐福鞋", cause: "模型识别了遮胯需求，但忽略低腰长裙与长外套叠加会下移视觉重心。", solution: "在召回层加入身高×版型约束；对小个子用户提升高腰、短外套权重。", color: "#ff806a" },
  { id: "CASE-0238", score: 61, type: "风格偏好理解错误", scene: "创意办公", age: 29, request: "偏好日系极简，不要甜美元素，办公室日常穿。", output: "荷叶边衬衫 + 蝴蝶结半裙 + 玛丽珍鞋", cause: "“日系”标签被错误映射到少女风，未正确响应负向约束“不要甜美”。", solution: "增强负向偏好指令权重，并拆分日系风格的二级标签体系。", color: "#a58bfa" },
  { id: "CASE-0233", score: 63, type: "场景匹配错误", scene: "客户提案", age: 32, request: "给科技公司客户做提案，要专业但不老气。", output: "牛仔夹克 + 印花 T 恤 + 工装裤", cause: "模型过度关联“科技公司”与休闲文化，弱化了客户提案的正式语义。", solution: "建立场景层级优先级：行为正式度应高于行业风格先验。", color: "#5ba8ff" },
  { id: "CASE-0227", score: 66, type: "色彩搭配问题", scene: "朋友婚礼", age: 27, request: "秋季户外婚礼，优雅、上镜，不抢新娘风头。", output: "荧光绿连衣裙 + 亮紫色手包 + 金色高跟鞋", cause: "单品分别符合上镜特征，但缺少整体色彩数量和饱和度约束。", solution: "增加全套 look 色彩和谐度后验打分，限制高饱和主色数量。", color: "#f6bb43" },
  { id: "CASE-0219", score: 69, type: "身材比例理解错误", scene: "城市旅行", age: 31, request: "苹果型身材，旅行拍照舒适显瘦。", output: "紧身短针织 + 低腰阔腿裤 + 腰包", cause: "错误使用短上衣突出腰线，未结合苹果型身材的腹部修饰需求。", solution: "补充体型与单品适配知识图谱，并引入组合级冲突检测。", color: "#ff806a" },
];

const nav = [
  { id: "create" as Page, icon: "＋", label: "创建评测任务", sub: "单 Case 评估" },
  { id: "report" as Page, icon: "◎", label: "模型评测报告", sub: "质量诊断" },
  { id: "cases" as Page, icon: "▦", label: "Bad Case 分析", sub: "问题洞察" },
  { id: "dataset" as Page, icon: "⌗", label: "评测数据集", sub: "共 328 条" },
  { id: "models" as Page, icon: "◫", label: "模型版本", sub: "3 个版本" },
];

function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "purple" | "red" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brandmark">F</div><div><b>FitEval</b><span>AI 穿搭模型评测平台</span></div></div>
    <div className="workspace"><span>当前工作区</span><b>Style Model Team</b><i>⌄</i></div>
    <nav>
      <p>评测工作台</p>
      {nav.slice(0,3).map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => setPage(n.id)}>
        <em>{n.icon}</em><span><b>{n.label}</b><small>{n.sub}</small></span>{n.id === "cases" && <i className="badge">12</i>}
      </button>)}
      <p>数据管理</p>
      {nav.slice(3).map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => setPage(n.id)}>
        <em>{n.icon}</em><span><b>{n.label}</b><small>{n.sub}</small></span>
      </button>)}
    </nav>
    <div className="side-foot"><div><span className="avatar">LY</span><span><b>林屿</b><small>产品评测负责人</small></span><i>•••</i></div><p><span></span> 服务运行正常 <b>v1.9.0</b></p></div>
  </aside>;
}

function Topbar({ page }: { page: Page }) {
  const meta = {
    create: ["创建评测任务", "使用用户画像与穿搭图片，生成并评估模型输出"],
    report: ["模型评测报告", "真实视觉证据 · 五维质量诊断"],
    cases: ["Bad Case Dashboard", "定位模型薄弱环节，驱动数据与策略迭代"],
    dataset: ["评测数据集", "管理标准测试 Case、人工标注与回归测试集"],
    models: ["模型版本", "对比模型、Prompt 与评分策略的版本表现"],
  }[page];
  return <header className="topbar"><div><p>评测中心 <span>/</span> {meta[0]}</p><h1>{meta[0]}</h1><small>{meta[1]}</small></div><div className="top-actions"><button>⌕</button><button className="notice">♢<i></i></button><div className="model"><span></span><div><small>当前视觉模型</small><b>Qwen3-VL Plus</b></div><i>⌄</i></div></div></header>;
}

function CreatePage({ onGenerate }: { onGenerate: (result: Evaluation) => void }) {
  const [file, setFile] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [styles, setStyles] = useState(["极简", "知性"]);
  const input = useRef<HTMLInputElement>(null);
  const profile = useRef<HTMLTextAreaElement>(null);
  const age = useRef<HTMLInputElement>(null);
  const height = useRef<HTMLInputElement>(null);
  const scene = useRef<HTMLSelectElement>(null);
  const generate = async () => {
    if (!imageDataUrl) {
      setError("请先上传一张穿搭图片，真实视觉评测需要图片输入。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile.current?.value,
          age: Number(age.current?.value),
          height: Number(height.current?.value),
          styles,
          scene: scene.current?.value,
          imageDataUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "模型评测失败");
      onGenerate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "模型评测失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };
  return <div className="page create-page">
    <div className="stepper"><div className="done"><b>1</b><span>填写评测输入<small>用户画像与场景</small></span></div><i></i><div><b>2</b><span>生成模型输出<small>模拟推理结果</small></span></div><i></i><div><b>3</b><span>查看评测报告<small>多维质量诊断</small></span></div></div>
    <div className="create-grid">
      <section className="panel form-panel"><div className="panel-title"><span><b>01</b><div><h2>用户画像与需求</h2><p>输入真实测试 Case 的基础信息</p></div></span><Pill>必填</Pill></div>
        <div className="form-grid">
          <label className="wide">用户画像<textarea ref={profile} defaultValue="互联网产品经理，日常通勤需要见客户，希望穿着专业但不刻板，注重舒适度。" /><small>建议包含职业、体型特征与核心诉求</small></label>
          <label>年龄<div className="input-unit"><input ref={age} type="number" defaultValue={28}/><span>岁</span></div></label>
          <label>身高<div className="input-unit"><input ref={height} type="number" defaultValue={162}/><span>cm</span></div></label>
          <label className="wide">风格偏好<div className="chip-input">{styles.map(s => <button key={s} onClick={() => setStyles(styles.filter(x => x !== s))}>{s} ×</button>)}<input placeholder="添加风格标签…" onKeyDown={e => { if(e.key === "Enter" && e.currentTarget.value) { setStyles([...styles, e.currentTarget.value]); e.currentTarget.value = ""; }}} /></div><div className="quick">常用：{["法式", "松弛感", "通勤", "复古"].map(s => <button key={s} onClick={() => !styles.includes(s) && setStyles([...styles,s])}>＋ {s}</button>)}</div></label>
          <label className="wide">使用场景<select ref={scene} defaultValue="通勤 / 客户会议"><option>通勤 / 客户会议</option><option>周末约会</option><option>朋友婚礼</option><option>城市旅行</option></select></label>
        </div>
      </section>
      <section className="panel upload-panel"><div className="panel-title"><span><b>02</b><div><h2>参考穿搭图片</h2><p>用于评估模型的视觉理解能力</p></div></span><Pill>选填</Pill></div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => {
          const f=e.target.files?.[0];
          if (!f) return;
          if (f.size > 8 * 1024 * 1024) { setError("图片不能超过 8MB"); return; }
          setFile(URL.createObjectURL(f));
          const reader = new FileReader();
          reader.onload = () => setImageDataUrl(String(reader.result));
          reader.readAsDataURL(f);
        }}/>
        <button className={`dropzone ${file ? "has-image" : ""}`} onClick={() => input.current?.click()}>
          {file ? <img src={file} alt="上传的穿搭参考" /> : <><span className="upload-icon">↑</span><b>点击或拖拽上传图片</b><p>支持 JPG、PNG、WEBP · 单张不超过 8MB</p><small>建议上传全身、光线清晰的穿搭照</small></>}
        </button>
        <div className="privacy"><span>⌾</span><p><b>数据隐私说明</b><br/>图片将发送至视觉模型完成本次分析，请勿上传敏感或未经授权的照片。</p></div>
      </section>
    </div>
    {error && <div className="api-error">⚠ {error}</div>}
    <div className="runbar"><div><span>♢</span><p><b>使用视觉模型分析真实穿搭图片</b><small>系统将识别服装证据，并结合用户需求执行 5 个维度的评测</small></p></div><button onClick={generate} disabled={loading}>{loading ? <><i className="spinner"></i>视觉分析中…</> : <>开始真实评测 <span>→</span></>}</button></div>
  </div>;
}

function ReportPage({ goCases, evaluation }: { goCases: () => void; evaluation: Evaluation | null }) {
  const [open, setOpen] = useState(0);
  const displayScores = evaluation?.scores || scores;
  const outfit = evaluation?.outfit || {
    title: "知性松弛感通勤 Look",
    summary: "燕麦色短款西装搭配炭灰垂感阔腿裤，以酒红色乐福鞋作为视觉焦点，兼顾专业感与舒适度。",
    items: [{name:"短款羊毛西装",detail:"燕麦色 · 微收腰"},{name:"垂感阔腿裤",detail:"炭灰 · 高腰"},{name:"方头乐福鞋",detail:"酒红 · 3cm 跟"}],
    modelExplanation: "考虑到你的身高与显高诉求，我用短款外套和高腰裤提高视觉腰线。",
  };
  const avg = Math.round(displayScores.reduce((a,b)=>a+b.value,0)/displayScores.length);
  return <div className="page report-page">
    <div className="report-hero panel"><div><Pill tone="green">✓ 真实评测完成</Pill><h2>综合质量评分</h2><p>基于视觉证据与结构化 LLM Judge 的结果</p></div><div className="score-ring" style={{"--score": `${avg * 3.6}deg`} as React.CSSProperties}><span><b>{avg}</b><small>/ 100</small></span></div><div className="hero-stats"><div><small>评测模型</small><b>{evaluation?.model || "Mock"}</b></div><div><small>任务 ID</small><b>{evaluation?.taskId?.slice(-8) || "DEMO"}</b></div><div><small>质量等级</small><b className="good">{avg >= 85 ? "优秀 A" : avg >= 75 ? "良好 B" : "待优化 C"}</b></div></div><button className="ghost">↻ 重新评测</button></div>
    <div className="report-layout">
      <div>
        <div className="section-head"><div><h2>维度评分明细</h2><p>点击展开原因分析与优化建议</p></div><Pill>5 个维度</Pill></div>
        <div className="score-list">{displayScores.map((s,i) => <article className={`score-card ${open===i?"expanded":""}`} key={s.name} onClick={() => setOpen(open===i ? -1 : i)}>
          <div className="score-main"><b className="num">0{i+1}</b><div className="score-info"><div><h3>{s.name}</h3><span className={s.value >= 85 ? "high" : s.value >= 80 ? "mid" : "low"}>{s.value >= 85 ? "表现优秀" : s.value >= 80 ? "基本达标" : "待优化"}</span></div><div className="bar"><i style={{width:`${s.value}%`}}></i></div></div><strong>{s.value}<small>/100</small></strong><button>⌄</button></div>
          {open===i && <div className="analysis"><div><span className="reason">⌕</span><p><b>原因分析</b>{s.reason}</p></div><div><span className="tip">↗</span><p><b>优化建议</b>{s.advice}</p></div></div>}
        </article>)}</div>
      </div>
      <aside className="output-card panel"><div className="card-head"><div><h2>AI 穿搭输出</h2><p>StyleMind-v2.4 生成结果</p></div><button>•••</button></div>
        <div className="outfit-visual"><div className="outfit-person"><span className="head"></span><span className="body"></span><span className="legs"></span></div><Pill tone="purple">LOOK 01</Pill></div>
        <h3>{outfit.title}</h3><p className="desc">{outfit.summary}</p>
        <div className="items">{outfit.items.map(item => <span key={item.name}>{item.name}<small>{item.detail}</small></span>)}</div>
        <div className="prompt"><small>模型解释</small><p>“{outfit.modelExplanation}”</p></div>
        <button className="flag" onClick={goCases}>⚑ 标记为 Bad Case</button>
      </aside>
    </div>
  </div>;
}

function CasesPage() {
  const [selected, setSelected] = useState<BadCase | null>(null);
  const [filter, setFilter] = useState("全部问题");
  const shown = useMemo(() => filter === "全部问题" ? cases : cases.filter(c => c.type === filter), [filter]);
  const dist = [{n:"身材比例理解错误",v:34,c:"#ff806a"},{n:"风格偏好理解错误",v:27,c:"#a58bfa"},{n:"场景匹配错误",v:23,c:"#5ba8ff"},{n:"色彩搭配问题",v:16,c:"#f6bb43"}];
  return <div className="page cases-page">
    <div className="metric-grid"><div className="metric panel"><span>▤</span><div><small>本轮测试 Case</small><b>328</b><p><i>↑ 12.4%</i> 较上一版本</p></div></div><div className="metric panel"><span>◎</span><div><small>模型平均评分</small><b>81.6</b><p><i>↑ 3.2</i> vs v2.3</p></div></div><div className="metric panel"><span>⚑</span><div><small>Bad Case 数量</small><b>42</b><p><em>12.8%</em> 总 Case 占比</p></div></div><div className="metric panel"><span>↗</span><div><small>高频问题</small><strong>身材比例理解</strong><p>占 Bad Case <em>34%</em></p></div></div></div>
    <div className="analytics-grid">
      <section className="panel chart-card"><div className="card-head"><div><h2>问题类型分布</h2><p>Bad Case 共 42 条 · 点击类别筛选</p></div><select><option>StyleMind-v2.4</option></select></div>
        <div className="donut-wrap"><div className="donut"><span><b>42</b><small>Bad Cases</small></span></div><div className="legend">{dist.map(d=><button key={d.n} onClick={()=>setFilter(d.n)}><i style={{background:d.c}}></i><span>{d.n}<small>{Math.round(d.v*.42)} Cases</small></span><b>{d.v}%</b></button>)}</div></div>
      </section>
      <section className="panel trend-card"><div className="card-head"><div><h2>版本质量趋势</h2><p>最近 4 个模型版本</p></div><Pill tone="green">持续改善</Pill></div>
        <div className="chart"><div className="y"><span>90</span><span>80</span><span>70</span><span>60</span></div><div className="lines"><i></i><i></i><i></i><i></i><svg viewBox="0 0 400 130" preserveAspectRatio="none"><polyline points="0,103 133,79 266,66 400,30" fill="none" stroke="#6754e9" strokeWidth="3"/><g fill="#fff" stroke="#6754e9" strokeWidth="3"><circle cx="0" cy="103" r="5"/><circle cx="133" cy="79" r="5"/><circle cx="266" cy="66" r="5"/><circle cx="400" cy="30" r="5"/></g></svg><div className="x"><span>v2.1<small>74.2</small></span><span>v2.2<small>77.8</small></span><span>v2.3<small>78.4</small></span><span>v2.4<small>81.6</small></span></div></div></div>
      </section>
    </div>
    <section className="panel case-table"><div className="table-toolbar"><div><h2>Bad Case 明细</h2><Pill tone="red">{shown.length} 条记录</Pill></div><div><label>⌕<input placeholder="搜索 Case ID 或输入需求"/></label><select value={filter} onChange={e=>setFilter(e.target.value)}><option>全部问题</option>{dist.map(d=><option key={d.n}>{d.n}</option>)}</select><button>⇩ 导出</button></div></div>
      <div className="table"><div className="tr th"><span>CASE ID</span><span>输入场景</span><span>问题类型</span><span>评分</span><span>问题摘要</span><span></span></div>{shown.map(c=><button className="tr" key={c.id} onClick={()=>setSelected(c)}><span><b>{c.id}</b><small>07-28 14:{c.id.slice(-2)}</small></span><span>{c.scene}<small>{c.age}岁 · 女性</small></span><span><i style={{background:c.color}}></i>{c.type}</span><span><strong>{c.score}</strong>/100</span><span>{c.cause}</span><span>→</span></button>)}</div>
      <div className="pagination"><span>显示 1–{shown.length}，共 42 条</span><div><button disabled>‹</button><button className="on">1</button><button>2</button><button>3</button><button>…</button><button>9</button><button>›</button></div></div>
    </section>
    {selected && <div className="drawer-backdrop" onClick={()=>setSelected(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><Pill tone="red">Bad Case · {selected.score}分</Pill><h2>{selected.id}</h2><p>StyleMind-v2.4 · 2026-07-28</p></div><button onClick={()=>setSelected(null)}>×</button></div>
      <div className="drawer-body"><section><small>01 · 输入需求</small><p>{selected.request}</p><div><Pill>{selected.scene}</Pill><Pill>{selected.age} 岁</Pill></div></section><section><small>02 · AI 输出</small><div className="mini-output"><div className="mini-look">LOOK</div><p>{selected.output}</p></div></section><section className="root-cause"><small>03 · 问题归因</small><h3><i style={{background:selected.color}}></i>{selected.type}</h3><p>{selected.cause}</p></section><section className="solution"><small>04 · 优化方案</small><p>{selected.solution}</p><button>＋ 加入优化任务</button></section></div></aside></div>}
  </div>;
}

const datasetRows = [
  { id:"DS-0328", scene:"通勤 / 客户会议", profile:"28岁 · 162cm · 互联网产品经理", style:"极简 / 知性", label:"已复核", score:86, group:"核心回归集", image:"通勤" },
  { id:"DS-0327", scene:"周末约会", profile:"25岁 · 158cm · 梨形身材", style:"法式 / 复古", label:"已复核", score:58, group:"身材适配集", image:"约会" },
  { id:"DS-0326", scene:"创意办公", profile:"29岁 · 165cm · 设计师", style:"日系 / 极简", label:"待复核", score:72, group:"风格理解集", image:"办公" },
  { id:"DS-0325", scene:"朋友婚礼", profile:"27岁 · 168cm · 品牌策划", style:"优雅 / 上镜", label:"已标注", score:66, group:"色彩专项集", image:"婚礼" },
  { id:"DS-0324", scene:"城市旅行", profile:"31岁 · 160cm · 苹果型身材", style:"舒适 / 显瘦", label:"待标注", score:null, group:"身材适配集", image:"旅行" },
  { id:"DS-0323", scene:"客户提案", profile:"32岁 · 170cm · 咨询顾问", style:"专业 / 现代", label:"已复核", score:91, group:"核心回归集", image:"提案" },
];

function DatasetPage({ runEvaluation }: { runEvaluation: () => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [selected, setSelected] = useState<string[]>([]);
  const rows = datasetRows.filter(row => (status === "全部状态" || row.label === status) && `${row.id}${row.scene}${row.profile}${row.style}`.includes(query));
  const toggle = (id:string) => setSelected(selected.includes(id) ? selected.filter(x=>x!==id) : [...selected,id]);
  return <div className="page dataset-page">
    <div className="dataset-summary">
      <div className="panel ds-stat"><span>⌗</span><div><small>全部 Case</small><b>328</b><p>覆盖 12 个核心场景</p></div></div>
      <div className="panel ds-stat"><span>✓</span><div><small>已完成标注</small><b>286</b><p><i>87.2%</i> 标注完成率</p></div></div>
      <div className="panel ds-stat"><span>◉</span><div><small>核心回归集</small><b>120</b><p>每次发版自动运行</p></div></div>
      <div className="panel ds-stat"><span>⌛</span><div><small>待复核</small><b>18</b><p><em>需要人工处理</em></p></div></div>
    </div>
    <section className="panel dataset-panel">
      <div className="dataset-toolbar"><div><h2>测试 Case 库</h2><p>标准化管理图片、需求和人工 Gold Label</p></div><div><button className="outline-btn">⇧ 导入数据</button><button className="primary-btn" onClick={runEvaluation}>＋ 新建 Case</button></div></div>
      <div className="dataset-filters"><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索 Case ID、场景或画像"/></label><select><option>全部数据集</option><option>核心回归集</option><option>身材适配集</option><option>风格理解集</option><option>色彩专项集</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option>全部状态</option><option>已复核</option><option>已标注</option><option>待复核</option><option>待标注</option></select><button>更多筛选 ⌄</button></div>
      {selected.length > 0 && <div className="batchbar"><b>已选择 {selected.length} 条 Case</b><span></span><button onClick={runEvaluation}>▶ 批量运行评测</button><button>移动到数据集</button><button onClick={()=>setSelected([])}>取消选择</button></div>}
      <div className="dataset-table">
        <div className="ds-row ds-head"><span><input type="checkbox" checked={selected.length===rows.length && rows.length>0} onChange={()=>setSelected(selected.length===rows.length?[]:rows.map(r=>r.id))}/></span><span>CASE / 场景</span><span>用户画像</span><span>风格偏好</span><span>所属数据集</span><span>人工评分</span><span>标注状态</span><span></span></div>
        {rows.map((row,i)=><div className="ds-row" key={row.id}><span><input type="checkbox" checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/></span><span className="case-cell"><i>{row.image}</i><span><b>{row.id}</b><small>{row.scene}</small></span></span><span>{row.profile}</span><span><Pill tone="purple">{row.style}</Pill></span><span>{row.group}</span><span>{row.score ? <><strong>{row.score}</strong><small>/100</small></> : <em>—</em>}</span><span><Pill tone={row.label==="已复核"?"green":row.label==="待标注"?"red":"gray"}>{row.label}</Pill></span><button>•••</button></div>)}
      </div>
      <div className="pagination"><span>显示 1–{rows.length}，共 328 条</span><div><button disabled>‹</button><button className="on">1</button><button>2</button><button>3</button><button>…</button><button>55</button><button>›</button></div></div>
    </section>
  </div>;
}

const modelVersions = [
  { id:"qwen-v3", name:"Qwen3-VL Plus", prompt:"Prompt v3.0", tag:"生产中", score:84.8, body:82, style:87, scene:86, color:85, need:84, latency:"38.6s", cost:"¥0.043", bad:36, date:"07-28 14:32", color:"#6754e9" },
  { id:"qwen-v2", name:"Qwen3-VL Plus", prompt:"Prompt v2.1", tag:"候选", score:81.6, body:76, style:84, scene:83, color:82, need:83, latency:"34.2s", cost:"¥0.038", bad:42, date:"07-27 18:10", color:"#2aab82" },
  { id:"openai-v1", name:"GPT-5.6 Terra", prompt:"Prompt v2.1", tag:"已归档", score:83.2, body:80, style:85, scene:84, color:84, need:83, latency:"18.4s", cost:"¥0.126", bad:39, date:"07-25 10:08", color:"#9b9eae" },
];

function ModelsPage({ createTask }: { createTask: () => void }) {
  const [compare, setCompare] = useState(["qwen-v3","qwen-v2"]);
  const compared = modelVersions.filter(v=>compare.includes(v.id));
  const toggle = (id:string) => setCompare(compare.includes(id) ? compare.filter(x=>x!==id) : compare.length<3 ? [...compare,id] : compare);
  return <div className="page models-page">
    <div className="model-overview panel"><div><Pill tone="green">● Production</Pill><h2>Qwen3-VL Plus · Prompt v3.0</h2><p>当前生产评测模型 · 2026-07-28 发布</p></div><div><small>综合评分</small><b>84.8</b><em>↑ 3.2</em></div><div><small>Bad Case 率</small><b>11.0%</b><em>↓ 1.8%</em></div><div><small>平均耗时</small><b>38.6s</b><span>视觉高精度</span></div><button className="primary-btn" onClick={createTask}>运行新评测</button></div>
    <div className="models-layout">
      <section className="panel version-list"><div className="version-title"><div><h2>模型版本</h2><p>选择 2–3 个版本进行指标对比</p></div><button>＋ 新建版本</button></div>
        {modelVersions.map(v=><button className={`version-card ${compare.includes(v.id)?"selected":""}`} key={v.id} onClick={()=>toggle(v.id)}><span className="check">{compare.includes(v.id)?"✓":""}</span><i style={{background:v.color}}>{v.name.charAt(0)}</i><div><b>{v.name}</b><small>{v.prompt} · {v.date}</small></div><Pill tone={v.tag==="生产中"?"green":v.tag==="候选"?"purple":"gray"}>{v.tag}</Pill><strong>{v.score}<small>分</small></strong></button>)}
        <div className="version-note"><span>ℹ</span><p><b>版本管理建议</b><br/>模型、Prompt 或评分权重任一变化，都应创建独立版本并运行核心回归集。</p></div>
      </section>
      <section className="panel compare-panel"><div className="compare-head"><div><h2>版本表现对比</h2><p>基于核心回归集 120 Cases</p></div><button>⇩ 导出报告</button></div>
        <div className="radar-area"><div className="radar"><span></span><i></i><b></b><em></em><div>场景匹配<small>90</small></div><div>风格一致<small>88</small></div><div>身材适配<small>82</small></div><div>色彩协调<small>86</small></div><div>需求满足<small>85</small></div></div><div className="radar-legend">{compared.map(v=><span key={v.id}><i style={{background:v.color}}></i>{v.name} · {v.prompt}</span>)}</div></div>
        <div className="compare-table"><div className="cmp-row cmp-head"><span>评测指标</span>{compared.map(v=><span key={v.id}>{v.prompt}</span>)}</div>{[
          ["综合评分","score"],["场景匹配度","scene"],["风格一致性","style"],["身材适配度","body"],["色彩协调性","color"],["需求满足度","need"],["Bad Case 数","bad"],["平均耗时","latency"],["单次成本","cost"]
        ].map(([label,key])=><div className="cmp-row" key={key}><span>{label}</span>{compared.map((v,idx)=><span key={v.id} className={idx===0?"best":""}>{String(v[key as keyof typeof v])}{typeof v[key as keyof typeof v]==="number" && key!=="bad"?"":""}{idx===0&&["score","scene","style","body","color","need"].includes(key)?<small> ↑</small>:null}</span>)}</div>)}</div>
        <div className="decision"><span>✓</span><p><b>版本结论</b>Prompt v3.0 在身材适配度上提升 6 分，Bad Case 减少 6 条；延迟增加 4.4 秒，但整体质量收益显著，建议保持生产版本。</p></div>
      </section>
    </div>
  </div>;
}

export default function Home() {
  const [page, setPage] = useState<Page>("create");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  return <main className="app-shell"><Sidebar page={page} setPage={setPage}/><div className="main"><Topbar page={page}/>{page==="create"&&<CreatePage onGenerate={(result)=>{setEvaluation(result);setPage("report");}}/>} {page==="report"&&<ReportPage evaluation={evaluation} goCases={()=>setPage("cases")}/>} {page==="cases"&&<CasesPage/>} {page==="dataset"&&<DatasetPage runEvaluation={()=>setPage("create")}/>} {page==="models"&&<ModelsPage createTask={()=>setPage("create")}/>}</div></main>;
}
