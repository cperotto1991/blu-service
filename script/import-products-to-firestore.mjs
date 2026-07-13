import fs from "node:fs";
import path from "node:path";

const parseArg = (key) => {
  const arg = process.argv.find((item) => item.startsWith(`${key}=`));
  return arg ? arg.split("=").slice(1).join("=") : undefined;
};

const resolveFilePath = (value, fallback) =>
  path.resolve(process.cwd(), value ?? fallback);

const seedPath = resolveFilePath(
  parseArg("--seed"),
  "script/firebase-seed-products.json",
);

const serviceAccountPath = resolveFilePath(
  parseArg("--serviceAccount") ?? process.env.GOOGLE_APPLICATION_CREDENTIALS,
  "",
);

if (!serviceAccountPath) {
  console.error(
    "Service account mancante. Usa --serviceAccount=percorso/file.json oppure GOOGLE_APPLICATION_CREDENTIALS.",
  );
  process.exit(1);
}

if (!fs.existsSync(seedPath)) {
  console.error(`Seed non trovato: ${seedPath}`);
  process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account non trovato: ${serviceAccountPath}`);
  process.exit(1);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const normalizeSeed = (rawSeed) => {
  if (Array.isArray(rawSeed)) {
    return {
      collection: "products",
      documents: rawSeed.map((item) => ({
        id: String(item?.code ?? item?.id ?? "").toUpperCase(),
        data: item,
      })),
    };
  }

  const collection = String(rawSeed?.collection ?? "products");
  const documents = Array.isArray(rawSeed?.documents) ? rawSeed.documents : [];

  return {
    collection,
    documents: documents.map((entry) => {
      const data = entry?.data ?? {};
      const id = String(
        entry?.id ?? data?.code ?? data?.id ?? "",
      ).toUpperCase();
      return { id, data };
    }),
  };
};

const run = async () => {
  const seedRaw = readJson(seedPath);
  const { collection, documents } = normalizeSeed(seedRaw);

  const validDocuments = documents.filter(
    (entry) => entry.id && typeof entry.data === "object" && entry.data,
  );

  if (!validDocuments.length) {
    console.error("Nessun documento valido trovato nel seed.");
    process.exit(1);
  }

  let admin;
  try {
    admin = await import("firebase-admin");
  } catch {
    console.error(
      'Dipendenza mancante: firebase-admin. Installa con "npm install firebase-admin".',
    );
    process.exit(1);
  }

  const serviceAccount = readJson(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });
  }

  const firestore = admin.getFirestore();

  const chunkSize = 400;
  let written = 0;

  for (let index = 0; index < validDocuments.length; index += chunkSize) {
    const chunk = validDocuments.slice(index, index + chunkSize);
    const batch = firestore.batch();

    for (const item of chunk) {
      const docRef = firestore.collection(collection).doc(item.id);
      batch.set(docRef, item.data, { merge: false });
    }

    await batch.commit();
    written += chunk.length;
    console.log(`Scritti ${written}/${validDocuments.length} documenti...`);
  }

  console.log(
    `Import completato: ${written} documenti nella collection ${collection}.`,
  );
};

run().catch((error) => {
  console.error("Errore durante import Firestore:", error);
  process.exit(1);
});
