<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
Schema::create('acid_bath', function (Blueprint $table) {
    $table->id();
    $table->string('pool_number');
    $table->foreignId('company_id')->constrained('companies');
    $table->foreignId('product_id')->constrained('products');
    $table->timestamp('bath_time')->nullable();
    $table->timestamp('remaining_time')->nullable();
    $table->string('is_active');
    $table->timestamps();
});
    }

    public function down()
    {
        Schema::dropIfExists('acid_bath');
    }
};
