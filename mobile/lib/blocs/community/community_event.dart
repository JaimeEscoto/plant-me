import 'package:equatable/equatable.dart';

class CommunityEvent extends Equatable {
  const CommunityEvent();

  @override
  List<Object?> get props => [];
}

class CommunityRequested extends CommunityEvent {
  const CommunityRequested();
}

class CommunitySearchRequested extends CommunityEvent {
  const CommunitySearchRequested(this.query);

  final String query;

  @override
  List<Object?> get props => [query];
}

class CommunityLikePlantRequested extends CommunityEvent {
  const CommunityLikePlantRequested(this.plantId);

  final String plantId;

  @override
  List<Object?> get props => [plantId];
}

class CommunityCommentPlantRequested extends CommunityEvent {
  const CommunityCommentPlantRequested({
    required this.plantId,
    required this.message,
  });

  final String plantId;
  final String message;

  @override
  List<Object?> get props => [plantId, message];
}
