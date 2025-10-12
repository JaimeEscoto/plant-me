import 'package:json_annotation/json_annotation.dart';

import 'user.dart';

part 'comment.g.dart';

@JsonSerializable(explicitToJson: true)
class Comment {
  const Comment({
    required this.id,
    required this.message,
    required this.author,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) => _$CommentFromJson(json);

  final String id;
  final String message;
  final User author;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => _$CommentToJson(this);
}
