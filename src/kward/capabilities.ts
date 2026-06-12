import type { PiSettingId } from '../settings/settingsRegistry';
import { isRecord } from '../shared/typeGuards';
import type { KwardCapabilities } from './types';

export class KwardCapabilityResolver {
  public constructor(private readonly capabilities: KwardCapabilities) {}

  public isGroupSupported(groupName: string): boolean {
    const group = this.getGroup(groupName);
    return group === true || (isRecord(group) && group.supported === true);
  }

  public isMethodSupported(groupName: string, method: string): boolean {
    const group = this.getGroup(groupName);
    if (!isRecord(group)) {
      return false;
    }

    const methods = group.methods;
    return group.supported === true && Array.isArray(methods) && methods.includes(method);
  }

  public isSessionFeatureSupported(featureName: string): boolean {
    const sessions = this.getGroup('sessions');
    const feature = isRecord(sessions) ? sessions[featureName] : undefined;
    return isRecord(feature) && feature.supported === true;
  }

  public isTreeFeatureSupported(featureName: 'labels' | 'navigate' | 'summarize'): boolean {
    const sessions = this.getGroup('sessions');
    const tree = isRecord(sessions) ? sessions.tree : undefined;
    return isRecord(tree) && tree.supported === true && tree[featureName] === true;
  }

  public isRuntimeSettingSupported(settingId: PiSettingId): boolean {
    const runtimeSettings = this.getGroup('runtimeSettings');
    if (!isRecord(runtimeSettings) || runtimeSettings.supported !== true) {
      return false;
    }

    const settings = runtimeSettings.settings;
    return Array.isArray(settings) && settings.includes(settingId);
  }

  public isBusyInputModeSupported(mode: 'steer' | 'followUp'): boolean {
    const turns = this.getGroup('turns');
    const busyInput = isRecord(turns) ? turns.busyInput : undefined;
    const value = isRecord(busyInput) ? busyInput[mode] : undefined;
    return typeof value === 'string' && value !== 'unsupported';
  }

  public isAttachmentInputSupported(): boolean {
    const attachments = this.getGroup('attachments');
    const input = isRecord(attachments) ? attachments.input : undefined;
    return isRecord(input) && input.supported === true;
  }

  private getGroup(groupName: string): unknown {
    return this.capabilities[groupName];
  }
}
