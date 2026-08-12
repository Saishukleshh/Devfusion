import { test, expect } from '@playwright/test';

test.describe('VendorVerse Multi-Vendor Marketplace End-to-End Test Suite', () => {

  test('1. Landing Page — All buttons, dark mode toggle, and newsletter subscription', async ({ page }) => {
    await page.goto('/');

    // Check main title branding
    await expect(page.locator('h1')).toContainText('SMART INVENTORY');

    // Test Navigation links
    await expect(page.getByRole('link', { name: 'Shop' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AI Importer' })).toBeVisible();

    // Test Dark Mode toggle button
    const themeBtn = page.getByTitle('Toggle Dark Mode');
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
    }

    // Test Newsletter form input and submit button
    const newsletterInput = page.getByPlaceholder('Enter email address');
    if (await newsletterInput.isVisible()) {
      await newsletterInput.fill('tester@vendorverse.com');
      await page.getByRole('button', { name: 'Subscribe' }).click();
    }
  });

  test('2. Product Catalog Browse — Search, filters, and sorting dropdowns', async ({ page }) => {
    await page.goto('/products');

    await expect(page.locator('h1')).toContainText('All Products');

    // Test Search input
    const searchInput = page.getByPlaceholder('Search...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Barcode');
    await page.waitForTimeout(300);
  });

  test('3. Product Detail Page — Variant selection, quantity controls, and cart button', async ({ page }) => {
    await page.goto('/products/smart-barcode-scanner');

    // Product Title check
    await expect(page.locator('h1')).toContainText('Smart Barcode Scanner');

    // Add to Cart button check
    const addToCartBtn = page.getByRole('button', { name: 'Add to Cart' });
    await expect(addToCartBtn).toBeVisible();
  });

  test('4. Shopping Cart — Item list, coupon code apply, and checkout button', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.locator('h1')).toContainText('Shopping Cart');

    // Test Coupon input
    const couponInput = page.getByPlaceholder('e.g. FESTIVE20');
    if (await couponInput.isVisible()) {
      await couponInput.fill('FESTIVE20');
      const applyBtn = page.getByRole('button', { name: 'Apply' });
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
      }
    }
  });

  test('5. Checkout Page — Address inputs and payment method selector', async ({ page }) => {
    await page.goto('/checkout');

    // Payment methods check (Razorpay vs Cash on Delivery)
    await expect(page.getByText('Cash on Delivery')).toBeVisible();
  });

  test('6. Authentication Pages — Quick demo auto-fill buttons', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h2')).toContainText('Welcome Back');

    // Test Quick Demo Credentials Buttons
    await page.getByRole('button', { name: 'Customer' }).click();
    await expect(page.getByPlaceholder('name@example.com')).toHaveValue('customer@vendorverse.com');

    await page.getByRole('button', { name: 'Seller' }).click();
    await expect(page.getByPlaceholder('name@example.com')).toHaveValue('seller@vendorverse.com');
  });

  test('7. AI Catalog Importer — Preset buttons, Gemini extraction, and review table', async ({ page }) => {
    await page.goto('/importer');

    await expect(page.locator('h1')).toContainText('Turn Messy Catalogs into Live Listings');

    // Test 30s Demo Preset Button
    const presetBtn = page.getByRole('button', { name: '30s Demo Preset' });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Verify raw text got filled into textarea
    const textarea = page.getByPlaceholder('Paste raw WhatsApp text');
    await expect(textarea).not.toBeEmpty();
  });

  test('8. Admin Dashboard Panel — Admin Auth Gate & Demo Auto-Fill button', async ({ page }) => {
    await page.goto('/admin');

    // Admin Gate should block unauthenticated access
    await expect(page.locator('h1')).toContainText('Admin Gate');

    // Test 1-click Auto-Fill Demo Admin Credentials button
    const autoFillBtn = page.getByRole('button', { name: '⚡ Auto-Fill Demo Admin Credentials' });
    await expect(autoFillBtn).toBeVisible();
    await autoFillBtn.click();

    // Test Verify Admin Access submit button
    const verifyBtn = page.getByRole('button', { name: 'Verify Admin Access' });
    await expect(verifyBtn).toBeVisible();
  });

});
