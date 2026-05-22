import type { ExtensionUIContext } from '@earendil-works/pi-coding-agent';

export type MaybePromise<T> = T | PromiseLike<T>;

type SdkExtensionCustomUiFactory = Parameters<ExtensionUIContext['custom']>[0];
type SdkExtensionCustomUiFactoryArgs = Parameters<SdkExtensionCustomUiFactory>;

export type ExtensionCustomUiFactory<T> = (
  tui: SdkExtensionCustomUiFactoryArgs[0],
  theme: SdkExtensionCustomUiFactoryArgs[1],
  keybindings: SdkExtensionCustomUiFactoryArgs[2],
  done: (result: T) => void
) => ReturnType<SdkExtensionCustomUiFactory>;
export type ExtensionCustomUiOptions = Parameters<ExtensionUIContext['custom']>[1];

export type ExtensionUi = {
  notify(message: string, notifyType: string): void;
  select(title: string, options: string[]): MaybePromise<string | undefined>;
  confirm(title: string, message: string | undefined): MaybePromise<boolean | undefined>;
  input(title: string, placeholder: string | undefined): MaybePromise<string | undefined>;
  custom?<T>(factory: ExtensionCustomUiFactory<T>, options?: ExtensionCustomUiOptions): MaybePromise<T | undefined>;
};

export function createCancellingExtensionUi(
  notify: (message: string, notifyType: string) => void
): ExtensionUi {
  return {
    notify,
    select: async () => undefined,
    confirm: async () => undefined,
    input: async () => undefined,
    custom: async () => undefined
  };
}
