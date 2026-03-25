module.exports = {
  content: getContentPaths(),
  theme: {
    extend: {},
  },
  plugins: [],
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

  // Default content paths - from the generated workspace context
  // These paths work both in dev and build where the workspace is generated
  return ['./src/**/*.{astro,jsx,tsx}', '../components/**/*.{astro,jsx,tsx}', './**/*.astro'];
}
