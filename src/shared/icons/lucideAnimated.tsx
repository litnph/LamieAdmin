/**
 * Static Lucide facade used by the application content.
 *
 * Animated icons intentionally live in AnimatedLucideIcon and are mounted only
 * by the sidebar. Keeping this import path avoids a broad, risky component
 * migration while ensuring tables, cards, dialogs and regular buttons remain
 * static.
 */
export * from 'lucide-react';
