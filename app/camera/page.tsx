"use client";

import { useEffect, useRef, useState } from "react";
import Speak from "@/components/Speak";
import Icon from "@/components/Icon";
import { HISTORY_KEY, SAVED_KEY, makeRecord, readRecords, writeRecords, type TranslationRecord } from "@/lib/translation-storage";
import { sourceLanguages } from "@/lib/languages";
import { getPreferredSourceLanguage, setPreferredSourceLanguage, subscribeToSourceLanguage } from "@/lib/source-language-preference";

const languages = sourceLanguages;

export default function CameraPage() {
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState("en");
  const [tone, setTone] = useState<"formal" | "casual">("casual");
  const [style, setStyle] = useState<"natural" | "literal">("natural");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [translateBusy, setTranslateBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [output, setOutput] = useState<{ kannada: string; roman: string; meaning: string } | null>(null);
  const [record, setRecord] = useState<TranslationRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSource(getPreferredSourceLanguage());
    const unsubscribe = subscribeToSourceLanguage(setSource);
    setTone(localStorage.getItem("kannadamitra-tone") === "formal" ? "formal" : "casual");
    setStyle(localStorage.getItem("kannadamitra-style") === "literal" ? "literal" : "natural");
    return () => {
      unsubscribe();
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    const video = videoRef.current;
    if (!cameraOpen || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    void video.play().catch(() => setError("The camera preview could not start. Please retry."));
  }, [cameraOpen]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    setError("");
    setNotice("");
    if (!window.isSecureContext && location.hostname !== "localhost") {
      setError("Camera access requires a secure HTTPS connection.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Live camera capture is not supported in this browser. Try the latest Chrome, Edge, or Safari on HTTPS.");
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setCameraOpen(true);
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      setError(name === "NotAllowedError" || name === "SecurityError" ? "Camera permission was denied. Allow camera access in your browser, then try again." : name === "NotFoundError" ? "No camera was found on this device." : "Could not open the camera. Check that it is not being used by another app, then retry.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("The camera is still starting. Please wait a moment and try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) { setError("Could not capture this frame. Please retry."); return; }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) { setError("Could not capture this frame. Please retry."); return; }
      if (blob.size > 4 * 1024 * 1024) { setError("This photo is still larger than 4 MB. Move closer and capture again."); return; }
      const captured = new File([blob], `kannadamitra-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(captured);
      setPreview(URL.createObjectURL(blob));
      setText("");
      setOutput(null);
      setRecord(null);
      setSaved(false);
      setError("");
      setNotice("");
      stopCamera();
    }, "image/jpeg", 0.84);
  };

  const retake = async () => {
    setFile(null);
    setPreview("");
    setText("");
    setOutput(null);
    setRecord(null);
    setSaved(false);
    await openCamera();
  };

  const analyzeImage = async () => {
    if (!file || ocrBusy) return;
    setError("");
    setNotice("");
    setOcrBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the captured photo."));
        reader.onerror = () => reject(new Error("Could not read the captured photo."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl, mimeType: file.type }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Image analysis failed.");
      setText(data.text);
      setNotice("Image analyzed. Review the recognized text before translating.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not analyze this photo. Please retry.");
    } finally { setOcrBusy(false); }
  };

  const translate = async () => {
    if (!text.trim() || translateBusy) return;
    setError("");
    setNotice("");
    setOutput(null);
    setTranslateBusy(true);
    try {
      const response = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, source, target: "Kannada", tone, style }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Translation failed.");
      setOutput(data);
      setSaved(false);
      const language = languages.find(item => item.code === source)?.label || "English";
      const entry = makeRecord({ source: text, sourceLanguage: language, kind: "camera", ...data, tone, style });
      setRecord(entry);
      writeRecords(HISTORY_KEY, [entry, ...readRecords(HISTORY_KEY)].slice(0, 100));
      void fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ record: entry }) }).then(async response => {
        if (!response.ok) { const detail = await response.json().catch(() => ({})); setNotice(detail.message || "Translated, but could not sync history to Atlas."); }
      }).catch(() => setNotice("Translated, but could not sync history to Atlas."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reach the translation service. Please retry.");
    } finally { setTranslateBusy(false); }
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice("Copied to clipboard."); }
    catch { setNotice("Clipboard access is unavailable. Select and copy the text."); }
  };

  const save = () => {
    if (!record || saved) return;
    const ok = writeRecords(SAVED_KEY, [record, ...readRecords(SAVED_KEY)].slice(0, 100));
    if (ok) { setSaved(true); setNotice("Saved on this device."); }
    else setNotice("Could not save in browser storage.");
  };

  return <div className="camera-page">
    <div className="library-title"><div><div className="eyebrow">CAMERA TRANSLATION</div><h1>Capture, analyze, translate.</h1><p className="subhead">Point your camera at a sign, menu, or note. Gemini will read it, then translate it into Kannada.</p></div></div>
    <div className="camera-grid">
      <section className="translate-panel camera-step-panel" aria-label="Capture a photo">
        <div className="camera-step-heading"><span className="camera-step-number">01</span><div><h2>Capture</h2><p>Frame text in good light.</p></div></div>
        {cameraOpen ? <div className="live-camera-frame"><video ref={videoRef} autoPlay playsInline muted aria-label="Live camera preview"/><div className="camera-viewfinder" aria-hidden="true"><i/><i/><i/><i/></div><div className="live-camera-actions"><button className="btn ghost" type="button" onClick={stopCamera}>Cancel</button><button className="btn camera-shutter" type="button" onClick={capturePhoto}><Icon name="camera"/> Capture</button></div></div> : preview ? <div className="captured-photo"><img src={preview} alt="Captured sign or printed text"/><button className="btn ghost small retake-button" type="button" onClick={() => void retake()}><Icon name="camera"/> Retake</button></div> : <button className="camera-start-card" type="button" onClick={() => void openCamera()}><span className="camera-start-icon"><Icon name="camera"/></span><strong>Open camera</strong><small>Capture text from the camera</small></button>}
        {!cameraOpen && !preview && <p className="camera-privacy-note">Camera starts only when you tap Open camera.</p>}
        {preview && <button className="btn translate-submit analyze-button" type="button" disabled={ocrBusy} onClick={() => void analyzeImage()}>{ocrBusy ? <><span className="spinner"/> Analyzing…</> : <><Icon name="sparkle"/> Analyze with Gemini</>}</button>}
      </section>
      <section className="translate-panel camera-step-panel" aria-label="Review detected text">
        <div className="camera-step-heading"><span className="camera-step-number">02</span><div><h2>Review</h2><p>Check and edit the text.</p></div></div>
        <label className="field camera-source">Text language<select value={source} onChange={event => { setSource(event.target.value); setPreferredSourceLanguage(event.target.value); }}>{languages.map(language => <option value={language.code} key={language.code}>{language.label}</option>)}</select></label>
        <label className="field">Detected text<textarea rows={8} maxLength={12_000} value={text} placeholder={ocrBusy ? "Analyzing captured photo…" : "Analyze a captured photo to detect text."} onChange={event => { setText(event.target.value); setOutput(null); }}/></label>
      </section>
      <section className="result-panel camera-step-panel camera-translate-panel" aria-label="Kannada translation" aria-live="polite">
        <div className="camera-step-heading"><span className="camera-step-number">03</span><div><h2>Translate</h2><p>Convert your text to Kannada.</p></div></div>
        <button className="btn translate-submit camera-translate-button" type="button" disabled={translateBusy || !text.trim()} onClick={() => void translate()}>{translateBusy ? <><span className="spinner"/> Translating…</> : "Translate to Kannada"}</button>
        {output ? <><div className="camera-translation-output"><div lang="kn" className="result-script">{output.kannada}</div><div className="result-roman">{output.roman}</div><div className="result-meaning"><span>Meaning in English</span><p>{output.meaning}</p></div></div><div className="result-actions"><Speak text={output.kannada} pronunciation={output.roman} label="Listen to Kannada translation"/><button className="result-action" type="button" onClick={() => void copy(output.kannada)}><Icon name="copy"/><span>Copy Kannada</span></button><button className="result-action save-action" type="button" disabled={saved} onClick={save}>{saved ? <Icon name="check"/> : <Icon name="bookmark"/>}<span>{saved ? "Saved" : "Save"}</span></button></div></> : <div className="translation-empty camera-translation-empty"><span className="empty-symbol"><Icon name="language"/></span><p>Your Kannada translation appears here.</p></div>}
      </section>
    </div>
    {error && <p className="translator-error camera-flow-message" role="alert">{error}</p>}{notice && <p className="inline-notice camera-flow-message" role="status">{notice}</p>}
  </div>;
}
