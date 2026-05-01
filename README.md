# Graduation Project

## Running the Project Locally

1. Open a terminal in the project root.
2. Install dependencies:

```bash
npm install
```

3. Ensure a `.env` file exists in the root directory with the following values:

```env
SERVER_PORT=5000
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASS=
DB_NAME=graduation_project
OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the server:

```bash
npm run server
```

5. In a second terminal, start the frontend:

```bash
npm start
```

6. To run both server and frontend concurrently:

```bash
npm run dev
```

## Technical Notes

- `server.js` reads database configuration from `.env` via `dotenv`.
- The admin panel and frontend connect to `http://127.0.0.1:5000`.
- AI integration is available at `POST /api/ai` endpoint using OpenAI.
- Added support for the `resource_consumption` field in the `menu_items` table.
- When an order is placed, the server reads the materials used from `menu_items` and deducts the quantities from the `inventory` table based on `item_name` and `quantity` for each material.
