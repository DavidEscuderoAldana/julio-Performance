import { check } from 'express-validator'
import models from '../models'
// Ajusta la ruta a tus modelos según tu proyecto

const create = [
  // Validar que `restaurantId` exista y sea un entero válido
  check('restaurantId')
    .exists({ checkNull: true }).withMessage('restaurantId is required')
    .isInt({ gt: 0 }).withMessage('restaurantId must be a positive integer')
    .bail()
    .custom(async (value) => {
      const restaurant = await models.Restaurant.findByPk(value)
      if (!restaurant) {
        throw new Error('Restaurant not found')
      }
    }),

  // Validar que `products` sea un array no vacío
  check('products')
    .exists().withMessage('Products are required')
    .isArray({ min: 1 }).withMessage('Products should be a non-empty array'),

  // Validar `productId` y `quantity` en cada producto dentro del array `products`
  check('products.*.productId')
    .exists().withMessage('Each product must have a productId')
    .isInt({ gt: 0 }).withMessage('productId must be a positive integer'),
  check('products.*.quantity')
    .exists().withMessage('Each product must have a quantity')
    .isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),

  // Validar que todos los productos pertenecen al mismo restaurante y están disponibles
  check('products').custom(async (products, { req }) => {
    const restaurantId = req.body.restaurantId
    const productIds = products.map((p) => p.productId)

    // Consultar productos en la base de datos
    const foundProducts = await models.Product.findAll({
      where: { id: productIds, restaurantId }
    })

    if (foundProducts.length !== products.length) {
      throw new Error('Some products are unavailable or do not belong to the restaurant')
    }
  })
]

const update = [
  check('restaurantId')
    .not().exists().withMessage('restaurantId cannot be updated'),

  check('products')
    .exists().withMessage('Products are required')
    .isArray({ min: 1 }).withMessage('Products should be a non-empty array'),

  check('products.*.productId')
    .exists().withMessage('Each product must have a productId')
    .isInt({ gt: 0 }).withMessage('productId must be a positive integer'),
  check('products.*.quantity')
    .exists().withMessage('Each product must have a quantity')
    .isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),

  check('products').custom(async (products, { req }) => {
    const orderId = req.params.id
    const order = await models.Order.findByPk(orderId, { include: 'restaurant' })
    if (!order) {
      throw new Error('Order not found')
    }

    if (order.currentStatus !== 'pending') {
      throw new Error('Only orders in pending status can be updated')
    }

    const productIds = products.map((p) => p.productId)

    const foundProducts = await models.Product.findAll({
      where: { id: productIds, restaurantId: order.restaurantId }
    })

    if (foundProducts.length !== products.length) {
      throw new Error('Some products are unavailable or do not belong to the original restaurant')
    }
  })
]

export { create, update }
//
