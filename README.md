# SauceDemo E2E Test Automation

End-to-end UI test automation for [SauceDemo](https://www.saucedemo.com), a demo e-commerce site. Built with **Playwright** and **TypeScript**, using the Page Object Model and custom fixtures.

The suite covers login, product sorting, the cart and the full checkout flow, and runs in **Chromium, Firefox and WebKit** on every push through GitHub Actions.



https://github.com/user-attachments/assets/1b98855c-a51b-4c13-ae48-4ca6c3ca9271





## Tech stack

| Tool | Purpose |
|---|---|
| [Playwright Test](https://playwright.dev) | Test runner, browser automation, assertions, reporting |
| TypeScript | Type-safe tests and page objects (`strict` mode) |
| GitHub Actions | CI: type check, run all tests, publish the HTML report |
| Node.js 18+ | Runtime |

## Key design decisions

- **Page Object Model:** each page has a class in `pages/` that owns its locators and actions. Tests describe *what* the user does; page objects know *how*.
- **Custom fixtures:** page objects are injected into tests (`async ({ loginPage, cartPage }) => ...`) instead of being created by hand in every test.
- **Log in once, reuse the session:** a `setup` project logs in through the UI and saves the session with `storageState`. Feature tests start already logged in, which keeps them fast and focused. Login tests and the end-to-end checkout test opt out and start logged out.
- **Resilient locators:** only `getByTestId` (mapped to SauceDemo's `data-test` attribute) and `getByRole`. No CSS or XPath selectors.
- **No hard waits:** no `waitForTimeout`. Playwright's auto-waiting and web-first assertions (`toHaveText`, `toBeVisible`) retry until the condition is met.
- **Data-driven tests:** credentials, products and customer details live in `test-data/`. Sorting and checkout validation tests run from a table of cases.
- **Debuggable failures:** screenshot and video are kept on failure, and a trace is recorded on the first retry.

## Project structure

```
├── .github/workflows/
│   └── playwright.yml      # CI pipeline
├── fixtures/
│   └── pages.fixture.ts    # Injects page objects into tests
├── pages/                  # Page Object Model
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
├── test-data/              # Test inputs (no data hardcoded in tests)
│   ├── users.json
│   ├── products.json
│   └── checkout.json
├── tests/
│   ├── auth.setup.ts       # Logs in once and saves the session
│   ├── login.spec.ts
│   ├── inventory.spec.ts
│   ├── cart.spec.ts
│   └── checkout.spec.ts
├── utils/
│   ├── auth.ts             # Path of the saved session file
│   └── price.ts            # Price parsing and formatting helpers
├── playwright.config.ts
└── tsconfig.json
```

## Getting started

**Prerequisites:** Node.js 18 or newer.

```bash
git clone <this-repo-url>
cd <repo-folder>
npm ci
npx playwright install
```

## Running tests

| Command | What it does |
|---|---|
| `npm test` | Run every test in all three browsers |
| `npm run test:smoke` | Run only tests tagged `@smoke` |
| `npm run test:ui` | Open Playwright UI mode to run, watch and debug tests |
| `npm run demo` | Watch the whole suite in Chrome at demo speed (`SLOW_MO=800`) |
| `npm run demo:checkout` | Recorded demo of the happy path, full screen and slowed down (see below) |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | Check TypeScript types without running tests |

Useful options:

```bash
npx playwright test --project=chromium        # one browser
npx playwright test tests/cart.spec.ts        # one file
npx playwright test --headed --workers=1      # watch the browser
npx playwright test --debug                   # step through with the Inspector
```

## Demo video

`npm run demo:checkout` plays the checkout happy path (login → add 2 items → cart → customer info → order total → finish) in full-screen Chrome, slowed down so viewers can follow it, and records it to `demo-video/checkout-happy-path.webm`.

- A visible mouse pointer glides to each element before it's used, and every click shows a red ripple (`demo/demo-cursor.ts`). Playwright has no on-screen cursor of its own.
- It uses its own config (`playwright.demo.config.ts`) and lives in `demo/`, so it never runs with `npm test` or in CI.
- The pauses in the demo are there for viewers only. The fast, assertion-focused version of the same flow is `tests/checkout.spec.ts`.
- To change the speed, set `SLOW_MO` (milliseconds before each action, default 300), for example `$env:SLOW_MO=600; npm run demo:checkout` in PowerShell.

## Test coverage

21 test cases, each run in 3 browsers (63 runs, plus one login setup step).

| Area | Test case | Type | Tag |
|---|---|---|---|
| **Login** | Standard user logs in and lands on Products | Positive | `@smoke` |
| | Locked-out user sees an error | Negative | `@smoke` |
| | Wrong password shows an error | Negative | |
| | Empty username shows an error | Negative | |
| | Empty password shows an error | Negative | |
| **Inventory: sorting** | Sort by name A to Z | Positive | |
| | Sort by name Z to A | Positive | |
| | Sort by price low to high | Positive | |
| | Sort by price high to low | Positive | |
| **Inventory: cart badge** | Adding one item shows badge 1 and a Remove button | Positive | `@smoke` |
| | Adding three items shows badge 3 | Positive | |
| | Removing an item lowers the badge count | Positive | |
| | Removing the last item hides the badge | Positive | |
| **Cart** | Added items are listed in the cart | Positive | `@smoke` |
| | Removing an item updates the list and badge | Positive | |
| | Removing every item empties the cart | Positive | |
| | Continue Shopping returns to inventory and keeps the cart | Positive | |
| **Checkout** | Full journey: login → add 2 items → cart → customer info → verify item total, tax and total → finish | End to end | `@smoke` |
| | Empty first name shows an error | Negative | |
| | Empty last name shows an error | Negative | |
| | Empty postal code shows an error | Negative | |

The checkout test doesn't hardcode the total. It adds up the item prices on the overview page, checks that they match the item total, then checks that total = item total + tax.

## Continuous integration

`.github/workflows/playwright.yml` runs on every push and pull request, and can also be started by hand from the Actions tab. It:

1. Installs dependencies with `npm ci`
2. Runs the TypeScript type check
3. Installs Playwright browsers
4. Runs the full suite in Chromium, Firefox and WebKit (2 retries on CI)
5. Uploads the HTML report as the `playwright-report` artifact, kept for 30 days

To view a CI report, open the workflow run, download the `playwright-report` artifact, unzip it and run `npx playwright show-report <unzipped-folder>`.

## Reports and debugging

- **HTML report:** `playwright-report/`, opened with `npm run report`.
- **On failure:** a screenshot and video are attached to the test in the report.
- **Traces:** recorded on the first retry. Open one from the report, or run `npx playwright show-trace <trace.zip>`, to step through every action with DOM snapshots, network calls and console logs.
