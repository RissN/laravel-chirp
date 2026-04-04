<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'media' => ['required', 'file', 'mimes:jpeg,png,jpg,gif,mp4,webm', 'max:10240'], // 10MB max
            'type' => ['nullable', 'string', 'in:avatar,header,tweet,message']
        ]);

        $folder = $request->type ?? 'uploads';
        
        $path = $request->file('media')->store('public/' . $folder);
        // Replace public/ with storage/ for URL
        $url = url(Storage::url($path));

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $url,
                'path' => str_replace('public/', 'storage/', $path)
            ]
        ]);
    }
}
