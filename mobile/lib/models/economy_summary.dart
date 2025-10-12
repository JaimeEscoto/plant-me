import 'package:json_annotation/json_annotation.dart';

import 'accessory.dart';

part 'economy_summary.g.dart';

@JsonSerializable(explicitToJson: true)
class EconomySummary {
  const EconomySummary({
    required this.seedBalance,
    this.ownedAccessories = const [],
  });

  factory EconomySummary.fromJson(Map<String, dynamic> json) =>
      _$EconomySummaryFromJson(json);

  final int seedBalance;
  final List<Accessory> ownedAccessories;

  Map<String, dynamic> toJson() => _$EconomySummaryToJson(this);
}
