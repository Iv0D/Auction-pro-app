# AuctionPro · TPO DA1

Plataforma de subastas con frontend Expo para web, Android e iOS, y una API Spring Boot con MySQL. El repo incluye los dos proyectos y la configuración para probarlos juntos en local.

## Arranque local

Con Docker y Docker Compose, ejecutá desde la raíz:

```sh
docker compose up --build -d --wait
```

- [AuctionPro web](http://localhost:8081)
- [API de subastas](http://localhost:8080/auctions)
- [Mailpit](http://localhost:8025) para recibir los correos de activación y recuperación

La web usa `/api` en el mismo origen. Nginx enruta tanto las llamadas REST como la conexión WebSocket a Spring Boot. MySQL guarda los datos en un volumen y Compose carga un empleado verificador para habilitar el registro desde una base vacía.

Para ver los logs, usá `docker compose logs -f`. Para detener los servicios y conservar los datos, usá `docker compose down`. Si alguno de los puertos está ocupado, podés configurar `WEB_PORT`, `API_PORT` o `MAIL_WEB_PORT` en un archivo `.env` en la raíz.

## Probar el alta de una cuenta

1. Registrá una cuenta de prueba desde la web con imágenes ficticias para el DNI.
2. Obtené su identificador de cliente por correo en la base local. Reemplazá `prueba@example.test` por el correo usado en el registro.

   ```sh
   docker compose exec db sh -c 'mysql -u "$MYSQL_USER" --password="$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
   ```

   ```sql
   SELECT cliente_id FROM users WHERE email = 'prueba@example.test';
   ```

3. Aprobá el alta con la API administrativa existente. Reemplazá `1` por el identificador devuelto.

   ```sh
   curl -fsS -X POST http://localhost:8080/admin/clients/1/approve
   ```

4. Abrí el correo en Mailpit y seguí el enlace para crear la contraseña. Ahora podés iniciar sesión y usar las funciones que requieren una cuenta.

La base local empieza sin subastas. Los datos del servidor original se incorporan mediante un volcado MySQL autorizado. El streaming de vídeo depende del servicio externo referenciado por el backend. El stack de Compose está destinado al desarrollo local y conserva los endpoints administrativos del proyecto original, que requieren una capa de autorización antes de una exposición pública.

## Desarrollo del frontend

Con Node.js 22, arrancá primero la API. Si vas a usar el servidor web de Expo, dejá libre el puerto 8081:

```sh
docker compose stop frontend
docker compose up -d --wait backend
cd frontend
npm ci
npm run web
```

También podés usar `npm run android` o `npm run ios` con los emuladores correspondientes. La URL de API por defecto es `http://10.0.2.2:8080` para el emulador Android y `http://localhost:8080` para web e iOS. Si cambiás el puerto de la API, configurá la URL de Expo en `frontend/.env` según [el ejemplo](frontend/.env.example).

Para probar en un teléfono conectado a la misma red, iniciá el backend con `API_BIND_ADDRESS` igual a la IP LAN de tu computadora e indicá esa dirección y puerto en `EXPO_PUBLIC_API_URL` dentro de `frontend/.env`. Entonces ejecutá `npm start` desde `frontend/`.

## Configuración del backend

Para ejecutar Spring Boot fuera de Compose, usá Java 17 o posterior y el Maven Wrapper incluido. Configurá `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` y `JWT_SECRET` antes de ejecutar `./mvnw spring-boot:run` desde `backend/`. Generá el secreto JWT con `openssl rand -hex 32`. Para usar SMTP externo configurá `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SMTP_AUTH` y `MAIL_SMTP_STARTTLS`. `FRONTEND_URL` determina la dirección de los enlaces enviados por correo.

## Código de origen

- [Frontend · TPO-DA1-Front, revisión `041d0cf`](https://github.com/agreboyras/TPO-DA1-Front/tree/041d0cfb59cf0f79abcd5be1af7d2b951a6b38b7)
- [Backend · TPO-DA1-Back-Hosteado, revisión `e1d3cfb`](https://github.com/MaximoSarmiento2003/TPO-DA1-Back-Hosteado/tree/e1d3cfbe9593ed73c591e4c39136f1675cfb6f1d)
