import { NotificationBell } from "@/components/app-shell/notification-panel";

/**
 * Floating Bell-Button im Top-Right der App. Bewusst KEIN Page-Title hier — den
 * liefern die existierenden ScreenHeader-Komponenten der Pages selbst, bis
 * Stages 1-3 die Pages neu bauen. Nach Stage 1-3 kann das hier zur vollwertigen
 * TopBar mit Title ausgebaut werden.
 */
export function TopBar() {
  return <NotificationBell />;
}
