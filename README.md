# tracker
Simple tracker

## Architecture

Frontend: S3 + CloudFront
Backend: AWS Lambda
DB: DynamoDB

## 📐 Arquitectura del Sistema (Diagrama de Contexto)

El siguiente diagrama muestra el flujo de datos e interacciones entre el usuario, la capa de Frontend estática, el Backend serverless y la Base de Datos en AWS:

```mermaid
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

Person(user, "User", "Accesses the application from any web browser")

System_Boundary(system, "Application") {
    Container(frontend, "Frontend", "Amazon S3 + CloudFront", "Serves the SPA/static content")
    Container(backend, "Backend", "AWS Lambda", "Exposes the business logic via API")
    ContainerDb(db, "Database", "Amazon DynamoDB", "Stores application data")
}

Rel(user, frontend, "Uses", "HTTPS")
Rel(frontend, backend, "Calls", "REST (API Gateway)")
Rel(backend, db, "Reads/Writes", "AWS SDK")
@enduml
```mermaid

```mermaid
C4Container
    title Container Diagram (C4-L2) - Tracker

    Person(user, "User", "Accesses the application from any web browser")

    System_Boundary(system, "Application") {
        Container(frontend, "Frontend", "Amazon S3 + CloudFront", "Serves the SPA/static content")
        Container(backend, "Backend", "AWS Lambda", "Exposes the business logic via API")
        ContainerDb(db, "Database", "Amazon DynamoDB", "Stores application data")
    }

    Rel(user, frontend, "Uses", "HTTPS")
    Rel(frontend, backend, "Calls", "REST (API Gateway)")
    Rel(backend, db, "Reads/Writes", "AWS SDK")

    UpdateElementStyle(frontend, $bgColor="darkorange", $borderColor="chocolate", $fontColor="white")
    UpdateElementStyle(backend, $bgColor="darkorange", $borderColor="chocolate", $fontColor="white")

```
