import 'package:json_annotation/json_annotation.dart';

import 'accessory.dart';
import 'plant.dart';

part 'garden.g.dart';

@JsonSerializable(explicitToJson: true)
class Garden {
  const Garden({
    required this.id,
    required this.name,
    required this.healthScore,
    this.description,
    this.plants = const [],
    this.accessories = const [],
  });

  factory Garden.fromJson(Map<String, dynamic> json) => _$GardenFromJson(json);

  final String id;
  final String name;
  final double healthScore;
  final String? description;
  final List<Plant> plants;
  final List<Accessory> accessories;

  Map<String, dynamic> toJson() => _$GardenToJson(this);
}
