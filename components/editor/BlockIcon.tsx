export function BlockIcon({ item }: { item: string }) {
  const icon = item === "Imagem"
    ? <><rect x="3.5" y="4" width="17" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4.5 17 4.5-4.5 3.5 3 2.5-2.5 4.5 4" /></>
    : <circle cx="12" cy="12" r="8" />;

  return <svg className="block-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>;
}
