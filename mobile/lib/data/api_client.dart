import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

/// Paths from `shared/routes.ts`.
class ApiPaths {
  ApiPaths._();

  static const String authUser = '/api/auth/user';
  static const String authRegister = '/api/auth/register';
  static const String authLogin = '/api/auth/login';
  static const String authRefresh = '/api/auth/refresh';
  static const String authLogout = '/api/auth/logout';
  static const String authForgotPassword = '/api/auth/forgot-password';
  static const String authVerifyResetToken = '/api/auth/verify-reset-token';
  static const String authResetPassword = '/api/auth/reset-password';
  static const String user = '/api/user';

  static const String moods = '/api/moods';
  static const String moodEntries = '/api/mood-entries';
  static const String habits = '/api/habits';
  static const String journals = '/api/journals';
  static const String sleepEntries = '/api/sleep-entries';
  static const String waterEntries = '/api/water-entries';
  static const String stressEntries = '/api/stress-entries';
  static const String healthDailyRecords = '/api/health-daily-records';
  static const String healthDailyRecordsLatest =
      '/api/health-daily-records/latest';
  static const String reports = '/api/reports';
  static const String conversations = '/api/conversations';
  static const String historyEmotional = '/api/history/emotional';

  static String conversationMessages(int id) => '/api/conversations/$id/messages';
  static String habit(int id) => '/api/habits/$id';
  static String journal(int id) => '/api/journals/$id';
  static String waterEntry(int id) => '/api/water-entries/$id';
  static String stressEntry(int id) => '/api/stress-entries/$id';
  static String report(int id) => '/api/reports/$id';
}

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;
}

/// Minimal cookie store for the two auth cookies. Dart's HTTP stack keeps no jar of
/// its own, and the server sets both cookies `httpOnly`.
class CookieJar {
  final Map<String, String> _values = <String, String>{};

  bool has(String name) => (_values[name] ?? '').isNotEmpty;

  String? get header => _values.isEmpty
      ? null
      : _values.entries.map((e) => '${e.key}=${e.value}').join('; ');

  void clear() => _values.clear();

  void absorb(List<String>? setCookieHeaders) {
    if (setCookieHeaders == null) return;
    for (final String header in setCookieHeaders) {
      final String pair = header.split(';').first;
      final int eq = pair.indexOf('=');
      if (eq <= 0) continue;
      final String name = pair.substring(0, eq).trim();
      final String value = pair.substring(eq + 1).trim();
      if (value.isEmpty) {
        _values.remove(name);
      } else {
        _values[name] = value;
      }
    }
  }
}

/// Talks to the same Express server the web client uses.
///
/// Replays the `talkeasy_access` / `talkeasy_refresh` cookies on every request and makes
/// a single automatic `/api/auth/refresh` + retry when the access token has expired.
class ApiClient {
  ApiClient({String? baseUrl})
      : baseUrl = baseUrl ?? _defaultBaseUrl(),
        _http = http.Client();

  static const String accessCookie = 'talkeasy_access';
  static const String refreshCookie = 'talkeasy_refresh';

  final String baseUrl;
  final http.Client _http;
  final CookieJar _cookies = CookieJar();

  bool _refreshing = false;

  static String _defaultBaseUrl() {
    const fromEnv = String.fromEnvironment('TALKEASY_API_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    return 'http://localhost:3000';
  }

  void clearCookies() => _cookies.clear();

  Uri _uri(String path, [Map<String, String>? query]) {
    final Uri base = Uri.parse(baseUrl);
    return base.replace(
      path: path,
      queryParameters: (query == null || query.isEmpty) ? null : query,
    );
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  Future<dynamic> post(String path, {Object? body, Map<String, String>? query}) =>
      _send('POST', path, body: body, query: query);

  Future<dynamic> patch(String path, {Object? body}) =>
      _send('PATCH', path, body: body);

  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<dynamic> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
    bool allowRefresh = true,
  }) async {
    final http.Response response =
        await _perform(method, path, body: body, query: query);

    if (response.statusCode == 401 &&
        allowRefresh &&
        path != ApiPaths.authRefresh &&
        await _tryRefresh()) {
      final http.Response retry =
          await _perform(method, path, body: body, query: query);
      return _decode(retry);
    }
    return _decode(response);
  }

  Future<http.Response> _perform(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
  }) async {
    final Uri uri = _uri(path, query);
    final String payload = body == null ? '' : jsonEncode(body);
    final Map<String, String> headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (_cookies.header != null) 'Cookie': _cookies.header!,
    };

    try {
      late http.Response res;
      switch (method) {
        case 'GET':
          res = await _http.get(uri, headers: headers).timeout(_timeout);
        case 'POST':
          res = await _http
              .post(uri, headers: headers, body: payload.isEmpty ? null : payload)
              .timeout(_timeout);
        case 'PATCH':
          res = await _http
              .patch(uri, headers: headers, body: payload.isEmpty ? null : payload)
              .timeout(_timeout);
        case 'DELETE':
          res = await _http.delete(uri, headers: headers).timeout(_timeout);
        default:
          throw ApiException('Unsupported method $method');
      }
      _cookies.absorb(res.headers['set-cookie']);
      return res;
    } on TimeoutException {
      throw ApiException('The server took too long to respond. Please try again.');
    } on SocketException catch (e) {
      throw ApiException(
        'Could not reach TalkEasy. Check that the server is running at $baseUrl (${e.message})',
      );
    } on http.ClientException catch (e) {
      throw ApiException('Network error: ${e.message}');
    }
  }

  static const Duration _timeout = Duration(seconds: 30);

  Future<bool> _tryRefresh() async {
    if (_refreshing || !_cookies.has(refreshCookie)) return false;
    _refreshing = true;
    try {
      final http.Response res = await _perform('POST', ApiPaths.authRefresh);
      return res.statusCode >= 200 && res.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      _refreshing = false;
    }
  }

  dynamic _decode(http.Response res) {
    final int status = res.statusCode;
    if (res.body.isEmpty) {
      if (status >= 400) {
        throw ApiException('Request failed ($status)', statusCode: status);
      }
      return null;
    }
    dynamic parsed;
    try {
      parsed = jsonDecode(res.body);
    } catch (_) {
      parsed = res.body;
    }
    if (status >= 400) {
      final String message = parsed is Map && parsed['message'] != null
          ? parsed['message'].toString()
          : 'Request failed ($status)';
      throw ApiException(message, statusCode: status);
    }
    return parsed;
  }

  /// Streams `POST /api/conversations/:id/messages`, which replies with SSE
  /// (`text/event-stream`): partial `content` frames, then `{ "done": true }`.
  Stream<Map<String, dynamic>> streamMessage(
    int conversationId,
    String content,
  ) {
    final HttpClient client = HttpClient();
    final StreamController<Map<String, dynamic>> controller =
        StreamController<Map<String, dynamic>>();
    final Uri uri = _uri(ApiPaths.conversationMessages(conversationId));

    controller.onListen = () {
      _runSse(client, controller, uri, content);
    };
    return controller.stream;
  }

  Future<void> _runSse(
    HttpClient client,
    StreamController<Map<String, dynamic>> controller,
    Uri uri,
    String content,
  ) async {
    try {
      final HttpClientRequest request = await client.postUrl(uri);
      final String? cookie = _cookies.header;
      if (cookie != null) {
        request.headers.set(HttpHeaders.cookieHeader, cookie);
      }
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      request.write(jsonEncode(<String, String>{'content': content}));

      final HttpClientResponse res = await request.close();
      if (res.statusCode >= 400) {
        final String raw = await res.transform(utf8.decoder).join();
        throw ApiException(
          raw.isEmpty ? 'Failed to send message' : raw,
          statusCode: res.statusCode,
        );
      }

      var finished = false;
      final StreamSubscription<String> sub =
          res.transform(utf8.decoder).transform(const LineSplitter()).listen(
        (String line) {
          if (finished || !line.startsWith('data:')) return;
          final String raw = line.substring(5).trim();
          if (raw.isEmpty || raw == '[DONE]') return;
          try {
            final dynamic frame = jsonDecode(raw);
            if (frame is Map<String, dynamic>) {
              controller.add(frame);
              if (frame['done'] == true) {
                finished = true;
                _finish(controller, client, sub);
              }
            }
          } catch (_) {
            // Ignore partial frames split across two SSE events.
          }
        },
        onDone: () {
          if (finished) return;
          finished = true;
          _finish(controller, client, sub);
        },
        onError: (Object e) {
          if (finished) return;
          finished = true;
          controller.addError(e);
          client.close();
        },
        cancelOnError: false,
      );
    } catch (e) {
      if (!controller.isClosed) controller.addError(e);
      client.close();
    }
  }

  void _finish(
    StreamController<Map<String, dynamic>> controller,
    HttpClient client,
    StreamSubscription<String> sub,
  ) {
    sub.cancel();
    client.close();
    if (!controller.isClosed) controller.close();
  }
}