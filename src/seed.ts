import * as bcrypt from "bcrypt";
import prisma from "./shared/prisma";
import { UserRole, UserStatus } from "../prisma/generated/prisma";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create/Upsert Super Admin
  const adminEmail = "admin@annabiasmart.com";
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      password: hashedPassword,
    },
    create: {
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      needPasswordChange: false,
      contactNumber: "+880 1700-000000",
    },
  });

  console.log("✅ Admin user ready:", admin.email);

  // 2. Create/Upsert StoreSettings
  const settings = await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      storeName: "Annabia's Mart",
      supportEmail: "support@annabiasmart.com",
      supportPhone: "+880 1700-000000",
      address: "Gulshan-1, Dhaka, Bangladesh",
      currency: "BDT",
      currencySymbol: "৳",
      steadfastBaseUrl: "https://portal.packzy.com/api/v1",
      redxBaseUrl: "https://openapi.redx.com.bd/v1.0.0",
    },
  });

  console.log("✅ Store settings initialized:", settings.storeName);
  console.log("🎉 Database seeded successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
