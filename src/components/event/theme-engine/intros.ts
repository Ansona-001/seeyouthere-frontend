/**
 * Opening covers by the theme's `intro` value: constant same-origin files under public/, never user input.
 * The artwork is painted on a white ground and drawn with `mix-blend-mode: multiply`, so the white drops into the
 * paper colour while the satin and petal shading stay (a cut-out would eat the ivory highlights).
 */
export const INTROS = {
  wisteria: {
    bow: { src: "/themes/wisteria-bow.webp", width: 960, height: 907 },
    strand: { src: "/themes/wisteria-strand.webp", width: 520, height: 2757 },
  },
} as const;
export type IntroKey = keyof typeof INTROS;
