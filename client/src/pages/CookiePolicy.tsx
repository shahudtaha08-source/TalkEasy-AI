import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Info, Settings } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Cookie Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">Last updated: October 2026</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                TalkEasy's Use of Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy currently uses cookies primarily for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Authentication:</strong> Session cookies to keep you logged in</li>
                <li><strong>Preferences:</strong> Storing your theme preference (light/dark mode)</li>
                <li><strong>Functionality:</strong> Remembering your settings and choices</li>
              </ul>
              <p className="text-sm mt-3">
                We do not currently use cookies for advertising or third-party tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold mb-2">Necessary Cookies</h3>
                <p className="text-sm">
                  These cookies are essential for the Platform to function. They enable core functionality such as:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>User authentication and session management</li>
                  <li>Security features</li>
                  <li>Basic navigation</li>
                </ul>
                <p className="text-sm mt-2">
                  These cookies cannot be disabled, as doing so would prevent the Platform from working.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Preferences Cookies</h3>
                <p className="text-sm">
                  These cookies remember your choices and preferences to provide a more personalized experience:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Theme preference (light/dark mode)</li>
                  <li>Language preference</li>
                  <li>Display settings</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Analytics Cookies (Future)</h3>
                <p className="text-sm">
                  TalkEasy may implement analytics cookies in the future to understand how users interact with the Platform and improve our services. These cookies would:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Collect anonymous usage statistics</li>
                  <li>Help identify popular features</li>
                  <li>Assist in bug detection and performance improvement</li>
                </ul>
                <p className="text-sm mt-2">
                  If implemented, these cookies would be optional and you would be able to opt out.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Managing Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies. Note that blocking necessary cookies may prevent the Platform from functioning correctly.</li>
                <li><strong>Cookie Preferences:</strong> Use our Cookie Preferences page to manage your cookie choices for TalkEasy.</li>
              </ul>
              <p className="text-sm">
                Please note that removing or blocking cookies may impact your user experience and some features may not work as intended.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy does not currently use third-party cookies for advertising or tracking. If we integrate third-party services in the future that use cookies, we will:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Inform you in this Cookie Policy</li>
                <li>Provide options to opt out</li>
                <li>Ensure third-party services respect your privacy choices</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Cookies vs. Persistent Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold mb-2">Session Cookies</h3>
                <p className="text-sm">
                  These are temporary cookies that expire when you close your browser. TalkEasy uses session cookies for authentication and security.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Persistent Cookies</h3>
                <p className="text-sm">
                  These remain on your device for a set period or until you delete them. TalkEasy may use persistent cookies to remember your preferences.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Updates to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our use of cookies or applicable laws. We will notify users of material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Posting the updated policy on TalkEasy</li>
                <li>Displaying a notice on the Platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                If you have questions about this Cookie Policy or our use of cookies, please contact us at:
              </p>
              <p className="font-semibold">
                privacy@talkeasy.ai
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">Important Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="text-sm">
                This Cookie Policy reflects TalkEasy's current implementation. As the Platform evolves, our use of cookies may change. We will update this policy accordingly and inform users of significant changes.
              </p>
              <p className="text-sm">
                We do not claim cookie categories that are not actually implemented in the application.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
