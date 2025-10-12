import 'package:json_annotation/json_annotation.dart';

part 'event_category.g.dart';

@JsonSerializable()
class EventCategory {
  const EventCategory({
    required this.id,
    required this.name,
  });

  factory EventCategory.fromJson(Map<String, dynamic> json) => _$EventCategoryFromJson(json);

  final String id;
  final String name;

  Map<String, dynamic> toJson() => _$EventCategoryToJson(this);
}
