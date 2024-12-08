import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { Journal } from "../db/db";

export function JournalDates() {
  const dates = useLiveQuery(async () => {
    const entries = await db.journals.orderBy("created_at").toArray();
    console.log(entries);

    return Array.from(
      new Set(
        entries.map((entry: Journal) =>
          new Date(entry.created_at).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
          })
        )
      )
    );
  });

  return (
    <div className="journal-dates">
      {dates?.map((date, index) => (
        <div key={index}>{date}</div>
      ))}
    </div>
  );
}
