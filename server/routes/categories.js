import express from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route   GET /api/categories
// @desc    Get all categories for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id })
      .sort({ order: 1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private
router.post('/', [
  protect,
  body('name').trim().notEmpty().withMessage('Category name is required')
], validate, async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    // Get max order for the user
    const maxOrderCategory = await Category.findOne({ user: req.user._id }).sort({ order: -1 });
    const order = maxOrderCategory ? maxOrderCategory.order + 1 : 0;

    const category = await Category.create({
      user: req.user._id,
      name,
      color: color || '#6366f1',
      icon: icon || 'folder',
      order
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check ownership
    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, color, icon, order } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, color, icon, order },
      { new: true, runValidators: true }
    );

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check ownership
    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update tasks that use this category
    const Task = (await import('../models/Task.js')).default;
    await Task.updateMany(
      { category: req.params.id },
      { $unset: { category: 1 } }
    );

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/categories/reorder
// @desc    Reorder categories
// @access  Private
router.put('/reorder', [
  protect,
  body('categories').isArray().withMessage('Categories array is required')
], validate, async (req, res) => {
  try {
    const { categories } = req.body;

    // Update order for each category
    for (const item of categories) {
      await Category.findOneAndUpdate(
        { _id: item.id, user: req.user._id },
        { order: item.order }
      );
    }

    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

