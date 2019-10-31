export const environment = {
  production: true,
  dataProvider: {
    secure            : true,
    socketurl         : 'wss://localhost:3000',
    secureconfig      : {
      ca: '../assets/cert.pem',
      secure: true,
      rejectUnauthorized: false,
      agent: false
    }
  }
};
