// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'comment.dart';

Comment _$CommentFromJson(Map<String, dynamic> json) => Comment(
      id: json['id'] as String,
      message: json['message'] as String,
      author: User.fromJson(json['author'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$CommentToJson(Comment instance) => <String, dynamic>{
      'id': instance.id,
      'message': instance.message,
      'author': instance.author.toJson(),
      'createdAt': instance.createdAt.toIso8601String(),
    };
