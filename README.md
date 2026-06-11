# Shoes Cart API

A Node.js + Express REST API for a Shoes e-commerce cart with MySQL database.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via mysql2)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Other**: dotenv, cors, helmet, uuid

## Project Structure

```
├── server.js              # Entry point
├── config/
│   └── database.js        # MySQL pool config
├── controllers/
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── cart.controller.js
│   └── order.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── cart.routes.js
│   └── order.routes.js
├── middleware/
│   ├── auth.middleware.js
│   └── error.middleware.js
├── models/
│   └── schema.sql         # MySQL schema + seed data
├── .env.example
└── package.json
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create MySQL database
```bash
mysql -u root -p < models/schema.sql
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Protected | Get current user |
| PUT | `/api/auth/profile` | Protected | Update profile |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | List all products |
| GET | `/api/products/categories` | Public | List categories |
| GET | `/api/products/:id` | Public | Get product by ID |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Cart
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/cart` | Protected | View cart |
| POST | `/api/cart` | Protected | Add item to cart |
| PUT | `/api/cart/:id` | Protected | Update cart item quantity |
| DELETE | `/api/cart/:id` | Protected | Remove item from cart |
| DELETE | `/api/cart` | Protected | Clear entire cart |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | Protected | Place order from cart |
| GET | `/api/orders` | Protected | My orders |
| GET | `/api/orders/:id` | Protected | Order detail |
| PUT | `/api/orders/:id/cancel` | Protected | Cancel pending order |
| GET | `/api/orders/admin/all` | Admin | All orders |
| PUT | `/api/orders/admin/:id/status` | Admin | Update order status |

## Authentication

Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <your_token>
```

## Query Params for Products

- `search` — keyword search
- `category` — filter by category name
- `brand` — filter by brand
- `minPrice` / `maxPrice` — price range
- `page` / `limit` — pagination

---

> **Note**: This project intentionally includes vulnerable dependencies and code patterns for security testing purposes.
