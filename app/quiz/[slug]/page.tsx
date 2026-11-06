"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { readEditorDocumentCache } from "@/lib/editor/cache";
import type { CanvasBlock } from "@/components/editor/types";

const answers = ["Busco mais clareza e direção", "Quero fortalecer minha fé", "Preciso recomeçar", "Quero viver algo novo"];

function SavedAlertIcon({ type, size = 17 }: { type?: CanvasBlock["alertIcon"]; size?: number }) {
  const icon = type === "attention" ? <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></> : type === "success" ? <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></> : type === "error" ? <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></> : type === "help" ? <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4 1.8c-1.2.8-1.7 1.2-1.7 2.5M12 16h.01" /></> : type === "close" ? <><path d="m6 6 12 12M18 6 6 18" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>;
  return <svg className="saved-alert-icon" style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>;
}

function SavedBlockPreview({ block, onNext }: { block: CanvasBlock; onNext: () => void }) {
  if (block.item === "Imagem") return block.imageUrl ? <img className="saved-quiz-image" src={block.imageUrl} alt={block.content || "Imagem do funil"} style={{ width: `${block.imageWidth ?? 100}%`, height: block.imageHeight ? `${block.imageHeight}px` : "auto", objectFit: "cover" }} /> : null;
  if (block.item === "Texto") return <div className="saved-quiz-text">{block.content}</div>;
  if (block.item === "Botão") return <button className="public-cta" type="button" onClick={onNext}>{block.content}<span>→</span></button>;
  if (block.item === "Alerta") { const align = block.alertAlign ?? "center"; return <div className={`saved-quiz-alert alert-public-align-${align}`} style={{ width: `${block.alertWidth ?? 100}%`, background: block.alertThemeColor ?? "#cad9ff", color: block.alertIconColor ?? "#266dff", flexDirection: block.alertIconPosition === "right" ? "row-reverse" : "row" }}><SavedAlertIcon type={block.alertIcon ?? "info"} size={block.alertIconSize ?? 24} /><strong style={{ color: "#111827", fontSize: "12px" }}>{block.content}</strong></div>; }
  if (block.item === "Formulário") return <div className="saved-quiz-form"><h2>{block.formTitle ?? "Formulário de Contato"}</h2>{(block.formFields ?? [{ id: 1, label: "Nome", type: "text", placeholder: "Digite seu nome" }, { id: 2, label: "Email", type: "email", placeholder: "Digite seu email" }]).map((field) => <label key={field.id}>{field.label}<input type={field.type} placeholder={field.placeholder} /></label>)}<button className="public-cta" type="button" onClick={onNext}>{block.formButtonText ?? "Enviar"}</button></div>;
  if (block.item === "Área de Texto") return <div className="saved-quiz-form"><strong>{block.textareaLabel ?? "Observações"}</strong><textarea placeholder={block.textareaPlaceholder ?? "Digite sua mensagem"} /><small>{block.textareaHelpText ?? "Opcional"}</small><button className="public-cta" type="button" onClick={onNext}>{block.textareaButtonText ?? "Enviar"}</button></div>;
  if (block.item === "FAQ") return <div className="saved-quiz-faq"><h2>{block.faqTitle ?? "Perguntas frequentes"}</h2>{(block.faqItems ?? []).map((item) => <details key={item.id}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>;
  if (block.item === "Opções") return <div className="saved-quiz-options">{(block.options ?? []).map((option) => <button type="button" key={option.id} onClick={onNext}>{option.label}<span>→</span></button>)}</div>;
  if (block.item === "Nível") return <div className="saved-quiz-data"><strong>{block.levelTitle ?? "Nível de Preparação"}</strong><span>{block.levelSubtitle ?? ""}</span><progress value={block.levelPercentage ?? 0} max="100" /></div>;
  if (block.item === "Peso") return <div className="saved-quiz-data"><strong>{block.weightValue ?? 70}{block.weightUnit ?? "kg"}</strong><input type="range" min={block.weightMinimum ?? 40} max={block.weightMaximum ?? 150} defaultValue={block.weightValue ?? 70} /></div>;
  if (block.item === "Altura") return <div className="saved-quiz-data"><strong>{block.heightValue ?? 170}{block.heightUnit === "in" ? " pol" : " cm"}</strong><input type="range" min={block.heightMinimum ?? 100} max={block.heightMaximum ?? 250} defaultValue={block.heightValue ?? 170} /></div>;
  if (block.item === "Idade") return <div className="saved-quiz-age"><h2>{block.dataLabel ?? "Qual a sua idade?"}</h2><p>Isso nos ajuda a criar seu plano personalizado</p><div className="age-value">{block.dataValue ?? 18}<small> anos</small></div><input type="range" min={block.dataMin ?? 18} max={block.dataMax ?? 80} defaultValue={block.dataValue ?? 18} /><small>Deslize para ajustar</small></div>;
  if (block.item === "Tendência") return <div className="saved-quiz-trend"><div><small>{block.trendTitle ?? "Tendência"}</small><strong>{block.trendValue ?? "88%"}</strong><span>{block.trendPositive === false ? "↘" : "↗"} {block.trendPercentage ?? 88}%</span><em>{block.trendPeriod ?? "Última semana"}</em></div><svg viewBox="0 0 240 80" preserveAspectRatio="none"><path d="M0 45 C50 18 80 15 120 48 S190 70 240 20 L240 80 L0 80 Z" /><path d="M0 45 C50 18 80 15 120 48 S190 70 240 20" /></svg></div>;
  if (block.item === "Gamificação") return <div className="saved-quiz-gamification"><h2>{block.gamificationText ?? "Parabéns! Você acumulou:"}</h2><div><strong>{block.gamificationCompany ?? "Deskfunnel"}</strong><small>{block.gamificationCompanyDescription ?? "Quizzes interativos"}</small><b>{block.gamificationAmount ?? "R$ 50.00"}</b></div><button className="public-cta" type="button" onClick={onNext}>{block.gamificationButtonText ?? "Resgatar Prêmio"}</button></div>;
  if (block.item === "Planos") return <div className="saved-quiz-plans"><h2>{block.plansTitle ?? "MAIS POPULARES"}</h2>{(block.planItems ?? []).map((plan) => <button type="button" key={plan.id} onClick={onNext}><strong>{plan.title}</strong><b>{plan.price}</b><small>{plan.description}</small></button>)}</div>;
  if (block.item === "Vídeo") { const source = block.videoEmbed?.match(/src\s*=\s*["']([^"']+)["']/i)?.[1]; return source ? <iframe className="saved-quiz-video" src={source} title="Vídeo do funil" allowFullScreen /> : null; }
  if (block.item === "Áudio") return block.audioUrl ? <div className="saved-quiz-audio"><strong>{block.audioTitle ?? "Mensagem de Áudio"}</strong><audio controls autoPlay={block.audioAutoplay} loop={block.audioLoop} src={block.audioUrl} /></div> : null;
  if (block.item === "Carrossel") return <div className="saved-quiz-carousel">{(block.carouselItems ?? []).map((item) => <figure key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt={item.text} />}<figcaption>{item.text}</figcaption></figure>)}</div>;
  if (block.item === "Antes/Depois") return <div className="saved-quiz-before-after">{block.beforeImageUrl && <img src={block.beforeImageUrl} alt={block.beforeLabel ?? "Antes"} />}{block.afterImageUrl && <img src={block.afterImageUrl} alt={block.afterLabel ?? "Depois"} />}</div>;
  if (block.item === "Depoimentos") return <div className="saved-quiz-testimonials">{(block.testimonialItems ?? []).map((item) => <article key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt={item.name} />}<strong>{item.name}</strong><small>{item.username}</small><p>{item.comment}</p><span>{"★".repeat(item.rating)}</span></article>)}</div>;
  if (block.item === "Espaço") return <div style={{ height: `${block.spacerHeight ?? 40}px` }} aria-hidden="true" />;
  if (block.item === "Notificação") return <div className="saved-quiz-alert">{block.notificationTitle ?? "Atenção"}<br /><small>{block.notificationMessage ?? "Sua notificação aparecerá aqui."}</small></div>;
  return <div className="saved-quiz-block"><strong>{block.content !== block.item ? block.content : block.item}</strong></div>;
}

export default function PublicQuiz() {
  const params = useParams<{ slug: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState("");
  const [email, setEmail] = useState("");
  const [finished, setFinished] = useState(false);
  const [savedSteps, setSavedSteps] = useState<Array<{ title: string; blocks: CanvasBlock[] }>>([]);
  const [loadingSavedQuiz, setLoadingSavedQuiz] = useState(true);

  useEffect(() => {
    let active = true;
    const loadingTimeout = window.setTimeout(() => { if (active) setLoadingSavedQuiz(false); }, 3500);
    function loadLocalCache() {
      const cached = params.slug ? readEditorDocumentCache(params.slug) : null;
      if (!cached?.steps?.length) return false;
      setSavedSteps(cached.steps.filter((item) => !item.break).map((item) => ({ title: item.title, blocks: item.id ? cached.blocksByStep[item.id] ?? [] : [] })));
      setLoadingSavedQuiz(false);
      return true;
    }
    async function loadSavedQuiz() {
      if (!supabase || !params.slug || params.slug === "preview") { loadLocalCache(); setLoadingSavedQuiz(false); return; }
      const funnel = await supabase.from("funnels").select("id").or(`slug.eq.${params.slug},id.eq.${params.slug}`).maybeSingle();
      if (!active || funnel.error || !funnel.data) { loadLocalCache(); setLoadingSavedQuiz(false); return; }
      const stepsResult = await supabase.from("funnel_steps").select("id, title, position").eq("funnel_id", funnel.data.id).order("position");
      if (!active || stepsResult.error || !stepsResult.data) { loadLocalCache(); setLoadingSavedQuiz(false); return; }
      const ids = stepsResult.data.map((item) => item.id);
      const blockResult = ids.length ? await supabase.from("step_blocks").select("step_id, block_type, content, position").in("step_id", ids).order("position") : { data: [], error: null };
      if (!active) return;
      if (blockResult.error) { loadLocalCache(); setLoadingSavedQuiz(false); return; }
      const blocksByStep = new Map<string, CanvasBlock[]>();
      for (const row of blockResult.data ?? []) { const payload = (row.content ?? {}) as Record<string, unknown>; const block = { id: Number(row.position) + 1, item: row.block_type, content: typeof payload.content === "string" ? payload.content : row.block_type, ...payload } as CanvasBlock; blocksByStep.set(row.step_id, [...(blocksByStep.get(row.step_id) ?? []), block]); }
      setSavedSteps(stepsResult.data.map((item) => ({ title: item.title, blocks: blocksByStep.get(item.id) ?? [] })));
      setLoadingSavedQuiz(false);
    }
    void loadSavedQuiz();
    return () => { active = false; window.clearTimeout(loadingTimeout); };
  }, [params.slug, supabase]);

  const savedStep = savedSteps[step - 1];
  const savedHasAction = Boolean(savedStep?.blocks.some((block) => ["Botão", "Formulário", "Área de Texto", "Opções"].includes(block.item)));

  const next = () => {
    if (step === 1) setStep(2);
    else if (step === 2 && selected) setStep(3);
    else if (step === 3 && email) setFinished(true);
  };

  if (loadingSavedQuiz) return <main className="public-quiz"><div className="public-quiz-card"><div className="public-brand"><span>iz</span> izquiz</div><p>Carregando seu quiz...</p></div></main>;
  if (savedSteps.length > 0 && savedStep) return <main className="public-quiz"><div className="public-progress"><span style={{ width: `${finished ? 100 : (step / savedSteps.length) * 100}%` }} /></div><div className="public-quiz-card"><div className="public-brand"><span>iz</span> izquiz</div>{finished ? <div className="public-result"><div className="result-spark">✦</div><h1>Seu próximo passo<br /><em>começa agora.</em></h1><p>Preparamos uma recomendação especial para você.</p></div> : <><div className="public-kicker">{savedStep.title}</div><div className="saved-quiz-blocks">{savedStep.blocks.map((block) => <SavedBlockPreview block={block} onNext={() => step < savedSteps.length ? setStep(step + 1) : setFinished(true)} key={block.id} />)}</div>{!savedHasAction && <button className="public-cta" onClick={() => step < savedSteps.length ? setStep(step + 1) : setFinished(true)}>{step < savedSteps.length ? "CONTINUAR" : "FINALIZAR"}<span>→</span></button>}</>}</div><footer>izquiz <span>feito para converter</span></footer></main>;
  if (params.slug !== "fe-por-um-fio") return <main className="public-quiz"><div className="public-quiz-card"><div className="public-brand"><span>iz</span> izquiz</div><h1>Não foi possível carregar este funil</h1><p>Verifique se o link está correto e se o funil foi salvo.</p></div></main>;
  return <main className="public-quiz"><div className="public-progress"><span style={{ width: `${finished ? 100 : step * 33.33}%` }} /></div><div className="public-quiz-card"><div className="public-brand"><span>iz</span> izquiz</div>{finished ? <div className="public-result"><div className="result-spark">✦</div><h1>Seu próximo passo<br /><em>começa agora.</em></h1><p>Preparamos uma recomendação especial para você. Confira seu e-mail para receber os próximos passos.</p><button onClick={() => window.location.reload()}>Refazer quiz</button></div> : <><div className="public-kicker">FE POR UM FIO</div><h1>{step === 1 ? <>Como se reconectar com Deus e conquistar a<br /><em>vida abundante</em> que você precisa?</> : step === 2 ? <>O que você mais<br /><em>busca hoje?</em></> : <>Receba seu<br /><em>resultado.</em></>}</h1><p className="public-description">{step === 1 ? "Mesmo que você já tenha tentado orar, ler a Bíblia... e nada tenha mudado." : step === 2 ? "Escolha a alternativa que mais representa o seu momento." : "Deixe seu melhor e-mail para receber uma recomendação personalizada."}</p>{step === 1 && <div className="public-visual"><span>Você não<br />chegou aqui<br />por acaso</span></div>}{step === 2 && <div className="answer-grid">{answers.map((answer) => <button className={selected === answer ? "answer selected" : "answer"} key={answer} onClick={() => setSelected(answer)}>{answer}<span>→</span></button>)}</div>}{step === 3 && <input className="public-email" type="email" placeholder="Seu melhor e-mail" value={email} onChange={(event) => setEmail(event.target.value)} />}{step !== 2 && <button className="public-cta" onClick={next}>{step === 1 ? "COMEÇAR" : "RECEBER RESULTADO"}<span>→</span></button>}{step === 2 && <button className="public-cta" onClick={next} disabled={!selected}>CONTINUAR <span>→</span></button>}<small className="public-note">Leva menos de 2 minutos　•　100% gratuito</small></>}</div><footer>izquiz <span>feito para converter</span></footer></main>;
}
