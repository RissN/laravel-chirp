<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::firstOrCreate(
            ['email' => 'admin@chirp.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123456'),
                'role' => 'superadmin',
                'is_active' => true,
            ]
        );
    }
}
