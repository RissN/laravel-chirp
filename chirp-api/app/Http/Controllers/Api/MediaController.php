<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Class MediaController
 *
 * Menangani upload file media (gambar, video, dan dokumen).
 * Mendukung format: JPEG, PNG, GIF, MP4, WebM, PDF, DOC, DOCX, ZIP, TXT,
 * XLS, XLSX, PPT, PPTX. Maksimum ukuran file: 10MB.
 * Otomatis mendeteksi tipe media (image/video/file) berdasarkan ekstensi.
 */
class MediaController extends Controller
{
    /**
     * Upload file media ke server.
     *
     * Menerima file tunggal, menyimpannya ke disk 'public' dalam folder
     * sesuai parameter 'type' (avatar/header/tweet/message), lalu
     * mengembalikan URL publik, path, tipe media, nama asli, dan ukuran file.
     *
     * @param  Request  $request  Request berisi file 'media' dan opsional 'type'
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi URL dan metadata file
     */
    public function upload(Request $request)
    {
        $request->validate([
            'media' => ['required', 'file', 'mimes:jpeg,png,jpg,gif,mp4,webm,pdf,doc,docx,zip,txt,xls,xlsx,ppt,pptx', 'max:10240'], // 10MB max
            'type' => ['nullable', 'string', 'in:avatar,header,tweet,message']
        ]);

        $folder = $request->type ?? 'uploads';
        
        $file = $request->file('media');
        $path = $file->store($folder, 'public');
        $url = asset(Storage::disk('public')->url($path));

        // Detect media type
        $extension = strtolower($file->getClientOriginalExtension());
        $imageExts = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
        $videoExts = ['mp4', 'webm'];
        
        if (in_array($extension, $imageExts)) {
            $mediaType = 'image';
        } elseif (in_array($extension, $videoExts)) {
            $mediaType = 'video';
        } else {
            $mediaType = 'file';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $url,
                'path' => 'storage/' . $path,
                'media_type' => $mediaType,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]
        ]);
    }
}
