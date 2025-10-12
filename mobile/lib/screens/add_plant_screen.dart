import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../blocs/garden/garden_bloc.dart';
import '../blocs/garden/garden_event.dart';
import '../blocs/garden/garden_state.dart';

class AddPlantScreen extends StatefulWidget {
  const AddPlantScreen({super.key});

  static const routeName = '/add-plant';

  @override
  State<AddPlantScreen> createState() => _AddPlantScreenState();
}

class _AddPlantScreenState extends State<AddPlantScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _speciesController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  String? _eventTypeId;
  String? _categoryId;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final gardenBloc = context.read<GardenBloc>();
    if (gardenBloc.state.eventTypes.isEmpty ||
        gardenBloc.state.eventCategories.isEmpty) {
      gardenBloc.add(const GardenRequested());
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _speciesController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_eventTypeId == null || _categoryId == null) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(content: Text('Selecciona tipo y categoría')));
      return;
    }
    setState(() {
      _isSubmitting = true;
    });
    context.read<GardenBloc>().add(
          GardenAddPlantRequested(
            name: _nameController.text.trim(),
            species: _speciesController.text.trim(),
            eventTypeId: _eventTypeId!,
            categoryId: _categoryId!,
            plantedAt: _selectedDate,
            notes: _notesController.text.trim().isEmpty
                ? null
                : _notesController.text.trim(),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar nueva planta')),
      body: BlocConsumer<GardenBloc, GardenState>(
        listenWhen: (previous, current) => previous.status != current.status,
        listener: (context, state) {
          if (state.status == GardenStatus.failure && state.errorMessage != null) {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(content: Text(state.errorMessage!)));
            setState(() {
              _isSubmitting = false;
            });
          }
          if (state.status == GardenStatus.success && _isSubmitting) {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(const SnackBar(content: Text('Planta agregada correctamente')));
            Navigator.of(context).pop();
          }
        },
        builder: (context, state) {
          final eventTypes = state.eventTypes;
          final categories = state.eventCategories;
          final isLoading = state.status == GardenStatus.loading;
          if ((eventTypes.isEmpty || categories.isEmpty) && isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (eventTypes.isEmpty || categories.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No hay información disponible para registrar plantas.'),
              ),
            );
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Nombre de la planta'),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Ingresa un nombre';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _speciesController,
                    decoration: const InputDecoration(labelText: 'Especie'),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Ingresa la especie';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _eventTypeId,
                    items: eventTypes
                        .map(
                          (eventType) => DropdownMenuItem(
                            value: eventType.id,
                            child: Text(eventType.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() => _eventTypeId = value),
                    decoration: const InputDecoration(labelText: 'Tipo de evento'),
                    validator: (value) => value == null ? 'Selecciona un tipo' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _categoryId,
                    items: categories
                        .map(
                          (category) => DropdownMenuItem(
                            value: category.id,
                            child: Text(category.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() => _categoryId = value),
                    decoration: const InputDecoration(labelText: 'Categoría'),
                    validator: (value) => value == null ? 'Selecciona una categoría' : null,
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Fecha de siembra'),
                    subtitle: Text('${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}'),
                    trailing: IconButton(
                      icon: const Icon(Icons.calendar_today),
                      onPressed: _pickDate,
                    ),
                  ),
                  TextFormField(
                    controller: _notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notas (opcional)',
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: isLoading ? null : _submit,
                      icon: const Icon(Icons.save),
                      label: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Guardar'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
