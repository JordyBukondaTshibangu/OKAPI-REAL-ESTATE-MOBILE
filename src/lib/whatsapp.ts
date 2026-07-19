import { Linking } from "react-native";
import { getPropertyUrl } from "../constants/web";

export function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  Linking.openURL(`https://wa.me/${cleaned}?text=${encoded}`);
}

/**
 * Builds the WhatsApp inquiry message for a property, using the locale's
 * message template and substituting the property link and reference.
 */
export function buildPropertyWhatsAppMessage(
  template: string,
  propertyId: string,
  reference?: string
) {
  return template
    .replace("{{link}}", getPropertyUrl(propertyId))
    .replace("{{ref}}", reference ?? "—");
}

export function openPhone(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

/**
 * Returns the best phone number to contact about a property: the agent's
 * WhatsApp number or phone, otherwise the listing agency's phone.
 * The backend returns `phoneNumber` / `whatsappNumber` on the agent object.
 */
export function getContactPhone(property: {
  agent?: { phone?: string; phoneNumber?: string; whatsappNumber?: string };
  agency?: { phone?: string; whatsapp?: string };
}): string {
  return (
    property.agent?.whatsappNumber ||
    property.agent?.phoneNumber ||
    property.agent?.phone ||
    property.agency?.whatsapp ||
    property.agency?.phone ||
    ""
  );
}
