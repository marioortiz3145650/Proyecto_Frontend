// Producción: todas las llamadas salen relativas a "/api".
// Requiere un reverse proxy (nginx, etc.) que reescriba "/api" -> "http://<host-backend>:3000".
// Ejemplo nginx:  location /api/ { rewrite ^/api/(.*)$ /$1 break; proxy_pass http://localhost:3000; }
export const environment = {
  production: true,
  apiUrl: '/api'
};
