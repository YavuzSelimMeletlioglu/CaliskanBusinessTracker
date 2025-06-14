<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
Schema::create('store', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained('companies');
    $table->foreignId('product_id')->constrained('products');
    $table->decimal('quantity', 10, 2);
    $table->timestamps();
});
    }

    public function down()
    {
        Schema::dropIfExists('store');
    }
};
