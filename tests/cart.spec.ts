import { test, expect } from '../fixtures/pages.fixture';
import products from '../test-data/products.json';

test.describe('Cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.addToCart(products.bikeLight);
    await inventoryPage.openCart();
  });

  test('shows the items that were added', { tag: '@smoke' }, async ({ cartPage, inventoryPage }) => {
    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.itemNames).toHaveText([products.backpack, products.bikeLight]);
    await expect(inventoryPage.cartBadge).toHaveText('2');
  });

  test('removing an item updates the list and badge', async ({ cartPage, inventoryPage }) => {
    await cartPage.removeItem(products.backpack);

    await expect(cartPage.itemNames).toHaveText([products.bikeLight]);
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('removing every item empties the cart', async ({ cartPage, inventoryPage }) => {
    await cartPage.removeItem(products.backpack);
    await cartPage.removeItem(products.bikeLight);

    await expect(cartPage.items).toHaveCount(0);
    await expect(inventoryPage.cartBadge).toBeHidden();
  });

  test('continue shopping goes back to the inventory and keeps the cart', async ({
    cartPage,
    inventoryPage,
    page,
  }) => {
    await cartPage.continueShopping();

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.cartBadge).toHaveText('2');
  });
});
