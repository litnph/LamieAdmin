// Only string class names are used by the imported icons; no Tailwind merging is needed.
export const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');
