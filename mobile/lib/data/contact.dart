import 'package:url_launcher/url_launcher.dart';

/// Official TalkEasy support contact. Kept separate from any transactional
/// sender identity: this is the address users write to for support, privacy,
/// legal, feedback and reviews.
const String kSupportEmail = 'talkeasysupport@gmail.com';

/// Builds a `mailto:` URI with correctly percent-encoded subject/body via [Uri].
Uri supportMailtoUri({String? subject, String? body}) {
  final Map<String, String> query = <String, String>{};
  if (subject != null && subject.isNotEmpty) query['subject'] = subject;
  if (body != null && body.isNotEmpty) query['body'] = body;
  return Uri(
    scheme: 'mailto',
    path: kSupportEmail,
    queryParameters: query.isEmpty ? null : query,
  );
}

/// Opens the user's mail composer addressed to support. Returns false when no
/// mail app can handle the link (the caller should surface the address instead
/// of silently doing nothing).
Future<bool> openSupportEmail({String? subject, String? body}) async {
  final Uri uri = supportMailtoUri(subject: subject, body: body);
  try {
    return await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    return false;
  }
}
