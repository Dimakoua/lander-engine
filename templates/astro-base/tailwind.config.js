module.exports = {
  content: getContentPaths(),
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: generateSafelistFromTheme(),
};

function getContentPaths() {
  // Allow users to override content paths via env var (JSON array or space-separated)
  if (process.env.LANDER_CONTENT_PATHS) {
    try {
      if (process.env.LANDER_CONTENT_PATHS.startsWith('[')) {
        return JSON.parse(process.env.LANDER_CONTENT_PATHS);
      } else {
        return process.env.LANDER_CONTENT_PATHS.split(/\s+/).filter(Boolean);
      }
    } catch (error) {
      console.warn('[tailwind.config.js] Failed to parse LANDER_CONTENT_PATHS, using defaults');
    }
  }

  // Default content paths
  return [
    './src/**/*.{astro,js,jsx,ts,tsx}',
    './components/**/*.{astro,js,jsx,ts,tsx}',
    './pages/**/*.{astro,js,jsx,ts,tsx}',
    './.lander-engine/src/**/*.{astro,js,jsx,ts,tsx}',
  ];
}

function findThemeJson() {
  const path = require('path');
  const fs = require('fs');

  // Look for theme.json in the environment-provided config directory
  // This should be set by the build process integrating lander-engine
  if (process.env.LANDER_JSON_CONFIGS_DIR) {
    const configDir = process.env.LANDER_JSON_CONFIGS_DIR;
    
    // Search for theme.json in any campaign subdirectory
    try {
      const campaigns = fs.readdirSync(configDir);
      for (const campaign of campaigns) {
        const themeFile = path.resolve(configDir, campaign, 'theme.json');
        if (fs.existsSync(themeFile)) {
          return themeFile;
        }
      }
    } catch (error) {
      // Directory doesn't exist or not readable, fall through
    }
  }

  return null;
}

function generateSafelistFromTheme() {
  const fs = require('fs');
  const themeFile = findThemeJson();

  if (!themeFile) {
    return [];
  }

  try {
    const theme = JSON.parse(fs.readFileSync(themeFile, 'utf-8'));
    const colors = theme?.colors || {};
    const colorKeys = Object.keys(colors);

    const colorSafelist = colorKeys.flatMap((colorName) => [
      `bg-[var(--color-${colorName})]`,
      `text-[var(--color-${colorName})]`,
      `border-[var(--color-${colorName})]`,
      `hover:bg-[var(--color-${colorName})]`,
      `hover:text-[var(--color-${colorName})]`,
    ]);

    return Array.from(new Set(colorSafelist));
  } catch (error) {
    return [];
  }
}

