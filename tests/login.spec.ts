import { test, expect } from '../fixtures/pages.fixture';
import users from '../test-data/users.json';

test.describe('Login', () => {
  // Login tests must start logged out, so ignore the saved session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in', { tag: '@smoke' }, async ({ loginPage, page }) => {
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  test('locked out user sees an error', { tag: '@smoke' }, async ({ loginPage }) => {
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);

    await expect(loginPage.errorMessage).toHaveText(
      'Epic sadface: Sorry, this user has been locked out.',
    );
  });

  test('wrong password shows an error', async ({ loginPage }) => {
    await loginPage.login(users.invalidPassword.username, users.invalidPassword.password);

    await expect(loginPage.errorMessage).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
  });

  test('empty username shows an error', async ({ loginPage }) => {
    await loginPage.login('', users.standard.password);

    await expect(loginPage.errorMessage).toHaveText('Epic sadface: Username is required');
  });

  test('empty password shows an error', async ({ loginPage }) => {
    await loginPage.login(users.standard.username, '');

    await expect(loginPage.errorMessage).toHaveText('Epic sadface: Password is required');
  });
});
