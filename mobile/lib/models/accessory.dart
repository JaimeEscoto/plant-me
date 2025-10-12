import 'package:json_annotation/json_annotation.dart';

part 'accessory.g.dart';

@JsonSerializable()
class Accessory {
  const Accessory({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.quantity,
    this.imageUrl,
  });

  factory Accessory.fromJson(Map<String, dynamic> json) => _$AccessoryFromJson(json);

  final String id;
  final String name;
  final String description;
  final int price;
  final int quantity;
  final String? imageUrl;

  Map<String, dynamic> toJson() => _$AccessoryToJson(this);
}
