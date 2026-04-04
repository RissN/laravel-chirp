<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required_without:username', 'string', 'email', 'nullable'],
            'username' => ['required_without:email', 'string', 'nullable'],
            'password' => ['required', 'string'],
        ];
    }
}
