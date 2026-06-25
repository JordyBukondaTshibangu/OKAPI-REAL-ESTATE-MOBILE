import { Linking, Alert } from "react-native";

/**
 * Safely open a URL (mailto:, tel:, https:, etc.).
 * Shows an alert instead of crashing when the URL scheme is not supported
 * (e.g. no email client configured, simulator without dialer, etc.)
 */
export async function openURL(url: string, fallbackMessage?: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Extract a human-readable value from the URL for the alert body
      const display = url
        .replace(/^mailto:/, "")
        .replace(/^tel:/, "")
        .split("?")[0];

      Alert.alert(
        "Impossible d'ouvrir",
        fallbackMessage ?? `Veuillez utiliser : ${display}`,
      );
    }
  } catch {
    const display = url.replace(/^mailto:/, "").replace(/^tel:/, "").split("?")[0];
    Alert.alert(
      "Impossible d'ouvrir",
      fallbackMessage ?? `Veuillez utiliser : ${display}`,
    );
  }
}
