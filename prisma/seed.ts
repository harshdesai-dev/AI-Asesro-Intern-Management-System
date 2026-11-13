import "dotenv/config";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || "AI ASESRO Admin";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) in .env before seeding.");
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    create: { name, email, passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
  });

  console.log(`Admin account ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
