import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'blocs/auth/auth_bloc.dart';
import 'blocs/auth/auth_event.dart';
import 'blocs/auth/auth_state.dart';
import 'blocs/community/community_bloc.dart';
import 'blocs/community/community_event.dart';
import 'blocs/economy/economy_bloc.dart';
import 'blocs/economy/economy_event.dart';
import 'blocs/garden/garden_bloc.dart';
import 'blocs/garden/garden_event.dart';
import 'router/app_router.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/api_service.dart';

void main() {
  final apiService = ApiService();
  runApp(PlantMeApp(apiService: apiService));
}

class PlantMeApp extends StatelessWidget {
  const PlantMeApp({super.key, required this.apiService});

  final ApiService apiService;

  @override
  Widget build(BuildContext context) {
    final appRouter = AppRouter();
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (_) => AuthBloc(apiService: apiService)..add(const AuthStarted()),
        ),
        BlocProvider<GardenBloc>(
          create: (_) => GardenBloc(apiService: apiService),
        ),
        BlocProvider<EconomyBloc>(
          create: (_) => EconomyBloc(apiService: apiService),
        ),
        BlocProvider<CommunityBloc>(
          create: (_) => CommunityBloc(apiService: apiService),
        ),
      ],
      child: BlocListener<AuthBloc, AuthState>(
        listenWhen: (previous, current) => previous.status != current.status,
        listener: (context, state) {
          if (state.status == AuthStatus.authenticated) {
            context.read<GardenBloc>().add(const GardenRequested());
            context.read<EconomyBloc>().add(const EconomyRequested());
            context.read<CommunityBloc>().add(const CommunityRequested());
          }
        },
        child: MaterialApp(
          title: 'Plant Me',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6BBE6E)),
            useMaterial3: true,
          ),
          onGenerateRoute: appRouter.onGenerateRoute,
        ),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        switch (state.status) {
          case AuthStatus.loading:
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          case AuthStatus.authenticated:
            return const HomeScreen();
          case AuthStatus.error:
            return LoginScreen(initialError: state.errorMessage);
          case AuthStatus.unauthenticated:
          default:
            return const LoginScreen();
        }
      },
    );
  }
}
