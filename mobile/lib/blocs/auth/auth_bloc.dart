import 'package:bloc/bloc.dart';

import '../../services/api_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc({required ApiService apiService})
      : _apiService = apiService,
        super(const AuthState.loading()) {
    on<AuthStarted>(_onStarted);
    on<AuthLoginRequested>(_onLoginRequested);
    on<AuthRegisterRequested>(_onRegisterRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
  }

  final ApiService _apiService;

  Future<void> _onStarted(AuthStarted event, Emitter<AuthState> emit) async {
    emit(const AuthState.loading());
    final token = await _apiService.getToken();
    final user = await _apiService.loadPersistedUser();
    if (token != null && token.isNotEmpty && user != null) {
      emit(AuthState.authenticated(user: user, token: token));
    } else {
      emit(const AuthState.unauthenticated());
    }
  }

  Future<void> _onLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthState.loading());
    try {
      final payload = await _apiService.login(
        email: event.email,
        password: event.password,
      );
      emit(AuthState.authenticated(user: payload.user, token: payload.token));
    } on Exception catch (error) {
      emit(AuthState.error(error.toString()));
      emit(const AuthState.unauthenticated());
    }
  }

  Future<void> _onRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthState.loading());
    try {
      final payload = await _apiService.register(
        name: event.name,
        email: event.email,
        password: event.password,
      );
      emit(AuthState.authenticated(user: payload.user, token: payload.token));
    } on Exception catch (error) {
      emit(AuthState.error(error.toString()));
      emit(const AuthState.unauthenticated());
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _apiService.clearPersistedUser();
    emit(const AuthState.unauthenticated());
  }
}
