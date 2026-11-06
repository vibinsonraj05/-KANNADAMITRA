import { sourceLanguages } from "@/lib/languages";

export const SOURCE_LANGUAGE_KEY = "kannadamitra-source";
export const SOURCE_LANGUAGE_EVENT = "kannadamitra-source-language-change";
const defaultCode = "en";

export function getPreferredSourceLanguage() {
  const saved = localStorage.getItem(SOURCE_LANGUAGE_KEY);
  return sourceLanguages.some(language => language.code === saved) ? saved! : defaultCode;
}

export function setPreferredSourceLanguage(code: string) {
  const validCode = sourceLanguages.some(language => language.code === code) ? code : defaultCode;
  localStorage.setItem(SOURCE_LANGUAGE_KEY, validCode);
  window.dispatchEvent(new CustomEvent(SOURCE_LANGUAGE_EVENT, { detail: validCode }));
  return validCode;
}

export function subscribeToSourceLanguage(onChange: (code: string) => void) {
  const handleSameTab = (event: Event) => {
    const code = (event as CustomEvent<string>).detail;
    if (sourceLanguages.some(language => language.code === code)) onChange(code);
  };
  const handleOtherTab = (event: StorageEvent) => {
    if (event.key === SOURCE_LANGUAGE_KEY && event.newValue) {
      if (sourceLanguages.some(language => language.code === event.newValue)) onChange(event.newValue);
    }
  };
  window.addEventListener(SOURCE_LANGUAGE_EVENT, handleSameTab);
  window.addEventListener("storage", handleOtherTab);
  return () => {
    window.removeEventListener(SOURCE_LANGUAGE_EVENT, handleSameTab);
    window.removeEventListener("storage", handleOtherTab);
  };
}
