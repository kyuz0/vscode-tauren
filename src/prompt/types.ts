export type PiPromptContextKind = 'file' | 'selection';

export type PiPromptContextSource = 'origin';

export type PiPromptTraceOriginData = {
  historicalPath: string;
  currentRelativePath: string;
};

export type PiPromptContextInput = {
  kind: PiPromptContextKind;
  path: string;
  label?: string;
  title?: string;
  languageId?: string;
  startLine?: number;
  endLine?: number;
  note?: string;
  text?: string;
  source?: PiPromptContextSource;
  traceOrigin?: PiPromptTraceOriginData;
};

export type PiPromptContextAttachment = PiPromptContextInput & {
  id: string;
  label: string;
  title: string;
};

export type PiPromptFormattingContextAttachment = Pick<
  PiPromptContextInput,
  'kind' | 'path' | 'languageId' | 'startLine' | 'endLine' | 'note' | 'text' | 'source' | 'traceOrigin'
>;
