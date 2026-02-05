import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: "device:create", description: "Buat device/session WhatsApp" },
  { name: "device:read", description: "Lihat daftar device" },
  { name: "device:update", description: "Edit device" },
  { name: "device:delete", description: "Hapus/disconnect device" },
  { name: "message:send", description: "Kirim pesan single" },
  { name: "broadcast:send", description: "Kirim broadcast" },
  { name: "broadcast:read", description: "Lihat log broadcast" },
  { name: "contact:create", description: "Tambah kontak" },
  { name: "contact:read", description: "Lihat kontak" },
  { name: "contact:update", description: "Edit kontak" },
  { name: "contact:delete", description: "Hapus kontak" },
  { name: "user:manage", description: "Kelola user tenant" },
  { name: "tenant:settings", description: "Pengaturan tenant" },
  { name: "tenant:read", description: "Lihat data tenant" },
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: PERMISSIONS.map((p) => p.name),
  tenant_admin: [
    "device:create", "device:read", "device:update", "device:delete",
    "message:send", "broadcast:send", "broadcast:read",
    "contact:create", "contact:read", "contact:update", "contact:delete",
    "user:manage", "tenant:settings", "tenant:read",
  ],
  operator: [
    "device:read", "device:update",
    "message:send", "broadcast:send", "broadcast:read",
    "contact:create", "contact:read", "contact:update", "contact:delete",
    "tenant:read",
  ],
  viewer: [
    "device:read", "broadcast:read", "contact:read", "tenant:read",
  ],
};

async function main() {
  console.log("Seeding permissions...");
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: p.name },
      create: p,
      update: { description: p.description },
    });
  }

  console.log("Seeding roles...");
  const roles = ["super_admin", "tenant_admin", "operator", "viewer"];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      create: {
        name: roleName,
        description: `Role: ${roleName}`,
      },
      update: {},
    });
  }

  console.log("Linking role permissions...");
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    for (const permName of permNames) {
      const perm = await prisma.permission.findUniqueOrThrow({ where: { name: permName } });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        create: { roleId: role.id, permissionId: perm.id },
        update: {},
      });
    }
  }

  // Optional: buat user super_admin & tenant demo jika belum ada
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  if (!existingUser) {
    console.log("Creating demo super_admin user (admin@example.com / admin123)...");
    const hashed = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password: hashed,
        name: "Super Admin",
      },
    });
    const superAdminRole = await prisma.role.findUniqueOrThrow({
      where: { name: "super_admin" },
    });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
        tenantId: null, // global
      },
    });

    console.log("Creating demo tenant...");
    const tenant = await prisma.tenant.create({
      data: { name: "Demo Tenant", slug: "demo" },
    });
    console.log("Demo tenant slug: demo. Assign tenant_admin to admin@example.com manually if needed.");
  }

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
