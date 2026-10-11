/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const title = execSync('git log -1 --format=%s').toString().trim();
const pattern = /^(✨ feat|🐛 fix|🧪 test|♻ refactor|📚 docs|⚙ chore|👷 ci|💄 style|⚡ perf|📦 build|⏪ revert)(\([a-z0-9._/-]+\))?!?: .+$/;
if (!pattern.test(title)) {
  console.error('PR title does not match required pattern:', pattern);
  process.exit(1);
}
console.log('PR title matches the required pattern.');