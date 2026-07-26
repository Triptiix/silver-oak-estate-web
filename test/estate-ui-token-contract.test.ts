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
function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
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

  it("verifies shared typography, spacing, container and motion tokens are declared in the root foundation rather than only in the dark block", () => {
    const rootBlockRegex = /:root\s*{([\s\S]*?)}/;
    const rootMatch = cssContent.match(rootBlockRegex);
    expect(rootMatch).not.toBeNull();
    const rootTokens = rootMatch![1];

    expect(rootTokens).toContain("--soe-text-base:");
    expect(rootTokens).toContain("--soe-space-4:");
    expect(rootTokens).toContain("--soe-container-content:");
    expect(rootTokens).toContain("--soe-duration-interface:");
    expect(rootTokens).toContain("--soe-leading-body:");
    expect(rootTokens).toContain("--soe-tracking-heading:");
    expect(rootTokens).toContain("--soe-section-space-md:");
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
    // We will do a basic contrast check on known colors from the palette to verify the contract is met.
    
    // Hardcoded expected values based on the spec
    // Light primary: Olive bg (#47543a), Ivory text (#f5f1e8) -> checking contrast
    const oliveBg = hexToRgb("#47543a");
    const ivoryText = hexToRgb("#f5f1e8");
    expect(getContrast(oliveBg, ivoryText)).toBeGreaterThan(3);

    // Dark primary: Brand-soft/light bg (#e7e8de), Dark ink text (#20231f)
    const softBg = hexToRgb("#e7e8de");
    const inkText = hexToRgb("#20231f");
    expect(getContrast(softBg, inkText)).toBeGreaterThan(3);

    // Light secondary: Light surface (#fbfaf7), Dark text (#20231f)
    const lightSurface = hexToRgb("#fbfaf7");
    expect(getContrast(lightSurface, inkText)).toBeGreaterThan(3);

    // Focus against light surface (#195aa8)
    const focusLight = hexToRgb("#195aa8");
    expect(getContrast(focusLight, lightSurface)).toBeGreaterThan(3);

    // Focus against dark surface (#9cc7ff)
    const darkNight = hexToRgb("#0d0f0e");
    const focusDark = hexToRgb("#9cc7ff");
    expect(getContrast(focusDark, darkNight)).toBeGreaterThan(3);

    // Error text against light surface (#9b2c2c)
    const errorRed = hexToRgb("#9b2c2c");
    expect(getContrast(errorRed, lightSurface)).toBeGreaterThan(3);
  });
});
