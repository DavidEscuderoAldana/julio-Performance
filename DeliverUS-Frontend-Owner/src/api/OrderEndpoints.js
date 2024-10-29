import axios from 'axios'

export const getOrdersByRestaurant = async (restaurantId) => {
  const response = await axios.get(`${process.env.API_BASE_URL}/restaurants/${restaurantId}/orders`)
  return response.data
}

export const advanceOrderStatus = async (orderId) => {
  const response = await axios.put(`/orders/${orderId}/advance`)
  return response.data
}

export const revertOrderStatus = async (orderId) => {
  const response = await axios.put(`/orders/${orderId}/revert`)
  return response.data
}
