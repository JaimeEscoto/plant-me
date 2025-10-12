import 'package:json_annotation/json_annotation.dart';

import 'comment.dart';
import 'user.dart';

part 'plant.g.dart';

@JsonSerializable(explicitToJson: true)
class Plant {
  const Plant({
    required this.id,
    required this.name,
    required this.species,
    required this.healthStatus,
    required this.plantedAt,
    required this.likes,
    required this.owner,
    this.imageUrl,
    this.comments = const [],
  });

  factory Plant.fromJson(Map<String, dynamic> json) => _$PlantFromJson(json);

  final String id;
  final String name;
  final String species;
  final String healthStatus;
  final DateTime plantedAt;
  final int likes;
  final User owner;
  final String? imageUrl;
  final List<Comment> comments;

  Map<String, dynamic> toJson() => _$PlantToJson(this);
}
