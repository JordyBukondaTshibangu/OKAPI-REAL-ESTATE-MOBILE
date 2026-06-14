import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

export async function shareProperty(propertyId: string, title: string) {
  const url = `https://okapi-real-estate.com/property/${propertyId}`;
  try {
    await Share.share({ title, message: `${title}\n${url}`, url });
  } catch {
    await Clipboard.setStringAsync(url);
  }
}
