import { Calendar } from "lucide-react";

interface DateDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: { value: string; label: string }[];
}

export function DateDropdown({
  value = "30",
  onChange,
  options = [
    { value: "7", label: "Últimos 7 días" },
    { value: "30", label: "Últimos 30 días" },
    { value: "this_month", label: "Este mes" },
    { value: "this_year", label: "Este año" },
  ]
}: DateDropdownProps) {
  return (
    <div className="relative inline-flex items-center">
      <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-9 pr-8 py-2 bg-muted/50 hover:bg-muted border border-border text-xs font-semibold rounded-lg appearance-none text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 pointer-events-none text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}
