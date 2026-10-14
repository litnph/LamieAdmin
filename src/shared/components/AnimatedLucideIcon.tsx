import React, {
  useEffect,
  useRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
} from "react";
import type { LucideIcon } from "@/shared/icons/lucideAnimated";
import { useAdminTheme } from "@/shared/theme/ThemeContext";
import { ArrowRightIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/arrow-right";
import { BoxesIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/boxes";
import { CalendarDaysIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/calendar-days";
import { CartIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/cart";
import { ChartLineIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/chart-line";
import { ClipboardCheckIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/clipboard-check";
import { KeyIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/key";
import { LayoutGridIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/layout-grid";
import { MenuIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/menu";
import { PaletteIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/palette";
import { PanelLeftOpenIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/panel-left-open";
import { PlusIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/plus";
import { SettingsIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/settings";
import { ShieldCheckIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/shield-check";
import { SparklesIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/sparkles";
import { UserRoundCogIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/user-round-cog";
import { UsersIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/users";
import { WalletIcon } from "../../../docs/LAMIE_UI_UX/motion-source/icons/wallet";

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type AnimatedSourceProps = HTMLAttributes<HTMLSpanElement> & {
  size?: number;
};

type AnimatedSourceComponent = ForwardRefExoticComponent<
  AnimatedSourceProps & RefAttributes<AnimatedIconHandle>
>;

const source = (component: unknown) => component as AnimatedSourceComponent;

const animatedIcons: Record<string, AnimatedSourceComponent> = {
  "layout-dashboard": source(LayoutGridIcon),
  "layout-grid": source(LayoutGridIcon),
  "shopping-bag": source(CartIcon),
  cart: source(CartIcon),
  "calendar-days": source(CalendarDaysIcon),
  "contact-round": source(UsersIcon),
  users: source(UsersIcon),
  "list-checks": source(ClipboardCheckIcon),
  "flower-2": source(SparklesIcon),
  "package-open": source(BoxesIcon),
  boxes: source(BoxesIcon),
  "chart-no-axes-combined": source(ChartLineIcon),
  "chart-line": source(ChartLineIcon),
  "receipt-text": source(WalletIcon),
  wallet: source(WalletIcon),
  radio: source(SparklesIcon),
  sparkles: source(SparklesIcon),
  settings: source(SettingsIcon),
  "settings-2": source(SettingsIcon),
  "user-round-cog": source(UserRoundCogIcon),
  "shield-check": source(ShieldCheckIcon),
  "key-round": source(KeyIcon),
  key: source(KeyIcon),
  "list-tree": source(PanelLeftOpenIcon),
  "panel-left": source(PanelLeftOpenIcon),
  plus: source(PlusIcon),
  menu: source(MenuIcon),
  palette: source(PaletteIcon),
  "arrow-right": source(ArrowRightIcon),
};

type AnimatedLucideIconProps = {
  iconKey?: string | null;
  fallback: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

const MAX_ANIMATION_MS = 1200;

export const AnimatedLucideIcon: React.FC<AnimatedLucideIconProps> = ({
  iconKey,
  fallback: Fallback,
  size = 18,
  strokeWidth = 1.8,
  className,
}) => {
  const iconRef = useRef<AnimatedIconHandle>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const Icon = iconKey ? animatedIcons[iconKey] : undefined;
  const { sidebarMotionEnabled } = useAdminTheme();

  useEffect(() => {
    if (!Icon || !wrapRef.current) return;

    const trigger =
      wrapRef.current.closest<HTMLElement>("[data-animated-icon-trigger]") ??
      wrapRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stopTimer: number | undefined;

    const stop = () => {
      if (stopTimer !== undefined) window.clearTimeout(stopTimer);
      stopTimer = undefined;
      iconRef.current?.stopAnimation();
    };
    const start = () => {
      if (!sidebarMotionEnabled || reducedMotion.matches || document.hidden) {
        stop();
        return;
      }
      if (stopTimer !== undefined) window.clearTimeout(stopTimer);
      iconRef.current?.startAnimation();
      stopTimer = window.setTimeout(stop, MAX_ANIMATION_MS);
    };
    const handleFocusOut = (event: FocusEvent) => {
      if (!trigger.contains(event.relatedTarget as Node | null)) stop();
    };
    const handleVisibility = () => {
      if (document.hidden) stop();
    };
    const handleMotionPreference = () => {
      if (reducedMotion.matches) stop();
    };

    if (!sidebarMotionEnabled) {
      stop();
      return stop;
    }

    trigger.addEventListener("pointerenter", start);
    trigger.addEventListener("pointerleave", stop);
    trigger.addEventListener("pointerdown", start);
    trigger.addEventListener("focusin", start);
    trigger.addEventListener("focusout", handleFocusOut);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      stop();
      trigger.removeEventListener("pointerenter", start);
      trigger.removeEventListener("pointerleave", stop);
      trigger.removeEventListener("pointerdown", start);
      trigger.removeEventListener("focusin", start);
      trigger.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, [Icon, sidebarMotionEnabled]);

  return (
    <span
      ref={wrapRef}
      className={`inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      aria-hidden="true"
      data-lucide-animated={Icon ? iconKey : undefined}
    >
      {Icon ? (
        <Icon ref={iconRef} size={size} className="inline-flex" />
      ) : (
        <Fallback size={size} strokeWidth={strokeWidth} />
      )}
    </span>
  );
};
