<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the Abono (rider deposit) system tables:
 *   rider_deposits       – one record per rider storing their Abono cap
 *   abono_transactions   – ledger of every deposit / advance / collection
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rider_deposits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('rider_id')->unique();
            $table->decimal('cap', 10, 2)->default(5000); // self-set max outstanding COD
            $table->timestamps();

            $table->foreign('rider_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('abono_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('rider_id');
            $table->uuid('order_id')->nullable();
            // deposit = rider topped up, advance = COD order accepted, collection = COD delivered
            $table->string('type'); // deposit | advance | collection
            $table->decimal('amount', 10, 2);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->foreign('rider_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abono_transactions');
        Schema::dropIfExists('rider_deposits');
    }
};
