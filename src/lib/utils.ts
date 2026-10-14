// The animated icon sources only need a small string class-name joiner.
export const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');
