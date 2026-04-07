<?php
/*
 * Created At: 2026-04-07
 * User: azizi
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\Report;
use App\Models\Tweet;
use App\Models\User;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(StoreReportRequest $request)
    {
        $validated = $request->validated();
        
        $reportableType = $validated['reportable_type'] === 'tweet' 
            ? Tweet::class 
            : User::class;
            
        // Check if reportable exists
        $reportable = $reportableType::find($validated['reportable_id']);
        
        if (!$reportable) {
            return response()->json([
                'success' => false,
                'message' => 'The item you are reporting no longer exists.'
            ], 404);
        }

        // Create the report
        $report = Report::create([
            'reporter_id' => $request->user()->id,
            'reportable_type' => $reportableType,
            'reportable_id' => $validated['reportable_id'],
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your report. Our moderators will review it shortly.',
            'data' => $report
        ]);
    }
}
