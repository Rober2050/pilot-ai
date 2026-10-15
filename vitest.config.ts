import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Reuses the app's Vite config (aliases, plugins). Agent worktrees under .claude/
// contain full copies of src/ and must not be collected as tests.
export default mergeConfig(viteConfig, defineConfig({
    test: {
        exclude: [...configDefaults.exclude, '.claude/**', '.agent/**', '.agents/**'],
    },
}));
