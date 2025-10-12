import 'package:bloc/bloc.dart';

import '../../services/api_service.dart';
import 'economy_event.dart';
import 'economy_state.dart';

class EconomyBloc extends Bloc<EconomyEvent, EconomyState> {
  EconomyBloc({required ApiService apiService})
      : _apiService = apiService,
        super(const EconomyState()) {
    on<EconomyRequested>(_onEconomyRequested);
    on<EconomyBuyAccessoryRequested>(_onBuyAccessoryRequested);
    on<EconomySellAccessoryRequested>(_onSellAccessoryRequested);
  }

  final ApiService _apiService;

  Future<void> _onEconomyRequested(
    EconomyRequested event,
    Emitter<EconomyState> emit,
  ) async {
    emit(state.copyWith(status: EconomyStatus.loading, errorMessage: null));
    try {
      final summary = await _apiService.fetchEconomySummary();
      emit(state.copyWith(status: EconomyStatus.success, summary: summary));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: EconomyStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onBuyAccessoryRequested(
    EconomyBuyAccessoryRequested event,
    Emitter<EconomyState> emit,
  ) async {
    emit(state.copyWith(status: EconomyStatus.loading));
    try {
      await _apiService.buyAccessory(event.accessoryId);
      final summary = await _apiService.fetchEconomySummary();
      emit(state.copyWith(status: EconomyStatus.success, summary: summary));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: EconomyStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onSellAccessoryRequested(
    EconomySellAccessoryRequested event,
    Emitter<EconomyState> emit,
  ) async {
    emit(state.copyWith(status: EconomyStatus.loading));
    try {
      await _apiService.sellAccessory(event.accessoryId);
      final summary = await _apiService.fetchEconomySummary();
      emit(state.copyWith(status: EconomyStatus.success, summary: summary));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: EconomyStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }
}
