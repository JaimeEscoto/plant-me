import 'package:equatable/equatable.dart';

import '../../models/economy_summary.dart';

enum EconomyStatus { initial, loading, success, failure }

class EconomyState extends Equatable {
  const EconomyState({
    this.status = EconomyStatus.initial,
    this.summary,
    this.errorMessage,
  });

  final EconomyStatus status;
  final EconomySummary? summary;
  final String? errorMessage;

  EconomyState copyWith({
    EconomyStatus? status,
    EconomySummary? summary,
    String? errorMessage,
  }) {
    return EconomyState(
      status: status ?? this.status,
      summary: summary ?? this.summary,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, summary, errorMessage];
}
