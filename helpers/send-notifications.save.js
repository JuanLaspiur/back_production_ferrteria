const { User } = require('../models');
require('dotenv').config(); 
const { Notifications } = require('expo');


async function sendPushNotification(expoPushToken, title, body) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
      },
      trigger: null, // Envía la notificación inmediatamente
      channelId: 'default', // Canal predeterminado de notificación
    });
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

async function sendDemandNotification(location) {
    try {
      // Obtén la lista de usuarios vendedores dentro de un radio de 15 km de la ubicación
      const sellers = await User.find({
        role: 'SELLER_ROLE', // Filtra solo a los vendedores
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(location.coordinates[1]), parseFloat(location.coordinates[0])], // Revisa el orden de las coordenadas si es necesario
            },
            $maxDistance: process.env.SEARCH_RADIUS || 15000, // 15 km en metros
          },
        },
      });
  
    console.log('Cordenadas 0 ' + location.coordinates[0] + '  1 ' + location.coordinates[1])
  
      console.log(sellers, '  vendedores ')
  
      // Envía notificaciones a cada vendedor encontrado
      sellers.forEach(async (seller) => {
        await sendPushNotification(seller.expoPushToken, 'Demanda cerca tuyo', 'Un usuario cerca tuyo pide un presupuesto de productos');
      });
  
      console.log('Notificaciones enviadas con éxito a los vendedores cercanos.');
    } catch (error) {
      console.error('Error al enviar las notificaciones:', error);
    }
  }
  
  
  async function sendMessageNotification(recipientId, title, body) {
    try {
      const recipient = await User.findById(recipientId);
      if (!recipient || !recipient.expoPushToken) {
        console.error('Usuario no encontrado o expoPushToken no disponible');
        return;
      }
  
      // Envía la notificación push al expoPushToken del destinatario
      await sendPushNotification(recipient.expoPushToken, title, body);
    } catch (error) {
      console.error('Error al enviar la notificación push:', error);
    }
  }
  
  
  module.exports = {
    sendPushNotification,
    sendDemandNotification,
    sendMessageNotification
  };