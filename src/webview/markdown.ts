import type { MarkdownRenderer } from './types';

const markdownRenderer: MarkdownRenderer | undefined = window.markdownit
  ? window.markdownit({
    html: false,
    linkify: true,
    breaks: false,
    highlight: highlightCode
  })
  : undefined;

export function renderMarkdownInto(element: HTMLElement, text: string): void {
  if (!markdownRenderer || !window.DOMPurify) {
    element.textContent = text;
    return;
  }

  element.classList.add('message__body--markdown');

  const rendered = markdownRenderer.render(text);
  element.innerHTML = window.DOMPurify.sanitize(rendered, {
    USE_PROFILES: { html: true }
  });
}

function highlightCode(code: string, language: string): string {
  if (!window.hljs || typeof language !== 'string' || language.length === 0) {
    return escapeHtml(code);
  }

  const normalizedLanguage = normalizeCodeLanguage(language);

  if (!window.hljs.getLanguage(normalizedLanguage)) {
    return escapeHtml(code);
  }

  try {
    return window.hljs.highlight(code, {
      language: normalizedLanguage,
      ignoreIllegals: true
    }).value;
  } catch {
    return escapeHtml(code);
  }
}

function normalizeCodeLanguage(language: string): string {
  const normalized = language.toLowerCase().trim();
  const aliases: Record<string, string> = {
    cjs: 'javascript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    shell: 'bash',
    sh: 'bash',
    ts: 'typescript',
    tsx: 'typescript',
    yml: 'yaml'
  };

  return aliases[normalized] || normalized;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
