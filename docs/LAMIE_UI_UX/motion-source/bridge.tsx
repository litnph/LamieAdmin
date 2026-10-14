import React from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal, flushSync } from 'react-dom';
import { MotionConfig } from 'motion/react';
import { LayoutGridIcon } from './icons/layout-grid';
import { CartIcon } from './icons/cart';
import { CalendarDaysIcon } from './icons/calendar-days';
import { UsersIcon } from './icons/users';
import { ClipboardCheckIcon } from './icons/clipboard-check';
import { BoxesIcon } from './icons/boxes';
import { ChartLineIcon } from './icons/chart-line';
import { WalletIcon } from './icons/wallet';
import { SparklesIcon } from './icons/sparkles';
import { SettingsIcon } from './icons/settings';
import { UserRoundCogIcon } from './icons/user-round-cog';
import { ShieldCheckIcon } from './icons/shield-check';
import { KeyIcon } from './icons/key';
import { PanelLeftOpenIcon } from './icons/panel-left-open';
import { PlusIcon } from './icons/plus';
import { CheckIcon } from './icons/check';
import { SearchIcon } from './icons/search';
import { DownloadIcon } from './icons/download';
import { UploadIcon } from './icons/upload';
import { CircleCheckIcon } from './icons/circle-check';
import { ArrowRightIcon } from './icons/arrow-right';
import { MenuIcon } from './icons/menu';
import { PaletteIcon } from './icons/palette';
import { TruckIcon } from './icons/truck';

// The icon components above are verbatim upstream Lucide Animated sources.
// This adapter gives the existing vanilla prototype one React portal tree.
const components = {
  'layout-dashboard': LayoutGridIcon, 'shopping-bag': CartIcon,
  'calendar-days': CalendarDaysIcon, users: UsersIcon,
  'list-checks': ClipboardCheckIcon, package: BoxesIcon,
  'chart-no-axes-combined': ChartLineIcon, wallet: WalletIcon,
  sparkles: SparklesIcon, 'settings-2': SettingsIcon, settings: SettingsIcon,
  'contact-round': UserRoundCogIcon, 'shield-check': ShieldCheckIcon,
  'key-round': KeyIcon, 'panel-left': PanelLeftOpenIcon,
  plus: PlusIcon, check: CheckIcon, search: SearchIcon,
  download: DownloadIcon, upload: UploadIcon,
  'check-circle-2': CircleCheckIcon, 'circle-check': CircleCheckIcon,
  'arrow-right': ArrowRightIcon, menu: MenuIcon, palette: PaletteIcon,
  truck: TruckIcon
};
const sourceNames = {
  'layout-dashboard': 'layout-grid', 'shopping-bag': 'cart',
  'list-checks': 'clipboard-check', package: 'boxes',
  'chart-no-axes-combined': 'chart-line', 'settings-2': 'settings',
  'contact-round': 'user-round-cog', 'key-round': 'key',
  'panel-left': 'panel-left-open', 'check-circle-2': 'circle-check'
};
type Handle = { startAnimation: () => void; stopAnimation: () => void };
type Entry = { host: HTMLElement; button: HTMLElement; name: string;
  id: number; size: number; handle: Handle | null; timer?: number; playing: boolean };
const entries = new Map<HTMLElement, Entry>();
const attached = new WeakSet<HTMLElement>();
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const tree = createRoot(document.createElement('div'));
const selector = 'button.lm-nav-item,button.lm-btn,button.lm-icon-btn,button.lm-text-btn,button.lm-screen-link';
let serial = 0;

function redraw() {
  flushSync(() => tree.render(
    <MotionConfig reducedMotion="user">
      {[...entries.values()].map(entry => {
        const Component = components[entry.name];
        return createPortal(<Component
          key={`${entry.id}-${preference.matches}`}
          ref={(handle: Handle | null) => { entry.handle = handle; }}
          className="lm-motion-glyph" size={entry.size} aria-hidden="true"
        />, entry.host, String(entry.id));
      })}
    </MotionConfig>
  ));
}

function stop(entry: Entry) {
  clearTimeout(entry.timer);
  entry.playing = false;
  if (entry.host.isConnected && !preference.matches) entry.handle?.stopAnimation();
}

function play(button: HTMLElement | null) {
  if (!button || preference.matches || button.matches(':disabled,[aria-disabled="true"]') || document.hidden) return;
  for (const entry of entries.values()) {
    if (entry.button !== button || entry.playing || !entry.host.isConnected) continue;
    entry.playing = true;
    entry.handle?.startAnimation();
    // Bound the upstream effects, including icons whose own hover variant loops.
    entry.timer = window.setTimeout(() => stop(entry), 1200);
  }
}

function buttonFor(event: Event) {
  return event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
}

function attach(container: HTMLElement) {
  if (attached.has(container)) return;
  attached.add(container);
  container.addEventListener('pointerover', (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const button = buttonFor(event);
    if (button && !(event.relatedTarget instanceof Node && button.contains(event.relatedTarget))) play(button);
  });
  container.addEventListener('pointerout', (event: PointerEvent) => {
    const button = buttonFor(event);
    if (!button || (event.relatedTarget instanceof Node && button.contains(event.relatedTarget))) return;
    for (const entry of entries.values()) if (entry.button === button) stop(entry);
  });
  container.addEventListener('focusin', event => play(buttonFor(event)));
  container.addEventListener('focusout', event => {
    const button = buttonFor(event);
    for (const entry of entries.values()) if (entry.button === button) stop(entry);
  });
  container.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') play(buttonFor(event));
  });
  container.addEventListener('click', event => {
    const button = buttonFor(event);
    const destination = button?.dataset.go;
    // Navigation replaces the DOM. Animate the new active item after the click.
    if (destination) queueMicrotask(() => play(container.querySelector(`.lm-nav-item.lm-active[data-go="${CSS.escape(destination)}"]`)));
  }, true);
  new MutationObserver(() => {
    let changed = false;
    for (const [host, entry] of entries) if (!host.isConnected) {
      clearTimeout(entry.timer); entries.delete(host); changed = true;
    }
    if (changed) redraw();
  }).observe(container, {childList: true, subtree: true});
}

function enhance(container: HTMLElement) {
  attach(container);
  let changed = false;
  for (const [host, entry] of entries) if (!host.isConnected) {
    clearTimeout(entry.timer); entries.delete(host); changed = true;
  }
  for (const icon of container.querySelectorAll<HTMLElement>('i[data-lucide]')) {
    const name = icon.dataset.lucide!;
    const button = icon.closest<HTMLElement>(selector);
    // Dense data, statuses, product illustrations and unsupported icons stay static.
    if (!components[name] || !button || icon.closest('.lm-tablewrap,.lm-badge,.lm-thumb')) continue;
    const host = document.createElement('span');
    host.className = 'lm-motion-icon';
    host.dataset.lmIcon = sourceNames[name] || name;
    host.setAttribute('aria-hidden', 'true');
    const size = button.classList.contains('lm-nav-item') ? 17 : button.classList.contains('lm-text-btn') ? 14 : 18;
    host.style.setProperty('--lm-icon-size', size + 'px');
    icon.replaceWith(host);
    entries.set(host, {host, button, name, id: ++serial, size, handle: null, playing: false});
    changed = true;
  }
  if (changed) redraw();
}

preference.addEventListener('change', () => {
  for (const entry of entries.values()) { clearTimeout(entry.timer); entry.playing = false; }
  // Remounting restores original SVG values immediately, including opacity/path drawing.
  redraw();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) for (const entry of entries.values()) stop(entry);
});
(window as any).LamieMotion = { enhance, source: 'https://lucide-animated.com', iconCount: 24 };
