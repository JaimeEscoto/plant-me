// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'economy_summary.dart';

EconomySummary _$EconomySummaryFromJson(Map<String, dynamic> json) =>
    EconomySummary(
      seedBalance: (json['seedBalance'] as num).toInt(),
      ownedAccessories: (json['ownedAccessories'] as List<dynamic>?)
              ?.map((e) => Accessory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$EconomySummaryToJson(EconomySummary instance) =>
    <String, dynamic>{
      'seedBalance': instance.seedBalance,
      'ownedAccessories':
          instance.ownedAccessories.map((e) => e.toJson()).toList(),
    };
