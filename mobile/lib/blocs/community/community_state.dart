import 'package:equatable/equatable.dart';

import '../../models/comment.dart';
import '../../models/user.dart';

enum CommunityStatus { initial, loading, success, failure }

class CommunityState extends Equatable {
  const CommunityState({
    this.status = CommunityStatus.initial,
    this.friends = const [],
    this.searchResults = const [],
    this.recentComment,
    this.errorMessage,
  });

  final CommunityStatus status;
  final List<User> friends;
  final List<User> searchResults;
  final Comment? recentComment;
  final String? errorMessage;

  CommunityState copyWith({
    CommunityStatus? status,
    List<User>? friends,
    List<User>? searchResults,
    Comment? recentComment,
    String? errorMessage,
  }) {
    return CommunityState(
      status: status ?? this.status,
      friends: friends ?? this.friends,
      searchResults: searchResults ?? this.searchResults,
      recentComment: recentComment,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, friends, searchResults, recentComment, errorMessage];
}
