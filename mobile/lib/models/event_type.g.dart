// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event_type.dart';

EventType _$EventTypeFromJson(Map<String, dynamic> json) => EventType(
      id: json['id'] as String,
      name: json['name'] as String,
      categoryId: json['categoryId'] as String,
    );

Map<String, dynamic> _$EventTypeToJson(EventType instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'categoryId': instance.categoryId,
    };
