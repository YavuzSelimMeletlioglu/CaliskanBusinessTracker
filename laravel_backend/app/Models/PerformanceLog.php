<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceLog extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'company_id', 'quantity', 'end_time', 'total_time_minutes', 'acid_pool_time_minutes'];
}
