import Storage from "expo-sqlite/kv-store";

import { DEFAULT_SETTINGS, parseSettings, type StudySettings } from "./index";

const KEY = "study.settings";

export function loadSettings(): StudySettings {
  try {
    return parseSettings(Storage.getItemSync(KEY));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: StudySettings): void {
  Storage.setItemSync(KEY, JSON.stringify(settings));
}
