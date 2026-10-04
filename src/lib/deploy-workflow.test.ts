import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const wf = parse(readFileSync('.github/workflows/deploy.yml', 'utf8'));
const steps: any[] = wf.jobs.deploy.steps;
const at = (pred: (s: any) => boolean) => steps.findIndex(pred);
const run = (cmd: string) => at((s) => s.run === cmd);
const ftp = at((s) => String(s.uses).startsWith('SamKirkland/FTP-Deploy-Action@'));

describe('deploy workflow', () => {
  it('deploys redesign to staging and main to live, on push', () => {
    expect(wf.on.push.branches).toEqual(['main', 'redesign']);
    expect(steps[ftp].with['server-dir']).toBe("${{ github.ref_name == 'main' && './' || './staging/' }}");
  });
  it('uploads only after schema sync, tests, build and verification all pass', () => {
    const order = [run('npx astro sync'), run('npm test'), run('npm run build'), run('npm run verify:build'), ftp];
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(steps.some((s) => s['continue-on-error'])).toBe(false);
  });
  it('hides staging from search engines and never touches live robots.txt', () => {
    const robots = steps[at((s) => /robots\.txt/.test(s.run ?? ''))];
    expect(robots.if).toBe("github.ref_name != 'main'");
    expect(steps.indexOf(robots)).toBeLessThan(ftp);
  });
  it('queues deploys of the same branch instead of overlapping them', () => {
    expect(wf.concurrency).toEqual({ group: 'deploy-${{ github.ref_name }}', 'cancel-in-progress': false });
  });
  it('uploads over FTPS with credentials from secrets only', () => {
    expect(steps[ftp].with).toMatchObject({
      protocol: 'ftps', port: 21, 'local-dir': './dist/',
      server: '${{ secrets.VODIEN_FTP_HOST }}', username: '${{ secrets.VODIEN_FTP_USER }}', password: '${{ secrets.VODIEN_FTP_PASSWORD }}',
    });
  });
  it('restores the image cache after npm ci, which would otherwise wipe it', () => {
    expect(at((s) => String(s.uses).startsWith('actions/cache@'))).toBeGreaterThan(run('npm ci'));
  });
});
