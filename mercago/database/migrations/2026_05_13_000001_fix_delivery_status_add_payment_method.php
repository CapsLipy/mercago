<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fixes two things in one pass:
 *  1. The previous migration used MySQL-only ALTER TABLE MODIFY syntax which
 *     silently failed on SQLite, leaving 'found_rider' absent from the CHECK
 *     constraint → causing the SQLSTATE[23000] error on accept.
 *  2. Adds payment_method (cod|online) and payment_status (pending|collected|settled)
 *     columns so orders can be placed and completed without missing-column errors.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite cannot ALTER a CHECK constraint in-place.
            // Strategy: create new table → copy data → drop old → rename.
            DB::statement('PRAGMA foreign_keys=OFF');

            DB::statement('CREATE TABLE "orders_new" (
                "id"              varchar NOT NULL,
                "shopper_id"      varchar NOT NULL,
                "vendor_id"       varchar NOT NULL,
                "rider_id"        varchar,
                "total_amount"    numeric(10,2) NOT NULL DEFAULT \'0\',
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

            // Detect which columns exist in the old table
            $cols = collect(DB::select('PRAGMA table_info("orders")'))->pluck('name');

            $select = '"id","shopper_id","vendor_id","rider_id","total_amount","status","delivery_status"';
            $select .= $cols->contains('payment_method') ? ',"payment_method"' : ',\'cod\' AS "payment_method"';
            $select .= $cols->contains('payment_status')  ? ',"payment_status"'  : ',\'pending\' AS "payment_status"';
            $select .= ',"created_at","updated_at"';

            DB::statement("INSERT INTO \"orders_new\" SELECT {$select} FROM \"orders\"");

            DB::statement('DROP TABLE "orders"');
            DB::statement('ALTER TABLE "orders_new" RENAME TO "orders"');
            DB::statement('PRAGMA foreign_keys=ON');

        } else {
            // MySQL / MariaDB
            DB::statement("ALTER TABLE orders MODIFY delivery_status
                ENUM('finding_rider','found_rider','ongoing','completed','cancelled')
                NOT NULL DEFAULT 'finding_rider'");

            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'payment_method')) {
                    $table->enum('payment_method', ['cod', 'online', 'gcash', 'maya', 'card'])
                        ->default('cod')->after('delivery_status');
                }
                if (!Schema::hasColumn('orders', 'payment_status')) {
                    $table->enum('payment_status', ['pending', 'collected', 'settled'])
                        ->default('pending')->after('payment_method');
                }
            });
        }
    }

    public function down(): void
    {
        // No-op for dev environment
    }
};
