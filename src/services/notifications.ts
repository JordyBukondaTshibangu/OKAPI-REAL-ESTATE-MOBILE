import * as Device from "expo-device";
import { Platform } from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import { API_URL } from "../constants/api";

// expo-notifications crashes at import time in Expo Go SDK 53+ (Android remote
// notifications were removed). Use lazy require() so the module is never loaded
// when running inside Expo Go — static `import` is hoisted and runs before any
// guard can stop it, but require() only runs when called.
const isExpoGo = Constants.appOwnership === "expo";

if (!isExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Requests permission, obtains the Expo push token, and saves it to the backend.
 * Safe to call on every app launch — the backend only writes if the token changed.
 * Returns the token string, or null if permissions were denied or not a physical device.
 */
export async function registerForPushNotifications(authToken: string): Promise<string | null> {
  if (isExpoGo) {
    console.log("[push] Skipping — Expo Go does not support remote push notifications (SDK 53+)");
    return null;
  }
  if (!Device.isDevice) {
    console.log("[push] Skipping — not a physical device");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require("expo-notifications");

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] Permission denied");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("alerts", {
      name: "Alertes immobilières",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4AF37",
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: "6010ebbc-d6b3-4f35-bfef-0dad2c42f919",
    });

    await axios.patch(
      `${API_URL}/users/me/push-token`,
      { token },
      { headers: { Authorization: `Bearer ${authToken}` } },
    );

    console.log("[push] Token registered:", token);
    return token;
  } catch (err) {
    console.warn("[push] Failed to register push token:", err);
    return null;
  }
}
