import { readFileSync } from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, type UserRole } from "../models/User";

// tsx doesn't auto-load .env — parse it here so `npm run seed` works standalone.
function loadEnv() {
  try {
    const txt = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  } catch {
    /* no .env file — rely on real environment */
  }
}
loadEnv();

const SEED_USERS: { username: string; password: string; role: UserRole }[] = [
  { username: "admin", password: "behanadmin", role: "admin" },
  { username: "cashier", password: "behancashier", role: "cashier" },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set — cannot seed.");

  await mongoose.connect(uri);
  console.log("→ connected to MongoDB");

  for (const u of SEED_USERS) {
    const existing = await User.findOne({ username: u.username }).lean();
    if (existing) {
      console.log(`✓ user '${u.username}' already exists — skipping`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    await User.create({ username: u.username, passwordHash, role: u.role });
    console.log(`✓ created ${u.role} '${u.username}' (password: ${u.password})`);
  }

  await mongoose.disconnect();
  console.log("✅ Seed complete.");
}

main().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
