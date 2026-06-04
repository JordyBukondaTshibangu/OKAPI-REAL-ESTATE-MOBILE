import { messages } from "./index";
import { useLocaleStore } from "../store/useLocaleStore";

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return messages[locale];
}
