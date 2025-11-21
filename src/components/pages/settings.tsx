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
import {
  Info,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PreviewText from "@/components/ui/preview-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Navigate, useSearchParams } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "../ui/input";
import { NativeSelect } from "../ui/native-select";
import { useThemeStore } from "@/stores/themeStore";
import { Theme } from "@/lib/theme";
import { useIsMobile } from "@/hooks/use-mobile";

const EXAMPLE_TEXT = "Hello World";

const tabsButtonClassname =
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center gap-1.5 rounded-md !border-none px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 w-full justify-start hover:bg-muted";

const SecuritySection = () => {
  const { settings, saveSettings } = useSettingsStore();
  const [passwordDialogShown, setPasswordDialogShown] = useState(false);
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [removeKeyDialogShown, setRemoveKeyDialogShown] = useState(false);
  const { enableEncryption, disableEncryption, lock, isUnlocked } =
    useJournalStore();

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

  return (
    <>
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
    </>
  );
};

const AppearanceSection = () => {
  const [cursorColor, setCursorColor] = useState<string | undefined>();
  const [textColor, setTextColor] = useState<string | undefined>();
  const { theme, setTheme } = useThemeStore();
  const { settings, saveSettings } = useSettingsStore();

  const handleChangeCursorColor = async (color: string | undefined) => {
    await saveSettings({ cursorColor: color });
  };

  const handleChangeTextColor = async (color: string | undefined) => {
    await saveSettings({ textColor: color });
  };

  return (
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

      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Theme</FieldLabel>
          <FieldDescription>Change the theme of your journal.</FieldDescription>
        </FieldContent>
        <NativeSelect
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </NativeSelect>
      </Field>
    </FieldSet>
  );
};

const AiSection = () => {
  const { settings, saveSettings } = useSettingsStore();
  const [cleanupPrompt, setCleanupPrompt] = useState<string | undefined>(
    undefined
  );
  const {
    models: llmModels,
    status: modelStatus,
    progress: modelProgress,
    timeElapsed: modelTimeElapsed,
    error: modelError,
    changeModel,
  } = useLLMStore();
  const modelDownloading = modelStatus === "downloading";
  const modelLoading = ["checking-cache", "loading"].includes(modelStatus);

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
  return (
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
          memory. This may use a lot of GPU and battery, but models can be used
          offline once downloaded.
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
            {modelError && <p className="text-destructive">{modelError}</p>}
          </div>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
};

const ProfileSection = () => {
  const { user, initializing } = useAuthStore();

  return initializing ? (
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
            <FieldDescription>Your email address.</FieldDescription>
          </FieldContent>
          <Input value={user.email} disabled className="w-fit" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ) : (
    <Navigate to="/login" />
  );
};

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs = ["security", "appearance", "ai", "profile"];
  const defaultTab = validTabs.includes(tabParam || "") ? tabParam! : null;
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { user } = useAuthStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleResetSettings = () => {
    toast.warning("This doesn't do anything lol.");
  };

  if (isMobile) {
    const currentSection = activeTab || null;

    if (!currentSection) {
      return (
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex flex-col px-4">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4"
              onClick={() => handleTabChange("security")}
            >
              <span className="font-medium">Security</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4"
              onClick={() => handleTabChange("appearance")}
            >
              <span className="font-medium">Appearance</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4"
              onClick={() => handleTabChange("ai")}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">AI</span>
                <Sparkles className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-4"
                onClick={() => handleTabChange("profile")}
              >
                <span className="font-medium">Account</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="border-t mt-4 pt-4 px-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleResetSettings}
            >
              <RotateCcw className="size-4 mr-2" />
              Reset Settings
            </Button>
          </div>
        </div>
      );
    }

    // Show detail view for selected section
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="sticky top-0 bg-background border-b z-10">
          <div className="flex items-center gap-2 py-2 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setActiveTab(null);
                setSearchParams({});
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {currentSection === "security" && "Security"}
              {currentSection === "appearance" && "Appearance"}
              {currentSection === "ai" && "AI"}
              {currentSection === "profile" && "Account"}
            </h2>
          </div>
        </div>
        <div className="p-4 pb-8">
          {currentSection === "security" && <SecuritySection />}
          {currentSection === "appearance" && <AppearanceSection />}
          {currentSection === "ai" && <AiSection />}
          {currentSection === "profile" && user && <ProfileSection />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center h-full p-8">
      <Tabs
        orientation="vertical"
        value={activeTab || "security"}
        onValueChange={handleTabChange}
        className="flex-row gap-4 max-w-2xl w-full"
      >
        <TabsList className="flex-col h-fit w-full max-w-[200px] bg-background gap-1 p-0">
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
          <SecuritySection />
        </TabsContent>

        <TabsContent value="appearance" className="flex-1">
          <AppearanceSection />
        </TabsContent>

        <TabsContent value="ai" className="flex-1">
          <AiSection />
        </TabsContent>
        <TabsContent value="profile" className="flex-1">
          <ProfileSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
