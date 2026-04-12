<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Class StoreTweetRequest
 *
 * Form Request untuk validasi data pembuatan tweet dan reply baru.
 * Aturan validasi:
 * - content: wajib jika tidak ada media, string, maksimum 250 karakter
 * - media: opsional, array URL maksimum 4 item
 */
class StoreTweetRequest extends FormRequest
{
    /**
     * Menentukan apakah user terautentikasi boleh membuat request ini.
     *
     * @return bool  Selalu true (otorisasi ditangani oleh middleware)
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi untuk request pembuatan tweet.
     *
     * @return array<string, mixed>  Array aturan validasi
     */
    public function rules(): array
    {
        return [
            'content' => ['required_without:media', 'string', 'max:250', 'nullable'],
            'media' => ['nullable', 'array', 'max:4'],
            'media.*' => ['string', 'url'], // Assuming frontend uploads first, gets URL
        ];
    }
}
