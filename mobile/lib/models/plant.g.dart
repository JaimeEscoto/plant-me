// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'plant.dart';

Plant _$PlantFromJson(Map<String, dynamic> json) => Plant(
      id: json['id'] as String,
      name: json['name'] as String,
      species: json['species'] as String,
      healthStatus: json['healthStatus'] as String,
      plantedAt: DateTime.parse(json['plantedAt'] as String),
      likes: (json['likes'] as num).toInt(),
      owner: User.fromJson(json['owner'] as Map<String, dynamic>),
      imageUrl: json['imageUrl'] as String?,
      comments: (json['comments'] as List<dynamic>?)
              ?.map((e) => Comment.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$PlantToJson(Plant instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'species': instance.species,
      'healthStatus': instance.healthStatus,
      'plantedAt': instance.plantedAt.toIso8601String(),
      'likes': instance.likes,
      'owner': instance.owner.toJson(),
      'imageUrl': instance.imageUrl,
      'comments': instance.comments.map((e) => e.toJson()).toList(),
    };
