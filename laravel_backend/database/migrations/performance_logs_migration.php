<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
Schema::create('performance_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained('companies');
    $table->foreignId('product_id')->constrained('products');
    $table->decimal('quantity', 10, 2);
    $table->timestamp('end_time')->nullable();
    $table->timestamp('total_time_minutes')->nullable();
    $table->unsignedBigInteger('acid_pool_time_minutes');
    $table->timestamps();
});
    }

    public function down()
    {
        Schema::dropIfExists('performance_logs');
    }
};
