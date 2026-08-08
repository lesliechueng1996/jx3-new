import { defineConfig } from 'skills-npm';

export default defineConfig({
  // Source to discover skills from: 'node_modules' or 'package.json'
  source: 'node_modules',
  // Target specific agents (defaults to all detected agents)
  agents: ['cursor'],
  // Scan recursively for monorepo packages (default: false)
  recursive: true,
  // Whether to update .gitignore (default: true)
  gitignore: false,
  // Skip confirmation prompts (default: false)
  yes: false,
  // Dry run mode (default: false)
  dryRun: false,
  // Include specific packages or skills
  include: [
    // Include all skills from a package
    '@logtape/logtape',
  ],
  // Exclude specific packages or skills
  exclude: [],
});
