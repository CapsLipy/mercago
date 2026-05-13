<?php

// This script manually fixes the SQLite database table "orders" 
// to allow the 'found_rider' status in the CHECK constraint.

$dbPath = __DIR__ . '/database/database.sqlite';

if (!file_exists($dbPath)) {
    die("❌ SQLite database not found at $dbPath\n");
}

try {
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "🔄 Fixing SQLite orders table...\n";

    $db->exec("PRAGMA foreign_keys=OFF");

    // 1. Create new table with corrected CHECK constraint
    $db->exec("CREATE TABLE orders_new (
        id              TEXT NOT NULL PRIMARY KEY,
        shopper_id      TEXT NOT NULL,
        vendor_id       TEXT NOT NULL,
        rider_id        TEXT,
        total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
        status          TEXT NOT NULL DEFAULT 'completed',
        delivery_status TEXT NOT NULL DEFAULT 'finding_rider' 
            CHECK(delivery_status IN ('finding_rider','found_rider','ongoing', 'completed', 'cancelled')),
        payment_method  TEXT NOT NULL DEFAULT 'cod'
            CHECK(payment_method IN ('cod','online')),
        created_at      DATETIME,
        updated_at      DATETIME,
        FOREIGN KEY (shopper_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id)  REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (rider_id)   REFERENCES users(id) ON DELETE SET NULL
    )");

    // 2. Copy data (mapping columns)
    // Check if payment_method exists in old table
    $columns = $db->query("PRAGMA table_info(orders)")->fetchAll(PDO::FETCH_ASSOC);
    $hasPaymentMethod = false;
    foreach ($columns as $col) {
        if ($col['name'] === 'payment_method') $hasPaymentMethod = true;
    }

    if ($hasPaymentMethod) {
        $db->exec("INSERT INTO orders_new SELECT id, shopper_id, vendor_id, rider_id, total_amount, status, delivery_status, payment_method, created_at, updated_at FROM orders");
    } else {
        $db->exec("INSERT INTO orders_new (id, shopper_id, vendor_id, rider_id, total_amount, status, delivery_status, created_at, updated_at) 
                   SELECT id, shopper_id, vendor_id, rider_id, total_amount, status, delivery_status, created_at, updated_at FROM orders");
    }

    // 3. Swap tables
    $db->exec("DROP TABLE orders");
    $db->exec("ALTER TABLE orders_new RENAME TO orders");

    $db->exec("PRAGMA foreign_keys=ON");

    echo "✅ Successfully fixed orders table constraint!\n";

} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
