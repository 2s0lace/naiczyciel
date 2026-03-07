const http = require('http');
http.get('http://127.0.0.1:8080/scripts.js', (res) => {
  console.log('scripts.js HTTP status:', res.statusCode);
});
