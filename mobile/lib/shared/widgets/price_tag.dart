import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';

/// Coral pill displaying a price in EGP.
class PriceTag extends StatelessWidget {
  const PriceTag({
    super.key,
    required this.price,
    this.compact = false,
  });

  final int price;
  final bool compact;

  String get _formatted {
    final format = NumberFormat('#,##0', 'en_US');
    return format.format(price);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 16,
        vertical: compact ? 4 : 8,
      ),
      decoration: BoxDecoration(
        color: AppColors.coral,
        borderRadius: BorderRadius.circular(compact ? 8 : 12),
        boxShadow: compact ? null : AppColors.coralShadow,
      ),
      child: Text(
        '$_formatted EGP',
        style: TextStyle(
          color: AppColors.warmWhite,
          fontSize: compact ? 13 : 16,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
