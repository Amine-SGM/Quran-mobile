import { useMemo } from "react";
import { MAX_AYAHS_PER_VIDEO } from "../types";
import "./RangeSelector.css";

interface RangeSelectorProps {
  surahNumber: number;
  totalAyahs: number;
  rangeStart: number;
  rangeEnd: number;
  onChange: (start: number, end: number) => void;
}

export function RangeSelector({
  totalAyahs,
  rangeStart,
  rangeEnd,
  onChange,
}: RangeSelectorProps) {
  const ayahOptions = useMemo(() => {
    return Array.from({ length: totalAyahs }, (_, i) => i + 1);
  }, [totalAyahs]);

  const handleStartChange = (value: string) => {
    const start = parseInt(value, 10);
    if (isNaN(start)) return;

    let newEnd = rangeEnd;
    if (newEnd - start + 1 > MAX_AYAHS_PER_VIDEO) {
      newEnd = Math.min(start + MAX_AYAHS_PER_VIDEO - 1, totalAyahs);
    }
    if (start > newEnd) {
      newEnd = Math.min(start, totalAyahs);
    }
    onChange(start, newEnd);
  };

  const handleEndChange = (value: string) => {
    const end = parseInt(value, 10);
    if (isNaN(end)) return;

    let newStart = rangeStart;
    if (end - newStart + 1 > MAX_AYAHS_PER_VIDEO) {
      newStart = Math.max(1, end - MAX_AYAHS_PER_VIDEO + 1);
    }
    if (end < newStart) {
      newStart = Math.max(1, end);
    }
    onChange(newStart, end);
  };

  const quickSelect = (count: number) => {
    const end = Math.min(count, totalAyahs);
    onChange(1, end);
  };

  return (
    <div className="range-selector">
      <div className="range-pickers">
        <div className="picker-group">
          <label>From Ayah</label>
          <select
            value={rangeStart}
            onChange={(e) => handleStartChange(e.target.value)}
          >
            {ayahOptions.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div className="picker-divider">—</div>

        <div className="picker-group">
          <label>To Ayah</label>
          <select
            value={rangeEnd}
            onChange={(e) => handleEndChange(e.target.value)}
          >
            {ayahOptions.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="quick-select">
        <span>Quick select:</span>
        <button onClick={() => quickSelect(3)}>3 ayahs</button>
        <button onClick={() => quickSelect(5)}>5 ayahs</button>
        <button onClick={() => quickSelect(7)}>7 ayahs</button>
        <button onClick={() => quickSelect(10)}>10 ayahs</button>
      </div>
    </div>
  );
}

export default RangeSelector;