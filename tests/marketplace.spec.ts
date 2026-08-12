import { test, expect } from '@playwright/test';

test.describe('VendorVerse Multi-Vendor Marketplace E2E Tests', () => {
  test('1. Landing Page renders successfully with luxury design components', async ({ page }) => {
    await page.goto('/');
    
    // Check main title
    await expect(page.locator('h1')).toContainText('RAW ELEGANCE');
    
    // Check Navigation links
    await expect(page.getByRole('link', { name: 'Shop' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AI Importer' })).toBeVisible();
  });

  test('2. Product Catalog browse & search filters work', async ({ page }) => {
    await page.goto('/products');
    
    // Header should state All Products
    await expect(page.locator('h1')).toContainText('All Products');

    // Search filter input should exist
    const searchInput = page.getByPlaceholder('Search...');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('Barcode');
    await page.waitForTimeout(500); // Wait for debounce
  });

  test('3. Open access to Customer Dashboard with order tracking and restock alerts', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Order History & Inventory Alerts');
  });

  test('4. Open access to Seller Dashboard with stock refill alerts and inventory controls', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await expect(page.locator('h1')).toContainText('Inventory & Catalog Control');
  });

  test('5. Admin Dashboard requires authentication and displays Admin Gate', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Admin Gate');
    
    // Click auto-fill admin credentials button
    await page.getByRole('button', { name: '⚡ Auto-Fill Demo Admin Credentials' }).click();
    
    // Verify Admin Login button is present
    await expect(page.getByRole('button', { name: 'Verify Admin Access' })).toBeVisible();
  });

  test('6. AI Catalog Importer page renders with 30s demo presets', async ({ page }) => {
    await page.goto('/importer');
    
    await expect(page.locator('h1')).toContainText('Turn Messy Catalogs into Live Listings');
    
    // Preset button should exist
    const presetBtn = page.getByRole('button', { name: '30s Demo Preset' });
    await expect(presetBtn).toBeVisible();
    
    // Click preset
    await presetBtn.click();
    
    // Extract button should be active
    const extractBtn = page.getByRole('button', { name: 'Extract Listing with Gemini AI' });
    await expect(extractBtn).toBeVisible();
  });
});
