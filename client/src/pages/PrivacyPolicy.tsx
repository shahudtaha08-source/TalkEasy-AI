import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Trash2, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">Last updated: October 2026</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our wellness platform.
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with the terms of this policy, please do not access or use TalkEasy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold mb-2">Account Information</h3>
                <p className="text-sm">
                  We collect information you provide when creating an account, including:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Email address</li>
                  <li>Username</li>
                  <li>Password (stored securely as a hash)</li>
                  <li>First name, last name (optional)</li>
                  <li>Profile image (optional)</li>
                  <li>City, locality (optional)</li>
                  <li>Emergency contact (optional)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Wellness Data</h3>
                <p className="text-sm">
                  We collect wellness data you voluntarily enter, including:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Mood entries and mood factors</li>
                  <li>Stress levels and notes</li>
                  <li>Water intake records</li>
                  <li>Sleep duration and patterns</li>
                  <li>Habit tracking data</li>
                  <li>Journal entries and reflections</li>
                  <li>Health metrics (heart rate, SpO2, blood pressure, steps, ECG status)</li>
                </ul>
                <p className="text-sm mt-2 text-amber-700 dark:text-amber-400">
                  <strong>Important:</strong> Health metrics marked as "Demo data" are simulated values for demonstration purposes. Wearable device integration is planned for a future release.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Usage Data</h3>
                <p className="text-sm">
                  We may collect information about how you use TalkEasy, including:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Pages visited and features used</li>
                  <li>Time spent on features</li>
                  <li>Device information (browser type, operating system)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide, maintain, and improve TalkEasy services</li>
                <li>Generate wellness reports and insights</li>
                <li>Display your wellness trends and patterns</li>
                <li>Send you important account-related communications</li>
                <li>Respond to your requests and support inquiries</li>
                <li>Ensure the security and integrity of our platform</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="text-sm mt-3">
                <strong>Important:</strong> TalkEasy is a wellness platform, not a medical service. Your wellness data is used for informational purposes only and is not medical advice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Storage and Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We implement appropriate technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Access controls and authentication</li>
                <li>Regular security reviews</li>
              </ul>
              <p className="text-sm">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>With your consent:</strong> When you explicitly authorize sharing</li>
                <li><strong>Service providers:</strong> With trusted third-party service providers who assist in operating TalkEasy (e.g., hosting providers, analytics services)</li>
                <li><strong>Legal requirements:</strong> When required by law, court order, or government authority</li>
                <li><strong>Safety concerns:</strong> To protect our rights, property, or safety, or that of our users</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Data Retention and Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We retain your information for as long as necessary to provide TalkEasy services, unless a longer retention period is required or permitted by law.
              </p>
              <p>
                <strong>You may request deletion of your account and data</strong> by:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Contacting us via the email address below</li>
                <li>Using the account deletion feature in Settings (if available)</li>
              </ul>
              <p className="text-sm">
                Upon account deletion, we will delete or anonymize your personal information within a reasonable timeframe, except where required to retain information for legal or security purposes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to certain uses of your information</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p className="text-sm">
                To exercise these rights, please contact us using the information below.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Posting the updated policy on TalkEasy</li>
                <li>Sending you an email notification (if you have provided consent)</li>
              </ul>
              <p className="text-sm">
                Your continued use of TalkEasy after the effective date of the updated policy constitutes acceptance of the changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                If you have questions about this Privacy Policy or your personal information, please contact us at:
              </p>
              <p className="font-semibold">
                privacy@talkeasy.ai
              </p>
              <p className="text-sm">
                We will respond to your inquiry within a reasonable timeframe.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">Legal Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="text-sm">
                This Privacy Policy is for informational purposes only and does not constitute legal advice. TalkEasy is not a medical service and does not provide medical diagnosis or treatment. Wellness data is for informational purposes only. Consult a qualified healthcare professional for medical advice.
              </p>
              <p className="text-sm">
                This Privacy Policy should be reviewed by legal counsel before commercial launch to ensure compliance with applicable laws and regulations in your jurisdiction.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
