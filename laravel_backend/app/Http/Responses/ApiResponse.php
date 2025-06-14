<?php

namespace App\Http\Responses;

class ApiResponse
{
    public static function success($data = null, $message = 'İşlem başarılı.', $status = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data
        ], $status);
    }

    public static function error($message = 'Bir hata oluştu.', $status = 500, $data = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data'    => $data
        ], $status);
    }
}
