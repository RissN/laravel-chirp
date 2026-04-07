<?php
/*
 * Created At: 2026-04-07
 * User: azizi
 */

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reportable_id' => 'required|integer',
            'reportable_type' => 'required|string|in:tweet,user',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ];
    }
}
