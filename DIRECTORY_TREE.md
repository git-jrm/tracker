mi-monorepo/
├── app/
│   ├── api/
# ADD:
node_modules/
├── src/                      # api source code
│   ├── config/               # environment and config variables (DB, etc.)
│   │   └── env.js
│   ├── controllers/          # business logic
│   │   └── usuarios.controller.js
│   ├── middlewares/          # security and validations
│   │   └── auth.middleware.js
│   ├── routes/               # endpoints def (GET, POST, etc.)
│   │   └── usuarios.routes.js
│   └── app.js                # Inicialización Express y middlewares globales
package.json              # Configuración del proyecto y scripts
server.js      <-- Servidor del backend
...
│   │
│   ├── db/
│   │   ├── iac.yaml       <-- Tu código de IaC (ej. AWS CloudFormation o SAM)
│   │   ├── create-table.js <-- Script nativo para crear la tabla (SDK de Dynamo)
│   │   └── client.js      <-- Configuración y cliente de conexión a DynamoDB
│   │
│   ├── requests/          <-- Carpeta para pruebas HTTP locales
│   │   ├── api.rest       <-- Peticiones directas a tu API local
│   │   └── aws-dynamo.rest <-- (Opcional) Peticiones directas a Dynamo Local
│   │
│   └── web/
│       ├── index.html     <-- Frontend nativo
│       ├── styles.css
│       └── app.js         <-- Lógica del cliente
│
└── README.md              <-- Explicación e instrucciones del proyecto
