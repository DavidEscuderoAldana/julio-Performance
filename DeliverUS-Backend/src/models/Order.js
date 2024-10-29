import moment from 'moment'
import { Model } from 'sequelize'

const loadModel = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate (models) {
      const OrderProducts = sequelize.define('OrderProducts', {
        quantity: DataTypes.INTEGER,
        unityPrice: DataTypes.DOUBLE
      })

      Order.belongsTo(models.Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' })
      Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
      Order.belongsToMany(models.Product, { as: 'products', through: OrderProducts, onDelete: 'cascade' })
    }

    getStatus () {
      if (this.deliveredAt) return 'delivered'
      if (this.sentAt) return 'sent'
      if (this.startedAt) return 'in process'
      return 'pending'
    }

    canRevertStatus () {
      return moment().diff(moment(this.updatedAt), 'minutes') <= 5
    }

    async advanceStatus () {
      const nextStatusMap = {
        pending: 'in process',
        'in process': 'sent',
        sent: 'delivered'
      }

      const nextStatus = nextStatusMap[this.currentStatus]
      if (!nextStatus) return false

      return sequelize.transaction(async (t) => {
        this.currentStatus = nextStatus
        if (nextStatus === 'in process') this.startedAt = new Date()
        if (nextStatus === 'sent') this.sentAt = new Date()
        if (nextStatus === 'delivered') this.deliveredAt = new Date()

        await this.save({ transaction: t })
        return true
      })
    }

    async revertStatus () {
      if (!this.canRevertStatus()) return false

      const previousStatusMap = {
        'in process': 'pending',
        sent: 'in process',
        delivered: 'sent'
      }

      const previousStatus = previousStatusMap[this.currentStatus]
      if (!previousStatus) return false

      return sequelize.transaction(async (t) => {
        this.currentStatus = previousStatus
        if (previousStatus === 'pending') this.startedAt = null
        if (previousStatus === 'in process') this.sentAt = null
        if (previousStatus === 'sent') this.deliveredAt = null

        await this.save({ transaction: t })
        return true
      })
    }
  }

  Order.init({
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    startedAt: DataTypes.DATE,
    sentAt: DataTypes.DATE,
    deliveredAt: DataTypes.DATE,
    price: DataTypes.DOUBLE,
    address: DataTypes.STRING,
    shippingCosts: DataTypes.DOUBLE,
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    currentStatus: {
      type: DataTypes.ENUM('pending', 'in process', 'sent', 'delivered'),
      defaultValue: 'pending'
    },
    status: {
      type: DataTypes.VIRTUAL,
      get () {
        return this.currentStatus || this.getStatus()
      }
    }
  }, {
    sequelize,
    modelName: 'Order',
    timestamps: true
  })

  return Order
}

export default loadModel
