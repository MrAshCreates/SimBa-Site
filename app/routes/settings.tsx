import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle } from "lucide-react";
import { useColorScheme } from "@dazl/color-scheme/react";
import type { Route } from "./+types/settings";
import { Navigation } from "~/components/navigation/navigation";
import { useAuth } from "~/hooks/use-auth";
import {
  useUserSettings,
  type AccentStyle,
  type ColorSchemePreference,
  type DensityPreference,
  type SiteStyle,
  type UserSettings,
} from "~/hooks/use-user-settings";
import type { User } from "~/data/auth";
import styles from "./settings.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - SimBa" },
    {
      name: "description",
      content: "Customize your SimBa Playground experience with personalized settings and preferences.",
    },
  ];
}

export default function Settings() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const { settings, updateSettings, updateNotificationSetting, resetSettings } = useUserSettings();
  const { setColorScheme } = useColorScheme();
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // User profile state
  const [developerStatus, setDeveloperStatus] = useState(user?.developerStatus || "");
  const [simbaUsage, setSimbaUsage] = useState(user?.simbaUsage || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSettingChange = <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
    category: T,
    key: K,
    value: UserSettings[T][K],
  ) => {
    updateSettings(category, key, value);
    showSaveConfirmation();
  };

  const handleNotificationChange = (key: keyof UserSettings["general"]["notifications"], value: boolean) => {
    updateNotificationSetting(key, value);
    showSaveConfirmation();
  };

  const handleToggle = <T extends keyof UserSettings, K extends keyof UserSettings[T]>(category: T, key: K) => {
    const currentValue = settings[category]?.[key] ?? false;
    handleSettingChange(category, key, !currentValue as UserSettings[T][K]);
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      const updatedUser = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerStatus,
          simbaUsage,
          phone,
        }),
      }).then(async (response) => {
        const data = (await response.json()) as { user?: User };
        if (!response.ok) {
          throw new Error("Failed to update profile");
        }
        return data.user;
      });

      if (updatedUser) {
        login(updatedUser);
        showSaveConfirmation();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const showSaveConfirmation = () => {
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  // Show loading state while authentication is being restored
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Navigation />
        <main className={styles.main}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <div>Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Navigation />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings & Preferences</h1>
          <p className={styles.subtitle}>
            Customize your SimBa Playground experience to match your coding preferences.
          </p>
        </div>

        <div className={styles.settingsGrid}>
          {/* Appearance */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Appearance</h2>
              <p className={styles.sectionDescription}>
                Change the look of the website and playground. These apply immediately.
              </p>
            </div>

            <div className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Color scheme</label>
                <p className={styles.description}>Light, dark, or follow your system setting</p>
                <select
                  className={styles.select}
                  value={settings.appearance?.colorScheme || "system"}
                  onChange={(e) => {
                    const value = e.target.value as ColorSchemePreference;
                    setColorScheme(value);
                    handleSettingChange("appearance", "colorScheme", value);
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Accent</label>
                <p className={styles.description}>Brand color used for buttons, tabs, and highlights</p>
                <select
                  className={styles.select}
                  value={settings.appearance?.accent || "violet"}
                  onChange={(e) => handleSettingChange("appearance", "accent", e.target.value as AccentStyle)}
                >
                  <option value="violet">Violet</option>
                  <option value="ocean">Ocean</option>
                  <option value="ember">Ember</option>
                  <option value="forest">Forest</option>
                  <option value="slate">Slate</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Site style</label>
                <p className={styles.description}>Default is soft. High contrast strengthens borders and text</p>
                <select
                  className={styles.select}
                  value={settings.appearance?.siteStyle || "default"}
                  onChange={(e) => handleSettingChange("appearance", "siteStyle", e.target.value as SiteStyle)}
                >
                  <option value="default">Default</option>
                  <option value="high-contrast">High contrast</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Density</label>
                <p className={styles.description}>Comfortable is roomier. Compact tightens the playground chrome</p>
                <select
                  className={styles.select}
                  value={settings.appearance?.density || "comfortable"}
                  onChange={(e) => handleSettingChange("appearance", "density", e.target.value as DensityPreference)}
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>
          </section>

          {/* User Profile Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>User Profile</h2>
              <p className={styles.sectionDescription}>
                Help us understand how you use SimBa to improve your experience.
              </p>
            </div>

            <div className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Developer Status</label>
                <p className={styles.description}>What best describes your programming experience?</p>
                <select
                  className={styles.select}
                  value={developerStatus}
                  onChange={(e) => setDeveloperStatus(e.target.value)}
                >
                  <option value="">Select your status</option>
                  <option value="student">Student</option>
                  <option value="hobbyist">Hobbyist</option>
                  <option value="professional">Professional Developer</option>
                  <option value="researcher">Researcher</option>
                  <option value="educator">Educator</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>SimBa Usage Purpose</label>
                <p className={styles.description}>What do you primarily use SimBa for?</p>
                <textarea
                  className={styles.textarea}
                  value={simbaUsage}
                  onChange={(e) => setSimbaUsage(e.target.value)}
                  placeholder="e.g., Learning hybrid programming, Personal projects, Research, Education..."
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number (Optional)</label>
                <p className={styles.description}>For important account notifications</p>
                <input
                  type="tel"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <button className={styles.saveButton} onClick={handleProfileUpdate}>
                Update Profile
              </button>
            </div>
          </section>

          {/* Editor Settings */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Code Editor</h2>
              <p className={styles.sectionDescription}>Configure the appearance and behavior of the code editor.</p>
            </div>

            <div className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Theme</label>
                <p className={styles.description}>Editor colors only. Site light/dark is under Appearance</p>
                <select
                  className={styles.select}
                  value={settings.editor?.theme || "vs-dark"}
                  onChange={(e) => handleSettingChange("editor", "theme", e.target.value)}
                >
                  <option value="vs-dark">Dark Theme</option>
                  <option value="vs-light">Light Theme</option>
                  <option value="hc-black">High Contrast Dark</option>
                  <option value="hc-light">High Contrast Light</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Keybinds Schema</label>
                <p className={styles.description}>Choose your preferred keyboard shortcuts</p>
                <select
                  className={styles.select}
                  value={settings.editor?.keybinds || "default"}
                  onChange={(e) => handleSettingChange("editor", "keybinds", e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="vscode">VS Code</option>
                  <option value="sublime">Sublime Text</option>
                  <option value="vim">Vim</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Font Size</label>
                <p className={styles.description}>Set the font size for code text (10-24px)</p>
                <input
                  type="number"
                  min="10"
                  max="24"
                  className={styles.input}
                  value={settings.editor?.fontSize || 14}
                  onChange={(e) => handleSettingChange("editor", "fontSize", parseInt(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Auto-save Delay</label>
                <p className={styles.description}>Delay in seconds before auto-saving changes</p>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className={styles.input}
                  value={settings.editor?.autoSaveDelay || 2}
                  onChange={(e) => handleSettingChange("editor", "autoSaveDelay", parseInt(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tab Size</label>
                <p className={styles.description}>Number of spaces per tab indentation</p>
                <select
                  className={styles.select}
                  value={settings.editor?.tabSize || 4}
                  onChange={(e) => handleSettingChange("editor", "tabSize", parseInt(e.target.value))}
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.editor?.wordWrap ? styles.active : ""}`}
                    onClick={() => handleToggle("editor", "wordWrap")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Word Wrap</div>
                    <p className={styles.description}>Wrap long lines to fit the editor width</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.editor?.minimap !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("editor", "minimap")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Minimap</div>
                    <p className={styles.description}>Show code overview minimap on the right side</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.editor?.lineNumbers !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("editor", "lineNumbers")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Line Numbers</div>
                    <p className={styles.description}>Display line numbers in the editor gutter</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.previewSection}>
              <h3 className={styles.previewTitle}>Preview</h3>
              <div
                className={styles.previewCode}
                style={{
                  fontSize: `${settings.editor?.fontSize || 14}px`,
                  fontFamily: "var(--font-monospace-code)",
                }}
              >
                {`# SimBa code example
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

result = fibonacci(10)
print(f"Fibonacci(10) = {result}")`}
              </div>
            </div>
          </section>

          {/* Terminal Settings */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Terminal & Console</h2>
              <p className={styles.sectionDescription}>
                Configure the appearance and behavior of the terminal and output console.
              </p>
            </div>

            <div className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Font Size</label>
                <p className={styles.description}>Set the font size for terminal text (10-20px)</p>
                <input
                  type="number"
                  min="10"
                  max="20"
                  className={styles.input}
                  value={settings.terminal?.fontSize || 13}
                  onChange={(e) => handleSettingChange("terminal", "fontSize", parseInt(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Cursor Style</label>
                <p className={styles.description}>Choose the terminal cursor appearance</p>
                <select
                  className={styles.select}
                  value={settings.terminal?.cursorStyle || "block"}
                  onChange={(e) => handleSettingChange("terminal", "cursorStyle", e.target.value)}
                >
                  <option value="block">Block</option>
                  <option value="underline">Underline</option>
                  <option value="bar">Bar</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Scrollback Limit</label>
                <p className={styles.description}>Maximum lines of terminal history to keep</p>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  className={styles.input}
                  value={settings.terminal?.scrollbackLimit || 1000}
                  onChange={(e) => handleSettingChange("terminal", "scrollbackLimit", parseInt(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.terminal?.showTimestamps ? styles.active : ""}`}
                    onClick={() => handleToggle("terminal", "showTimestamps")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Show Timestamps</div>
                    <p className={styles.description}>Display timestamps for terminal output</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.terminal?.clearOnRun !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("terminal", "clearOnRun")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Clear on Run</div>
                    <p className={styles.description}>Automatically clear console when running code</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.previewSection}>
              <h3 className={styles.previewTitle}>Terminal Preview</h3>
              <div
                className={styles.previewCode}
                style={{
                  fontSize: `${settings.terminal?.fontSize || 13}px`,
                  fontFamily: "var(--font-monospace-code)",
                  background: "#1e1e1e",
                  color: "#d4d4d4",
                }}
              >
                {`simba> run hello-world.smba
=== SimBa Execution ===
Submitting code for execution...
✓ Compilation successful
Hello, Developer! Welcome to SimBa!
The answer is 42
Execution completed successfully`}
              </div>
            </div>
          </section>

          {/* Playground layout */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Playground Layout</h2>
              <p className={styles.sectionDescription}>
                Defaults used when the playground loads. You can still change panels from the toolbar or terminal.
              </p>
            </div>

            <div className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Default console mode</label>
                <p className={styles.description}>
                  Output is results-only. Terminal is a full command session for navigating the playground.
                </p>
                <select
                  className={styles.select}
                  value={settings.playground?.defaultConsoleMode || "output"}
                  onChange={(e) =>
                    handleSettingChange("playground", "defaultConsoleMode", e.target.value as "output" | "terminal")
                  }
                >
                  <option value="output">Output (limited)</option>
                  <option value="terminal">Terminal (full)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.playground?.showSidebar !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("playground", "showSidebar")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Show files sidebar</div>
                    <p className={styles.description}>Open the file list when the playground loads</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.playground?.showConsole !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("playground", "showConsole")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Show console</div>
                    <p className={styles.description}>Open Output / Terminal when the playground loads</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.playground?.showExamples !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("playground", "showExamples")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Show examples panel</div>
                    <p className={styles.description}>Open the examples panel when the playground loads</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* General Settings */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>General</h2>
              <p className={styles.sectionDescription}>General application preferences and behaviors.</p>
            </div>

            <div className={styles.settingsForm}>
              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.general?.autoSave !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("general", "autoSave")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Auto-save Projects</div>
                    <p className={styles.description}>Automatically save changes to your projects</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggle} ${settings.general?.confirmDelete !== false ? styles.active : ""}`}
                    onClick={() => handleToggle("general", "confirmDelete")}
                  >
                    <div className={styles.toggleSlider}></div>
                  </button>
                  <div>
                    <div className={styles.toggleLabel}>Confirm Deletions</div>
                    <p className={styles.description}>Show confirmation dialog before deleting projects</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Default File Extension</label>
                <p className={styles.description}>Default extension for new files</p>
                <select
                  className={styles.select}
                  value={settings.general?.defaultExtension || ".smba"}
                  onChange={(e) => handleSettingChange("general", "defaultExtension", e.target.value)}
                >
                  <option value=".smba">.smba (SimBa)</option>
                  <option value=".py">.py (Python)</option>
                  <option value=".rs">.rs (Rust)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <h4 className={styles.subSectionTitle}>Notifications</h4>
                <p className={styles.description}>Choose which notifications you'd like to receive</p>

                <div className={styles.notificationGroup}>
                  <div className={styles.toggleGroup}>
                    <button
                      className={`${styles.toggle} ${settings.general?.notifications?.codeRunSuccess !== false ? styles.active : ""}`}
                      onClick={() =>
                        handleNotificationChange("codeRunSuccess", !settings.general?.notifications?.codeRunSuccess)
                      }
                    >
                      <div className={styles.toggleSlider}></div>
                    </button>
                    <div>
                      <div className={styles.toggleLabel}>Code Run Success</div>
                      <p className={styles.description}>Notify when code executes successfully</p>
                    </div>
                  </div>

                  <div className={styles.toggleGroup}>
                    <button
                      className={`${styles.toggle} ${settings.general?.notifications?.codeRunError !== false ? styles.active : ""}`}
                      onClick={() =>
                        handleNotificationChange("codeRunError", !settings.general?.notifications?.codeRunError)
                      }
                    >
                      <div className={styles.toggleSlider}></div>
                    </button>
                    <div>
                      <div className={styles.toggleLabel}>Code Run Errors</div>
                      <p className={styles.description}>Notify when code execution fails</p>
                    </div>
                  </div>

                  <div className={styles.toggleGroup}>
                    <button
                      className={`${styles.toggle} ${settings.general?.notifications?.newFeatures !== false ? styles.active : ""}`}
                      onClick={() =>
                        handleNotificationChange("newFeatures", !settings.general?.notifications?.newFeatures)
                      }
                    >
                      <div className={styles.toggleSlider}></div>
                    </button>
                    <div>
                      <div className={styles.toggleLabel}>New Feature Announcements</div>
                      <p className={styles.description}>Notify about new SimBa features and updates</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                className={styles.saveButton}
                onClick={() => {
                  if (window.confirm("Reset all playground and appearance settings to defaults?")) {
                    resetSettings();
                    setColorScheme("system");
                    showSaveConfirmation();
                  }
                }}
              >
                Reset all settings
              </button>
            </div>
          </section>
        </div>

        {showSaveMessage && (
          <div className={styles.successMessage}>
            <CheckCircle size={16} />
            Settings saved successfully!
          </div>
        )}
      </main>
    </div>
  );
}
