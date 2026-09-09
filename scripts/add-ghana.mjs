import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not defined in environment");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log("Adding Ghana to countries table...");

  // 1. Insert or update Ghana in countries table
  await sql.query(`
    INSERT INTO countries (code, name, currency_code, currency_symbol, base_shipping_fee, flag_emoji, is_active, sort_order)
    VALUES ('GH', 'Ghana', 'GHS', 'GH₵', 45.00, '🇬🇭', true, 5)
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      currency_code = EXCLUDED.currency_code,
      currency_symbol = EXCLUDED.currency_symbol,
      base_shipping_fee = EXCLUDED.base_shipping_fee,
      flag_emoji = EXCLUDED.flag_emoji,
      is_active = true,
      sort_order = 5;
  `);

  // Re-order other countries if needed
  await sql.query(`UPDATE countries SET sort_order = 6 WHERE code = 'FR';`);
  await sql.query(`UPDATE countries SET sort_order = 7 WHERE code = 'US';`);

  console.log("Ghana added to countries table successfully.");

  // 2. Fetch all products
  const products = await sql.query(`SELECT id, slug, name FROM products;`);
  console.log(`Found ${products.length} products to assign Ghana prices.`);

  const priceMap = {
    "bouillie-maman-bebe": 80.00,
    "farine-infantile-enrichie": 55.00,
    "farine-sorgho-rouge": 45.00,
    "fonio-precuit-guinee": 70.00,
    "millet-perle-bio": 40.00,
  };

  for (const product of products) {
    const price = priceMap[product.slug] || 50.00;
    await sql.query(
      `INSERT INTO product_prices (product_id, country_code, price)
       VALUES ($1, 'GH', $2)
       ON CONFLICT (product_id, country_code) DO UPDATE SET price = EXCLUDED.price;`,
      [product.id, price]
    );
    console.log(`- Set price for ${product.name} (${product.slug}): ${price} GH₵`);
  }

  // 3. Verify final countries
  const countries = await sql.query(`SELECT code, name, currency_code, currency_symbol, base_shipping_fee, is_active, sort_order FROM countries ORDER BY sort_order ASC;`);
  console.log("\nCurrent active countries in DB:", countries);

  // 4. Verify Ghana prices
  const ghanaPrices = await sql.query(`
    SELECT p.name, pp.country_code, pp.price
    FROM product_prices pp
    JOIN products p ON p.id = pp.product_id
    WHERE pp.country_code = 'GH';
  `);
  console.log("\nGhana prices in DB:", ghanaPrices);
}

main().catch(console.error);
