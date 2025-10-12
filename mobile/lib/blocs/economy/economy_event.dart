import 'package:equatable/equatable.dart';

class EconomyEvent extends Equatable {
  const EconomyEvent();

  @override
  List<Object?> get props => [];
}

class EconomyRequested extends EconomyEvent {
  const EconomyRequested();
}

class EconomyBuyAccessoryRequested extends EconomyEvent {
  const EconomyBuyAccessoryRequested(this.accessoryId);

  final String accessoryId;

  @override
  List<Object?> get props => [accessoryId];
}

class EconomySellAccessoryRequested extends EconomyEvent {
  const EconomySellAccessoryRequested(this.accessoryId);

  final String accessoryId;

  @override
  List<Object?> get props => [accessoryId];
}
