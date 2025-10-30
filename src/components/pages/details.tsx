import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Label } from "../ui/label";
import { Link, useParams } from "react-router";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { Button } from "../ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";

const Details = () => {
  const { date } = useParams();

  const [year, month, day] = date?.split("-").map(Number) || [];
  const dateObject =
    year && month && day ? new Date(year, month - 1, day) : null;

  const journals = useLiveQuery(async () => {
    if (!dateObject || isNaN(dateObject.getTime())) return [];
    const start = new Date(dateObject);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateObject);
    end.setHours(23, 59, 59, 999);
    return await db.journals
      .where("createdAt")
      .between(start, end, true, true)
      .toArray();
  }, [dateObject?.getTime()]);

  if (!journals) return null;

  if (!dateObject || !journals || journals.length === 0)
    return (
      <Empty className="max-w-md mx-auto">
        <EmptyMedia variant="icon">
          <BookOpen />
        </EmptyMedia>
        <EmptyTitle>No journal found</EmptyTitle>
        <EmptyDescription>
          There are no journal entries for this day. Try picking another date or
          start writing a new entry!
        </EmptyDescription>
        <EmptyContent>
          <Button asChild>
            <Link to="/">
              <ArrowLeft />
              Go back
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );

  return (
    <div className="p-4 flex flex-col gap-6 w-[min(100%,800px)] mx-auto">
      <h1 className="text-2xl font-bold">
        {dateObject.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </h1>
      <div className="flex flex-col gap-4">
        {journals?.map((journal) => (
          <div key={journal.id} className="space-y-2">
            <Label className="text-muted-foreground">
              {journal.createdAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </Label>
            <p className="text-sm wrap-anywhere">{journal.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Details;
