"use client";

import { useState } from "react";

type ImagePickerModalProps = {
  onCancel: () => void;
  onSelect: (url: string) => void;
};

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
    return "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><rect width='100%' height='100%' fill='white'/><text x='50%' y='55%' text-anchor='middle' font-size='260'>" + emoji + "</text></svg>");
  }

  return <div className="image-picker-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="image-picker-modal" role="dialog" aria-modal="true" aria-labelledby="image-picker-title"><button className="modal-close" onClick={onCancel} aria-label="Fechar">×</button><h2 id="image-picker-title">Selecionar imagem</h2><div className="image-picker-tabs"><button className={tab === "files" ? "active" : ""} onClick={() => setTab("files")}>▱　Arquivos</button><button className={tab === "url" ? "active" : ""} onClick={() => setTab("url")}>▧　URL</button><button className={tab === "upload" ? "active" : ""} onClick={() => setTab("upload")}>↥　Enviar</button><button className={tab === "emoji" ? "active" : ""} onClick={() => setTab("emoji")}>☺　Emoji</button></div>{tab === "files" && <div className="image-library-grid">{mockColors.map((color) => <button key={color} className="asset-thumb" style={{ background: color }} onClick={() => onSelect(mockImage(color))} aria-label="Selecionar imagem" />)}</div>}{tab === "url" && <div className="image-url-panel"><label>URL da imagem<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://exemplo.com/imagem.jpg" /></label><button className="primary-btn" disabled={!url.trim()} onClick={() => onSelect(url.trim())}>Usar URL</button></div>}{tab === "upload" && <label className="image-dropzone">↥<strong>Arraste suas imagens ou navegue</strong><span>Formatos suportados: JPEG, PNG, GIF, WEBP | Tamanho máximo: 5MB</span><span className="outline-btn">↥　Selecionar arquivo</span><input type="file" accept="image/*" onChange={(event) => chooseFile(event.target.files?.[0])} /></label>}{tab === "emoji" && <div className="emoji-panel"><div className="emoji-categories"><button className="active">Rostos</button><button>Gestos</button><button>Pessoas</button><button>Animais</button><button>Plantas</button><button>Comidas</button></div><div className="emoji-grid">{emojis.map((emoji) => <button key={emoji} onClick={() => onSelect(mockEmoji(emoji))}>{emoji}</button>)}</div></div>}</div></div>;
}
