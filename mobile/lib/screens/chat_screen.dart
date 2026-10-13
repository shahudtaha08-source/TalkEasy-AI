import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/api_client.dart';
import '../data/app_state.dart';
import '../data/models.dart';
import '../i18n/language.dart';
import '../theme/talk_colors.dart';
import '../widgets/app_shell.dart';
import '../widgets/talk_widgets.dart';

/// Support Chat. Lists/creates conversations and streams replies the same way the
/// web `Chatbot` page does: `POST /api/conversations/:id/messages` responds with
/// SSE frames (`content`, then `{ done: true }`). In demo mode nothing leaves the
/// device — a small local reply is used instead of the AI service.
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _composer = TextEditingController();
  final ScrollController _scroll = ScrollController();

  List<Conversation> _conversations = <Conversation>[];
  List<Message> _messages = <Message>[];
  Conversation? _active;

  bool _loading = true;
  bool _sending = false;
  String _streaming = '';
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadConversations());
  }

  @override
  void dispose() {
    _composer.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _loadConversations() async {
    final AppState state = context.read<AppState>();
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final List<Conversation> conversations;
      if (state.isDemo) {
        conversations = state.demo.conversations();
      } else {
        final dynamic raw = await state.api.get(ApiPaths.conversations);
        conversations = raw is List
            ? raw
                .whereType<Map<String, dynamic>>()
                .map(Conversation.fromJson)
                .toList(growable: false)
            : <Conversation>[];
      }
      if (!mounted) return;
      setState(() {
        _conversations = conversations;
        _loading = false;
      });
      if (conversations.isNotEmpty) {
        await _open(conversations.first);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _open(Conversation conversation) async {
    final AppState state = context.read<AppState>();
    setState(() {
      _active = conversation;
      _messages = <Message>[];
    });
    try {
      final List<Message> messages;
      if (state.isDemo) {
        messages = state.demo.conversationHistory(conversation.id!);
      } else {
        final dynamic raw =
            await state.api.get(ApiPaths.conversationMessages(conversation.id!));
        messages = raw is List
            ? raw
                .whereType<Map<String, dynamic>>()
                .map(Message.fromJson)
                .toList(growable: false)
            : <Message>[];
      }
      if (!mounted) return;
      setState(() => _messages = messages);
      _scrollToEnd();
    } catch (e) {
      if (!mounted) return;
      TalkToast.show(context, e.toString(), destructive: true);
    }
  }

  Future<Conversation?> _newConversation() async {
    final AppState state = context.read<AppState>();
    const String title = 'New conversation';
    try {
      final Conversation conversation;
      if (state.isDemo) {
        conversation = state.demo.createConversation(title);
      } else {
        final dynamic raw = await state.api.post(
          ApiPaths.conversations,
          body: <String, dynamic>{'title': title},
        );
        if (raw is! Map<String, dynamic>) return null;
        conversation = Conversation.fromJson(raw);
      }
      if (!mounted) return null;
      setState(() {
        _conversations = <Conversation>[conversation, ..._conversations];
        _active = conversation;
        _messages = <Message>[];
      });
      return conversation;
    } catch (e) {
      if (!mounted) return null;
      TalkToast.show(context, e.toString(), destructive: true);
      return null;
    }
  }

  String _localReply(String message) {
    final String text = message.toLowerCase();
    if (text.contains('sad') || text.contains('down') || text.contains('low')) {
      return "I'm sorry you're feeling this way. It's okay to have hard days. "
          'Would you like to talk about what is weighing on you?';
    }
    if (text.contains('anxious') ||
        text.contains('anxiety') ||
        text.contains('worried') ||
        text.contains('stress')) {
      return 'That sounds overwhelming. Try a slow breath in for four counts '
          'and out for six. What feels most pressing right now?';
    }
    if (text.contains('sleep') || text.contains('tired')) {
      return 'Rest matters. A consistent bedtime and less screen time before '
          'sleep can help. What does your evening routine look like?';
    }
    return 'Thank you for sharing that with me. I am here to listen. '
        'Can you tell me a little more about how you are feeling?';
  }

  Future<void> _send() async {
    final String text = _composer.text.trim();
    if (text.isEmpty || _sending) return;
    final AppState state = context.read<AppState>();

    Conversation conversation;
    if (_active != null) {
      conversation = _active!;
    } else {
      final Conversation? created = await _newConversation();
      if (created == null) return;
      conversation = created;
    }

    _composer.clear();
    setState(() {
      _sending = true;
      _messages = <Message>[
        ..._messages,
        Message(role: 'user', content: text),
      ];
    });
    _scrollToEnd();

    if (state.isDemo) {
      state.demo.addMessage(conversation.id!, 'user', text);
      await Future<void>.delayed(const Duration(milliseconds: 450));
      final String reply = _localReply(text);
      state.demo.addMessage(conversation.id!, 'assistant', reply);
      if (!mounted) return;
      setState(() {
        _messages = state.demo.conversationHistory(conversation.id!);
        _sending = false;
      });
      _scrollToEnd();
      return;
    }

    setState(() => _streaming = '');
    final StringBuffer buffer = StringBuffer();
    state.api.streamMessage(conversation.id!, text).listen(
      (Map<String, dynamic> frame) {
        final dynamic content = frame['content'];
        if (content is String && content.isNotEmpty) {
          buffer.write(content);
          if (mounted) setState(() => _streaming = buffer.toString());
          _scrollToEnd();
        }
      },
      onError: (Object error) {
        if (!mounted) return;
        setState(() {
          _sending = false;
          _streaming = '';
        });
        TalkToast.show(context, error.toString(), destructive: true);
      },
      onDone: () async {
        final Conversation? current = _active;
        if (current != null) {
          try {
            final dynamic raw = await state.api
                .get(ApiPaths.conversationMessages(current.id!));
            if (raw is List) {
              final List<Message> messages = raw
                  .whereType<Map<String, dynamic>>()
                  .map(Message.fromJson)
                  .toList(growable: false);
              if (!mounted) return;
              setState(() => _messages = messages);
            }
          } catch (_) {
            // Keep the optimistic bubble if the reload fails.
          }
        }
        if (!mounted) return;
        setState(() {
          _sending = false;
          _streaming = '';
        });
        _scrollToEnd();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);

    return AppShell(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 820),
          child: Column(
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(
                    TalkSpace.md, TalkSpace.md, TalkSpace.md, TalkSpace.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    TalkPageTitle(
                      icon: Icons.chat_bubble_outline_rounded,
                      title: context.t('chatTitle'),
                      subtitle: context.t('chatSubtitle'),
                      trailing: IconButton(
                        tooltip: 'New conversation',
                        onPressed: _sending ? null : () => _newConversation(),
                        icon: const Icon(Icons.add_comment_outlined),
                      ),
                    ),
                    if (_conversations.length > 1)
                      SizedBox(
                        height: 40,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _conversations.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(width: TalkSpace.sm),
                          itemBuilder: (BuildContext context, int index) {
                            final Conversation c = _conversations[index];
                            return TalkChoiceChip(
                              label: c.title ?? 'Conversation',
                              selected: c.id == _active?.id,
                              onTap: () => _open(c),
                            );
                          },
                        ),
                      ),
                  ],
                ),
              ),
              Divider(height: 1, color: theme.dividerColor),
              Expanded(child: _buildMessages(theme)),
              _buildComposer(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessages(ThemeData theme) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return TalkEmptyState(
        icon: Icons.cloud_off_rounded,
        title: 'Could not load conversations',
        message: _error,
        action: TextButton(
          onPressed: _loadConversations,
          child: const Text('Retry'),
        ),
      );
    }
    if (_active == null && _messages.isEmpty && _streaming.isEmpty) {
      return TalkEmptyState(
        icon: Icons.forum_outlined,
        title: context.t('startSupportiveConversation'),
        message: context.t('supportChatDescription'),
        action: FilledButton.icon(
          onPressed: _sending ? null : () => _newConversation(),
          icon: const Icon(Icons.add_comment_outlined),
          label: Text(context.t('startConversation')),
        ),
      );
    }

    final bool showStreaming = _streaming.isNotEmpty;
    final int count = _messages.length + (showStreaming ? 1 : 0);

    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.all(TalkSpace.md),
      itemCount: count,
      itemBuilder: (BuildContext context, int index) {
        if (showStreaming && index == _messages.length) {
          return _MessageBubble(
            message: Message(role: 'assistant', content: _streaming),
            pending: true,
          );
        }
        return _MessageBubble(message: _messages[index]);
      },
    );
  }

  Widget _buildComposer(ThemeData theme) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(TalkSpace.md),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border(top: BorderSide(color: theme.dividerColor)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: <Widget>[
            Expanded(
              child: TextField(
                controller: _composer,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(),
                decoration: InputDecoration(
                  hintText: context.t('typeMessagePlaceholder'),
                  border: const OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: TalkSpace.sm),
            FilledButton(
              onPressed: _sending ? null : _send,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.all(14),
                shape: const CircleBorder(),
              ),
              child: _sending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_rounded, size: 18),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, this.pending = false});

  final Message message;
  final bool pending;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final bool isUser = message.isUser;
    final bool isDark = theme.brightness == Brightness.dark;

    final Color background = isUser
        ? TalkColors.primary
        : (isDark ? TalkColors.darkCard : TalkColors.card);
    final Color foreground = isUser
        ? Colors.white
        : (isDark ? TalkColors.darkForeground : TalkColors.foreground);

    return Padding(
      padding: const EdgeInsets.only(bottom: TalkSpace.sm),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: <Widget>[
          Flexible(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 520),
              padding: const EdgeInsets.symmetric(
                  horizontal: TalkSpace.md, vertical: TalkSpace.sm + 2),
              decoration: BoxDecoration(
                color: background,
                borderRadius: TalkRadius.card,
                border: isUser
                    ? null
                    : Border.all(color: theme.dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    message.content ?? '',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: foreground,
                      height: 1.35,
                    ),
                  ),
                  if (pending) ...<Widget>[
                    const SizedBox(height: TalkSpace.xs),
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ],
                  if (!isUser && (message.aiSuggestion ?? '').isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: TalkSpace.xs),
                      child: Text(
                        message.aiSuggestion!,
                        style: theme.textTheme.labelSmall
                            ?.copyWith(color: TalkColors.softBlue),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
