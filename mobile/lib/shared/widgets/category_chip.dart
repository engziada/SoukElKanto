import 'package:flutter/material.dart';

import '../../core/api/models.dart';
import '../../core/theme/app_colors.dart';

/// Category chip with bilingual label support.
class CategoryChip extends StatelessWidget {
  const CategoryChip({
    super.key,
    required this.category,
    this.locale = 'en',
    this.selected = false,
    this.onTap,
  });

  final Category category;
  final String locale;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final label = category.label(locale);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.coral
              : Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkSurfaceMid
                  : AppColors.awningShade,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? AppColors.coral
                : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected
                ? AppColors.warmWhite
                : Theme.of(context).textTheme.bodyMedium?.color,
            fontSize: 13,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
