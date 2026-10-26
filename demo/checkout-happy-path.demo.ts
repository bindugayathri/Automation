import { test as base, expect } from '../fixtures/pages.fixture';
import users from '../test-data/users.json';
import products from '../test-data/products.json';
import checkout from '../test-data/checkout.json';
import { installDemoCursor } from './demo-cursor';

// This file is a recorded demo, not a test: the pauses below exist so a viewer can
// read each screen. The real, fast version of this flow is tests/checkout.spec.ts.
const TYPING_DELAY_MS = 50;
const HOLD_MS = 1000;
const FINAL_HOLD_MS = 2500;
const SCROLL_MS = 1200;
const VIDEO_PATH = 'demo-video/checkout-happy-path.webm';

const test = base.extend({
  // Record at the exact size of this screen, so the video has no grey borders.
  video: async ({ browser }, use) => {
    const probe = await browser.newPage();
    const size = await probe.evaluate(() => ({ width: screen.width, height: screen.height }));
    await probe.close();
    await use({ mode: 'on', size });
  },

  // Full screen (like pressing F11), plus a visible mouse pointer and click ripple.
  page: async ({ page }, use, testInfo) => {
    await page.addInitScript(installDemoCursor);
    const cdp = await page.context().newCDPSession(page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'fullscreen' } });
    await page.waitForFunction(() => innerWidth === screen.width && innerHeight === screen.height);

    await use(page);

    // The video is only finished once the page closes; then copy it to a fixed path.
    // Only a successful run replaces the saved demo video.
    await page.close();
    if (testInfo.status === 'passed') {
      await page.video()?.saveAs(VIDEO_PATH);
    }
  },
});

test('Checkout happy path demo', async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
}) => {
  type Target = typeof loginPage.usernameInput;
  const hold = (ms = HOLD_MS) => page.waitForTimeout(ms);
  // Glide the visible pointer to an element before acting on it, so viewers see what comes next.
  const pointAt = (target: Target) => target.hover();
  const type = async (field: Target, text: string) => {
    await pointAt(field);
    await field.click();
    await field.pressSequentially(text, { delay: TYPING_DELAY_MS });
  };
  // Playwright only scrolls when it clicks, and then it jumps. Scroll slowly so viewers can follow.
  const scrollTo = (target: Target) =>
    target.evaluate(
      (el, duration) =>
        new Promise<void>((resolve) => {
          const startY = window.scrollY;
          const maxY = document.documentElement.scrollHeight - window.innerHeight;
          const rect = el.getBoundingClientRect();
          const endY = Math.min(maxY, startY + rect.top - (window.innerHeight - rect.height) / 2);
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            window.scrollTo({ top: startY + (endY - startY) * eased, behavior: 'instant' });
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        }),
      SCROLL_MS,
    );

  await test.step('Log in', async () => {
    await loginPage.goto();
    await hold();
    await type(loginPage.usernameInput, users.standard.username);
    await type(loginPage.passwordInput, users.standard.password);
    await hold();
    await pointAt(loginPage.loginButton);
    await loginPage.loginButton.click();
    await expect(inventoryPage.title).toHaveText('Products');
    await hold();
  });

  await test.step('Add two items to the cart', async () => {
    await pointAt(inventoryPage.item(products.backpack).getByRole('button', { name: 'Add to cart' }));
    await inventoryPage.addToCart(products.backpack);
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await hold();
    await pointAt(inventoryPage.item(products.bikeLight).getByRole('button', { name: 'Add to cart' }));
    await inventoryPage.addToCart(products.bikeLight);
    await expect(inventoryPage.cartBadge).toHaveText('2');
    await hold();
  });

  await test.step('Review the cart', async () => {
    await pointAt(inventoryPage.cartLink);
    await inventoryPage.openCart();
    await expect(cartPage.itemNames).toHaveText([products.backpack, products.bikeLight]);
    await hold();
    await pointAt(cartPage.checkoutButton);
    await cartPage.checkout();
  });

  await test.step('Enter customer information', async () => {
    await expect(checkoutPage.title).toHaveText('Checkout: Your Information');
    await hold();
    await type(checkoutPage.firstNameInput, checkout.customer.firstName);
    await type(checkoutPage.lastNameInput, checkout.customer.lastName);
    await type(checkoutPage.postalCodeInput, checkout.customer.postalCode);
    await hold();
    await pointAt(checkoutPage.continueButton);
    await checkoutPage.continue();
  });

  await test.step('Review the order total', async () => {
    await expect(checkoutPage.title).toHaveText('Checkout: Overview');
    await expect(checkoutPage.totalLabel).toBeVisible();
    await hold();
    await scrollTo(checkoutPage.finishButton);
    await expect(checkoutPage.finishButton).toBeInViewport();
    await hold(HOLD_MS * 2);
    await pointAt(checkoutPage.finishButton);
    await checkoutPage.finish();
  });

  await test.step('Order complete', async () => {
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    // The order is complete; if the window is closed during this last pause, keep the recording.
    await hold(FINAL_HOLD_MS).catch(() => {});
  });
});
