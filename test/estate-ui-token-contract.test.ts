import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Small deterministic contrast helper relative luminance
function getLuminance(r: number, g: number, b: number) {
  const [a, c, d] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a * 0.2126 + c * 0.7152 + d * 0.0722;
}

function getContrast(color1: [number, number, number], color2: [number, number, number]) {
  const l1 = getLuminance(color1[0], color1[1], color1[2]);
  const l2 = getLuminance(color2[0], color2[1], color2[2]);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
}

// Simple parser for our hex colors to rgb
function parseColor(val: string): [number, number, number] {
  if (val === "transparent") return [0, 0, 0];
  if (val.startsWith("rgba")) {
    const match = val.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  let hex = val.replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid color value: ${val}`);
  }
  return [r, g, b];
}

// Extract variables from a block
function parseRules(css: string): Record<string, string> {
  const rules: Record<string, string> = {};
  const regex = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    rules[match[1]] = match[2].trim();
  }
  return rules;
}

// Recursive var resolution
function resolveVar(val: string, scope: Record<string, string>): string {
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
    // 1. Extract all declared --soe-* custom properties from css
    const declaredTokens = new Set<string>();
    const declRegex = /(--soe-[a-zA-Z0-9-]+):/g;
    let match;
    while ((match = declRegex.exec(cssContent)) !== null) {
      declaredTokens.add(match[1]);
    }

    // 2. Extract every var(--soe-...) reference in components
    const referencedTokens = new Set<string>();
    const refRegex = /var\((--soe-[a-zA-Z0-9-]+)\)/g;
    for (const file of uiFiles) {
      while ((match = refRegex.exec(file.content)) !== null) {
        referencedTokens.add(match[1]);
      }
    }

    // 3. Verify
    const missing: string[] = [];
    for (const token of referencedTokens) {
      if (!declaredTokens.has(token)) {
        missing.push(token);
      }
    }

    expect(missing).toEqual([]);
  });

  it("verifies shared typography, spacing, section spacing, container, radius, shadow, duration and easing tokens are in :root and NOT in dark", () => {
    const rootBlockRegex = /:root\s*{([\s\S]*?)}/;
    const rootMatch = cssContent.match(rootBlockRegex);
    expect(rootMatch).not.toBeNull();
    const rootTokens = rootMatch![1];

    const darkBlockRegex = /\[data-estate-theme="dark"\]\s*{([\s\S]*?)}/;
    const darkMatch = cssContent.match(darkBlockRegex);
    expect(darkMatch).not.toBeNull();
    const darkTokens = darkMatch![1];

    const sharedPrefixes = [
      "--soe-text-",
      "--soe-leading-",
      "--soe-tracking-",
      "--soe-space-",
      "--soe-section-space-",
      "--soe-container-",
      "--soe-radius-",
      "--soe-shadow-",
      "--soe-duration-",
      "--soe-ease-"
    ];

    const rootRules = parseRules(rootTokens);
    const darkRules = parseRules(darkTokens);

    for (const prefix of sharedPrefixes) {
      // Find at least one matching in root to ensure it exists
      const foundInRoot = Object.keys(rootRules).some(k => k.startsWith(prefix));
      expect(foundInRoot, `Expected to find tokens with prefix ${prefix} in :root`).toBe(true);

      // Ensure none exist in dark
      const foundInDark = Object.keys(darkRules).some(k => k.startsWith(prefix));
      expect(foundInDark, `Expected NOT to find tokens with prefix ${prefix} in dark selector`).toBe(false);
    }
  });

  it("verifies Tailwind font mappings exist for all font utility classes used", () => {
    // Extract font utility classes used
    const usedFonts = new Set<string>();
    const fontClassRegex = /font-soe-(display|body|ui)/g;
    for (const file of uiFiles) {
      let match;
      while ((match = fontClassRegex.exec(file.content)) !== null) {
        usedFonts.add(`--font-soe-${match[1]}`);
      }
    }

    // Verify they are declared in @theme
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

  it("verifies light and dark action contracts contain all required semantic variables and meet contrast", () => {
    const rootBlockRegex = /:root\s*{([\s\S]*?)}/;
    const lightBlockRegex = /\[data-estate-theme="light"\]\s*{([\s\S]*?)}/;
    const darkBlockRegex = /\[data-estate-theme="dark"\]\s*{([\s\S]*?)}/;

    const rootTokens = parseRules(cssContent.match(rootBlockRegex)![1]);
    const lightOverrides = cssContent.match(lightBlockRegex) ? parseRules(cssContent.match(lightBlockRegex)![1]) : {};
    const darkOverrides = cssContent.match(darkBlockRegex) ? parseRules(cssContent.match(darkBlockRegex)![1]) : {};

    const lightScope = { ...rootTokens, ...lightOverrides };
    const darkScope = { ...rootTokens, ...darkOverrides };

    const requiredMappings = [
      "--soe-surface-bg-primary",
      "--soe-surface-bg-surface",
      "--soe-surface-text-primary",
      "--soe-surface-text-inverse",
      "--soe-surface-text-secondary",
      "--soe-surface-action-primary",
      "--soe-surface-action-secondary",
      "--soe-surface-action-hover",
      "--soe-surface-action-quiet-hover",
      "--soe-color-focus-ring",
      "--soe-surface-color-error"
    ];

    for (const scope of [lightScope, darkScope]) {
      // 1. Fails when a semantic mapping is removed or changed
      for (const token of requiredMappings) {
        expect(scope[token], `Token ${token} should exist`).toBeDefined();

        // Ensure it can be resolved without throwing
        const resolved = resolveVar(`var(${token})`, scope);
        expect(resolved, `Token ${token} should resolve to a valid color string`).toBeTruthy();
      }

      // Check primary contrast (normal text >= 4.5:1)
      const bgPrimary = parseColor(resolveVar(`var(--soe-surface-bg-primary)`, scope));
      const textPrimary = parseColor(resolveVar(`var(--soe-surface-text-primary)`, scope));
      expect(getContrast(textPrimary, bgPrimary), `Primary text contrast`).toBeGreaterThanOrEqual(4.5);

      const textSecondary = parseColor(resolveVar(`var(--soe-surface-text-secondary)`, scope));
      expect(getContrast(textSecondary, bgPrimary), `Secondary text contrast`).toBeGreaterThanOrEqual(4.5);

      // Check action primary contrast (text inverse vs action primary)
      const actionPrimary = parseColor(resolveVar(`var(--soe-surface-action-primary)`, scope));
      const textInverse = parseColor(resolveVar(`var(--soe-surface-text-inverse)`, scope));
      expect(getContrast(textInverse, actionPrimary), `Action primary text contrast`).toBeGreaterThanOrEqual(4.5);

      // Check action hover contrast (text inverse vs action hover)
      const actionHover = parseColor(resolveVar(`var(--soe-surface-action-hover)`, scope));
      expect(getContrast(textInverse, actionHover), `Action hover text contrast`).toBeGreaterThanOrEqual(4.5);

      // Check non-text boundary (focus ring vs bg primary >= 3:1)
      const focusRing = parseColor(resolveVar(`var(--soe-color-focus-ring)`, scope));
      expect(getContrast(focusRing, bgPrimary), `Focus ring contrast against primary bg`).toBeGreaterThanOrEqual(3);

      // Check error text contrast (error text vs bg primary >= 4.5:1)
      const errorText = parseColor(resolveVar(`var(--soe-surface-color-error)`, scope));
      expect(getContrast(errorText, bgPrimary), `Error text contrast against primary bg`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
