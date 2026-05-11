import { chromium } from 'playwright';

const BASE = 'http://localhost:5175';
const DIR = 'screenshots';
const VIEWPORT = { width: 390, height: 844 };

async function seedDB(page) {
  await page.evaluate(async () => {
    const { db } = await import('/src/db/schema.ts');
    const { seedDefaults } = await import('/src/db/seed.ts');
    const { createNewProgram } = await import('/src/db/repositories/program.repo.ts');
    const { calculateTM } = await import('/src/core/calculator.ts');

    await seedDefaults();

    const tmPct = 85;
    await db.settings.update(1, { tmPercentage: tmPct, unit: 'kg', roundingIncrement: 2.5, defaultSupplement: 'bbb' });

    await db.mainLifts.clear();
    const now = new Date().toISOString();
    const lifts = [
      { name: 'squat', oneRepMax: 140, trainingMax: calculateTM(140, tmPct), unit: 'kg', updatedAt: now },
      { name: 'bench', oneRepMax: 95, trainingMax: calculateTM(95, tmPct), unit: 'kg', updatedAt: now },
      { name: 'deadlift', oneRepMax: 165, trainingMax: calculateTM(165, tmPct), unit: 'kg', updatedAt: now },
      { name: 'ohp', oneRepMax: 70, trainingMax: calculateTM(70, tmPct), unit: 'kg', updatedAt: now },
    ];
    const ids = await db.mainLifts.bulkAdd(lifts, { allKeys: true });
    const savedLifts = lifts.map((l, i) => ({ ...l, id: ids[i] }));

    const settings = await db.settings.get(1);
    await createNewProgram(savedLifts, { ...settings, leaderCycles: 2, anchorCycles: 1 });
  });
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });

  // --- Setup page (clean browser, no data) ---
  const setupPage = await context.newPage();
  await setupPage.goto(BASE, { waitUntil: 'networkidle' });
  await setupPage.waitForTimeout(1000);
  await setupPage.screenshot({ path: `${DIR}/01-setup.png` });
  console.log('Captured: 01-setup');

  // Seed DB via Vite's module system
  await seedDB(setupPage);
  console.log('DB seeded');

  // Reload and wait for dashboard content
  await setupPage.goto(BASE, { waitUntil: 'networkidle' });
  await setupPage.waitForSelector('text=Wendler 5/3/1', { timeout: 10000 }).catch(() => {});
  await setupPage.waitForTimeout(1000);

  // --- Dashboard ---
  await setupPage.screenshot({ path: `${DIR}/03-dashboard.png` });
  console.log('Captured: 03-dashboard');

  await setupPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await setupPage.waitForTimeout(300);
  await setupPage.screenshot({ path: `${DIR}/04-dashboard-weeks.png` });
  console.log('Captured: 04-dashboard-weeks');

  // --- Workout page: find first pending workout ---
  const firstWorkoutId = await setupPage.evaluate(async () => {
    const { db } = await import('/src/db/schema.ts');
    const day = await db.workoutDays.where('status').equals('pending').first();
    return day?.id;
  });

  if (firstWorkoutId) {
    await setupPage.goto(`${BASE}/workout/${firstWorkoutId}`, { waitUntil: 'networkidle' });
    await setupPage.waitForTimeout(1000);
    await setupPage.screenshot({ path: `${DIR}/05-workout.png` });
    console.log('Captured: 05-workout');

    await setupPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await setupPage.waitForTimeout(300);
    await setupPage.screenshot({ path: `${DIR}/06-workout-supplement.png` });
    console.log('Captured: 06-workout-supplement');
  }

  // --- Settings ---
  await setupPage.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await setupPage.waitForTimeout(500);
  await setupPage.screenshot({ path: `${DIR}/07-settings.png` });
  console.log('Captured: 07-settings');

  await browser.close();
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
