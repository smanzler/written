import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db, Journal } from "@/lib/db";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export function MigrateJournalsDialog() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [journalsToMigrate, setJournalsToMigrate] = useState<Journal[]>([]);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkForOrphanedJournals = async () => {
      const orphanedJournals = await db.journals
        .filter(
          (journal) => journal.user_id === null || journal.user_id === undefined
        )
        .toArray();

      if (orphanedJournals.length > 0) {
        setJournalsToMigrate(orphanedJournals);
        setOpen(true);
      }
    };

    checkForOrphanedJournals();
  }, [user?.id]);

  const handleMigrate = async () => {
    if (!user?.id) {
      toast.error("Unable to migrate journals: user not found");
      setOpen(false);
      return;
    }

    setMigrating(true);

    try {
      await db.transaction("rw", db.journals, async () => {
        await db.journals
          .filter(
            (journal) =>
              journal.user_id === null || journal.user_id === undefined
          )
          .modify({ user_id: user.id });
      });

      toast.success(
        `Successfully migrated ${journalsToMigrate.length} journal${
          journalsToMigrate.length === 1 ? "" : "s"
        }`
      );

      setOpen(false);
      setJournalsToMigrate([]);
    } catch (error) {
      console.error("Error migrating journals:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to migrate journals. Please try again."
      );
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!migrating) {
          setOpen(open);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Migrate Journals?</DialogTitle>
          <DialogDescription>
            {journalsToMigrate.length > 0
              ? `Found ${journalsToMigrate.length} journal${
                  journalsToMigrate.length === 1 ? "" : "s"
                } with no user attached. Would you like to migrate ${
                  journalsToMigrate.length === 1 ? "it" : "them"
                } to your account?`
              : "There are some journals with no user attached. Would you like to migrate them to your account?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={migrating}
          >
            Skip
          </Button>
          <Button onClick={handleMigrate} disabled={migrating}>
            {migrating ? "Migrating..." : "Migrate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
