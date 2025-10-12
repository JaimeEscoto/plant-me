import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/accessory.dart';
import '../models/auth_payload.dart';
import '../models/comment.dart';
import '../models/economy_summary.dart';
import '../models/event_category.dart';
import '../models/event_type.dart';
import '../models/garden.dart';
import '../models/plant.dart';
import '../models/user.dart';

class ApiService {
  ApiService({
    Dio? dio,
    FlutterSecureStorage? secureStorage,
    this.baseUrl = 'https://api.plantme.app',
  })  : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl)),
        _secureStorage = secureStorage ?? const FlutterSecureStorage() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            _secureStorage.delete(key: _tokenKey);
          }
          return handler.next(error);
        },
      ),
    );
  }

  final Dio _dio;
  final FlutterSecureStorage _secureStorage;
  final String baseUrl;

  static const _tokenKey = 'authToken';
  static const _userKey = 'authUser';

  Future<String?> getToken() async => _secureStorage.read(key: _tokenKey);

  Future<void> setAuthToken(String? token) async {
    if (token == null || token.isEmpty) {
      await _secureStorage.delete(key: _tokenKey);
      return;
    }
    await _secureStorage.write(key: _tokenKey, value: token);
  }

  Future<void> persistUser(User user) async {
    await _secureStorage.write(key: _userKey, value: jsonEncode(user.toJson()));
  }

  Future<User?> loadPersistedUser() async {
    final raw = await _secureStorage.read(key: _userKey);
    if (raw == null) {
      return null;
    }
    try {
      return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearPersistedUser() async {
    await _secureStorage.delete(key: _userKey);
    await _secureStorage.delete(key: _tokenKey);
  }

  Future<AuthPayload> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/login',
      data: {'email': email, 'password': password},
    );
    final payload = AuthPayload.fromJson(response.data!);
    await setAuthToken(payload.token);
    await persistUser(payload.user);
    return payload;
  }

  Future<AuthPayload> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/register',
      data: {
        'name': name,
        'email': email,
        'password': password,
      },
    );
    final payload = AuthPayload.fromJson(response.data!);
    await setAuthToken(payload.token);
    await persistUser(payload.user);
    return payload;
  }

  Future<Garden> fetchGarden() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/jardin/');
    return Garden.fromJson(response.data!);
  }

  Future<Plant> addPlant({
    required String name,
    required String species,
    required String eventTypeId,
    required String categoryId,
    required DateTime plantedAt,
    String? notes,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/jardin/planta',
      data: {
        'name': name,
        'species': species,
        'eventTypeId': eventTypeId,
        'categoryId': categoryId,
        'plantedAt': plantedAt.toIso8601String(),
        'notes': notes,
      },
    );
    return Plant.fromJson(response.data!);
  }

  Future<List<EventType>> fetchEventTypes() async {
    final response =
        await _dio.get<List<dynamic>>('/api/jardin/tipos-evento');
    return response.data!
        .map((json) => EventType.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<List<EventCategory>> fetchEventCategories() async {
    final response =
        await _dio.get<List<dynamic>>('/api/jardin/categorias-evento');
    return response.data!
        .map((json) => EventCategory.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<EconomySummary> fetchEconomySummary() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/api/economia/resumen');
    return EconomySummary.fromJson(response.data!);
  }

  Future<Accessory> buyAccessory(String accessoryId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/economia/accesorios/$accessoryId/comprar',
    );
    return Accessory.fromJson(response.data!);
  }

  Future<Accessory> sellAccessory(String accessoryId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/economia/accesorios/$accessoryId/vender',
    );
    return Accessory.fromJson(response.data!);
  }

  Future<List<User>> searchFriends(String query) async {
    final response = await _dio.get<List<dynamic>>(
      '/api/usuarios/buscar',
      queryParameters: {'q': query},
    );
    return response.data!
        .map((json) => User.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<List<User>> fetchFriends() async {
    final response =
        await _dio.get<List<dynamic>>('/api/usuarios/amigos');
    return response.data!
        .map((json) => User.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<void> likePlant(String plantId) async {
    await _dio.post<void>('/api/usuarios/plantas/$plantId/likes');
  }

  Future<Comment> commentPlant({
    required String plantId,
    required String message,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/usuarios/plantas/$plantId/comentarios',
      data: {'message': message},
    );
    return Comment.fromJson(response.data!);
  }
}
