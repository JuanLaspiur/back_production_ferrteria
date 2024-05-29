const axios = require('axios');
const { User } = require('../models');
require('dotenv').config();

async function sendPushNotification(expoPushToken, title, body) {
  const message = {
    to: expoPushToken,
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    // Small push notification service
    const response = await axios.post('https://micro-services-ferreteria-notifications.onrender.com/api/send-notification', {
      expoPushToken,
      title,
      body,
    });

    if (response.status === 200) {
      console.log('Notification sent successfully');
    } else {
      console.error('Error sending push notification:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

async function sendDemandNotification(location) {
  try {
    const sellers = await User.find({
      role: 'SELLER_ROLE',
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(location.coordinates[1]), parseFloat(location.coordinates[0])],
          },
          $maxDistance: process.env.SEARCH_RADIUS || 15000,
        },
      },
    });

    console.log('Coordinates 0:', location.coordinates[0], '1:', location.coordinates[1]);
    console.log(sellers, 'sellers found');

    sellers.forEach(async (seller) => {
      await sendPushNotification(seller.expoPushToken, 'Demanda cercana', 'Un usuario cerca de ti está solicitando un presupuesto para productos');

    });

    console.log('Notifications successfully sent to nearby sellers.');
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

async function sendMessageNotification(recipientId, title, body) {
  try {
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.expoPushToken) {
      console.error('User not found or expoPushToken not available');
      return;
    }

    await sendPushNotification(recipient.expoPushToken, title, body);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

module.exports = {
  sendPushNotification,
  sendDemandNotification,
  sendMessageNotification,
};

