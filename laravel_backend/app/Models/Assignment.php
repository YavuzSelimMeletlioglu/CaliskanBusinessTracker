<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = ['company_id', 'product_id', 'quantity', 'user_id', 'last_date_completion', 'completed_quantity'];
}
