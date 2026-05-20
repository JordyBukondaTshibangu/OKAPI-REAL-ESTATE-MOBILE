import { Linking } from "react-native";

export function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  Linking.openURL(`https://wa.me/${cleaned}?text=${encoded}`);
}

export function openPhone(phone: string) {
  Linking.openURL(`tel:${phone}`);
}
