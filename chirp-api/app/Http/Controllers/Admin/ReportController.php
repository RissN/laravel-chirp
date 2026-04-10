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
        // Load reporter, resolver, and the morphTo reportable relation.
        // Also eagerly load nested relations for the reportable so we can render details.
        $query = Report::with([
            'reporter', 
            'resolver', 
            'reportable' => function ($morphTo) {
                // If it's a Tweet, load its user; if it's a User, it's already loaded
                $morphTo->morphWith([
                    \App\Models\Tweet::class => ['user'],
                ]);
            }
        ])->latest();

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

        // Notify the reporter
        \App\Models\Notification::create([
            'user_id' => $report->reporter_id,
            'actor_id' => null, // System notification
            'type' => 'report_resolved',
            'notifiable_type' => Report::class,
            'notifiable_id' => $report->id,
            'data' => [
                'status' => $request->status,
                'target_type' => class_basename($report->reportable_type),
                'reason' => $report->reason,
            ]
        ]);

        // Dispatch WebSocket event if we have a notification event configured
        // For example, if we re-use NotificationCreated event:
        $notif = \App\Models\Notification::where('notifiable_id', $report->id)
            ->where('type', 'report_resolved')
            ->latest()->first();

        if ($notif) {
            event(new \App\Events\NotificationCreated($notif));
        }

        return response()->json(['success' => true, 'message' => "Report has been marked as {$request->status}."]);
    }
}
