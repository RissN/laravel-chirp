<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $query = Report::with(['reporter', 'resolver'])->latest();

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $reports = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reports->items(),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'total' => $reports->total(),
                'per_page' => $reports->perPage(),
            ]
        ]);
    }

    public function resolve(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:reviewed,resolved,dismissed',
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $report = Report::findOrFail($id);
        $report->update([
            'status' => $request->status,
            'admin_note' => $request->admin_note,
            'resolved_by' => $request->user('admin')->id,
        ]);

        AuditLog::create([
            'admin_id' => $request->user('admin')->id,
            'action' => 'resolve_report',
            'target_type' => 'Report',
            'target_id' => $report->id,
            'meta' => ['status' => $request->status],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => "Report has been marked as {$request->status}."]);
    }
}
