import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");

const requiredKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

if (!fs.existsSync(envPath)) {
  console.error(".env.local fehlt. Kopiere zuerst .env.example nach .env.local.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const values = new Map();

for (const line of content.split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#")) continue;
  const separator = line.indexOf("=");
  if (separator === -1) continue;
  const key = line.slice(0, separator).trim();
  const value = line.slice(separator + 1).trim();
  values.set(key, value);
}

const missing = requiredKeys.filter((key) => !values.get(key));

if (missing.length > 0) {
  console.error("Folgende Firebase-Variablen fehlen:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("Firebase .env.local ist fuer den ersten Test vollstaendig.");
