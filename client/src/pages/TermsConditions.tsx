import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, Gavel, Users, ExternalLink } from "lucide-react";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms & Conditions</h1>
          <p className="text-gray-600 dark:text-gray-400">Last updated: October 2026</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                By accessing or using TalkEasy ("the Platform"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, please do not use TalkEasy.
              </p>
              <p>
                TalkEasy reserves the right to modify these Terms at any time. Your continued use of the Platform after changes constitutes acceptance of the updated Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Purpose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy is a wellness and personal tracking platform designed to help users:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Track mood, stress, sleep, water intake, and other wellness metrics</li>
                <li>Build and monitor habits</li>
                <li>Journal reflections and thoughts</li>
                <li>View wellness trends and patterns</li>
                <li>Generate wellness reports</li>
                <li>Access mental health resources and support information</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Not Medical Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-red-700 dark:text-red-400">
                IMPORTANT: TalkEasy is NOT a medical service.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>TalkEasy does not provide medical diagnosis, treatment, or advice</li>
                <li>TalkEasy is not a substitute for professional medical care</li>
                <li>TalkEasy is not a doctor, therapist, or emergency medical service</li>
                <li>Wellness data and insights are for informational purposes only</li>
                <li>Health metrics marked as "Demo data" are simulated values</li>
                <li>Wearable device integration is planned for a future release</li>
              </ul>
              <p className="text-sm mt-3">
                Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment. In case of emergency, contact emergency services immediately (India: 112, Tele-MANAS: 14416).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>As a user of TalkEasy, you agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate and complete information when creating an account</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
                <li>Not share your account credentials with others</li>
              </ul>
              <p className="text-sm">
                You must be at least 13 years old to use TalkEasy. Users under 18 should have parental or guardian supervision.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Acceptable Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use TalkEasy for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to TalkEasy systems or data</li>
                <li>Interfere with or disrupt TalkEasy services or servers</li>
                <li>Use TalkEasy to harass, abuse, or harm others</li>
                <li>Post false, misleading, or harmful information</li>
                <li>Impersonate any person or entity</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Use TalkEasy to self-harm or encourage self-harm in others</li>
              </ul>
              <p className="text-sm">
                TalkEasy reserves the right to suspend or terminate accounts that violate these Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User-Generated Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                You retain ownership of content you create on TalkEasy (journal entries, mood entries, etc.). However, by using TalkEasy, you grant us a license to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Store and process your content to provide services</li>
                <li>Display your content to you (e.g., in reports, trends)</li>
                <li>Analyze your content to generate insights (using rule-based logic, not AI in v6.0)</li>
              </ul>
              <p className="text-sm">
                You represent that you have the right to share any content you post on TalkEasy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy, its design, and its content are owned by TalkEasy and are protected by intellectual property laws. You may not:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Copy, modify, or distribute TalkEasy without permission</li>
                <li>Use TalkEasy trademarks or branding without authorization</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Third-Party Services and Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy may contain links to third-party websites or resources (e.g., mental health resources, crisis hotlines). We are not responsible for the content or practices of third-party sites.
              </p>
              <p className="text-sm">
                Your use of third-party services is governed by their respective terms and privacy policies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Accuracy or reliability of wellness data and insights</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Compatibility with your device or software</li>
                <li>Security of data transmission</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                To the maximum extent permitted by law, TalkEasy shall not be liable for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of data, revenue, or profits</li>
                <li>Decisions made based on wellness data or insights</li>
                <li>Health outcomes or medical decisions</li>
              </ul>
              <p className="text-sm">
                In no event shall TalkEasy's total liability exceed the amount you paid (if any) to use the Platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy reserves the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violation of these Terms</li>
                <li>Suspicious or fraudulent activity</li>
                <li>Extended period of inactivity</li>
                <li>Operational or technical reasons</li>
              </ul>
              <p className="text-sm">
                Upon termination, your right to use TalkEasy will cease immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Conduct and Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                TalkEasy takes user safety seriously. If you express immediate self-harm or suicidal intent:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>We will provide immediate safety-oriented guidance</li>
                <li>We will encourage you to move away from means and not be alone</li>
                <li>We will provide emergency support information (India: 112, Tele-MANAS: 14416)</li>
                <li>We may log safety events for follow-up (with your privacy in mind)</li>
              </ul>
              <p className="text-sm">
                We never shame users. Our safety architecture is independent of AI and prioritizes your wellbeing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                You agree to indemnify and hold TalkEasy harmless from any claims, damages, or expenses arising from your use of TalkEasy or violation of these Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Severability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                For questions about these Terms, please contact us at:
              </p>
              <p className="font-semibold">
                legal@talkeasy.ai
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-400">Legal Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="text-sm">
                These Terms & Conditions are for informational purposes only and do not constitute legal advice. This document should be reviewed by legal counsel before commercial launch to ensure compliance with applicable laws and regulations in your jurisdiction.
              </p>
              <p className="text-sm">
                TalkEasy is a wellness platform, not a medical service. Always consult qualified professionals for medical, legal, or other professional advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
