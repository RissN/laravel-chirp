import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from './axios';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

export const initEcho = (token: string) => {
  window.Echo = new Echo({
    broadcaster: 'reverb',
    key: 'pk_chirp_dev_key',
    wsHost: 'localhost',
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: any, _options: any) => {
      return {
        authorize: (socketId: string, callback: any) => {
          api.post('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          .then(response => {
            callback(false, response.data);
          })
          .catch(error => {
            callback(true, error);
          });
        }
      };
    },
  });

  return window.Echo;
};
