<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:160'],
            'location' => ['nullable', 'string', 'max:30'],
            'website' => ['nullable', 'url', 'max:100'],
            'birth_date' => ['nullable', 'date'],
            'avatar' => ['nullable', 'string', 'url'],
            'header_image' => ['nullable', 'string', 'url'],
        ];
    }
}
