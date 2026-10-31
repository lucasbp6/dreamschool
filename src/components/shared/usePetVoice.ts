"use client";

// Voz do pet com a síntese de voz do navegador (Web Speech API, pt-BR). As falas são divididas em frases:
// assim o pet começa a falar enquanto a resposta ainda chega e evita o corte de falas longas do Chrome.
import { useCallback, useEffect, useRef, useState } from "react";

const PREF_KEY = "ds-pet-voice";

/** Timbre por espécie: tom (pitch) e velocidade. */
const VOICE: Record<string, { pitch: number; rate: number }> = {
  CAT: { pitch: 1.5, rate: 1.05 },
  OWL: { pitch: 1.15, rate: 0.95 },
  BEAR: { pitch: 1.25, rate: 0.95 },
  BUNNY: { pitch: 1.7, rate: 1.1 },
  FOX: { pitch: 1.45, rate: 1.05 },
  DOG: { pitch: 1.35, rate: 1.05 },
  DRAGON: { pitch: 1.0, rate: 0.95 },
};

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const br = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("pt-br"));
  const pt = br.length ? br : voices.filter((v) => v.lang.toLowerCase().startsWith("pt"));
  // Prefere vozes mais naturais quando existem (Google/Microsoft "Natural"/"Online").
  return pt.find((v) => /natural|online|google/i.test(v.name)) ?? pt[0] ?? null;
}

/** Texto para falar: sem emojis, símbolos de markdown e reticências repetidas. */
export function speakable(text: string) {
  return text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[*_#`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Divide em frases completas e o resto ainda incompleto. */
export function splitSentences(text: string): { complete: string[]; rest: string } {
  const complete: string[] = [];
  const re = /[^.!?…]+[.!?…]+["”')\]]*\s+/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    complete.push(m[0].trim());
    last = re.lastIndex;
  }
  return { complete, rest: text.slice(last) };
}

export function usePetVoice(petType: string) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const pending = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    try {
      setEnabled(localStorage.getItem(PREF_KEY) !== "off");
    } catch {}
    const load = () => (voice.current = pickVoice(window.speechSynthesis.getVoices()));
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    pending.current = 0;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /** Enfileira uma frase (sem interromper as anteriores). */
  const say = useCallback(
    (text: string, force = false) => {
      if (!supported || (!enabled && !force)) return;
      const clean = speakable(text);
      if (!clean) return;
      const u = new SpeechSynthesisUtterance(clean);
      const tone = VOICE[petType] ?? VOICE.CAT;
      u.lang = "pt-BR";
      if (voice.current) u.voice = voice.current;
      u.pitch = tone.pitch;
      u.rate = tone.rate;
      const done = () => {
        pending.current = Math.max(0, pending.current - 1);
        if (pending.current === 0) setSpeaking(false);
      };
      u.onstart = () => setSpeaking(true);
      u.onend = done;
      u.onerror = done;
      pending.current++;
      window.speechSynthesis.speak(u);
    },
    [supported, enabled, petType],
  );

  /** Fala um texto inteiro do começo (interrompe o que estava falando). */
  const speak = useCallback(
    (text: string, force = false) => {
      if (!supported || (!enabled && !force)) return;
      stop();
      const { complete, rest } = splitSentences(`${text} `);
      for (const s of [...complete, rest]) say(s, force);
    },
    [supported, enabled, stop, say],
  );

  /** Para respostas em streaming: `feed(textoAcumulado)` fala cada frase assim que ela termina; `flush()` fala o resto. */
  const stream = useCallback(() => {
    let spoken = 0;
    let latest = "";
    return {
      feed(text: string) {
        latest = text;
        const { complete } = splitSentences(text.slice(spoken));
        for (const s of complete) {
          say(s);
          spoken = text.indexOf(s, spoken) + s.length;
        }
      },
      flush() {
        const rest = latest.slice(spoken).trim();
        if (rest) say(rest);
        spoken = latest.length;
      },
    };
  }, [say]);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on;
      try {
        localStorage.setItem(PREF_KEY, next ? "on" : "off");
      } catch {}
      if (!next) stop();
      return next;
    });
  }, [stop]);

  return { supported, enabled, speaking, speak, stream, stop, toggle };
}

export type PetVoice = ReturnType<typeof usePetVoice>;
