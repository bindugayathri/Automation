import { test, expect } from '../fixtures/pages.fixture';
import { type CustomerInfo } from '../pages/CheckoutPage';
import { formatPrice, parsePrice } from '../utils/price';
import users from '../test-data/users.json';
import products from '../test-data/products.json';
import checkout from '../test-data/checkout.json';

test.describe('Checkout end to end', () => {
  // Start logged out: this test covers the whole journey, including login.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('user can buy two items', { tag: '@smoke' }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await test.step('log in', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await expect(inventoryPage.title).toHaveText('Products');
    });

    await test.step('add two items to the cart', async () => {
      await inventoryPage.addToCart(products.backpack);
      await inventoryPage.addToCart(products.bikeLight);
      await expect(inventoryPage.cartBadge).toHaveText('2');
    });

    await test.step('open the cart and check out', async () => {
      await inventoryPage.openCart();
      await expect(cartPage.itemNames).toHaveText([products.backpack, products.bikeLight]);
      await cartPage.checkout();
    });

    await test.step('enter customer information', async () => {
      await expect(checkoutPage.title).toHaveText('Checkout: Your Information');
      await checkoutPage.fillCustomerInfo(checkout.customer);
      await checkoutPage.continue();
    });

    await test.step('verify item total, tax and total', async () => {
      await expect(checkoutPage.title).toHaveText('Checkout: Overview');
      await expect(checkoutPage.itemPrices).toHaveCount(2);

      const prices = (await checkoutPage.itemPrices.allTextContents()).map(parsePrice);
      const itemTotal = prices.reduce((sum, price) => sum + price, 0);
      await expect(checkoutPage.subtotalLabel).toHaveText(`Item total: ${formatPrice(itemTotal)}`);

      const tax = parsePrice(await checkoutPage.taxLabel.innerText());
      await expect(checkoutPage.totalLabel).toHaveText(`Total: ${formatPrice(itemTotal + tax)}`);
    });

    await test.step('finish the order', async () => {
      await checkoutPage.finish();
      await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
      await expect(inventoryPage.cartBadge).toBeHidden();
    });
  });
});

test.describe('Checkout information validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout-step-one.html');
  });

  const cases: { field: string; info: CustomerInfo; error: string }[] = [
    {
      field: 'first name',
      info: { ...checkout.customer, firstName: '' },
      error: 'Error: First Name is required',
    },
    {
      field: 'last name',
      info: { ...checkout.customer, lastName: '' },
      error: 'Error: Last Name is required',
    },
    {
      field: 'postal code',
      info: { ...checkout.customer, postalCode: '' },
      error: 'Error: Postal Code is required',
    },
  ];

  for (const { field, info, error } of cases) {
    test(`empty ${field} shows an error`, async ({ checkoutPage, page }) => {
      await checkoutPage.fillCustomerInfo(info);
      await checkoutPage.continue();

      await expect(checkoutPage.errorMessage).toHaveText(error);
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });
  }
});
