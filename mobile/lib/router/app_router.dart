import 'package:flutter/material.dart';

import '../main.dart';
import '../screens/add_plant_screen.dart';

class AppRouter {
  Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/':
        return MaterialPageRoute(builder: (_) => const AuthGate());
      case AddPlantScreen.routeName:
        return MaterialPageRoute(builder: (_) => const AddPlantScreen());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('No encontrado')),
            body: const Center(child: Text('Ruta no encontrada')),
          ),
        );
    }
  }
}
