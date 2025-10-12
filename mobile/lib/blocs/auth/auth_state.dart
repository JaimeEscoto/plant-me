import 'package:equatable/equatable.dart';

import '../../models/user.dart';

enum AuthStatus { unauthenticated, authenticated, loading, error }

class AuthState extends Equatable {
  const AuthState._({
    required this.status,
    this.user,
    this.token,
    this.errorMessage,
  });

  const AuthState.unauthenticated()
      : this._(status: AuthStatus.unauthenticated);

  const AuthState.authenticated({required User user, required String token})
      : this._(status: AuthStatus.authenticated, user: user, token: token);

  const AuthState.loading()
      : this._(status: AuthStatus.loading);

  const AuthState.error(String message)
      : this._(status: AuthStatus.error, errorMessage: message);

  final AuthStatus status;
  final User? user;
  final String? token;
  final String? errorMessage;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  @override
  List<Object?> get props => [status, user, token, errorMessage];
}
