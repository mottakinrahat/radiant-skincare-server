const bcrypt = require('bcrypt');
const { PrismaClient } = require('./prisma/generated/prisma');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Synchronizing frontend products & bundles to backend database...');

  // 1. Super Admin
  const adminEmail = 'admin@annabiasmart.com';
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      password: hashedPassword,
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      needPasswordChange: false,
      contactNumber: '+880 1700-000000',
    },
  });

  // 1b. Manager
  const managerEmail = 'manager@annabiasmart.com';
  await prisma.user.upsert({
    where: { email: managerEmail },
    update: { role: 'MANAGER', status: 'ACTIVE' },
    create: {
      name: 'Operations Manager',
      email: managerEmail,
      password: hashedPassword,
      role: 'MANAGER',
      status: 'ACTIVE',
      needPasswordChange: false,
      contactNumber: '+880 1711-111111',
    },
  });

  // 2. Store Settings
  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      storeName: "Annabia's Mart",
      supportEmail: 'support@annabiasmart.com',
      supportPhone: '+880 1700-000000',
      address: 'Gulshan-1, Dhaka, Bangladesh',
      currency: 'BDT',
      currencySymbol: '৳',
      steadfastBaseUrl: 'https://portal.packzy.com/api/v1',
      redxBaseUrl: 'https://openapi.redx.com.bd/v1.0.0',
    },
  });

  // 3. Categories
  const catNight = await prisma.category.upsert({
    where: { categoryName: 'নাইট ক্রিম' },
    update: {},
    create: {
      categoryName: 'নাইট ক্রিম',
      slug: 'night-cream',
      description: 'রাতের গভীর ত্বকের পরিচর্যা ও পুষ্টি প্রদানকারী ক্রিম',
      image: '/img-3.png',
    },
  });

  const catSun = await prisma.category.upsert({
    where: { categoryName: 'সানস্ক্রিন' },
    update: {},
    create: {
      categoryName: 'সানস্ক্রিন',
      slug: 'sunscreen',
      description: 'সূর্যের ক্ষতিকর রশ্মি থেকে ত্বককে সুরক্ষার ফর্মুলেশন',
      image: '/image-8.png',
    },
  });

  const catBundle = await prisma.category.upsert({
    where: { categoryName: 'সেট ও কম্বো' },
    update: {},
    create: {
      categoryName: 'সেট ও কম্বো',
      slug: 'bundles',
      description: 'স্পেশাল কম্বো ও বান্ডেল অফার',
      image: 'https://res.cloudinary.com/dse4w3es9/image/upload/v1786776593/ChatGPT_Image_Aug_14_2026_02_55_03_AM_hte9f8.png',
    },
  });

  // 4. Brands
  const brandAnnabia = await prisma.brand.upsert({
    where: { brandName: "Annabia's Mart" },
    update: {},
    create: {
      brandName: "Annabia's Mart",
      description: 'অফিশিয়াল প্রিমিয়াম স্কিনকেয়ার ব্র্যান্ড',
      logoUrl: '/Annabias Mart.png',
    },
  });

  // Clean old test products
  await prisma.productImage.deleteMany({});
  await prisma.orderItems.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.product.deleteMany({});

  // 5. Product 1: Luxury 4-in-1 Night Cream
  const p1 = await prisma.product.create({
    data: {
      id: 'night-cream',
      name: 'লাক্সারি ৪-ইন-১ নাইট ক্রিম',
      slug: 'luxury-4in1-night-cream',
      productSerial: '01',
      productAddById: admin.id,
      categoryId: catNight.id,
      brandId: brandAnnabia.id,
      shortDescription: 'ঘুমের মধ্যেই ত্বকের নবজন্ম — দাগ-ছোপ, পিগমেন্টেশন আর ব্রণের চিহ্নে ঘিরে থাকা মলিন ত্বকের জন্য।',
      description: 'রাতের এক প্রলেপেই কাজ শুরু। দাগ-ছোপ, পিগমেন্টেশন আর ব্রণের চিহ্নে ঘিরে থাকা মলিন ত্বকের জন্য বানানো এই ক্রিম ঘুমের মধ্যেই ত্বককে দেয় গভীর পুষ্টি — সকালে চোখ খুললে ত্বক হয়ে ওঠে কোমল, মসৃণ আর উজ্জ্বল।',
      buyingPrice: 650,
      sellingPrice: 990,
      regularPrice: 1290,
      stock: 120,
      isPublished: true,
      isFeatured: true,
      status: 'ACTIVE',
      tags: ['নাইট ক্রিম', 'বেস্ট সেলার', 'গ্লো'],
      images: {
        create: [
          { url: '/img-3.png', isPrimary: true, altText: 'লাক্সারি ৪-ইন-১ নাইট ক্রিম' },
          { url: '/img-2.png', isPrimary: false, altText: 'নাইট ক্রিম গ্যালারি ১' },
          { url: '/img-4.png', isPrimary: false, altText: 'নাইট ক্রিম গ্যালারি ২' }
        ]
      }
    }
  });

  // 6. Product 2: Luxury Sunscreen
  const p2 = await prisma.product.create({
    data: {
      id: 'sunscreen',
      name: 'লাক্সারি সানস্ক্রিন',
      slug: 'luxury-sunscreen',
      productSerial: '02',
      productAddById: admin.id,
      categoryId: catSun.id,
      brandId: brandAnnabia.id,
      shortDescription: 'সুরক্ষা যেন সিল্কের মতো হালকা — নো হোয়াইট কাস্ট ব্রড-স্পেকট্রাম সানস্ক্রিন।',
      description: 'সূর্যের রোদে বেরোনোর আগে এক পাম্প — কোনো সাদা ছাপ নেই, কোনো ভারী অনুভূতি নেই। শুধু হালকা, সিল্কি ফিনিশ যা মেকআপের নিচেও মিলিয়ে যায় নিমেষে, আর সারাদিন রাখে সুরক্ষিত।',
      buyingPrice: 480,
      sellingPrice: 750,
      regularPrice: 950,
      stock: 85,
      isPublished: true,
      isFeatured: true,
      status: 'ACTIVE',
      tags: ['সানস্ক্রিন', 'নতুন', 'এসপিএফ'],
      images: {
        create: [
          { url: '/image-8.png', isPrimary: true, altText: 'লাক্সারি সানস্ক্রিন' }
        ]
      }
    }
  });

  // 7. Product 3: Night Cream + Sunscreen Bundle
  const p3 = await prisma.product.create({
    data: {
      id: 'bundle',
      name: 'নাইট ক্রিম + সানস্ক্রিন বান্ডেল',
      slug: 'night-cream-sunscreen-bundle',
      productSerial: '03',
      productAddById: admin.id,
      categoryId: catBundle.id,
      brandId: brandAnnabia.id,
      shortDescription: 'রাতের যত্ন ও দিনের সুরক্ষা একসাথে — দুটি প্রিমিয়াম ফর্মুলা একসাথে নিলে পাচ্ছেন বিশেষ ৳২৫০ ছাড়!',
      description: 'লাক্সারি ৪-ইন-১ নাইট ক্রিম এবং লাক্সারি সানস্ক্রিন একসাথে নিয়ে সম্পূর্ণ স্কিনকেয়ার রুটিন পূর্ণ করুন। রাতে দাগহীন উজ্জ্বল ত্বকের মেরামত এবং দিনে আল্ট্রা-শিয়ার সানস্ক্রিনের সর্বোচ্চ ইউভি সুরক্ষা। সেট অফারে পাচ্ছেন আকর্ষণীয় ৳২৫০ ইনস্ট্যান্ট সেভিংস!',
      buyingPrice: 1000,
      sellingPrice: 1490,
      regularPrice: 1740,
      stock: 60,
      isPublished: true,
      isFeatured: true,
      status: 'ACTIVE',
      tags: ['সেট অফার', 'বান্ডেল', 'স্পেশাল ছাড়'],
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dse4w3es9/image/upload/v1786776593/ChatGPT_Image_Aug_14_2026_02_55_03_AM_hte9f8.png', isPrimary: true, altText: 'নাইট ক্রিম + সানস্ক্রিন বান্ডেল' }
        ]
      }
    }
  });

  console.log('✅ Synchronized 3 products to database:');
  console.log('1. ' + p1.name + ' - ৳' + p1.sellingPrice);
  console.log('2. ' + p2.name + ' - ৳' + p2.sellingPrice);
  console.log('3. ' + p3.name + ' - ৳' + p3.sellingPrice);
  console.log('🎉 Seeding completed!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
