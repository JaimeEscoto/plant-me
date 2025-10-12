// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'garden.dart';

Garden _$GardenFromJson(Map<String, dynamic> json) => Garden(
      id: json['id'] as String,
      name: json['name'] as String,
      healthScore: (json['healthScore'] as num).toDouble(),
      description: json['description'] as String?,
      plants: (json['plants'] as List<dynamic>?)
              ?.map((e) => Plant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      accessories: (json['accessories'] as List<dynamic>?)
              ?.map((e) => Accessory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$GardenToJson(Garden instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'healthScore': instance.healthScore,
      'description': instance.description,
      'plants': instance.plants.map((e) => e.toJson()).toList(),
      'accessories': instance.accessories.map((e) => e.toJson()).toList(),
    };
