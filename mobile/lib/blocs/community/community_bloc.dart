import 'package:bloc/bloc.dart';

import '../../services/api_service.dart';
import 'community_event.dart';
import 'community_state.dart';

class CommunityBloc extends Bloc<CommunityEvent, CommunityState> {
  CommunityBloc({required ApiService apiService})
      : _apiService = apiService,
        super(const CommunityState()) {
    on<CommunityRequested>(_onCommunityRequested);
    on<CommunitySearchRequested>(_onSearchRequested);
    on<CommunityLikePlantRequested>(_onLikeRequested);
    on<CommunityCommentPlantRequested>(_onCommentRequested);
  }

  final ApiService _apiService;

  Future<void> _onCommunityRequested(
    CommunityRequested event,
    Emitter<CommunityState> emit,
  ) async {
    emit(state.copyWith(status: CommunityStatus.loading, errorMessage: null));
    try {
      final friends = await _apiService.fetchFriends();
      emit(state.copyWith(
        status: CommunityStatus.success,
        friends: friends,
      ));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: CommunityStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onSearchRequested(
    CommunitySearchRequested event,
    Emitter<CommunityState> emit,
  ) async {
    emit(state.copyWith(status: CommunityStatus.loading));
    try {
      final results = await _apiService.searchFriends(event.query);
      emit(state.copyWith(
        status: CommunityStatus.success,
        searchResults: results,
      ));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: CommunityStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onLikeRequested(
    CommunityLikePlantRequested event,
    Emitter<CommunityState> emit,
  ) async {
    try {
      await _apiService.likePlant(event.plantId);
    } on Exception catch (error) {
      emit(state.copyWith(
        status: CommunityStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onCommentRequested(
    CommunityCommentPlantRequested event,
    Emitter<CommunityState> emit,
  ) async {
    emit(state.copyWith(status: CommunityStatus.loading));
    try {
      final comment = await _apiService.commentPlant(
        plantId: event.plantId,
        message: event.message,
      );
      emit(state.copyWith(
        status: CommunityStatus.success,
        recentComment: comment,
      ));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: CommunityStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }
}
