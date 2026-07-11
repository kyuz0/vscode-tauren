/** Transport-neutral composer completion contract. */
export type ComposerCompletionItem = {
  id: string;
  value: string;
  label: string;
  description?: string;
};

export type ComposerCompletionRequest = {
  id: string;
  revision: number;
  text: string;
  selectionStart: number;
  selectionEnd: number;
};

export type ComposerCompletionResult = {
  id: string;
  revision: number;
  items: ComposerCompletionItem[];
  capabilities: ComposerCompletionCapabilities;
};

export type ComposerCompletionApplication = {
  id: string;
  revision: number;
  itemId: string;
};

export type ComposerCompletionApplied = {
  id: string;
  revision: number;
  text: string;
  selectionStart: number;
  selectionEnd: number;
};

export type ComposerCompletionCapabilities = {
  triggerCharacters: string[];
  generation: number;
};
