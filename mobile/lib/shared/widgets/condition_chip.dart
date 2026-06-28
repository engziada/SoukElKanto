import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Condition chip showing the listing condition.
class ConditionChip extends StatelessWidget {
  const ConditionChip({super.key, required this.condition});

  final String condition;

  String get _label {
    return switch (condition) {
      'NEW_WITH_TAGS' => 'New with Tags',
      'LIKE_NEW' => 'Like New',
      'GOOD' => 'Good',
      'FAIR' => 'Fair',
      'NEEDS_REPAIR' => 'Needs Repair',
      'FOR_PARTS' => 'For Parts',
      _ => condition,
    };
  }

  Color get _color {
    return switch (condition) {
      'NEW_WITH_TAGS' => AppColors.mint,
      'LIKE_NEW' => AppColors.teal,
      'GOOD' => AppColors.indigo,
      'FAIR' => AppColors.honey,
      'NEEDS_REPAIR' => AppColors.coral,
      'FOR_PARTS' => AppColors.dustyCloud,
      _ => AppColors.slateSmoke,
    };
  }

  @override
  Widget build(BuildContext context) {
    final color = _color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        _label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
