"use client";

// Ditado por voz com a Web Speech API do navegador (Chrome, Edge e Safari; o Firefox não suporta).
// Observação: no Chrome/Edge o áudio é transcrito por um serviço online do próprio navegador.
import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Para falar, permita o uso do microfone no navegador.",
  "service-not-allowed": "Para falar, permita o uso do microfone no navegador.",
  "no-speech": "Não ouvi nada. Toque no microfone e tente de novo.",
  "audio-capture": "Não encontrei um microfone neste aparelho.",
  network: "O ditado precisa de internet. Tente de novo ou escreva.",
};

/**
 * `start(prefix)` começa a ouvir e chama `onText(prefix + transcrição)` a cada trecho reconhecido,
 * para o texto aparecer na caixa enquanto o aluno fala. `stop()` encerra e entrega o trecho final;
 * `cancel()` encerra e descarta qualquer resultado que ainda chegue (usado ao enviar a mensagem).
 */
export function useSpeechToText(onText: (text: string) => void, lang = "pt-BR") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  // Detectado só no cliente, para não divergir da renderização do servidor.
  useEffect(() => setSupported(getCtor() !== null), []);
  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(
    (prefix: string) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      rec.current?.abort();
      const r = new Ctor();
      r.lang = lang;
      r.continuous = true;
      r.interimResults = true;
      const base = prefix.trim() ? `${prefix.trim()} ` : "";
      r.onresult = (e) => {
        // Resultados atrasados de uma escuta cancelada não podem reescrever a caixa de texto.
        if (rec.current !== r) return;
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
        onTextRef.current(base + transcript.trim());
      };
      r.onerror = (e) => {
        if (rec.current === r && e.error !== "aborted")
          setError(ERRORS[e.error] ?? "Não consegui ouvir agora. Você pode escrever.");
      };
      r.onend = () => {
        if (rec.current !== r) return; // fim de uma escuta antiga: não mexe na atual
        rec.current = null;
        setListening(false);
      };
      setError(null);
      setListening(true);
      rec.current = r;
      r.start();
    },
    [lang],
  );

  const stop = useCallback(() => rec.current?.stop(), []);

  const cancel = useCallback(() => {
    const r = rec.current;
    rec.current = null;
    r?.abort();
    setListening(false);
  }, []);

  return { supported, listening, error, start, stop, cancel };
}
