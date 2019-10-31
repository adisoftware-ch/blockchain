import * as io from 'socket.io-client';

export interface SocketConfig {
  dataProvider: {
    secure: boolean;
    socketurl: string;
    secureconfig?: {
      ca: string;
      secure: boolean;
      rejectUnauthorized: boolean;
      agent: boolean;
    }
  };
}

export class SocketUtil {

    public static connect(config: SocketConfig): SocketIOClient.Socket {
        if (config.dataProvider.secure) {
            console.log('initiating secure connection:', config.dataProvider.socketurl);

            // get certificate from file
            fetch(config.dataProvider.secureconfig.ca).then(result => {
                result.text().then(cert => {
                    console.log('certificate found: ' + cert);

                    // replace cert path with real content of cert
                    config.dataProvider.secureconfig.ca = cert;

                    // connect using wss protocol
                    return io.connect(config.dataProvider.socketurl, config.dataProvider.secureconfig);
                });
            });
        } else {
            console.warn('initiating non-secure connection:', config.dataProvider.socketurl);
            console.warn('do not use in production environment!')
            // connect using ws protocol
            return io.connect(config.dataProvider.socketurl);
        }
    }

}
