// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accessory.dart';

Accessory _$AccessoryFromJson(Map<String, dynamic> json) => Accessory(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      price: (json['price'] as num).toInt(),
      quantity: (json['quantity'] as num).toInt(),
      imageUrl: json['imageUrl'] as String?,
    );

Map<String, dynamic> _$AccessoryToJson(Accessory instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'price': instance.price,
      'quantity': instance.quantity,
      'imageUrl': instance.imageUrl,
    };
