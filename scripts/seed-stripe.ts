/**
 * Stripe Test Seed Script
 *
 * Creates test-mode products and prices in Stripe for local development.
 * Each product gets a monthly recurring price.
 *
 * Usage: npx tsx scripts/seed-stripe.ts
 *
 * Requirements:
 *   - STRIPE_SECRET_KEY must be set and must start with sk_test_
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY ?? "";

if (!key) {
  console.error("Error: STRIPE_SECRET_KEY environment variable is required.");
  process.exit(1);
}

if (!key.startsWith("sk_test_")) {
  console.error(
    "Error: STRIPE_SECRET_KEY must be a test key (starts with sk_test_). " +
      "Refusing to run against live keys.",
  );
  process.exit(1);
}

const stripe = new Stripe(key);

const TIERS = [
  { name: "Free", amount: 0 },
  { name: "Pro", amount: 1900 },
  { name: "Enterprise", amount: 9900 },
] as const;

async function seed() {
  console.log("Seeding Stripe test products and prices...\n");

  for (const tier of TIERS) {
    const product = await stripe.products.create({
      name: tier.name,
      metadata: { tier: tier.name.toLowerCase() },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.amount,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { tier: tier.name.toLowerCase() },
    });

    console.log(`${tier.name}:`);
    console.log(`  product_id: ${product.id}`);
    console.log(`  price_id:   ${price.id}`);
  }

  console.log("\nDone. Add price IDs to your .env as STRIPE_PRICE_ID_<TIER>.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
