<p align="center">
  <img src="frontend/assets/images/auctionpro-login-tile.png" alt="AuctionPro logo" width="96" height="96">
</p>

# AuctionPro

Plataforma de subastas experimental para explorar catálogos, publicar piezas y pujar en vivo desde Android o iOS (o Web). Incluye registro con aprobación, medios de pago, notificaciones, historial y un panel de operaciones para rematadores.

## Arranque rápido

Con Docker y Compose activos, ejecutá el comando desde la raíz del proyecto.

```sh
docker compose up --build -d --wait
```

- [Aplicación web](http://localhost:8081)
- [API de subastas](http://localhost:8080/auctions)
- [Mailpit](http://localhost:8025) para los correos de activación y recuperación

MySQL guarda los datos en un volumen. `docker compose down` detiene los servicios y conserva el volumen. Usá `docker compose ps` para consultar su estado y `docker compose logs -f backend frontend` para seguir los logs.

## Demo con comprador y rematador

Arrancá el entorno con los datos de muestra activados.

```sh
DEMO_DATA=true docker compose up --build -d --wait
```

- **Comprador** · `comprador@auctionpro.test`
- **Rematador** · `rematador@auctionpro.test`
- **Contraseña de ambas cuentas** · `Demo-AuctionPro-2026`

1. Abrí la web como comprador. En **Subastas**, elegí **Sala de demostración** e ingresá con el cheque verificado de ARS 120.
2. Hacé una oferta de ARS 10 por la cámara. El saldo del cheque baja a ARS 110 y la puja aparece en el historial del lote.
3. En otra sesión del navegador, ingresá como rematador y abrí **Perfil → Administración**. Cerrá el lote actual. El comprador ve el resultado y el paso al siguiente lote en tiempo real.
4. Para probar un alta, registrá una cuenta con un correo de prueba y fotos ficticias. Aprobala desde el panel y abrí el enlace de activación en Mailpit. Si la cuenta agrega un medio de pago, también podés verificarlo desde el panel.

La demo agrega dos lotes y conserva su estado entre reinicios. Para repetirla desde cero, podés levantar otra instancia con un volumen separado. Asignale otros puertos si el entorno habitual sigue activo.

```sh
DEMO_DATA=true WEB_PORT=18081 API_PORT=18080 MAIL_WEB_PORT=18025 \
  docker compose -p auctionpro-demo up --build -d --wait
```

### Administrar un entorno local propio

Con `DEMO_DATA=false`, creá un operador definiendo `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el `.env` de la raíz. Elegí un correo nuevo y una contraseña de al menos 12 caracteres y hasta 72 bytes. En el primer arranque se crea la cuenta. Los siguientes arranques conservan su contraseña.

El panel permite aprobar y rechazar altas, revisar publicaciones, verificar medios de pago y cerrar el lote actual. La carga de nuevos catálogos y subastas queda fuera del panel. Las operaciones administrativas requieren un JWT de rematador.

## Expo en un celular

El proyecto usa **Expo SDK 54**. Instalá [Expo Go compatible con ese SDK](https://expo.dev/go) y conectá el celular y la computadora a la misma red. Sustituí `192.168.1.10` por la IP local de la computadora.

```sh
API_BIND_ADDRESS=192.168.1.10 docker compose up -d --wait backend
cd frontend
npm ci
EXPO_PUBLIC_API_URL=http://192.168.1.10:8080 npx expo start --go --port 8082
```

Escaneá el QR de la terminal. El puerto `8082` deja libre el `8081` que usa la web. Si la app abre pero no carga datos, probá `http://192.168.1.10:8080/auctions` en el navegador del celular para comprobar que llega a la API.

### Desarrollo web y emuladores

Con Node.js 22 y el backend activo, ejecutá estos comandos desde `frontend/`.

```sh
npm ci
npm run web -- --port 8082
```

Para esa variante web, incluí `http://localhost:8082` en `CORS_ALLOWED_ORIGINS` en el `.env` de la raíz y recreá el backend. Conservá también `http://localhost:8081` si seguís usando la web de Compose.

Podés usar `npm run android -- --port 8082` o `npm run ios -- --port 8082` con el emulador correspondiente. Android usa `http://10.0.2.2:8080` por defecto. El simulador iOS y la web de Expo usan `http://localhost:8080`. Las variables del [ejemplo de Expo](frontend/.env.example) permiten personalizar las URL por plataforma.

## Arquitectura

- `frontend/app/` contiene las rutas y pantallas de Expo Router. `frontend/src/` agrupa componentes, sesión y clientes de API.
- `backend/src/main/java/` contiene controladores REST, servicios de dominio, repositorios JPA y seguridad JWT. `backend/src/main/resources/` contiene la configuración de Spring Boot.
- En la web de Compose, Nginx sirve la app y reenvía `/api/` al backend. En Expo Go, la app se conecta directamente al backend.
- Las pujas entran por REST con autenticación. STOMP sobre WebSocket distribuye las pujas y los resultados después de que se guardan en MySQL.

### API principal

- **Público** · `GET /auctions`, `GET /auctions/{id}/catalog`, `GET /auctions/items/{itemId}`.
- **Cuenta** · `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `GET /users/profile`.
- **Sala en vivo** · `POST /auctions/{id}/join`, `POST /auctions/{id}/bid`, `GET /auctions/{id}/state`, `POST /auctions/{id}/leave`.
- **Rematador** · `GET /admin/clients/pending`, `GET /admin/products/pending`, `GET /admin/payment-methods/pending`, `POST /auctions/{id}/items/{itemId}/close`.
- **Eventos** · Conexión en `/ws` y suscripciones a `/topic/auction/{id}/bids` y `/topic/auction/{id}/result`.

## Configuración

Copiá [`.env.example`](.env.example) a `.env` si necesitás cambiar valores de Compose. Expo lee su configuración desde `frontend/.env`.

- **Red** · `WEB_PORT`, `API_PORT`, `MAIL_WEB_PORT`, `API_BIND_ADDRESS` y `CORS_ALLOWED_ORIGINS`.
- **Arranque local** · `DEMO_DATA`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- **Credenciales** · `DB_PASSWORD` y `JWT_SECRET`. Para un entorno propio, generá un secreto JWT con `openssl rand -hex 32`. Para una base existente, mantené la contraseña con la que se inicializó el volumen o rotala también en MySQL.
- **Envío** · `AUCTION_SHIPPING_FEE` configura la tarifa fija en ARS. El valor local de ejemplo es 500.
- **Enlaces** · `FRONTEND_URL` se usa en los correos. `STREAMING_BASE_URL` es opcional. Si se define, la sala enlaza a esa URL seguida del identificador de la subasta.

Para ejecutar Spring Boot fuera de Compose, instalá Java 17 o posterior y configurá `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` y `JWT_SECRET` antes de ejecutar `./mvnw spring-boot:run` desde `backend/`. Para SMTP externo usá `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SMTP_AUTH` y `MAIL_SMTP_STARTTLS`.

## Verificación

```sh
cd frontend
npm ci
npm run lint
npm run typecheck
npm run build:web
```

La prueba de Spring Boot requiere MySQL y las mismas variables de conexión que el backend. Ejecutá `./mvnw test` desde `backend/`.

Para probar el flujo HTTP completo, usá la demo en los puertos `18081` y `18025` con un volumen nuevo. Desde la raíz, ejecutá `python3 scripts/smoke.py`. La prueba crea una cuenta ficticia y cierra el primer lote de esa demo.


### Alcance del entorno

La verificación de medios de pago y el registro de multas son operaciones internas. El flujo de cheques reserva la oferta en ARS, conserva la del ganador y libera las demás. Para operar con dinero real hace falta una integración de cobros. Para publicar el entorno también quedan pendientes HTTPS, migraciones versionadas, copias de seguridad y una política de acceso y retención de fotos de DNI.
