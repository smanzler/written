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
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  FileText,
  Lock,
  Pencil,
  Sparkles,
  Trash,
  X,
} from "lucide-react";
import { useDecryptedJournalsByDate } from "@/dexie/journals/queries";
import { useJournalStore } from "@/stores/journalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import LockedDialog from "../ui/locked-dialog";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useDeleteJournal, useUpdateJournal } from "@/dexie/journals/mutations";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
} from "../ui/dialog";

const Details = () => {
  const { date } = useParams();
  const { isUnlocked, encryptText } = useJournalStore();
  const { settings } = useSettingsStore();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [openOriginalContentDialog, setOpenOriginalContentDialog] =
    useState(false);

  const [year, month, day] = date?.split("-").map(Number) || [];
  const dateObject =
    year && month && day ? new Date(year, month - 1, day) : null;

  const { journals, decrypting } = useDecryptedJournalsByDate(
    dateObject ?? undefined
  );

  const deleteJournal = useDeleteJournal();
  const updateJournal = useUpdateJournal();

  const handleEdit = (id: number) => {
    if (!journals) return;
    setEditingId(id);
    setContent(journals.find((j) => j.id === id)?.content ?? "");
  };

  const handleSave = async (id: number, content: string) => {
    setSaving(true);

    const journal = journals.find((j) => j.id === id);

    if (!journal) return;

    let journalData;

    let blob = {
      content: content,
      cleaned_content: journal.cleaned_content,
    };

    if (journal.is_encrypted) {
      const result = await encryptText(JSON.stringify(blob));
      journalData = {
        raw_blob: null,
        encrypted_blob: JSON.stringify(result),
        updated_at: new Date(),
      };
    } else {
      journalData = {
        raw_blob: JSON.stringify(blob),
        encrypted_blob: null,
        updated_at: new Date(),
      };
    }

    await updateJournal(id, journalData);
    setEditingId(null);
    setSaving(false);
  };

  if (!journals || decrypting) return null;

  if (!isUnlocked && settings.lockEnabled) {
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
      <h1 className="text-2xl font-bold px-2">
        {dateObject.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </h1>
      <div className="flex flex-col">
        {journals?.map((journal) => (
          <React.Fragment key={journal.id}>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                disabled={editingId === journal.id || saving}
              >
                <div
                  className={cn(
                    "space-y-2 cursor-pointer rounded-md p-2",
                    editingId !== journal.id &&
                      "hover:bg-accent data-[state=open]:bg-accent"
                  )}
                >
                  <div className="flex flex-row items-center gap-2">
                    <Label className="text-muted-foreground">
                      {journal.created_at.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Label>
                    {!!journal.cleaned_content && (
                      <Sparkles className="size-4 text-yellow-500" />
                    )}
                  </div>
                  {editingId === journal.id ? (
                    <div className="flex flex-col items-end gap-2">
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="resize-none wrap-anywhere"
                        disabled={saving}
                      />
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingId(null)}
                        >
                          <X />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave(journal.id, content)}
                        >
                          {saving ? <Spinner /> : <Check />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm wrap-anywhere">
                      {journal.cleaned_content ?? journal.content}
                    </p>
                  )}
                  {journal.error && (
                    <p className="text-sm text-red-500">{journal.error}</p>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {journal.cleaned_content && (
                  <DropdownMenuItem
                    onClick={() => setOpenOriginalContentDialog(true)}
                  >
                    <FileText />
                    View Original
                  </DropdownMenuItem>
                )}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(journal.content || "")
                    }
                  >
                    <Copy />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(journal.id)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteJournal(journal.id)}
                  >
                    <Trash />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog
              open={openOriginalContentDialog}
              onOpenChange={setOpenOriginalContentDialog}
            >
              <DialogContent>
                <DialogHeader className="mb-4">
                  <DialogTitle>Original Content</DialogTitle>
                  <DialogDescription>
                    The following content was originally written:
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-2 max-h-[60vh] overflow-y-auto">
                  <Label className="text-muted-foreground">
                    {journal.created_at.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Label>
                  <p className="text-sm wrap-anywhere">{journal.content}</p>
                </div>
              </DialogContent>
            </Dialog>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Details;
