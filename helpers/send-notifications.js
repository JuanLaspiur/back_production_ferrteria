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
    const response = await fetch('https://micro-services-ferreteria-notifications.onrender.com/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expoPushToken,
        title,
        body,
      }),
    });

    if (response.ok) {
      console.log('Notification sent successfully');
    } else {
      const errorData = await response.json();
      console.error('Error sending push notification:', response.status, response.statusText, errorData);
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
      await sendPushNotification(seller.expoPushToken, 'Demand nearby', 'A user near you is requesting a quote for products');
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
