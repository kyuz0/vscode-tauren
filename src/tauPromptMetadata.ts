const visibleSystemPromptStartMarker = '<!-- tau:visible-system-prompt:start -->';
const visibleSystemPromptEndMarker = '<!-- tau:visible-system-prompt:end -->';
const ideContextStartMarker = '<!-- tau:ide-context:start -->';
const ideContextEndMarker = '<!-- tau:ide-context:end -->';

export function stripTauPromptMetadata(text: string): string {
  return stripLeadingSkillBlock(stripLeadingMarkedBlock(
    stripLeadingMarkedBlock(text, visibleSystemPromptStartMarker, visibleSystemPromptEndMarker),
    ideContextStartMarker,
    ideContextEndMarker
  ));
}

function stripLeadingMarkedBlock(text: string, startMarker: string, endMarker: string): string {
  const startIndex = text.indexOf(startMarker);

  if (startIndex === -1 || text.slice(0, startIndex).trim()) {
    return text;
  }

  const endIndex = text.indexOf(endMarker, startIndex + startMarker.length);

  if (endIndex === -1) {
    return text;
  }

  return text.slice(endIndex + endMarker.length).replace(/^\s+/, '');
}

function stripLeadingSkillBlock(text: string): string {
  const match = text.match(/^<skill name="[^"]+" location="[^"]+">\n[\s\S]*?\n<\/skill>(?:\n\n([\s\S]*))?$/);

  if (!match) {
    return text;
  }

  return (match[1] ?? '').trim();
}
