import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

export interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(val: string): ColorRGBA {
  const str = val.trim();
  if (str === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  if (str.startsWith("rgba")) {
    const match = str.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: parseFloat(match[4]),
      };
    }
  }
  if (str.startsWith("rgb")) {
    const match = str.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: 1,
      };
    }
  }
  let hex = str.replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b, a: 1 };
    }
  }
  throw new Error(`Invalid color value: ${val}`);
}

export function compositeColor(fg: ColorRGBA, bg: ColorRGBA): ColorRGBA {
  const fgA = Math.min(1, Math.max(0, fg.a));
  const bgA = Math.min(1, Math.max(0, bg.a));

  const outA = fgA + bgA * (1 - fgA);
  const outAClamped = Math.min(1, Math.max(0, outA));

  if (outAClamped === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const r = (fg.r * fgA + bg.r * bgA * (1 - fgA)) / outAClamped;
  const g = (fg.g * fgA + bg.g * bgA * (1 - fgA)) / outAClamped;
  const b = (fg.b * fgA + bg.b * bgA * (1 - fgA)) / outAClamped;

  return {
    r: Math.min(255, Math.max(0, r)),
    g: Math.min(255, Math.max(0, g)),
    b: Math.min(255, Math.max(0, b)),
    a: outAClamped,
  };
}

export function getLuminance(r: number, g: number, b: number): number {
  const [a, c, d] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a * 0.2126 + c * 0.7152 + d * 0.0722;
}

export function getContrast(color1: ColorRGBA, color2: ColorRGBA): number {
  if (color2.a < 1) {
    throw new Error("getContrast: background must be opaque; composite it first");
  }
  const final1 = color1.a < 1 ? compositeColor(color1, color2) : color1;
  const final2 = color2;

  const l1 = getLuminance(final1.r, final1.g, final1.b);
  const l2 = getLuminance(final2.r, final2.g, final2.b);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
}

export function parseRules(css: string): Record<string, string> {
  const rules: Record<string, string> = {};
  const regex = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    rules[match[1]] = match[2].trim();
  }
  return rules;
}

export function resolveVar(val: string, scope: Record<string, string>): string {
  let current = val;
  let iterations = 0;
  while (current.includes("var(") && iterations < 20) {
    const match = current.match(/var\((--[a-zA-Z0-9-]+)\)/);
    if (match) {
      const varName = match[1];
      const resolved = scope[varName];
      if (!resolved) {
        throw new Error(`Cannot resolve variable ${varName} inside ${val}`);
      }
      current = current.replace(match[0], resolved);
    }
    iterations++;
  }
  return current.trim();
}

export const REQUIRED_SHARED_TOKENS = [
  // Typography
  "--soe-text-xs",
  "--soe-text-sm",
  "--soe-text-base",
  "--soe-text-lg",
  "--soe-text-xl",
  "--soe-text-2xl",
  "--soe-text-3xl",
  "--soe-text-hero",

  // Line heights
  "--soe-leading-display-tight",
  "--soe-leading-heading",
  "--soe-leading-body",
  "--soe-leading-label",

  // Tracking
  "--soe-tracking-display",
  "--soe-tracking-heading",
  "--soe-tracking-eyebrow",
  "--soe-tracking-label",

  // Spacing
  "--soe-space-1",
  "--soe-space-2",
  "--soe-space-3",
  "--soe-space-4",
  "--soe-space-6",
  "--soe-space-8",
  "--soe-space-12",
  "--soe-space-16",
  "--soe-space-20",
  "--soe-space-24",
  "--soe-space-32",

  // Section spacing
  "--soe-section-space-sm",
  "--soe-section-space-md",
  "--soe-section-space-lg",

  // Containers
  "--soe-container-visual",
  "--soe-container-content",
  "--soe-container-reading",

  // Radius
  "--soe-radius-control",
  "--soe-radius-card",
  "--soe-radius-media",
  "--soe-radius-pill",

  // Shadows
  "--soe-shadow-raised",
  "--soe-shadow-overlay",

  // Motion
  "--soe-duration-immediate",
  "--soe-duration-interface",
  "--soe-duration-editorial",
  "--soe-ease-standard",
  "--soe-ease-emphasized",
  "--soe-ease-editorial"
];

export function validateRequiredSharedTokens(css: string): { missingInRoot: string[]; presentInDark: string[] } {
  const rootMatch = css.match(/:root\s*{([\s\S]*?)}/);
  const rootTokens = rootMatch ? parseRules(rootMatch[1]) : {};

  const darkMatch = css.match(/\[data-estate-theme="dark"\]\s*{([\s\S]*?)}/);
  const darkTokens = darkMatch ? parseRules(darkMatch[1]) : {};

  const missingInRoot: string[] = [];
  const presentInDark: string[] = [];

  for (const token of REQUIRED_SHARED_TOKENS) {
    if (!rootTokens[token]) {
      missingInRoot.push(token);
    }
    if (darkTokens[token]) {
      presentInDark.push(token);
    }
  }

  return { missingInRoot, presentInDark };
}

export function validateScopeContrasts(scope: Record<string, string>, scopeName: "light" | "dark"): void {
  const bgPrimary = parseColor(resolveVar("var(--soe-surface-bg-primary)", scope));
  const textPrimary = parseColor(resolveVar("var(--soe-surface-text-primary)", scope));
  const textSecondary = parseColor(resolveVar("var(--soe-surface-text-secondary)", scope));
  const textInverse = parseColor(resolveVar("var(--soe-surface-text-inverse)", scope));

  const actionPrimaryRaw = parseColor(resolveVar("var(--soe-surface-action-primary)", scope));
  const actionHoverRaw = parseColor(resolveVar("var(--soe-surface-action-hover)", scope));

  const actionSecRaw = parseColor(resolveVar("var(--soe-surface-action-secondary)", scope));
  const actionSecHoverRaw = parseColor(resolveVar("var(--soe-surface-action-secondary-hover)", scope));
  const border = parseColor(resolveVar("var(--soe-surface-control-border)", scope));

  const quietHoverRaw = parseColor(resolveVar("var(--soe-surface-action-quiet-hover)", scope));
  const focusRing = parseColor(resolveVar("var(--soe-color-focus-ring)", scope));
  const errorText = parseColor(resolveVar("var(--soe-surface-color-error)", scope));

  // Composite action backgrounds over bgPrimary if translucent
  const actionPrimaryBg = actionPrimaryRaw.a < 1 ? compositeColor(actionPrimaryRaw, bgPrimary) : actionPrimaryRaw;
  const actionHoverBg = actionHoverRaw.a < 1 ? compositeColor(actionHoverRaw, bgPrimary) : actionHoverRaw;
  const actionSecBg = actionSecRaw.a < 1 ? compositeColor(actionSecRaw, bgPrimary) : actionSecRaw;
  const actionSecHoverBg = actionSecHoverRaw.a < 1 ? compositeColor(actionSecHoverRaw, bgPrimary) : actionSecHoverRaw;
  const quietHoverBg = quietHoverRaw.a < 1 ? compositeColor(quietHoverRaw, bgPrimary) : quietHoverRaw;

  // Primary
  if (getContrast(textPrimary, bgPrimary) < 4.5) {
    throw new Error(`[${scopeName}] Primary text contrast < 4.5`);
  }
  if (getContrast(textSecondary, bgPrimary) < 4.5) {
    throw new Error(`[${scopeName}] Secondary text contrast < 4.5`);
  }
  if (getContrast(textInverse, actionPrimaryBg) < 4.5) {
    throw new Error(`[${scopeName}] Primary action text contrast < 4.5`);
  }
  if (getContrast(textInverse, actionHoverBg) < 4.5) {
    throw new Error(`[${scopeName}] Primary action hover text contrast < 4.5`);
  }

  // Secondary Action
  if (getContrast(textPrimary, actionSecBg) < 4.5) {
    throw new Error(`[${scopeName}] Secondary action primary text contrast < 4.5`);
  }
  if (getContrast(textPrimary, actionSecHoverBg) < 4.5) {
    throw new Error(`[${scopeName}] Secondary action hover text contrast < 4.5`);
  }

  // Secondary Action Border (Always checked for both light and dark!)
  if (getContrast(border, bgPrimary) < 3.0) {
    throw new Error(`[${scopeName}] Secondary action border contrast < 3.0`);
  }

  // Quiet Action
  if (getContrast(textPrimary, quietHoverBg) < 4.5) {
    throw new Error(`[${scopeName}] Quiet action hover text contrast < 4.5`);
  }

  // Focus and Error
  if (getContrast(focusRing, bgPrimary) < 3.0) {
    throw new Error(`[${scopeName}] Focus ring contrast < 3.0`);
  }
  if (getContrast(errorText, bgPrimary) < 4.5) {
    throw new Error(`[${scopeName}] Surface-aware error text contrast < 4.5`);
  }
}

describe("Estate UI Token Contract", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const uiDir = path.resolve(__dirname, "../src/components/estate-ui");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  const uiFiles = fs.readdirSync(uiDir)
    .filter(f => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map(f => ({
      name: f,
      content: fs.readFileSync(path.join(uiDir, f), "utf-8")
    }));

  it("fails when any component references an undeclared token", () => {
    const declaredTokens = new Set<string>();
    const declRegex = /(--soe-[a-zA-Z0-9-]+):/g;
    let match;
    while ((match = declRegex.exec(cssContent)) !== null) {
      declaredTokens.add(match[1]);
    }

    const referencedTokens = new Set<string>();
    const refRegex = /var\((--soe-[a-zA-Z0-9-]+)\)/g;
    for (const file of uiFiles) {
      while ((match = refRegex.exec(file.content)) !== null) {
        referencedTokens.add(match[1]);
      }
    }

    const missing: string[] = [];
    for (const token of referencedTokens) {
      if (!declaredTokens.has(token)) {
        missing.push(token);
      }
    }

    expect(missing).toEqual([]);
  });

  it("verifies every required shared token is declared in :root and NOT declared in dark theme", () => {
    const result = validateRequiredSharedTokens(cssContent);
    expect(result.missingInRoot, "All required shared tokens must be declared in :root").toEqual([]);
    expect(result.presentInDark, "No shared tokens should be declared in dark theme").toEqual([]);
  });

  it("verifies Tailwind font mappings exist for all font utility classes used", () => {
    const usedFonts = new Set<string>();
    const fontClassRegex = /font-soe-(display|body|ui)/g;
    for (const file of uiFiles) {
      let match;
      while ((match = fontClassRegex.exec(file.content)) !== null) {
        usedFonts.add(`--font-soe-${match[1]}`);
      }
    }

    const themeBlockRegex = /@theme\s*{([\s\S]*?)}/;
    const themeMatch = cssContent.match(themeBlockRegex);
    expect(themeMatch).not.toBeNull();
    const themeTokens = themeMatch![1];

    for (const fontVar of usedFonts) {
      expect(themeTokens).toContain(fontVar);
    }
  });

  it("verifies the global reduced-motion universal selector is absent", () => {
    expect(cssContent).not.toContain("*, ::before, ::after {");
  });

  it("verifies components use semantic radius and motion tokens rather than spacing variables or hard-coded 200ms", () => {
    for (const file of uiFiles) {
      expect(file.content).not.toContain("duration-[200ms]");
      expect(file.content).not.toContain("rounded-[var(--soe-space-");
    }
  });

  it("verifies light action contract meets all required contrast ratios", () => {
    const rootTokens = parseRules(cssContent.match(/:root\s*{([\s\S]*?)}/)![1]);
    const lightMatch = cssContent.match(/\[data-estate-theme="light"\]\s*{([\s\S]*?)}/);
    const lightOverrides = lightMatch ? parseRules(lightMatch[1]) : {};
    const lightScope = { ...rootTokens, ...lightOverrides };

    expect(() => validateScopeContrasts(lightScope, "light")).not.toThrow();
  });

  it("verifies dark action contract meets all required contrast ratios", () => {
    const rootTokens = parseRules(cssContent.match(/:root\s*{([\s\S]*?)}/)![1]);
    const darkMatch = cssContent.match(/\[data-estate-theme="dark"\]\s*{([\s\S]*?)}/);
    const darkOverrides = darkMatch ? parseRules(darkMatch[1]) : {};
    const darkScope = { ...rootTokens, ...darkOverrides };

    expect(() => validateScopeContrasts(darkScope, "dark")).not.toThrow();
  });
});

describe("Parser & Contract Validation Unit Tests", () => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("preserves alpha 0.1 for rgba(255, 255, 255, 0.1)", () => {
    const parsed = parseColor("rgba(255, 255, 255, 0.1)");
    expect(parsed.a).toBeCloseTo(0.1, 5);
    expect(parsed.r).toBe(255);
    expect(parsed.g).toBe(255);
    expect(parsed.b).toBe(255);
  });

  it("preserves alpha 0 for transparent", () => {
    const parsed = parseColor("transparent");
    expect(parsed.a).toBe(0);
  });

  it("composites white at 10% over #0d0f0e within 1 channel tolerance", () => {
    const fg = parseColor("rgba(255, 255, 255, 0.1)");
    const bg = parseColor("#0d0f0e");
    const composited = compositeColor(fg, bg);

    expect(Math.abs(composited.r - 37)).toBeLessThanOrEqual(1);
    expect(Math.abs(composited.g - 39)).toBeLessThanOrEqual(1);
    expect(Math.abs(composited.b - 38)).toBeLessThanOrEqual(1);
    expect(composited.a).toBe(1);
  });

  it("composites two translucent colours correctly (nested-alpha test)", () => {
    const fg = { r: 255, g: 0, b: 0, a: 0.5 };
    const bg = { r: 0, g: 0, b: 255, a: 0.5 };
    const composited = compositeColor(fg, bg);

    expect(composited.a).toBeCloseTo(0.75, 5);
    expect(composited.r).toBeCloseTo(170, 2);
    expect(composited.g).toBeCloseTo(0, 2);
    expect(composited.b).toBeCloseTo(85, 2);
  });

  it("throws an error when getContrast is called with a translucent background", () => {
    const fg = { r: 255, g: 255, b: 255, a: 1 };
    const bgTranslucent = { r: 0, g: 0, b: 0, a: 0.5 };
    expect(() => getContrast(fg, bgTranslucent)).toThrow(
      "getContrast: background must be opaque; composite it first"
    );
  });

  it("reports missing token when one required token is removed from CSS fixture", () => {
    const modifiedCss = cssContent.replace("--soe-space-4:", "--soe-removed-token:");
    const result = validateRequiredSharedTokens(modifiedCss);
    expect(result.missingInRoot).toContain("--soe-space-4");
  });

  it("fails contrast validation when a semantic action colour is changed in an in-memory fixture", () => {
    const modifiedCss = cssContent.replaceAll(
      "--soe-surface-action-primary: var(--soe-color-brand);",
      "--soe-surface-action-primary: var(--soe-color-canvas);"
    );
    const rootTokens = parseRules(modifiedCss.match(/:root\s*{([\s\S]*?)}/)![1]);
    const lightMatch = modifiedCss.match(/\[data-estate-theme="light"\]\s*{([\s\S]*?)}/);
    const lightOverrides = lightMatch ? parseRules(lightMatch[1]) : {};
    const lightScope = { ...rootTokens, ...lightOverrides };

    expect(() => validateScopeContrasts(lightScope, "light")).toThrow(
      "[light] Primary action text contrast < 4.5"
    );
  });
});
