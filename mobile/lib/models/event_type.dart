import 'package:json_annotation/json_annotation.dart';

part 'event_type.g.dart';

@JsonSerializable()
class EventType {
  const EventType({
    required this.id,
    required this.name,
    required this.categoryId,
  });

  factory EventType.fromJson(Map<String, dynamic> json) => _$EventTypeFromJson(json);

  final String id;
  final String name;
  final String categoryId;

  Map<String, dynamic> toJson() => _$EventTypeToJson(this);
}
