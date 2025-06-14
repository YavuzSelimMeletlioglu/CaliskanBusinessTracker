<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
Schema::create('pool_queue', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained('companies');
    $table->foreignId('product_id')->constrained('products');
    $table->timestamp('bath_time')->nullable();
});
    }

    public function down()
    {
        Schema::dropIfExists('pool_queue');
    }
};
