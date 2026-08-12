import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@vendorverse.com';
const seedSellerEmail = process.env.SEED_SELLER_EMAIL ?? 'seller@vendorverse.com';
const seedCustomerEmail = process.env.SEED_CUSTOMER_EMAIL ?? 'customer@vendorverse.com';
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';
const seedSellerPassword = process.env.SEED_SELLER_PASSWORD ?? 'Seller@123456';
const seedCustomerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? 'Customer@123456';

interface SeedVariant {
  type: string;
  value: string;
  stock: number;
  lowStockThreshold?: number;
  restockEta?: Date | null;
}

async function main() {
  console.log('Seeding categories...');

  const categoriesData = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, scanners, and inventory hardware' },
    { name: 'Supplies', slug: 'supplies', description: 'Warehouse tools, packaging, and fulfillment essentials' },
    { name: 'Books', slug: 'books', description: 'Fiction, non-fiction, academic, and kids books' },
    { name: 'Groceries', slug: 'groceries', description: 'Daily essentials, fresh produce, and packaged foods' },
    { name: 'Home Decor', slug: 'home-decor', description: 'Furniture, lighting, and home accessories' },
    { name: 'Beauty', slug: 'beauty', description: 'Cosmetics, skincare, and personal care' },
    { name: 'Sports', slug: 'sports', description: 'Sports equipment, fitness gear, and activewear' },
    { name: 'Furniture', slug: 'furniture', description: 'Beds, sofas, tables, and premium home styling' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories.push(category);
  }
  console.log(`Seeded ${categories.length} categories.`);

  console.log('Seeding settings...');
  const settingsData = [
    { key: 'platform_fee_percent', value: '5', description: 'Platform commission charge percentage' },
    { key: 'default_gst_percent', value: '18', description: 'Default GST rate for products' },
    { key: 'platform_name', value: 'VendorVerse', description: 'Name of the e-commerce platform' },
  ];

  for (const setting of settingsData) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }
  console.log('Seeded settings.');

  console.log('Seeding test users with bcrypt passwords...');

  const hashedCustomerPassword = await bcrypt.hash(seedCustomerPassword, 10);
  const hashedSellerPassword = await bcrypt.hash(seedSellerPassword, 10);
  const hashedAdminPassword = await bcrypt.hash(seedAdminPassword, 10);

  const customer = await prisma.user.upsert({
    where: { email: seedCustomerEmail },
    update: { password: hashedCustomerPassword },
    create: {
      email: seedCustomerEmail,
      password: hashedCustomerPassword,
      name: 'Rahul Kumar',
      phone: '+919876543210',
      role: Role.CUSTOMER,
      emailVerified: true,
    },
  });

  await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: seedSellerEmail },
    update: { password: hashedSellerPassword },
    create: {
      email: seedSellerEmail,
      password: hashedSellerPassword,
      name: 'Orion Supplies',
      phone: '+919876543211',
      role: Role.SELLER,
      emailVerified: true,
    },
  });

  const store = await prisma.store.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      name: 'Orion Supply Co',
      slug: 'orion-supply-co',
      description: 'A trusted multi-vendor store offering inventory and logistics essentials.',
      logo: 'https://images.unsplash.com/photo-1541103865618-a0dec0291771?q=80&w=200&h=200&fit=crop',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&h=400&fit=crop',
      isVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: seedAdminEmail },
    update: { password: hashedAdminPassword },
    create: {
      email: seedAdminEmail,
      password: hashedAdminPassword,
      name: 'Platform Administrator',
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  console.log('Seeded users and profiles:', {
    customer: customer.email,
    seller: seller.email,
    store: store.slug,
    admin: admin.email,
  });

  console.log('Seeding sample products for Orion Supply Co...');
  const electronicsCategory = categories.find((c) => c.slug === 'electronics');
  if (electronicsCategory) {
    const productsData = [
      {
        name: 'Smart Barcode Scanner',
        slug: 'smart-barcode-scanner',
        description: 'Wireless barcode scanner with real-time inventory sync and batch scan support for warehouse and retail operations.',
        brand: 'Orion Supply Co',
        price: 899900, // ₹8,999 in paise
        compareAtPrice: 1250000,
        discount: 28,
        weight: 850,
        dimensions: '60x40x10',
        shippingCharge: 15000, // ₹150 in paise
        images: [
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop',
        ],
        variants: [
          { type: 'bundle', value: 'Single Unit', stock: 12 },
          { type: 'bundle', value: 'Starter Pack', stock: 8 },
          { type: 'bundle', value: 'Enterprise Kit', stock: 4 },
        ] as SeedVariant[],
      },
      {
        name: 'Compact Shipping Scale',
        slug: 'compact-shipping-scale',
        description: 'Precision shipping scale with Bluetooth reporting, ideal for fulfillment centers and dispatch counters.',
        brand: 'Orion Supply Co',
        price: 450000, // ₹4,500 in paise
        weight: 320,
        dimensions: '30x25x2',
        images: [
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
        ],
        variants: [
          { type: 'model', value: 'Standard', stock: 15 },
          { type: 'model', value: 'Pro', stock: 0, restockEta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), lowStockThreshold: 3 },
          { type: 'model', value: 'Pro Plus', stock: 2, lowStockThreshold: 3 },
        ] as SeedVariant[],
      },
    ];

    for (const prodInfo of productsData) {
      const { variants, ...prodFields } = prodInfo;
      const product = await prisma.product.upsert({
        where: { slug: prodFields.slug },
        update: {},
        create: {
          ...prodFields,
          storeId: store.id,
          categoryId: electronicsCategory.id,
        },
      });

      for (const variant of variants) {
        await prisma.productVariant.upsert({
          where: {
            productId_type_value: {
              productId: product.id,
              type: variant.type,
              value: variant.value,
            },
          },
          update: {},
          create: {
            productId: product.id,
            type: variant.type,
            value: variant.value,
            stock: variant.stock,
            lowStockThreshold: variant.lowStockThreshold ?? 5,
            restockEta: variant.restockEta ?? null,
          },
        });
      }
    }
    console.log('Seeded sample products.');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
