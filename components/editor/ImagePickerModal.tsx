"use client";

import { useState } from "react";

type ImagePickerModalProps = {
  onCancel: () => void;
  onSelect: (url: string) => void;
};

function PickerIcon({ type }: { type: "files" | "url" | "upload" | "emoji" | "close" }) {
  const paths = {
    files: <><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5Z" /><path d="M3 9h18" /></>,
    url: <><path d="M9.5 14.5 8 16a3 3 0 0 1-4.2-4.2l2.4-2.4A3 3 0 0 1 10.4 9" /><path d="m14.5 9.5 1.5-1.5a3 3 0 0 1 4.2 4.2l-2.4 2.4A3 3 0 0 1 13.6 15" /><path d="m8.5 15.5 7-7" /></>,
    upload: <><path d="M12 16V4" /><path d="m7.5 8.5 4.5-4.5 4.5 4.5" /><path d="M5 15v4h14v-4" /></>,
    emoji: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9h.01M15 9h.01" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };

  return <svg className="picker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export function ImagePickerModal({ onCancel, onSelect }: ImagePickerModalProps) {
  const [tab, setTab] = useState<"files" | "url" | "upload" | "emoji">("files");
  const [url, setUrl] = useState("");
  const mockColors = ["#5bd7dc", "#61d9df", "#d5b28f", "#d7dbe2", "#1e2630", "#f3c96b", "#836b53", "#4d9f88"];
  const emojis = ["😀", "😃", "😍", "😂", "😎", "🥳", "🤔", "😢", "🔥", "⭐", "❤️", "🎉", "👍", "🙏", "💡", "✅"];

  function chooseFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onSelect(String(reader.result));
    reader.readAsDataURL(file);
  }

  function mockImage(color: string) {
    return "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='900' height='520'><rect width='100%' height='100%' fill='" + color + "'/></svg>");
  }

  function mockEmoji(emoji: string) {
    return "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><text x='50%' y='55%' text-anchor='middle' font-size='260'>" + emoji + "</text></svg>");
  }

  return <div className="image-picker-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="image-picker-modal" role="dialog" aria-modal="true" aria-labelledby="image-picker-title"><button type="button" className="modal-close" onClick={onCancel} aria-label="Fechar"><PickerIcon type="close" /></button><h2 id="image-picker-title">Selecionar imagem</h2><div className="image-picker-tabs"><button type="button" className={tab === "files" ? "active" : ""} onClick={() => setTab("files")}><PickerIcon type="files" /><span>Arquivos</span></button><button type="button" className={tab === "url" ? "active" : ""} onClick={() => setTab("url")}><PickerIcon type="url" /><span>URL</span></button><button type="button" className={tab === "upload" ? "active" : ""} onClick={() => setTab("upload")}><PickerIcon type="upload" /><span>Enviar</span></button><button type="button" className={tab === "emoji" ? "active" : ""} onClick={() => setTab("emoji")}><PickerIcon type="emoji" /><span>Emoji</span></button></div>{tab === "files" && <div className="image-library-grid">{mockColors.map((color) => <button type="button" key={color} className="asset-thumb" style={{ background: color }} onClick={() => onSelect(mockImage(color))} aria-label="Selecionar imagem" />)}</div>}{tab === "url" && <div className="image-url-panel"><label>URL da imagem<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://exemplo.com/imagem.jpg" /></label><button type="button" className="primary-btn" disabled={!url.trim()} onClick={() => onSelect(url.trim())}>Usar URL</button></div>}{tab === "upload" && <label className="image-dropzone"><PickerIcon type="upload" /><strong>Arraste suas imagens ou navegue</strong><span>Formatos suportados: JPEG, PNG, GIF, WEBP | Tamanho máximo: 5MB</span><span className="outline-btn"><PickerIcon type="upload" />Selecionar arquivo</span><input type="file" accept="image/*" onChange={(event) => chooseFile(event.target.files?.[0])} /></label>}{tab === "emoji" && <div className="emoji-panel"><div className="emoji-categories"><button type="button" className="active">Rostos</button><button type="button">Gestos</button><button type="button">Pessoas</button><button type="button">Animais</button><button type="button">Plantas</button><button type="button">Comidas</button></div><div className="emoji-grid">{emojis.map((emoji) => <button type="button" key={emoji} onClick={() => onSelect(mockEmoji(emoji))}>{emoji}</button>)}</div></div>}</div></div>;
}
