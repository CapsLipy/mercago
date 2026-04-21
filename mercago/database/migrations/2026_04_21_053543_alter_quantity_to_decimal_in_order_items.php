<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE order_items MODIFY quantity DECIMAL(10,3) NOT NULL');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE order_items MODIFY quantity INT NOT NULL');
        });
    }
};
