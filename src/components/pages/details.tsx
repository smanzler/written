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
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { useDecryptedJournalsByDate } from "@/dexie/journals/queries";
import { useJournal } from "@/providers/JournalProvider";
import { useSettings } from "@/providers/SettingsProvider";
import LockedDialog from "../ui/locked-dialog";
import { useState } from "react";

const Details = () => {
  const { date } = useParams();
  const { isUnlocked } = useJournal();
  const { settings } = useSettings();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);

  const [year, month, day] = date?.split("-").map(Number) || [];
  const dateObject =
    year && month && day ? new Date(year, month - 1, day) : null;

  const { journals, decrypting } = useDecryptedJournalsByDate(
    dateObject ?? undefined
  );

  if (!isUnlocked && settings?.lockEnabled) {
    return (
      <>
        <Empty className="max-w-md mx-auto">
          <EmptyMedia variant="icon">
            <Lock />
          </EmptyMedia>
          <EmptyTitle>Journal Locked</EmptyTitle>
          <EmptyDescription>
            Please enter your pin to view your journal
          </EmptyDescription>
          <EmptyContent>
            <Button onClick={() => setOpenLockedDialog(true)}>
              <Lock />
              Unlock Journal
            </Button>
          </EmptyContent>
        </Empty>

        <LockedDialog
          open={openLockedDialog}
          onOpenChange={setOpenLockedDialog}
        />
      </>
    );
  }

  if (!journals || decrypting) return null;

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
