import React from 'react';
import { Calendar, X } from 'lucide-react';

export type DateFilterPreset = 'ALL' | 'TODAY' | 'YESTERDAY' | '7DAYS' | 'MONTH' | 'CUSTOM';

interface DateRangeFilterProps {
  preset: DateFilterPreset;
  onPresetChange: (preset: DateFilterPreset) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  showPresets?: boolean;
}

export const filterItemByDateRange = (
  dateStr: string | undefined,
  preset: DateFilterPreset,
  customStart?: string,
  customEnd?: string
): boolean => {
  if (!dateStr) return true;
  if (preset === 'ALL') return true;

  const itemYmd = dateStr.slice(0, 10);
  const now = new Date();
  const todayYmd = now.toISOString().slice(0, 10);

  if (preset === 'TODAY') {
    return itemYmd === todayYmd;
  }

  if (preset === 'YESTERDAY') {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayYmd = yesterday.toISOString().slice(0, 10);
    return itemYmd === yesterdayYmd;
  }

  if (preset === '7DAYS') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return itemYmd >= sevenDaysAgo && itemYmd <= todayYmd;
  }

  if (preset === 'MONTH') {
    const currentMonthPrefix = todayYmd.slice(0, 7); // YYYY-MM
    return itemYmd.startsWith(currentMonthPrefix);
  }

  if (preset === 'CUSTOM') {
    if (customStart && customEnd) {
      return itemYmd >= customStart && itemYmd <= customEnd;
    }
    if (customStart) {
      return itemYmd >= customStart;
    }
    if (customEnd) {
      return itemYmd <= customEnd;
    }
    return true;
  }

  return true;
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  showPresets = true
}) => {
  const presets: { id: DateFilterPreset; label: string }[] = [
    { id: 'ALL', label: 'Semua Tanggal' },
    { id: 'TODAY', label: 'Hari Ini' },
    { id: 'YESTERDAY', label: 'Kemarin' },
    { id: '7DAYS', label: '7 Hari' },
    { id: 'MONTH', label: 'Bulan Ini' },
    { id: 'CUSTOM', label: 'Rentang Kustom' }
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      {showPresets && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {presets.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPresetChange(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                preset === p.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {preset === 'CUSTOM' && (
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
            className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none"
            placeholder="Dari"
          />
          <span className="text-slate-400 text-xs font-bold">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
            className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none"
            placeholder="Sampai"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                onStartDateChange('');
                onEndDateChange('');
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title="Reset Rentang Tanggal"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
