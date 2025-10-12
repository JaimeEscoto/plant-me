import 'package:equatable/equatable.dart';

class GardenEvent extends Equatable {
  const GardenEvent();

  @override
  List<Object?> get props => [];
}

class GardenRequested extends GardenEvent {
  const GardenRequested();
}

class GardenAddPlantRequested extends GardenEvent {
  const GardenAddPlantRequested({
    required this.name,
    required this.species,
    required this.eventTypeId,
    required this.categoryId,
    required this.plantedAt,
    this.notes,
  });

  final String name;
  final String species;
  final String eventTypeId;
  final String categoryId;
  final DateTime plantedAt;
  final String? notes;

  @override
  List<Object?> get props => [name, species, eventTypeId, categoryId, plantedAt, notes];
}
