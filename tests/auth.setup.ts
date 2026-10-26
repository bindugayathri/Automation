import { test as setup, expect } from '../fixtures/pages.fixture';
import users from '../test-data/users.json';
import { STANDARD_USER_STATE } from '../utils/auth';

// Runs once before the browser projects. Logs in through the UI and saves the
// session cookie, so other tests start already logged in.
setup('log in as standard user', async ({ loginPage, inventoryPage, page }) => {
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await expect(inventoryPage.title).toHaveText('Products');

  await page.context().storageState({ path: STANDARD_USER_STATE });
});
