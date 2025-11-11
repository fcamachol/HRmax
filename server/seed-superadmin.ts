import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedSuperAdmin() {
  console.log("🚀 Iniciando seed de Super Admin...\n");

  const username = process.env.SUPER_ADMIN_USERNAME || "superadmin";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Admin123!";

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`⚠️  El usuario '${username}' ya existe.`);
      
      if (!existingUser[0].isSuperAdmin) {
        console.log("   Actualizando a Super Admin...");
        await db
          .update(users)
          .set({ isSuperAdmin: true })
          .where(eq(users.username, username));
        console.log("✅ Usuario actualizado a Super Admin");
      } else {
        console.log("✅ El usuario ya es Super Admin");
      }
      
      console.log("\n📋 Credenciales:");
      console.log(`   Username: ${username}`);
      console.log(`   Password: (usa tu password actual)`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      nombre: "Super Administrador",
      email: "admin@nominahub.com",
      tipoUsuario: "maxtalent",
      isSuperAdmin: true,
      activo: true
    }).returning();

    console.log("✅ Super Admin creado exitosamente!\n");
    console.log("📋 Credenciales de acceso:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro.");
    console.log("   Puedes cambiar la contraseña después del primer login.");
    console.log("\n💡 Para testing con mock auth, usa estos headers:");
    console.log("   X-User-Id: " + newUser.id);
    console.log("   X-Username: " + username);
    console.log("   X-Is-Super-Admin: true");
    console.log("   X-User-Type: maxtalent");

  } catch (error) {
    console.error("❌ Error al crear Super Admin:", error);
    process.exit(1);
  }

  console.log("\n✨ Seed completado!");
  process.exit(0);
}

seedSuperAdmin();
