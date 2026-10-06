import 'package:flutter/material.dart';

import '../theme/talk_theme.dart';

/// `TalkEasyLogo.tsx` — a rounded teal tile with a chat-bubble glyph, plus the
/// gradient wordmark. Drawn with Flutter primitives so no asset is needed.
class TalkEasyLogo extends StatelessWidget {
  const TalkEasyLogo({super.key, this.size = 40, this.showWordmark = true});

  final double size;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    final Widget mark = _LogoTile(size: size);

    if (!showWordmark) return mark;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        mark,
        SizedBox(width: size * 0.3),
        ShaderMask(
          shaderCallback: (Rect bounds) => const LinearGradient(
            colors: <Color>[Color(0xFF1DAF9C), Color(0xFF0E7C86)],
          ).createShader(bounds),
          child: Text(
            'TalkEasy',
            style: TextStyle(
              fontFamily: TalkTheme.displayFont,
              fontSize: size * 0.72,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}

class _LogoTile extends StatelessWidget {
  const _LogoTile({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.3),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[Color(0xFF2FD4BC), Color(0xFF12897F)],
        ),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: const Color(0xFF1DAF9C).withValues(alpha: 0.32),
            blurRadius: size * 0.35,
            offset: Offset(0, size * 0.12),
          ),
        ],
      ),
      child: Icon(
        Icons.chat_bubble_rounded,
        size: size * 0.55,
        color: Colors.white,
      ),
    );
  }
}