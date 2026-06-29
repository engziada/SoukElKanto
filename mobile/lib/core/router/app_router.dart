import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_provider.dart';
import '../i18n/l10n_helper.dart';
import '../theme/app_colors.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/otp_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/listings/listings_screen.dart';
import '../../features/listings/listing_detail_screen.dart';
import '../../features/listings/create_listing_screen.dart';
import '../../features/listings/edit_listing_screen.dart';
import '../../features/listings/my_listings_screen.dart';
import '../../features/favorites/favorites_screen.dart';
import '../../features/offers/offers_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/wallet/wallet_screen.dart';
import '../../features/trust_meter/trust_meter_screen.dart';
import '../../features/kyc/kyc_screen.dart';

/// Route paths.
class Routes {
  Routes._();

  static const String splash = '/splash';
  static const String login = '/login';
  static const String otp = '/otp';
  static const String home = '/';
  static const String listings = '/listings';
  static const String listingDetail = '/listings/:id';
  static const String create = '/create';
  static const String editListing = '/listings/:id/edit';
  static const String my = '/my';
  static const String favorites = '/favorites';
  static const String offers = '/offers';
  static const String profile = '/profile';
  static const String verify = '/verify';
  static const String wallet = '/wallet';
  static const String trustMeter = '/trust-meter';
}

/// Router configuration.
GoRouter buildRouter(Ref ref) {
  return GoRouter(
    initialLocation: Routes.home,
    redirect: (context, state) {
      final isAuthenticated = ref.read(isAuthenticatedProvider);
      final path = state.matchedLocation;

      // Auth-required routes.
      final authRequiredRoutes = [
        Routes.create,
        '/listings/:id/edit',
        Routes.my,
        Routes.offers,
        Routes.profile,
        Routes.verify,
        Routes.wallet,
        Routes.trustMeter,
        Routes.favorites,
      ];

      // If trying to access auth-required route while unauthenticated.
      if (authRequiredRoutes.contains(path) && !isAuthenticated) {
        return Routes.login;
      }

      // If authenticated and trying to access login/otp, redirect to home.
      if (isAuthenticated && (path == Routes.login || path == Routes.otp)) {
        return Routes.home;
      }

      return null;
    },
    routes: [
      // Splash / loading screen.
      GoRoute(
        path: Routes.splash,
        builder: (context, state) => const _SplashScreen(),
      ),
      // Login screen.
      GoRoute(
        path: Routes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      // OTP verification screen.
      GoRoute(
        path: Routes.otp,
        builder: (context, state) => const OtpScreen(),
      ),
      // Shell route with bottom navigation for main screens.
      ShellRoute(
        builder: (context, state, child) => _AppShell(child: child),
        routes: [
          // Home screen.
          GoRoute(
            path: Routes.home,
            builder: (context, state) => const HomeScreen(),
          ),
          // Listings browse.
          GoRoute(
            path: Routes.listings,
            builder: (context, state) => const ListingsScreen(),
          ),
          // My listings.
          GoRoute(
            path: Routes.my,
            builder: (context, state) => const MyListingsScreen(),
          ),
          // Offers.
          GoRoute(
            path: Routes.offers,
            builder: (context, state) => const OffersScreen(),
          ),
          // Profile.
          GoRoute(
            path: Routes.profile,
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      // Listing detail (outside shell — full screen).
      GoRoute(
        path: '/listings/:id',
        builder: (context, state) => ListingDetailScreen(
          id: state.pathParameters['id']!,
        ),
      ),
      // Create listing (outside shell — full screen).
      GoRoute(
        path: Routes.create,
        builder: (context, state) => const CreateListingScreen(),
      ),
      // Edit listing (outside shell — full screen).
      GoRoute(
        path: '/listings/:id/edit',
        builder: (context, state) => EditListingScreen(
          listingId: state.pathParameters['id']!,
        ),
      ),
      // Favorites.
      GoRoute(
        path: Routes.favorites,
        builder: (context, state) => const FavoritesScreen(),
      ),
      // KYC verification.
      GoRoute(
        path: Routes.verify,
        builder: (context, state) => const KycScreen(),
      ),
      // Wallet.
      GoRoute(
        path: Routes.wallet,
        builder: (context, state) => const WalletScreen(),
      ),
      // Trust meter.
      GoRoute(
        path: Routes.trustMeter,
        builder: (context, state) => const TrustMeterScreen(),
      ),
    ],
  );
}

/// Router provider.
final routerProvider = Provider<GoRouter>((ref) => buildRouter(ref));

// ── App Shell with bottom navigation ─────────────────────

class _AppShell extends StatelessWidget {
  const _AppShell({required this.child});

  final Widget child;

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/listings')) return 1;
    if (location == '/my') return 2;
    if (location == '/offers') return 3;
    if (location == '/profile') return 4;
    return 0; // home
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    final l = context.l10n;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go('/');
              break;
            case 1:
              context.go('/listings');
              break;
            case 2:
              context.go('/my');
              break;
            case 3:
              context.go('/offers');
              break;
            case 4:
              context.go('/profile');
              break;
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: l.navHome,
          ),
          NavigationDestination(
            icon: const Icon(Icons.search_outlined),
            selectedIcon: const Icon(Icons.search),
            label: l.navListings,
          ),
          NavigationDestination(
            icon: const Icon(Icons.sell_outlined),
            selectedIcon: const Icon(Icons.sell),
            label: l.authMyListings,
          ),
          NavigationDestination(
            icon: const Icon(Icons.local_offer_outlined),
            selectedIcon: const Icon(Icons.local_offer),
            label: l.navOffers,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l.myProfileTitle,
          ),
        ],
      ),
    );
  }
}

// ── Splash screen ────────────────────────────────────────

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(color: AppColors.coral),
      ),
    );
  }
}
