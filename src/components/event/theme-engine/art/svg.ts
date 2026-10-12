import { createElement, type ReactElement } from "react";

/**
 * Static SVG geometry as plain data (generated from `design/art/*.svg`), turned
 * into React elements without JSX so the node test runner can import and render
 * it. Nothing here is user input: every tree is a compile-time constant, and the
 * only per-mount value (a clip-path id) is substituted from `useId`.
 */
export type SvgAttrs = Readonly<Record<string, string | Readonly<Record<string, string>>>>;
export type SvgNode = readonly [tag: string, attrs: SvgAttrs, children?: readonly SvgNode[]];

/** Rewrites `from` to `to` inside string attributes (used to make an `id` unique per mount). */
export type IdScope = readonly [from: string, to: string];

function build(node: SvgNode, scope: IdScope | undefined): ReactElement {
  const [tag, attrs, children] = node;
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attrs)) {
    props[name] = scope && typeof value === "string" ? value.replaceAll(scope[0], scope[1]) : value;
  }
  // Children are passed as varargs, so no React keys are needed.
  return createElement(tag, props, ...(children ?? []).map((child) => build(child, scope)));
}

/** The element for `node`, with `extra` props (class, size, ...) merged onto the root. */
export function svgEl(node: SvgNode, extra: Record<string, unknown> = {}, scope?: IdScope): ReactElement {
  const root = build(node, scope);
  return createElement(root.type, { ...(root.props as object), ...extra });
}

/** Intrinsic `[width, height]` of a tree's `viewBox` (for tiling). */
export function viewSize(node: SvgNode): readonly [number, number] {
  const box = String(node[1].viewBox ?? "").split(" ").map(Number);
  const [w, h] = [box[2], box[3]];
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? [w, h] : [100, 100];
}
