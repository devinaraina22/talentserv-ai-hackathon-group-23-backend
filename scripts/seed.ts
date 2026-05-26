import { resetStore } from "../src/lib/db";

async function main() {
  await resetStore();
  console.log("Database seeded from data/seed.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
