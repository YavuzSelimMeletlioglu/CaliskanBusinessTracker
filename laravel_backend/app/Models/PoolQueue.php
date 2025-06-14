<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoolQueue extends Model
{
    use HasFactory;

    protected $fillable = ['company_id', 'product_id', 'bath_time'];
}
