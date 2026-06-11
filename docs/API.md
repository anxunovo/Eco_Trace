# API Documentation

## Authentication

Authentication is handled via JWT (JSON Web Tokens). Most protected endpoints require a valid token passed in the `Authorization` header.

**Header Format:**
```http
Authorization: Bearer <your_token_here>
```

Tokens can be obtained by calling the `POST /api/auth/login` or `POST /api/auth/register` endpoints.

---

## Public Endpoints

### `POST /api/auth/login`
Logs in a user and returns an authentication token.
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "nickname": "Alice",
    "password": "mypassword"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "u_alice",
      "nickname": "Alice",
      "avatar": "/assets/avatar.png",
      "school": "Example University",
      "campus": "Main Campus",
      "role": "STUDENT",
      "eco_points": 100
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Missing nickname or password.
  - `401 Unauthorized`: Incorrect nickname or password.

### `POST /api/auth/register`
Registers a new user and returns an authentication token.
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "nickname": "Bob",
    "password": "mypassword"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### `GET /api/listings`
Retrieves a paginated list of active listings.
- **Method:** `GET`
- **Query Parameters:**
  - `category` (optional): Filter by category.
  - `campus` (optional): Filter by campus.
  - `tradeMode` (optional): Filter by trade mode.
  - `q` (optional): Search term for title or description.
  - `page` (optional): Page number (default: 1).
  - `limit` (optional): Results per page (default: 20, max: 50).
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "l_123",
        "title": "Example Listing",
        "category": "BOOKS",
        "price": 10.0,
        ...
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
  ```

### `GET /api/listing`
Retrieves details for a single listing.
- **Method:** `GET`
- **Query Parameters:**
  - `id` (required): The listing ID.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "l_123",
      "title": "Example Listing",
      ...
    }
  }
  ```

### `GET /api/dashboard`
Retrieves aggregated global carbon saving stats.
- **Method:** `GET`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalCarbonSaved": 12.5,
      "totalCompletedListings": 5,
      "totalFoodSaved": 3.2,
      "byCategory": {
        "BOOKS": { "carbon": 5.0, "count": 2 },
        "ELECTRONICS": { "carbon": 7.5, "count": 3 }
      }
    }
  }
  ```

### `GET /api/carbon/stats`
Retrieves carbon stats, optionally scoped by user.
- **Method:** `GET`
- **Query Parameters:**
  - `scope` (optional): `global` or `user`
  - `userId` (optional): Specific user ID when `scope=user`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalCarbonSavedKg": 10.5,
      "listingCount": 3,
      "byCategory": [
        { "category": "BOOKS", "total": 5.0 }
      ]
    }
  }
  ```

---

## Protected Endpoints

*All protected endpoints require the `Authorization: Bearer <token>` header.*

### `GET /api/auth/me`
Retrieves the currently authenticated user's details.
- **Method:** `GET`
- **Response:**
  ```json
  {
    "success": true,
    "user": { ... }
  }
  ```

### `GET /api/user/profile`
Retrieves user profile stats, including listing count and carbon savings.
- **Method:** `GET`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "u_123",
      "nickname": "Alice",
      "listingCount": 5,
      "totalCarbonSavedKg": 12.5,
      ...
    }
  }
  ```

### `POST /api/listings/create`
Creates a new listing.
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "title": "Calculus Book",
    "description": "Good condition",
    "category": "BOOKS",
    "tradeMode": "SELL",
    "price": 15,
    "images": ["data:image/jpeg;base64,..."]
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": { "id": "l_abc123" }
  }
  ```

### `PUT /api/listings/update`
Updates an existing listing. Must be the owner.
- **Method:** `PUT`
- **Query Parameters:**
  - `id` (required): Listing ID
- **Request Body:** Any subset of listing fields to update.
- **Response:**
  ```json
  {
    "success": true,
    "data": { "id": "l_abc123" }
  }
  ```

### `DELETE /api/listings/delete`
Soft-deletes a listing (sets status to 'REMOVED'). Must be the owner.
- **Method:** `DELETE`
- **Query Parameters:**
  - `id` (required): Listing ID
- **Response:**
  ```json
  {
    "success": true,
    "data": { "id": "l_abc123", "deleted": true }
  }
  ```

### `POST /api/listings/:id/complete`
Marks a listing as completed. Generates a carbon record and updates eco points. Must be the owner.
- **Method:** `POST`
- **Path Parameters:**
  - `id` (required): Listing ID
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "message": "Listing completed successfully",
      "points_earned": 10,
      "listing": { ... },
      "carbon_record": { ... }
    }
  }
  ```

### `POST /api/interests`
Expresses interest in a listing.
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "listingId": "l_123",
    "message": "Is this still available?"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": { "id": "i_xyz789" }
  }
  ```

### `GET /api/interests`
Retrieves interests for a listing.
- **Method:** `GET`
- **Query Parameters:**
  - `listingId` (required): Listing ID
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "interests": [
        {
          "id": "i_xyz789",
          "userId": "u_123",
          "message": "Is this still available?",
          "createdAt": "2023-10-01T12:00:00Z",
          "user": { "nickname": "Bob", "avatar": "..." }
        }
      ]
    }
  }
  ```

---

## AI Endpoints

### `POST /api/ai/analyze`
Analyzes uploaded images to auto-generate listing details (title, description, category, etc.).
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "images": ["data:image/jpeg;base64,..."],
    "title": "Optional hint",
    "description": "Optional hint",
    "category": "Optional hint"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "title": "Calculus Textbook",
      "description": "A well-maintained calculus textbook, suitable for university students.",
      "category": "BOOKS",
      "condition": "GOOD",
      "estimatedValue": "15-25"
    }
  }
  ```
- **Fallback Behavior:**
  If the AI service is unavailable or times out (>8s), the endpoint falls back to a default JSON response:
  ```json
  {
    "category": "OTHER",
    "condition": "UNKNOWN",
    "title": "Auto-generated Title",
    "description": "Details could not be generated.",
    "estimatedValue": "0",
    "tags": []
  }
  ```

---

## Code Examples

### cURL
```bash
# Fetch active listings
curl -X GET "http://localhost:8888/api/listings?limit=5"

# Create a listing (requires authentication)
curl -X POST "http://localhost:8888/api/listings/create" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{
           "title": "Used Bicycle",
           "category": "TRANSPORT",
           "tradeMode": "SELL",
           "price": 50
         }'
```

### JavaScript (Fetch)
```javascript
// Get listing details
async function getListing(id) {
  const response = await fetch(`/api/listing?id=${id}`);
  const data = await response.json();
  if (data.success) {
    console.log(data.data);
  }
}

// Complete a listing
async function completeListing(id, token) {
  const response = await fetch(`/api/listings/${id}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

### Python (Requests)
```python
import requests

# Login
res = requests.post('http://localhost:8888/api/auth/login', json={
    'nickname': 'Alice',
    'password': 'mypassword'
})
token = res.json().get('token')

# Get User Profile
headers = {'Authorization': f'Bearer {token}'}
profile_res = requests.get('http://localhost:8888/api/user/profile', headers=headers)
print(profile_res.json())
```

---

## Error Handling

The API returns standard HTTP status codes. Errors are typically returned with `success: false` or a simple JSON/text error string depending on the endpoint.

- `400 Bad Request`: Missing parameters or validation failed.
- `401 Unauthorized`: Missing or invalid authentication token.
- `404 Not Found`: Resource not found (e.g., listing doesn't exist).
- `405 Method Not Allowed`: Incorrect HTTP method used (e.g., GET instead of POST).
- `500 Internal Server Error`: Server encountered an error processing the request.

Example Error Response:
```json
{
  "success": false,
  "error": "Method not allowed"
}
```

### Rate Limiting
To prevent abuse, the API enforces rate limits on certain endpoints:
- `429 Too Many Requests`: Returned when a client exceeds the allowed number of requests per minute.
- Standard endpoints allow 100 requests per minute per IP.
- The `POST /api/ai/analyze` endpoint is strictly rate limited by the upstream ZhipuAI provider, and the API will return a 429 status or fall back to default JSON data if those limits are hit.
