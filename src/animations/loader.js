import { resolve } from 'path';

export async function loadAnimation(name, config) {
  const animConfig = config[name] || {};
  animConfig.rootDir = config.rootDir;

  // Try loading from animations directory
  const modulePath = resolve(config.rootDir, 'src', 'animations', `${name}.js`);

  try {
    const mod = await import(modulePath);
    const AnimClass = mod.default;
    return new AnimClass(animConfig);
  } catch (err) {
    console.error(`Failed to load animation "${name}": ${err.message}`);
    console.error('Falling back to dvd-bounce');

    // Fallback to dvd-bounce
    const fallback = await import('./dvd-bounce.js');
    return new fallback.default(animConfig);
  }
}
