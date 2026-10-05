<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['schedule_status', 'is_open', 'schedule_description'];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_active' => 'boolean',
        'scheduled_days' => 'array',
        'interval_hours' => 'integer',
    ];

    public function getEffectiveScheduleType(): string
    {
        if (in_array($this->schedule_type, ['daily', 'weekly', 'interval'])) {
            return $this->schedule_type;
        }

        if ($this->schedule_type === 'once' || $this->start_time || $this->end_time) {
            return 'once';
        }

        return 'always';
    }

    public function isAvailableNow(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $scheduleType = $this->getEffectiveScheduleType();

        if ($scheduleType === 'always') {
            return true;
        }

        if ($scheduleType === 'once') {
            $now = now();

            if ($this->start_time && $now->lt($this->start_time)) {
                return false;
            }

            if ($this->end_time && $now->gt($this->end_time)) {
                return false;
            }

            return true;
        }

        $today = now()->format('Y-m-d');
        $startTimeStr = $this->start_hour ? $today.' '.$this->start_hour : $today.' 00:00:00';
        $endTimeStr = $this->end_hour ? $today.' '.$this->end_hour : $today.' 23:59:59';

        // If end hour is before start hour, it means it crosses midnight
        $startDt = Carbon::parse($startTimeStr);
        $endDt = Carbon::parse($endTimeStr);
        if ($endDt->lt($startDt)) {
            $endDt->addDay();
        }

        if ($scheduleType === 'daily') {
            return now()->between($startDt, $endDt);
        }

        if ($scheduleType === 'weekly') {
            $days = is_array($this->scheduled_days) ? $this->scheduled_days : [];
            $todayDay = (int) now()->format('N'); // 1 (Senin) - 7 (Minggu)

            if (! in_array($todayDay, $days) && ! in_array((string) $todayDay, $days)) {
                return false;
            }

            return now()->between($startDt, $endDt);
        }

        if ($scheduleType === 'interval') {
            $interval = $this->interval_hours ?? 1;
            if ($interval <= 0) {
                $interval = 1;
            }

            $now = now();
            // Start from 00:00 or start_hour
            $baseHour = $this->start_hour ? (int) explode(':', $this->start_hour)[0] : 0;
            $currentHour = (int) $now->format('H');

            // Check if current time is within the overall window (e.g. 08:00 - 18:00)
            if (! now()->between($startDt, $endDt)) {
                return false;
            }

            // Calculate if current time is in an active interval slot
            // Assuming an exam is available to start exactly at the interval hour (e.g. 08:00, 10:00)
            // and remains available for the duration of the exam
            $hoursSinceBase = $currentHour - $baseHour;
            if ($hoursSinceBase < 0) {
                return false;
            }

            $slotStartHour = $baseHour + (floor($hoursSinceBase / $interval) * $interval);
            $slotStartDt = Carbon::today()->setHour($slotStartHour)->setMinute(0);
            $slotEndDt = $slotStartDt->copy()->addMinutes($this->duration_minutes ?? 60);

            return $now->between($slotStartDt, $slotEndDt);
        }

        return true;
    }

    public function getIsOpenAttribute(): bool
    {
        return $this->isAvailableNow();
    }

    public function getScheduleStatusAttribute(): string
    {
        $scheduleType = $this->getEffectiveScheduleType();

        if ($scheduleType === 'always') {
            return 'always';
        }

        if ($scheduleType === 'once') {
            $now = now();

            if ($this->start_time && $now->lt($this->start_time)) {
                return 'upcoming';
            }

            if ($this->end_time && $now->gt($this->end_time)) {
                return 'expired';
            }

            return 'ongoing';
        }

        // For recurring, if it's open now it's ongoing, else it's upcoming (for the next cycle)
        return $this->isAvailableNow() ? 'ongoing' : 'upcoming';
    }

    public function getScheduleDescriptionAttribute(): string
    {
        $scheduleType = $this->getEffectiveScheduleType();

        if ($scheduleType === 'always') {
            return 'Tersedia Setiap Saat (Bebas)';
        }

        if ($scheduleType === 'once') {
            $start = $this->start_time ? $this->start_time->format('d/m/Y H:i') : '-';
            $end = $this->end_time ? $this->end_time->format('d/m/Y H:i') : '-';

            return "Sekali Saja ({$start} s/d {$end} WIB)";
        }

        $timeWindow = ($this->start_hour || $this->end_hour)
            ? ($this->start_hour ?? '00:00').' - '.($this->end_hour ?? '23:59').' WIB'
            : 'Sepanjang Hari';

        if ($scheduleType === 'daily') {
            return "Setiap Hari ({$timeWindow})";
        }

        if ($scheduleType === 'weekly') {
            $dayNames = [
                1 => 'Senin',
                2 => 'Selasa',
                3 => 'Rabu',
                4 => 'Kamis',
                5 => 'Jumat',
                6 => 'Sabtu',
                7 => 'Minggu',
            ];
            $selectedDays = is_array($this->scheduled_days) ? $this->scheduled_days : [];
            $names = [];
            foreach ($selectedDays as $d) {
                if (isset($dayNames[(int) $d])) {
                    $names[] = $dayNames[(int) $d];
                }
            }
            $daysStr = ! empty($names) ? implode(', ', $names) : 'Hari Tertentu';

            return "Setiap {$daysStr} ({$timeWindow})";
        }

        if ($scheduleType === 'interval') {
            $hours = $this->interval_hours ?? 2;

            return "Setiap {$hours} Jam ({$timeWindow})";
        }

        return 'Tersedia';
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'exam_questions');
    }

    public function examType()
    {
        return $this->belongsTo(ExamType::class);
    }

    public function sessions()
    {
        return $this->hasMany(CbtSession::class);
    }
}
