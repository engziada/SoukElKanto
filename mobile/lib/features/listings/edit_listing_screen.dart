import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/i18n/app_locale.dart';
import '../../core/i18n/l10n_helper.dart';
import '../../core/listings/listings_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Edit listing screen — pre-filled multi-step wizard for editing an existing listing.
class EditListingScreen extends ConsumerStatefulWidget {
  const EditListingScreen({super.key, required this.listingId});

  final String listingId;

  @override
  ConsumerState<EditListingScreen> createState() => _EditListingScreenState();
}

class _EditListingScreenState extends ConsumerState<EditListingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _districtController = TextEditingController();

  String? _selectedCategory;
  String _selectedCondition = 'GOOD';
  final List<XFile> _pickedPhotos = [];
  bool _submitting = false;
  bool _loading = true;
  bool _deleting = false;
  bool _showDeleteConfirm = false;
  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    // ignore: discarded_futures
    _loadListing();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _districtController.dispose();
    super.dispose();
  }

  Future<void> _loadListing() async {
    try {
      final api = ref.read(apiClientProvider);
      final listing = await api.getListing(widget.listingId);
      if (mounted) {
        _titleController.text = listing.title;
        _descriptionController.text = listing.description ?? '';
        _priceController.text = listing.askingPrice.toString();
        _districtController.text = listing.district;
        setState(() {
          _selectedCategory = listing.category;
          _selectedCondition = listing.condition;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.createLoadError),
            backgroundColor: AppColors.coral,
          ),
        );
      }
    }
  }

  Future<void> _pickPhotos() async {
    final picker = ImagePicker();
    final photos = await picker.pickMultiImage(
      imageQuality: 80,
      maxWidth: 1080,
    );
    if (photos.isNotEmpty) {
      setState(() => _pickedPhotos.addAll(photos));
    }
  }

  void _removePhoto(int index) {
    setState(() => _pickedPhotos.removeAt(index));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.createErrorCategory),
          backgroundColor: AppColors.coral,
        ),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final api = ref.read(apiClientProvider);

      // Upload new photos and collect r2Keys
      final photoInputs = <({String r2Key, int position})>[];
      for (var i = 0; i < _pickedPhotos.length; i++) {
        final file = _pickedPhotos[i];
        final bytes = await file.readAsBytes();
        final filename = file.name;
        final contentType = file.mimeType ?? 'image/jpeg';

        final r2Key = await api.uploadPhoto(
          filename: filename,
          bytes: bytes,
          contentType: contentType,
        );
        photoInputs.add((r2Key: r2Key, position: i));
      }

      // Update listing
      await api.updateListing(
        id: widget.listingId,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        category: _selectedCategory,
        condition: _selectedCondition,
        askingPrice: int.parse(_priceController.text.trim()),
        district: _districtController.text.trim(),
        photos: photoInputs,
      );

      // Invalidate caches
      ref.invalidate(myListingsProvider);
      ref.invalidate(listingByIdProvider(widget.listingId));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.createSaveChanges),
            backgroundColor: AppColors.mint,
          ),
        );
        context.go('/listings/${widget.listingId}');
      }
    } catch (e) {
      final api = ref.read(apiClientProvider);
      final err = api.extractError(e);
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err.message),
            backgroundColor: AppColors.coral,
          ),
        );
      }
    }
  }

  Future<void> _deleteListing() async {
    setState(() => _deleting = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.deleteListing(widget.listingId);
      ref.invalidate(myListingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.createDeleteConfirmYes),
            backgroundColor: AppColors.mint,
          ),
        );
        context.go('/my');
      }
    } catch (e) {
      final api = ref.read(apiClientProvider);
      final err = api.extractError(e);
      if (mounted) {
        setState(() => _deleting = false);
        _showDeleteConfirm = false;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err.message),
            backgroundColor: AppColors.coral,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final l = context.l10n;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(l.createEditTitle)),
        body: const LoadingIndicator(),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(l.createEditTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppColors.coral),
            onPressed: () => setState(() => _showDeleteConfirm = true),
            tooltip: l.createDeleteListing,
          ),
        ],
      ),
      body: _submitting
          ? LoadingIndicator(message: l.createPublishing)
          : _showDeleteConfirm
              ? _buildDeleteConfirm(context)
              : Form(
                  key: _formKey,
                  child: Stepper(
                    currentStep: _currentStep,
                    onStepContinue: () {
                      if (_currentStep < 2) {
                        setState(() => _currentStep++);
                      } else {
                        // ignore: discarded_futures
                        _submit();
                      }
                    },
                    onStepCancel: () {
                      if (_currentStep > 0) {
                        setState(() => _currentStep--);
                      } else {
                        context.pop();
                      }
                    },
                    onStepTapped: (step) =>
                        setState(() => _currentStep = step),
                    controlsBuilder: (context, details) {
                      return Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Row(
                          children: [
                            FilledButton(
                              onPressed: details.onStepContinue,
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.coral,
                                foregroundColor: AppColors.warmWhite,
                              ),
                              child: Text(
                                _currentStep < 2
                                    ? l.createNext
                                    : l.createSaveChanges,
                              ),
                            ),
                            const SizedBox(width: 8),
                            TextButton(
                              onPressed: details.onStepCancel,
                              child: Text(
                                _currentStep > 0
                                    ? l.createBack
                                    : l.createCancel,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                    steps: [
                      // Step 1: Basic info
                      Step(
                        title: Text(l.createStepDetails),
                        content: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TextFormField(
                              controller: _titleController,
                              decoration: InputDecoration(
                                labelText: l.createLabelTitle,
                                border: const OutlineInputBorder(),
                              ),
                              validator: (v) => v == null || v.trim().isEmpty
                                  ? l.createErrorRequired
                                  : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _descriptionController,
                              maxLines: 4,
                              decoration: InputDecoration(
                                labelText: l.createLabelDescription,
                                border: const OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Category dropdown
                            categoriesAsync.when(
                              data: (categories) =>
                                  DropdownButtonFormField<String>(
                                // ignore: deprecated_member_use
                                value: _selectedCategory,
                                decoration: InputDecoration(
                                  labelText: l.filterCategory,
                                  border: const OutlineInputBorder(),
                                ),
                                items: categories
                                    .map((c) => DropdownMenuItem(
                                          value: c.value,
                                          child: Text(AppLocale.isArabic(
                                                  Localizations.localeOf(
                                                      context))
                                              ? c.labelAr
                                              : c.labelEn),
                                        ))
                                    .toList(),
                                onChanged: (v) =>
                                    setState(() => _selectedCategory = v),
                              ),
                              loading: () =>
                                  const LinearProgressIndicator(),
                              error: (_, _) => Text(l.errorGeneric),
                            ),
                            const SizedBox(height: 12),
                            // Condition dropdown
                            DropdownButtonFormField<String>(
                              // ignore: deprecated_member_use
                              value: _selectedCondition,
                              decoration: InputDecoration(
                                labelText: l.createLabelCondition,
                                border: const OutlineInputBorder(),
                              ),
                              items: [
                                DropdownMenuItem(
                                    value: 'NEW_WITH_TAGS',
                                    child: Text(l.condNewWithTags)),
                                DropdownMenuItem(
                                    value: 'LIKE_NEW',
                                    child: Text(l.condLikeNew)),
                                DropdownMenuItem(
                                    value: 'GOOD', child: Text(l.condGood)),
                                DropdownMenuItem(
                                    value: 'FAIR', child: Text(l.condFair)),
                                DropdownMenuItem(
                                    value: 'NEEDS_REPAIR',
                                    child: Text(l.condNeedsRepair)),
                              ],
                              onChanged: (v) => setState(
                                  () => _selectedCondition = v ?? 'GOOD'),
                            ),
                          ],
                        ),
                        isActive: _currentStep >= 0,
                      ),
                      // Step 2: Price & Location
                      Step(
                        title: Text(l.createStepPrice),
                        content: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TextFormField(
                              controller: _priceController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: l.createLabelPrice,
                                border: const OutlineInputBorder(),
                                prefixIcon:
                                    const Icon(Icons.payments_outlined),
                              ),
                              validator: (v) {
                                if (v == null || v.trim().isEmpty) {
                                  return l.createErrorRequired;
                                }
                                final price = int.tryParse(v.trim());
                                if (price == null || price < 0) {
                                  return l.createErrorPrice;
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _districtController,
                              decoration: InputDecoration(
                                labelText: l.createLabelDistrict,
                                border: const OutlineInputBorder(),
                                prefixIcon:
                                    const Icon(Icons.location_on_outlined),
                              ),
                              validator: (v) => v == null || v.trim().isEmpty
                                  ? l.createErrorRequired
                                  : null,
                            ),
                          ],
                        ),
                        isActive: _currentStep >= 1,
                      ),
                      // Step 3: Photos (new photos only — existing photos
                      // are kept server-side unless replaced)
                      Step(
                        title: Text(l.createStepPhotos),
                        content: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_pickedPhotos.isEmpty)
                              InkWell(
                                onTap: _pickPhotos,
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(32),
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: AppColors.border,
                                      style: BorderStyle.solid,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      const Icon(
                                          Icons.add_photo_alternate_outlined,
                                          size: 48,
                                          color: AppColors.dustyCloud),
                                      const SizedBox(height: 8),
                                      Text(l.createPhotoDrop),
                                    ],
                                  ),
                                ),
                              )
                            else
                              GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  mainAxisSpacing: 8,
                                  crossAxisSpacing: 8,
                                ),
                                itemCount: _pickedPhotos.length + 1,
                                itemBuilder: (context, index) {
                                  if (index == _pickedPhotos.length) {
                                    return InkWell(
                                      onTap: _pickPhotos,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          border: Border.all(
                                              color: AppColors.border),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.add,
                                            color: AppColors.dustyCloud),
                                      ),
                                    );
                                  }
                                  return Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius:
                                            BorderRadius.circular(8),
                                        child: Image.file(
                                          File(_pickedPhotos[index].path),
                                          fit: BoxFit.cover,
                                          width: double.infinity,
                                          height: double.infinity,
                                        ),
                                      ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: GestureDetector(
                                          onTap: () => _removePhoto(index),
                                          child: Container(
                                            padding: const EdgeInsets.all(4),
                                            decoration: const BoxDecoration(
                                              color: Colors.black54,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(Icons.close,
                                                size: 14,
                                                color: Colors.white),
                                          ),
                                        ),
                                      ),
                                    ],
                                  );
                                },
                              ),
                          ],
                        ),
                        isActive: _currentStep >= 2,
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildDeleteConfirm(BuildContext context) {
    final l = context.l10n;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.warning_amber_rounded,
              size: 64, color: AppColors.coral),
          const SizedBox(height: 16),
          Text(
            l.createDeleteConfirmTitle,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            l.createDeleteConfirmMessage,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              FilledButton(
                onPressed: _deleting
                    ? null
                    // ignore: discarded_futures
                    : () => _deleteListing(),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.coral,
                  foregroundColor: AppColors.warmWhite,
                ),
                child: _deleting
                    ? Text(l.createDeleting)
                    : Text(l.createDeleteConfirmYes),
              ),
              OutlinedButton(
                onPressed: _deleting
                    ? null
                    : () => setState(() => _showDeleteConfirm = false),
                child: Text(l.createDeleteConfirmNo),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
