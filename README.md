# tracker
Simple tracker

## Architecture

Frontend: S3 + CloudFront
Backend: AWS Lambda
DB: DynamoDB


El siguiente diagrama muestra el flujo de datos e interacciones entre el usuario, la capa de Frontend estática, el Backend serverless y la Base de Datos en AWS:

```mermaid
graph LR
    %% Definición de Nodos
    Browser["🌐 Navegador Web<br>(Smartphone / Laptop)"]
    
    subgraph AWS ["☁️ Amazon Web Services (AWS)"]
        subgraph Frontend ["Capa Frontend (Costo $0)"]
            CF["📦 Amazon CloudFront<br>(CDN / URL Privada)"]
            S3["🪣 Amazon S3<br>(HTML / JS Estático)"]
        end
        
        subgraph Backend ["Capa Backend (Serverless)"]
            Lambda["⚡ AWS Lambda<br>(Lógica Node.js / Python)"]
        end
        
        subgraph Database ["Capa de Datos"]
            Dynamo["🗄️ Amazon DynamoDB<br>(Tabla NoSQL por PIN)"]
        end
    end

    %% Flujos e Interacciones
    Browser -->|1. Solicita App (URL Privada)| CF
    CF -->|2. Sirve Archivos| S3
    S3 -->|3. Retorna HTML/JS| Browser
    
    Browser -.->|LocalStorage: Lee/Guarda PIN| Browser
    
    Browser -->|4. Envía PIN (API Fetch)| Lambda
    Lambda -->|5. Consulta Historial| Dynamo
    Dynamo -->|6. Retorna Datos Históricos| Lambda
    Lambda -->|7. Responde JSON con Historial| Browser

    %% Estilos Visuales
    style Browser fill:#f9f,stroke:#333,stroke-width:2px
    style AWS fill:#fff,stroke:#ff9900,stroke-width:2px
    style Frontend fill:#e6f2ff,stroke:#0066cc,stroke-width:1px
    style Backend fill:#ffe6cc,stroke:#cc6600,stroke-width:1px
    style Database fill:#e6ffe6,stroke:#006600,stroke-width:1px
```

