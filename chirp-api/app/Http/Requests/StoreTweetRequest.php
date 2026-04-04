<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTweetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['required_without:media', 'string', 'max:280', 'nullable'],
            'media' => ['nullable', 'array', 'max:4'],
            'media.*' => ['string', 'url'], // Assuming frontend uploads first, gets URL
        ];
    }
}
