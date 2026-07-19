import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "okapi_device_session_id";

/**
 * Returns a stable device-level session UUID persisted in AsyncStorage.
 * Used to deduplicate property view/share/whatsapp tracking for
 * anonymous (non-logged-in) visitors across app launches.
 */
export async function getOrCreateDeviceSessionId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    // Generate a UUID-like string without external deps
    const id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
    await AsyncStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "";
  }
}
