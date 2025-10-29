# Hotel Offer Orchestrator

A system that aggregates hotel offers from two mock suppliers, deduplicates hotels, and selects the best offer per hotel. Built with Node.js (TypeScript), Express, Temporal, Redis, and Docker.

## Features

- Calls two mocked supplier hotel APIs
- Compares hotel listings based on price
- Returns the best-priced hotel for each name (de-duplicated)
- Uses Temporal.io to orchestrate the comparison logic
- Ability to filter hotel list by price range
- Health check endpoint to monitor supplier status

## Tech Stack

- Node.js with TypeScript
- Express.js for API endpoints
- Temporal.io for workflow orchestration
- Redis for caching and filtering
- Docker and Docker Compose for containerization

## API Endpoints

- `GET /api/hotels?city=delhi` - Get hotels for a specific city
- `GET /api/hotels?city=delhi&minPrice=1000&maxPrice=5000` - Get hotels with price filtering
- `GET /health` - Check the health of the application and its dependencies
- `GET /supplierA/hotels?city=delhi` - Mock Supplier A API
- `GET /supplierB/hotels?city=delhi` - Mock Supplier B API

## Setup and Deployment

### Prerequisites

- Node.js (v14 or higher)
- npm
- Docker and Docker Compose

### Local Development

1. Clone the repository

```bash
git clone <repository-url>
cd hotel-offer-orchestrator
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory (or use the provided one)

```
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
TEMPORAL_HOST=localhost:7233
```

4. Start Redis and Temporal locally (using Docker)

```bash
docker-compose up -d redis temporal cassandra temporal-ui
```

5. Build the TypeScript code

```bash
npm run build
```

6. Start the Temporal worker

```bash
npm run worker
```

7. Start the application

```bash
npm run dev
```

### Docker Deployment

To deploy the entire application stack using Docker Compose:

```bash
docker-compose up -d
```

This will start the following services:
- The main application on port 3000
- Temporal worker
- Redis on port 6379
- Temporal server on port 7233
- Temporal UI on port 8080
- Cassandra (for Temporal) on port 9042

## Testing

A Postman collection is included in the repository for testing the API endpoints. Import the `Hotel_Offer_Orchestrator.postman_collection.json` file into Postman to use it.

The collection includes the following requests:
- Get Hotels by City
- Get Hotels with Price Filter
- Get Hotels for Non-existent City
- Get Hotels for Mumbai
- Health Check
- Direct access to Supplier A and B APIs

## Architecture

The application follows a microservices architecture pattern:

1. **API Layer**: Express.js routes handle HTTP requests
2. **Workflow Layer**: Temporal.io orchestrates the business logic
3. **Activity Layer**: Performs individual tasks like fetching from suppliers
4. **Caching Layer**: Redis stores and filters hotel data
5. **Mock Suppliers**: Simulate external hotel data providers

## Error Handling and Resilience

- Temporal provides automatic retries for failed activities
- The application handles supplier failures gracefully
- Health check endpoint monitors the status of all components
- Comprehensive error logging throughout the application