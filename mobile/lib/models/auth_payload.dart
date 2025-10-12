import 'package:json_annotation/json_annotation.dart';

import 'user.dart';

part 'auth_payload.g.dart';

@JsonSerializable(explicitToJson: true)
class AuthPayload {
  const AuthPayload({
    required this.token,
    required this.user,
  });

  factory AuthPayload.fromJson(Map<String, dynamic> json) =>
      _$AuthPayloadFromJson(json);

  final String token;
  final User user;

  Map<String, dynamic> toJson() => _$AuthPayloadToJson(this);
}
