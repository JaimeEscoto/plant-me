import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/community/community_bloc.dart';
import '../blocs/community/community_event.dart';
import '../blocs/community/community_state.dart';
import '../blocs/economy/economy_bloc.dart';
import '../blocs/economy/economy_event.dart';
import '../blocs/economy/economy_state.dart';
import '../blocs/garden/garden_bloc.dart';
import '../blocs/garden/garden_event.dart';
import '../blocs/garden/garden_state.dart';
import '../models/accessory.dart';
import '../models/plant.dart';
import 'add_plant_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(BuildContext context) async {
    context.read<GardenBloc>().add(const GardenRequested());
    context.read<EconomyBloc>().add(const EconomyRequested());
    context.read<CommunityBloc>().add(const CommunityRequested());
  }

  void _logout(BuildContext context) {
    context.read<AuthBloc>().add(const AuthLogoutRequested());
  }

  void _openAddPlant(BuildContext context) {
    Navigator.of(context).pushNamed(AddPlantScreen.routeName);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tu jardín'),
        actions: [
          IconButton(
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
          )
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddPlant(context),
        icon: const Icon(Icons.add),
        label: const Text('Nueva planta'),
      ),
      body: RefreshIndicator(
        onRefresh: () => _refresh(context),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            BlocBuilder<GardenBloc, GardenState>(
              builder: (context, state) {
                if (state.status == GardenStatus.loading && state.garden == null) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state.status == GardenStatus.failure) {
                  return _ErrorCard(
                    message: state.errorMessage ?? 'No fue posible cargar el jardín',
                    onRetry: () => context.read<GardenBloc>().add(const GardenRequested()),
                  );
                }
                final garden = state.garden;
                if (garden == null) {
                  return const _InfoCard(title: 'Aún no tienes plantas registradas');
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Salud general: ${(garden.healthScore * 100).toStringAsFixed(0)}%',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: garden.plants
                          .map((plant) => _PlantChip(plant: plant))
                          .toList(),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Accesorios instalados',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    if (garden.accessories.isEmpty)
                      const Text('Sin accesorios por ahora')
                    else
                      Wrap(
                        spacing: 8,
                        children: garden.accessories
                            .map((acc) => Chip(label: Text(acc.name)))
                            .toList(),
                      ),
                  ],
                );
              },
            ),
            const SizedBox(height: 24),
            BlocBuilder<EconomyBloc, EconomyState>(
              builder: (context, state) {
                if (state.status == EconomyStatus.loading && state.summary == null) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state.status == EconomyStatus.failure) {
                  return _ErrorCard(
                    message: state.errorMessage ?? 'No fue posible cargar la economía',
                    onRetry: () => context.read<EconomyBloc>().add(const EconomyRequested()),
                  );
                }
                final summary = state.summary;
                if (summary == null) {
                  return const _InfoCard(title: 'Sin información económica disponible');
                }
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Semillas disponibles: ${summary.seedBalance}',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 12),
                        Text('Accesorios', style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 8),
                        if (summary.ownedAccessories.isEmpty)
                          const Text('No tienes accesorios en inventario')
                        else
                          Column(
                            children: summary.ownedAccessories
                                .map(
                                  (Accessory accessory) => ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    title: Text(accessory.name),
                                    subtitle: Text(accessory.description),
                                    trailing: Text('x${accessory.quantity}'),
                                  ),
                                )
                                .toList(),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            BlocBuilder<CommunityBloc, CommunityState>(
              builder: (context, state) {
                if (state.status == CommunityStatus.loading && state.friends.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state.status == CommunityStatus.failure) {
                  return _ErrorCard(
                    message: state.errorMessage ?? 'Error al cargar la comunidad',
                    onRetry: () => context.read<CommunityBloc>().add(const CommunityRequested()),
                  );
                }
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text('Amigos',
                                  style: Theme.of(context).textTheme.titleMedium),
                            ),
                            IconButton(
                              onPressed: () => context
                                  .read<CommunityBloc>()
                                  .add(const CommunityRequested()),
                              icon: const Icon(Icons.refresh),
                              tooltip: 'Actualizar amigos',
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (state.friends.isEmpty)
                          const Text('Invita a tus amigos para compartir tus plantas')
                        else
                          Column(
                            children: state.friends
                                .map(
                                  (friend) => ListTile(
                                    leading: CircleAvatar(
                                      child: Text(
                                        friend.name.isNotEmpty
                                            ? friend.name[0].toUpperCase()
                                            : '?',
                                      ),
                                    ),
                                    title: Text(friend.name),
                                    subtitle: Text(friend.email),
                                  ),
                                )
                                .toList(),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _PlantChip extends StatelessWidget {
  const _PlantChip({required this.plant});

  final Plant plant;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: const Icon(Icons.spa, size: 18),
      label: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(plant.name, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text('Likes: ${plant.likes}'),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(child: Text(message)),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      ),
    );
  }
}
