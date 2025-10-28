import { useEffect, useState } from "react";

export function JournalDates() {
  const [dates, setDates] = useState<Date[]>([]);

  useEffect(() => {
    setDates(
      Array.from(
        new Set(dates.map((date) => new Date(date.toLocaleDateString())))
      )
    );
  }, []);

  return (
    <div className="journal-dates">
      {dates?.map((date, index) => (
        <div key={index}>{date.toLocaleDateString()}</div>
      ))}
    </div>
  );
}
