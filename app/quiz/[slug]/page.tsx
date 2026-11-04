"use client";

import { useState } from "react";

const answers = ["Busco mais clareza e direção", "Quero fortalecer minha fé", "Preciso recomeçar", "Quero viver algo novo"];

export default function PublicQuiz() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState("");
  const [email, setEmail] = useState("");
  const [finished, setFinished] = useState(false);

  const next = () => {
    if (step === 1) setStep(2);
    else if (step === 2 && selected) setStep(3);
    else if (step === 3 && email) setFinished(true);
  };

  return <main className="public-quiz"><div className="public-progress"><span style={{ width: `${finished ? 100 : step * 33.33}%` }} /></div><div className="public-quiz-card"><div className="public-brand"><span>iz</span> izquiz</div>{finished ? <div className="public-result"><div className="result-spark">✦</div><h1>Seu próximo passo<br /><em>começa agora.</em></h1><p>Preparamos uma recomendação especial para você. Confira seu e-mail para receber os próximos passos.</p><button onClick={() => window.location.reload()}>Refazer quiz</button></div> : <><div className="public-kicker">FE POR UM FIO</div><h1>{step === 1 ? <>Como se reconectar com Deus e conquistar a<br /><em>vida abundante</em> que você precisa?</> : step === 2 ? <>O que você mais<br /><em>busca hoje?</em></> : <>Receba seu<br /><em>resultado.</em></>}</h1><p className="public-description">{step === 1 ? "Mesmo que você já tenha tentado orar, ler a Bíblia... e nada tenha mudado." : step === 2 ? "Escolha a alternativa que mais representa o seu momento." : "Deixe seu melhor e-mail para receber uma recomendação personalizada."}</p>{step === 1 && <div className="public-visual"><span>Você não<br />chegou aqui<br />por acaso</span></div>}{step === 2 && <div className="answer-grid">{answers.map((answer) => <button className={selected === answer ? "answer selected" : "answer"} key={answer} onClick={() => setSelected(answer)}>{answer}<span>→</span></button>)}</div>}{step === 3 && <input className="public-email" type="email" placeholder="Seu melhor e-mail" value={email} onChange={(event) => setEmail(event.target.value)} />}{step !== 2 && <button className="public-cta" onClick={next}>{step === 1 ? "COMEÇAR" : "RECEBER RESULTADO"}<span>→</span></button>}{step === 2 && <button className="public-cta" onClick={next} disabled={!selected}>CONTINUAR <span>→</span></button>}<small className="public-note">Leva menos de 2 minutos　•　100% gratuito</small></>}</div><footer>izquiz <span>feito para converter</span></footer></main>;
}
