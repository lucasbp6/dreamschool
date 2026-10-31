// Avaliação 7B × 32B com os prompts reais do "Ensinar o pet".
// Uso (na raiz do projeto): node --env-file=.env --import tsx scripts/eval/mentor-eval.mts <saida.json>
import fs from "node:fs";
import { petReplyMessages, type MentorContext } from "../../src/lib/mentor.ts";

const KEY = process.env.FEATHERLESS_API_KEY!;
const MODELS = ["Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2.5-32B-Instruct"];
const base = { petName: "Sábia", petType: "OWL", studentName: "Lia Fernandes Costa" };
const cases: { id: string; ctx: Omit<MentorContext, keyof typeof base>; text: string; expect: string }[] = [
  { id: "fotossintese", ctx: { subjectName: "Ciências", topic: "Fotossíntese" }, text: "A fotossíntese é quando a planta come terra pela raiz para crescer.", expect: "ERRO: acontece nas folhas, com luz, água e gás carbônico; produz açúcar/glicose e oxigênio" },
  { id: "fracoes", ctx: { subjectName: "Matemática", topic: "Frações" }, text: "1/4 é maior que 1/2 porque 4 é maior que 2.", expect: "ERRO: 1/2 é maior; dividir em mais partes deixa cada parte menor" },
  { id: "tabuada", ctx: { subjectName: "Matemática", topic: "Tabuada do 7" }, text: "7 vezes 8 é 54, é só somar 7 oito vezes.", expect: "ERRO: 7×8 = 56 (o método está certo)" },
  { id: "capital", ctx: { subjectName: "Geografia", topic: "Capitais do Brasil" }, text: "A capital do Brasil é o Rio de Janeiro, porque é a cidade mais famosa.", expect: "ERRO: Brasília (desde 1960); o Rio já foi capital" },
  { id: "substantivo", ctx: { subjectName: "Português", topic: "Classes de palavras" }, text: "Substantivo é a palavra que mostra uma ação, tipo correr e pular.", expect: "ERRO: isso é verbo; substantivo nomeia seres/coisas" },
  { id: "estacoes", ctx: { subjectName: "Ciências", topic: "Estações do ano" }, text: "É verão quando a Terra está mais perto do Sol e inverno quando está mais longe.", expect: "ERRO (sutil): é a inclinação do eixo da Terra" },
  { id: "ciclo-agua", ctx: { subjectName: "Ciências", topic: "Ciclo da água" }, text: "O sol esquenta a água do mar, ela evapora, vira nuvem e depois cai como chuva.", expect: "CORRETO: comemorar e aprofundar (condensação)" },
  { id: "cabral", ctx: { subjectName: "História", topic: "Chegada dos portugueses" }, text: "Os portugueses chegaram ao Brasil em 1500 com Pedro Álvares Cabral, e aqui já moravam os povos indígenas.", expect: "CORRETO: comemorar e aprofundar" },
  { id: "transcricao", ctx: { subjectName: "Ciências", topic: "Sistema solar" }, text: "o sol é uma estrela e a terra jira em volta dele uma vez por ano tipo 365 dias", expect: "CORRETO (falado, sem pontuação e com 'jira'): não corrigir ortografia" },
];

async function ask(model: string, messages: unknown) {
  const t0 = Date.now();
  const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 200, stream: true }),
  });
  if (!res.ok || !res.body) return { status: res.status, ttft: null, total: Date.now() - t0, text: (await res.text()).slice(0, 200) };
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "", ttft: number | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop()!;
    for (const l of lines) {
      if (!l.startsWith("data: ") || l.includes("[DONE]")) continue;
      const piece = JSON.parse(l.slice(6)).choices?.[0]?.delta?.content;
      if (piece) {
        if (ttft === null) ttft = Date.now() - t0;
        text += piece;
      }
    }
  }
  return { status: res.status, ttft, total: Date.now() - t0, text: text.trim() };
}

const results: unknown[] = [];
for (const model of MODELS) {
  await ask(model, [{ role: "user", content: "oi" }]); // aquecimento: tira o "modelo frio" da medição
  for (const c of cases) {
    const ctx = { ...base, ...c.ctx } as MentorContext;
    const r = await ask(model, petReplyMessages(ctx, [{ role: "PET", content: "Oba! Me ensina?" }, { role: "STUDENT", content: c.text }]));
    const sentences = r.text.split(/(?<=[.!?…])\s+/).filter((s) => s.trim()).length;
    results.push({ model: model.includes("32B") ? "32B" : "7B", case: c.id, expect: c.expect, ...r, sentences });
    console.error(`${model} ${c.id} ${r.status} ttft=${r.ttft} total=${r.total}`);
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(results, null, 1));
