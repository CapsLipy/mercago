<?php

/**
 * Emergency fix script — run this when the migration can't run automatically.
 * Adds 'found_rider' to the delivery_status CHECK constraint,
 * and adds payment_method + payment_status columns to the orders table.
 *
 * Usage:  php fix_db.php
 */

// Try both possible locations for the database
$possiblePaths = [
    __DIR__ . '/database/database.sqlite',
    __DIR__ . '/../database/database.sqlite',
    __DIR__ . '/database.sqlite',
];

$dbPath = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $dbPath = $path;
        break;
    }
}

if (!$dbPath) {
    die("❌ SQLite database not found. Tried:\n" . implode("\n", $possiblePaths) . "\n");
}

echo "✅ Found database at: $dbPath\n";

try {
    $db = new PDO("sqlite:$dbPath");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check existing columns
    $cols = [];
    foreach ($db->query('PRAGMA table_info("orders")') as $row) {
        $cols[] = $row['name'];
    }

    echo "📋 Existing columns: " . implode(', ', $cols) . "\n";

    $hasPaymentMethod = in_array('payment_method', $cols);
    $hasPaymentStatus = in_array('payment_status', $cols);

    echo "🔄 Rebuilding orders table with all required columns...\n";

    $db->exec('PRAGMA foreign_keys=OFF');

    // Build the new table (always with both payment columns)
    $db->exec('CREATE TABLE "orders_new" (
        "id"              varchar NOT NULL,
        "shopper_id"      varchar NOT NULL,
        "vendor_id"       varchar NOT NULL,
        "rider_id"        varchar,
        "total_amount"    numeric(10,2) NOT NULL DEFAULT 0,
        "status"          varchar NOT NULL DEFAULT \'completed\',
        "delivery_status" varchar NOT NULL DEFAULT \'finding_rider\'
            CHECK("delivery_status" IN (\'finding_rider\',\'found_rider\',\'ongoing\',\'completed\',\'cancelled\')),
        "payment_method"  varchar NOT NULL DEFAULT \'cod\'
            CHECK("payment_method" IN (\'cod\',\'online\',\'gcash\',\'maya\',\'card\')),
        "payment_status"  varchar NOT NULL DEFAULT \'pending\'
            CHECK("payment_status" IN (\'pending\',\'collected\',\'settled\')),
        "created_at"      datetime,
        "updated_at"      datetime,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("shopper_id") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("vendor_id")  REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("rider_id")   REFERENCES "users"("id") ON DELETE SET NULL
    )');

    // Copy with fallback defaults for missing columns
    $pmCol  = $hasPaymentMethod ? '"payment_method"' : "'cod'";
    $psCol  = $hasPaymentStatus  ? '"payment_status"'  : "'pending'";

    $db->exec("INSERT INTO \"orders_new\"
        SELECT \"id\",\"shopper_id\",\"vendor_id\",\"rider_id\",
               \"total_amount\",\"status\",\"delivery_status\",
               $pmCol, $psCol,
               \"created_at\",\"updated_at\"
        FROM \"orders\"");

    $db->exec('DROP TABLE "orders"');
    $db->exec('ALTER TABLE "orders_new" RENAME TO "orders"');
    $db->exec('PRAGMA foreign_keys=ON');

    echo "✅ Success! Orders table now has:\n";
    echo "   • found_rider in delivery_status CHECK\n";
    echo "   • payment_method column (cod/online/gcash/maya/card)\n";
    echo "   • payment_status column (pending/collected/settled)\n";

} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
