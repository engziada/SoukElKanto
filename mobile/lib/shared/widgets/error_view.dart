import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Error view with retry button.
class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    required this.message,
    this.onRetry,
    this.icon = Icons.error_outline,
  });

  final String message;
  final VoidCallback? onRetry;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppColors.coral.withValues(alpha: 0.6),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.slateSmoke,
                  ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.coral,
                  foregroundColor: AppColors.warmWhite,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Network-specific error view.
class NetworkErrorView extends StatelessWidget {
  const NetworkErrorView({super.key, this.onRetry});

  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return ErrorView(
      message: 'No internet connection. Check your network and try again.',
      onRetry: onRetry,
      icon: Icons.wifi_off,
    );
  }
}
