import 'package:bloc/bloc.dart';

import '../../models/event_category.dart';
import '../../models/event_type.dart';
import '../../models/garden.dart';
import '../../services/api_service.dart';
import 'garden_event.dart';
import 'garden_state.dart';

class GardenBloc extends Bloc<GardenEvent, GardenState> {
  GardenBloc({required ApiService apiService})
      : _apiService = apiService,
        super(const GardenState()) {
    on<GardenRequested>(_onGardenRequested);
    on<GardenAddPlantRequested>(_onAddPlantRequested);
  }

  final ApiService _apiService;

  Future<void> _onGardenRequested(
    GardenRequested event,
    Emitter<GardenState> emit,
  ) async {
    emit(state.copyWith(status: GardenStatus.loading, errorMessage: null));
    try {
      final results = await Future.wait([
        _apiService.fetchGarden(),
        _apiService.fetchEventTypes(),
        _apiService.fetchEventCategories(),
      ]);
      final garden = results[0] as Garden;
      final eventTypes = results[1] as List<EventType>;
      final eventCategories = results[2] as List<EventCategory>;
      emit(state.copyWith(
        status: GardenStatus.success,
        garden: garden,
        eventTypes: eventTypes,
        eventCategories: eventCategories,
      ));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: GardenStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }

  Future<void> _onAddPlantRequested(
    GardenAddPlantRequested event,
    Emitter<GardenState> emit,
  ) async {
    emit(state.copyWith(status: GardenStatus.loading));
    try {
      await _apiService.addPlant(
        name: event.name,
        species: event.species,
        eventTypeId: event.eventTypeId,
        categoryId: event.categoryId,
        plantedAt: event.plantedAt,
        notes: event.notes,
      );
      final refreshedGarden = await _apiService.fetchGarden();
      emit(state.copyWith(
        status: GardenStatus.success,
        garden: refreshedGarden,
        errorMessage: null,
      ));
    } on Exception catch (error) {
      emit(state.copyWith(
        status: GardenStatus.failure,
        errorMessage: error.toString(),
      ));
    }
  }
}
