'use strict'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const Notifications = "Notifications";
const Users = "Users";

exports.sendNotification = functions.database.ref(`/${Notifications}/{user_id}/{notification_id}`)
.onWrite((change, context) => {

    const userId = context.params.user_id;
    const notification_id  = context.params.notification_id;

    console.log('New notification need to send to: ', userId);
    
    const afterData=change.after.val();
    if (!afterData) {
        return console.log('A notification has been deleted from database: ', notification_id);
    }

    const fromUser = admin.database().ref(`/${Notifications}/${userId}/${notification_id}`).once('value');
    return fromUser.then(fromUserResult => {

        const from_user_id = fromUserResult.val().from;
        console.log('A new notification from ', from_user_id)

        const userQuery = admin.database().ref(`${Users}/${from_user_id}/name`).once('value')
        const deviceToken = admin.database().ref(`/${Users}/${userId}/device_token_id`).once('value')
        const notificationType = admin.database().ref(`/${Notifications}/${userId}/${notification_id}/type`).once('value')

        return Promise.all([userQuery, deviceToken, notificationType]).then(result => {

            const userName = result[0].val();
            const tokenId = result[1].val();
            const type = result[2].val();

            if (type === 'request') {

                const payload = {
                    notification: {
                        title: "New Friend Request",
                        body: `Friend request sent from ${userName}.`,
                        icon: "default",
                    }, 
                    data: {
                        from_user: from_user_id,
                        type: "request",
                    }
                }
                
                return admin.messaging().sendToDevice(tokenId, payload).then(function(response) {
                    console.log('Notification sent successfully.', response);
                }).catch((error) => {
                    console.log('Error! Notification not sent.', error);
                });

            } else if (type === 'chat') {

                const payload = {
                    notification: {
                        title: "New message received",
                        body: `Message from ${userName}.`,
                        icon: "default",
                    }, 
                    data: {
                        from_user: from_user_id,
                        type: "chat",
                    }
                }
                
                return admin.messaging().sendToDevice(tokenId, payload).then(function(response) {
                    console.log('Notification sent successfully.', response);
                }).catch((error) => {
                    console.log('Error! Notification not sent.', error);
                });

            }

        });
        
    });

});
