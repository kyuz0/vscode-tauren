import type { NavigationController } from '../navigation/navigationController';
import type { WebviewSettingsSection, WebviewSettingsState, WebviewSettingsViewState } from '../webviewProtocol/types';

const defaultSettingsSection: WebviewSettingsSection = 'appearance';

export class SettingsViewController {
  private activeSection: WebviewSettingsSection = defaultSettingsSection;
  private settings: WebviewSettingsState = { values: {} };

  public constructor(
    private readonly navigation: NavigationController,
    private readonly postState: () => void
  ) {}

  public get isSettingsVisible(): boolean {
    return this.navigation.isSettingsVisible;
  }

  public getWebviewState(): WebviewSettingsViewState {
    return {
      ...(this.activeSection === defaultSettingsSection ? {} : { activeSection: this.activeSection }),
      settings: this.settings
    };
  }

  public setSettings(settings: WebviewSettingsState): void {
    this.settings = {
      values: { ...settings.values },
      ...(settings.pending ? { pending: settings.pending.slice() } : {}),
      ...(settings.errors ? { errors: { ...settings.errors } } : {})
    };
  }

  public toggleSettings(): void {
    if (this.navigation.isSettingsVisible) {
      this.hideSettings();
      return;
    }

    this.showSettings();
  }

  public showSettings(): void {
    this.navigation.showChatFace('settings');
  }

  public hideSettings(options: { post?: boolean } = {}): void {
    this.navigation.hideChatFace(options);
  }

  public setActiveSection(section: WebviewSettingsSection): void {
    if (this.activeSection === section) {
      return;
    }

    this.activeSection = section;
    this.postState();
  }
}
