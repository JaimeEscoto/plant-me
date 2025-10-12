import 'package:equatable/equatable.dart';

import '../../models/event_category.dart';
import '../../models/event_type.dart';
import '../../models/garden.dart';

enum GardenStatus { initial, loading, success, failure }

class GardenState extends Equatable {
  const GardenState({
    this.status = GardenStatus.initial,
    this.garden,
    this.eventTypes = const [],
    this.eventCategories = const [],
    this.errorMessage,
  });

  final GardenStatus status;
  final Garden? garden;
  final List<EventType> eventTypes;
  final List<EventCategory> eventCategories;
  final String? errorMessage;

  GardenState copyWith({
    GardenStatus? status,
    Garden? garden,
    List<EventType>? eventTypes,
    List<EventCategory>? eventCategories,
    String? errorMessage,
  }) {
    return GardenState(
      status: status ?? this.status,
      garden: garden ?? this.garden,
      eventTypes: eventTypes ?? this.eventTypes,
      eventCategories: eventCategories ?? this.eventCategories,
      errorMessage: errorMessage,
    );
  }

  GardenState clearError() => copyWith(errorMessage: null);

  @override
  List<Object?> get props => [status, garden, eventTypes, eventCategories, errorMessage];
}
