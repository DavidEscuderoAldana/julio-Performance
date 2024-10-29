import { Order, Product, Restaurant, User } from '../models/models.js'

const listOrders = async function (req, res) {
  try {
    const restaurantId = req.params.restaurantId

    const restaurant = await Restaurant.findOne({
      where: { id: restaurantId, userId: req.user.id }
    })
    if (!restaurant) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const orders = await Order.findAll({
      where: { restaurantId },
      include: [{ model: User, as: 'user' }, { model: Product, as: 'products' }],
      order: [
        ['currentStatus', 'ASC'],
        ['createdAt', 'ASC']
      ]
    })

    res.json(orders)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

const advanceOrderStatus = async function (req, res) {
  try {
    const orderId = req.params.orderId
    const order = await Order.findByPk(orderId)

    if (!order || order.restaurantId !== req.body.restaurantId) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const success = await order.advanceStatus()
    if (!success) {
      return res.status(400).json({ message: 'Unable to advance order status' })
    }

    res.json(order)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

const revertOrderStatus = async function (req, res) {
  try {
    const orderId = req.params.orderId
    const order = await Order.findByPk(orderId)

    if (!order || order.restaurantId !== req.body.restaurantId) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (!order.canRevertStatus()) {
      return res.status(400).json({ message: 'Cannot revert order status' })
    }

    const success = await order.revertStatus()
    if (!success) {
      return res.status(400).json({ message: 'Unable to revert order status' })
    }

    res.json(order)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

const OrderController = {
  listOrders,
  advanceOrderStatus,
  revertOrderStatus
}
export default OrderController
