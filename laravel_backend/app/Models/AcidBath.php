<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcidBath extends Model
{
    use HasFactory;

    protected $fillable = ['pool_number', 'company_id', 'product_id', 'bath_time', 'remaining_time', 'is_active'];
}
