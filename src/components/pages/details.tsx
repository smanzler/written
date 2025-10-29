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
import { BASE_URL } from "@/App";
import { Button } from "../ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";

const Details = () => {
  const { date } = useParams();
  const journals = useLiveQuery(async () => {
    if (!date) return [];
    const [year, month, day] = date.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return [];
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    console.log(start, end);
    return await db.journals
      .where("createdAt")
      .between(start, end, true, true)
      .toArray();
  });

  console.log(journals);

  console.log(date);

  if (!journals) return null;

  if (!date || !journals || journals.length === 0)
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
            <Link to={BASE_URL}>
              <ArrowLeft />
              Go back
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );

  return (
    <div className="px-4 flex flex-col gap-4 min-w-xl mx-auto">
      <h1 className="text-2xl font-bold">
        {new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </h1>
      <div className="flex flex-col gap-4">
        {journals?.map((journal) => (
          <div key={journal.id} className="space-y-2">
            <Label className="text-muted-foreground">
              {journal.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Label>
            <p className="text-sm">{journal.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Details;
