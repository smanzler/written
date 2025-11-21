import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJournalStore } from "@/stores/journalStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import LockedDialog from "@/components/ui/locked-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ColorPicker } from "@/components/ui/color-picker";
import PasswordOTP from "@/components/ui/password-otp";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectItemText } from "@radix-ui/react-select";
import { useLLMStore } from "@/stores/llmStore";
import { Progress } from "@/components/ui/progress";
import { Info, RotateCcw, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PreviewText from "@/components/ui/preview-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Navigate, useSearchParams } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "../ui/input";

const EXAMPLE_TEXT = "Hello World";

const tabsButtonClassname =
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center gap-1.5 rounded-md !border-none px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 w-full justify-start hover:bg-muted";

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs = ["security", "appearance", "ai", "profile"];
  const defaultTab = validTabs.includes(tabParam || "")
    ? tabParam!
    : "security";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const { settings, saveSettings } = useSettingsStore();
  const [passwordDialogShown, setPasswordDialogShown] = useState(false);
  const [removeKeyDialogShown, setRemoveKeyDialogShown] = useState(false);
  const [password, setPassword] = useState("");
  const { enableEncryption, disableEncryption, lock, isUnlocked } =
    useJournalStore();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [cleanupPrompt, setCleanupPrompt] = useState<string | undefined>(
    undefined
  );
  const [cursorColor, setCursorColor] = useState<string | undefined>();
  const [textColor, setTextColor] = useState<string | undefined>();
  const [lockLoading, setLockLoading] = useState(false);
  const { user, initializing } = useAuthStore();
  const {
    models: llmModels,
    status: modelStatus,
    progress: modelProgress,
    timeElapsed: modelTimeElapsed,
    error: modelError,
    changeModel,
    currentModelId,
    targetModelId,
  } = useLLMStore();
  const modelDownloading = modelStatus === "downloading";
  const modelLoading = ["checking-cache", "loading"].includes(modelStatus);

  useEffect(() => {
    if (!settings.selectedModel) return;
    if (targetModelId === settings.selectedModel) return;
    if (currentModelId === settings.selectedModel) return;
    if (modelLoading || modelDownloading) return;

    changeModel(settings.selectedModel).catch((e) => {
      console.error("Error changing model:", e);
    });
  }, [
    settings.selectedModel,
    changeModel,
    currentModelId,
    targetModelId,
    modelLoading,
    modelDownloading,
  ]);

  const handleSavePassword = async (value: string) => {
    setLockLoading(true);
    const success = await enableEncryption(value);

    if (!success) {
      setLockLoading(false);
      setRemoveKeyDialogShown(true);
      return;
    }

    await saveSettings({ lockEnabled: true });
    setPasswordDialogShown(false);
    setLockLoading(false);
  };

  const handleRemoveKey = async () => {
    setLockLoading(true);
    const success = await enableEncryption(password, true);

    if (!success) {
      toast.error("An error occured while trying to create your password");
      setLockLoading(false);
      return;
    }

    await saveSettings({ lockEnabled: true });
    setRemoveKeyDialogShown(false);
    setPasswordDialogShown(false);
    setLockLoading(false);
  };

  const handleChangeLockEnabled = async (checked: boolean, key?: CryptoKey) => {
    if (checked) {
      setPasswordDialogShown(true);
      return;
    }

    if (!isUnlocked && !key) {
      setOpenLockedDialog(true);
      return;
    }

    setLockLoading(true);
    try {
      await disableEncryption(key);
      await saveSettings({ lockEnabled: false });
      lock();
    } catch (error) {
      toast.error("An error occured while trying to unlock your journal");
      console.error(error);
    } finally {
      setLockLoading(false);
    }
  };

  const handleChangeCursorColor = async (color: string | undefined) => {
    await saveSettings({ cursorColor: color });
  };

  const handleChangeTextColor = async (color: string | undefined) => {
    await saveSettings({ textColor: color });
  };

  const handleChangeAiCleanupEnabled = async (checked: boolean) => {
    if (!settings.selectedModel) {
      toast.error("Please select a model before enabling AI cleanup.");
      return;
    }

    await saveSettings({ cleanupEnabled: checked });
  };

  const handleChangeSelectedModel = async (value: string) => {
    if (value === "none") {
      await saveSettings({
        selectedModel: undefined,
        cleanupEnabled: false,
      });
      return;
    }

    try {
      await changeModel(value);
      await saveSettings({ selectedModel: value });
      toast.success("Model ready to use.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load the selected model.");
    }
  };

  const handleSaveCleanupPrompt = async () => {
    if (!cleanupPrompt) return;
    await saveSettings({ cleanupPrompt: cleanupPrompt });
    setCleanupPrompt(undefined);
  };

  const handleResetSettings = () => {
    toast.warning("This doesn't do anything lol.");
  };

  return (
    <div className="flex justify-center h-full p-8">
      <Tabs
        orientation="vertical"
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-row gap-4 max-w-2xl w-full"
      >
        <TabsList className="flex-col h-fit w-full max-w-[200px] bg-background gap-1">
          <TabsTrigger value="security" className={tabsButtonClassname}>
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className={tabsButtonClassname}>
            Appearance
          </TabsTrigger>
          <TabsTrigger value="ai" className={tabsButtonClassname}>
            AI
          </TabsTrigger>
          <Separator className="my-3" />
          {user && (
            <>
              <TabsTrigger value="profile" className={tabsButtonClassname}>
                Account
              </TabsTrigger>
              <Separator className="my-3" />
            </>
          )}
          <Button
            variant="ghost"
            className={tabsButtonClassname}
            onClick={handleResetSettings}
          >
            <RotateCcw className="size-4" />
            Reset Settings
          </Button>
        </TabsList>
        <TabsContent value="security" className="flex-1">
          <FieldSet>
            <FieldLegend>Security</FieldLegend>
            <FieldDescription>
              Protect your journal entries from unauthorized access.
            </FieldDescription>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel>Lock your jounal entries</FieldLabel>
                  <FieldDescription>
                    Enable encryption to protect your journal entries from
                    unauthorized access.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={settings.lockEnabled}
                  onCheckedChange={handleChangeLockEnabled}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </TabsContent>

        <TabsContent value="appearance" className="flex-1">
          <FieldSet>
            <FieldLegend>Appearance</FieldLegend>
            <FieldDescription>
              Customize the appearance of your journal.
            </FieldDescription>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Preview</p>
              <div className="w-full flex flex-col items-center justify-center">
                <PreviewText
                  text={EXAMPLE_TEXT}
                  textColor={textColor || settings.textColor}
                  cursorColor={cursorColor || settings.cursorColor}
                />
              </div>
            </div>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel>Text color</FieldLabel>
                  <FieldDescription>
                    Change the color of the text in the journal.
                  </FieldDescription>
                </FieldContent>
                <ColorPicker
                  state={textColor}
                  fallbackColor={settings.textColor}
                  onColorChange={setTextColor}
                  onSubmit={handleChangeTextColor}
                />
              </Field>

              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel>Cursor color</FieldLabel>
                  <FieldDescription>
                    Change the color of the cursor in the journal.
                  </FieldDescription>
                </FieldContent>
                <ColorPicker
                  state={cursorColor}
                  fallbackColor={settings.cursorColor}
                  onColorChange={setCursorColor}
                  onSubmit={handleChangeCursorColor}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </TabsContent>

        <TabsContent value="ai" className="flex-1">
          <FieldSet>
            <FieldLegend className="flex flex-row items-center gap-2 justify-between w-full">
              AI
              <Sparkles className="size-4" />
            </FieldLegend>
            <FieldDescription>
              Customize the AI settings for your journal.
            </FieldDescription>

            <Alert>
              <Info className="size-4" />
              <AlertTitle>AI Features</AlertTitle>
              <AlertDescription>
                AI features work by downloading a public model to the browser's
                memory. This may use a lot of GPU and battery, but models can be
                used offline once downloaded.
              </AlertDescription>
            </Alert>

            <FieldGroup className="gap-2">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel>Cleanup Text Entries</FieldLabel>
                  <FieldDescription>
                    Enable cleanup of text entries with AI.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={settings.cleanupEnabled}
                  onCheckedChange={handleChangeAiCleanupEnabled}
                />
              </Field>
              <Textarea
                value={
                  cleanupPrompt === undefined
                    ? settings.cleanupPrompt || ""
                    : cleanupPrompt
                }
                onChange={(e) => setCleanupPrompt(e.target.value)}
                disabled={!settings.cleanupEnabled}
                className="resize-none wrap-anywhere peer pr-9"
                onBlur={handleSaveCleanupPrompt}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                    handleSaveCleanupPrompt();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                The prompt to use for AI cleanup.
              </p>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldContent>
                  <FieldLabel>Selected Model</FieldLabel>
                  <FieldDescription>
                    Select the model to use for AI tagging and cleanup.
                  </FieldDescription>
                </FieldContent>
                <div className="space-y-4 text-xs">
                  <Select
                    value={settings.selectedModel || "none"}
                    onValueChange={handleChangeSelectedModel}
                    disabled={modelLoading || modelDownloading}
                  >
                    <SelectTrigger className="min-w-[220px]">
                      {modelLoading || modelDownloading ? (
                        <div className="flex flex-row gap-2 items-center">
                          <Spinner />
                          Loading model...
                        </div>
                      ) : (
                        <SelectValue>
                          {settings.selectedModel
                            ? llmModels.find(
                                (model) => model.id === settings.selectedModel
                              )?.label
                            : "Choose a model"}
                        </SelectValue>
                      )}
                    </SelectTrigger>
                    <SelectContent align="end">
                      {llmModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <SelectItemText>
                            <div className="flex flex-col text-left">
                              <span>{model.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.description} · {model.vram}
                              </span>
                            </div>
                          </SelectItemText>
                        </SelectItem>
                      ))}
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                  {modelDownloading && (
                    <div className="space-y-2">
                      {modelTimeElapsed && (
                        <div className="flex flex-row justify-between gap-2 text-muted-foreground">
                          <p>{modelProgress}%</p>
                          <p>{modelTimeElapsed}s</p>
                        </div>
                      )}
                      <Progress value={modelProgress} className="w-full" />
                    </div>
                  )}
                  {modelError && (
                    <p className="text-destructive">{modelError}</p>
                  )}
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>
        </TabsContent>
        <TabsContent value="profile" className="flex-1">
          {initializing ? (
            <div className="flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-muted-foreground">Loading account...</p>
            </div>
          ) : user ? (
            <FieldSet>
              <FieldLegend>Account</FieldLegend>
              <FieldDescription>Manage your account settings.</FieldDescription>
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel>Email</FieldLabel>
                  </FieldContent>
                  <Input value={user.email} disabled />
                </Field>
              </FieldGroup>
            </FieldSet>
          ) : (
            <Navigate to="/login" />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={passwordDialogShown} onOpenChange={setPasswordDialogShown}>
        <DialogContent className="w-fit">
          <DialogHeader>
            <DialogTitle>Password</DialogTitle>
            <DialogDescription>
              Enter your password to enable encryption
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <PasswordOTP
              secure={false}
              onChange={setPassword}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSavePassword(password);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleSavePassword(password)}
              disabled={lockLoading}
              className="w-full"
            >
              {lockLoading && <Spinner />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeKeyDialogShown}
        onOpenChange={setRemoveKeyDialogShown}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detected existing key</DialogTitle>
            <DialogDescription>
              Are you sure you would like to proceed? This will remove the
              current key which could lose all of your currently locked journal
              entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setRemoveKeyDialogShown(false);
                setPasswordDialogShown(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                setRemoveKeyDialogShown(false);
                setPasswordDialogShown(false);
                await saveSettings({ lockEnabled: true });
              }}
            >
              Continue without removing key
            </Button>
            <Button onClick={handleRemoveKey} disabled={lockLoading}>
              {lockLoading && <Spinner />}Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LockedDialog
        open={openLockedDialog}
        onOpenChange={setOpenLockedDialog}
        onUnlock={async (key) => {
          if (key) {
            await handleChangeLockEnabled(false, key);
            setOpenLockedDialog(false);
          }
        }}
      />
    </div>
  );
};

export default SettingsPage;
