<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Class AuthController
 * 
 * Menangani proses autentikasi pengguna termasuk registrasi, login,
 * logout, pengambilan data user yang sedang login, dan refresh token.
 * Menggunakan Laravel Sanctum untuk manajemen token API.
 */
class AuthController extends Controller
{
    /**
     * Registrasi pengguna baru.
     *
     * Membuat akun user baru di database, meng-hash password dengan bcrypt,
     * lalu menghasilkan token Sanctum untuk auto-login setelah registrasi.
     *
     * @param  RegisterRequest  $request  Data registrasi yang sudah divalidasi (name, username, email, password)
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data user dan token autentikasi
     */
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token
            ]
        ], 201);
    }

    /**
     * Login pengguna yang sudah terdaftar.
     *
     * Mendukung login via email ATAU username. Memvalidasi kredensial,
     * mengecek status banned/suspended user, dan menghasilkan token Sanctum.
     * Jika user di-ban tapi masa bannya sudah habis, otomatis direaktivasi.
     *
     * @param  LoginRequest  $request  Kredensial login (email/username + password)
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data user dan token, atau error 401/403
     */
    public function login(LoginRequest $request)
    {
        $field = $request->email ? 'email' : 'username';
        $value = $request->email ?? $request->username;

        $user = User::where($field, $value)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Manage banned users
        if ($user->status === 'banned') {
            if ($user->banned_until && now()->greaterThan($user->banned_until)) {
                // Ban expired, reactivate user
                $user->update(['status' => 'active', 'ban_reason' => null, 'banned_until' => null]);
            } else {
                $expiryInfo = $user->banned_until ? " until {$user->banned_until->toDateTimeString()}" : " permanently";
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been banned' . $expiryInfo . '. Reason: ' . ($user->ban_reason ?? 'Violation of community guidelines.'),
                    'error_code' => 'account_banned',
                ], 403);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token
            ]
        ]);
    }

    /**
     * Logout pengguna.
     *
     * Menghapus token akses yang sedang digunakan sehingga menjadi invalid.
     * Pengguna perlu login ulang untuk mendapatkan token baru.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\JsonResponse  Response JSON konfirmasi logout berhasil
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Mendapatkan data user yang sedang login.
     *
     * Mengembalikan resource lengkap dari user yang terotentikasi,
     * digunakan oleh frontend untuk menampilkan profil dan sesi aktif.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi data UserResource
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'User retrieved successfully',
            'data' => new UserResource($request->user())
        ]);
    }

    /**
     * Refresh token autentikasi.
     *
     * Menghapus token lama dan membuat token baru. Berguna untuk
     * memperpanjang sesi tanpa perlu login ulang.
     *
     * @param  Request  $request  Request dengan user yang terautentikasi
     * @return \Illuminate\Http\JsonResponse  Response JSON berisi token baru
     */
    public function refresh(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        $token = $request->user()->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully',
            'data' => [
                'token' => $token
            ]
        ]);
    }
}
