/** Transport-neutral composer completion contract. */
export type ComposerCompletionItem = {
  id: string;
  value: string;
  label: string;
  description?: string;
};

export type ComposerCompletionRequest = {
  id: string;
  text: string;
  selectionStart: number;
  selectionEnd: number;
};

export type ComposerCompletionResult = {
  id: string;
  items: ComposerCompletionItem[];
};

export type ComposerCompletionApplication = {
  id: string;
  itemId: string;
};

export type ComposerCompletionApplied = {
  id: string;
  text: string;
  selectionStart: number;
  selectionEnd: number;
};
