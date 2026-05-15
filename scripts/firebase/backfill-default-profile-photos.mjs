import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const DEFAULT_PROFILE_PHOTO_URL = "/home-icons/profile.svg";

loadEnvFile(path.join(process.cwd(), ".env.local"));

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Firebase Admin Env fehlt. Setze FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL und FIREBASE_ADMIN_PRIVATE_KEY in .env.local.",
  );
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();
const users = await db.collection("users").get();
let updated = 0;
let batch = db.batch();
let pending = 0;

for (const doc of users.docs) {
  const data = doc.data();
  const photoURL = typeof data.photoURL === "string" ? data.photoURL.trim() : "";

  if (photoURL.length > 0) {
    continue;
  }

  batch.set(
    doc.ref,
    {
      photoURL: DEFAULT_PROFILE_PHOTO_URL,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  updated += 1;
  pending += 1;

  if (pending === 450) {
    await batch.commit();
    batch = db.batch();
    pending = 0;
  }
}

if (pending > 0) {
  await batch.commit();
}

console.log(
  `Default-Profilbilder gesetzt: ${updated}/${users.size} User in ${projectId}.`,
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
