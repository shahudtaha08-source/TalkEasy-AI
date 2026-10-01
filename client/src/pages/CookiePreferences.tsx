import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, Save, RefreshCw } from "lucide-react";

export default function CookiePreferences() {
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    preferences: true,
    analytics: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real implementation, this would save to localStorage or a backend
    localStorage.setItem("cookiePreferences", JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setPreferences({
      necessary: true,
      preferences: true,
      analytics: false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Cookie Preferences</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your cookie settings for TalkEasy</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookie Categories
              </CardTitle>
              <CardDescription>
                Choose which types of cookies you allow TalkEasy to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Necessary Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Required for the Platform to function. These cannot be disabled.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Used for: Authentication, security, basic navigation
                  </p>
                </div>
                <Switch checked={preferences.necessary} disabled className="opacity-50" />
              </div>

              {/* Preferences Cookies */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Preferences Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remember your settings and choices for a personalized experience.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Used for: Theme preference, language, display settings
                  </p>
                </div>
                <Switch
                  checked={preferences.preferences}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, preferences: checked })
                  }
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Analytics Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Help us understand how you use TalkEasy to improve our services.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Used for: Anonymous usage statistics, feature popularity, performance
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Currently not implemented
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Each Category Means</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold mb-2">Necessary</h3>
                <p className="text-sm">
                  These cookies are essential for the Platform to work. Without them, you cannot log in or use core features. They are always active.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Preferences</h3>
                <p className="text-sm">
                  These cookies remember your choices (like dark/light mode) so you don't have to set them every time you visit. Disabling them may reset your preferences.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Analytics</h3>
                <p className="text-sm">
                  These cookies help us understand how users interact with TalkEasy. The data is anonymous and used only to improve the Platform. This category is not currently implemented.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">Important Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="text-sm">
                Currently, TalkEasy only uses Necessary and Preferences cookies. Analytics cookies are planned for future implementation but are not active yet.
              </p>
              <p className="text-sm">
                Disabling Preferences cookies will reset your theme and other preferences to defaults each time you visit.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSave} className="flex-1">
              {saved ? "Saved!" : <><Save className="h-4 w-4 mr-2" /> Save Preferences</>}
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Learn More</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="text-sm">
                For detailed information about cookies and how we use them, please read our full <a href="/cookie-policy" className="text-blue-600 dark:text-blue-400 hover:underline">Cookie Policy</a>.
              </p>
              <p className="text-sm">
                You can also manage cookies through your browser settings. Note that browser-level settings may override TalkEasy preferences.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
