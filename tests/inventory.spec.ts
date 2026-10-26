import { test, expect } from '../fixtures/pages.fixture';
import { type SortOption } from '../pages/InventoryPage';
import { parsePrice } from '../utils/price';
import products from '../test-data/products.json';

test.describe('Inventory', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items).toHaveCount(6);
  });

  test.describe('sorting', () => {
    const byName = (a: string, b: string) => a.localeCompare(b);
    const byPrice = (a: string, b: string) => parsePrice(a) - parsePrice(b);

    const nameSorts: { option: SortOption; label: string; compare: typeof byName }[] = [
      { option: 'az', label: 'name A to Z', compare: byName },
      { option: 'za', label: 'name Z to A', compare: (a, b) => byName(b, a) },
    ];
    const priceSorts: { option: SortOption; label: string; compare: typeof byPrice }[] = [
      { option: 'lohi', label: 'price low to high', compare: byPrice },
      { option: 'hilo', label: 'price high to low', compare: (a, b) => byPrice(b, a) },
    ];

    for (const { option, label, compare } of nameSorts) {
      test(`sorts by ${label}`, async ({ inventoryPage }) => {
        const names = await inventoryPage.itemNames.allTextContents();

        await inventoryPage.sortBy(option);

        await expect(inventoryPage.itemNames).toHaveText([...names].sort(compare));
      });
    }

    for (const { option, label, compare } of priceSorts) {
      test(`sorts by ${label}`, async ({ inventoryPage }) => {
        const prices = await inventoryPage.itemPrices.allTextContents();

        await inventoryPage.sortBy(option);

        await expect(inventoryPage.itemPrices).toHaveText([...prices].sort(compare));
      });
    }
  });

  test.describe('cart badge', () => {
    test('adding an item shows badge count 1', { tag: '@smoke' }, async ({ inventoryPage }) => {
      await expect(inventoryPage.cartBadge).toBeHidden();

      await inventoryPage.addToCart(products.backpack);

      await expect(inventoryPage.cartBadge).toHaveText('1');
      await expect(
        inventoryPage.item(products.backpack).getByRole('button', { name: 'Remove' }),
      ).toBeVisible();
    });

    test('adding three items shows badge count 3', async ({ inventoryPage }) => {
      await inventoryPage.addToCart(products.backpack);
      await inventoryPage.addToCart(products.bikeLight);
      await inventoryPage.addToCart(products.onesie);

      await expect(inventoryPage.cartBadge).toHaveText('3');
    });

    test('removing an item lowers the badge count', async ({ inventoryPage }) => {
      await inventoryPage.addToCart(products.backpack);
      await inventoryPage.addToCart(products.bikeLight);
      await expect(inventoryPage.cartBadge).toHaveText('2');

      await inventoryPage.removeFromCart(products.backpack);

      await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    test('removing the last item hides the badge', async ({ inventoryPage }) => {
      await inventoryPage.addToCart(products.backpack);
      await expect(inventoryPage.cartBadge).toHaveText('1');

      await inventoryPage.removeFromCart(products.backpack);

      await expect(inventoryPage.cartBadge).toBeHidden();
      await expect(
        inventoryPage.item(products.backpack).getByRole('button', { name: 'Add to cart' }),
      ).toBeVisible();
    });
  });
});
