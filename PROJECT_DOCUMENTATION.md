# Project Documentation: CaffAIne Admin Intelligence System
**Date:** May 11, 2026
**Project Title:** CaffAIne - Specialty Coffee Management & BI Ecosystem
**Team Leader:** Omar Al-Ajarma
**Core Team:** Sultan Al-Adawi, Mohammad Al-Hadidi, Bashar Al-Dabbas

---

## 1. Project Overview
CaffAIne is a production-grade, full-stack management ecosystem designed specifically for **Faculty Coffee** in Birmingham, UK. It bridges the gap between traditional café operations and modern data intelligence. The project consists of a high-end customer-facing website and a comprehensive administrative command center equipped with dual-tier AI intelligence.

### Core Objectives
- **Operational Efficiency:** Real-time inventory tracking with recipe-linked auto-deduction.
- **Strategic Oversight:** A unified audit logging system for administrative accountability.
- **Business Intelligence:** AI-driven analytics that process live database metrics into actionable insights.
- **Enhanced UX:** A cinematic, bilingual (AR/EN), and voice-enabled customer interface.

---

## 2. Technology Stack & Dependencies

### **Backend (The Core Engine)**
- **Runtime:** Node.js v18+
- **Framework:** Express.js 5 (Advanced Routing & Middleware)
- **Database:** MySQL 8.0 (Relational Data Persistence)
- **AI Engine:** OpenAI GPT-4o-mini (Integrated via GitHub Models / Azure Inference)
- **File Storage:** Multer (Disk storage for product images)
- **PDF Engine:** jsPDF + AutoTable (Professional report generation)

### **Frontend (The Visual Layer)**
- **Library:** React.js 18
- **State Management:** React Context API (Atomic stores for Cart, Store, and Admin Auth)
- **Routing:** React Router v7 (SPA architecture)
- **Styling:** Vanilla CSS + CSS Modules (Glassmorphism aesthetics)
- **Animations:** useReveal hook (IntersectionObserver) + Custom CSS Keyframes
- **Smooth Scroll:** Lenis.js

---

## 3. Full Project Structure Analysis

```text
/root
├── server.js               # Main Backend entry point (API, DB, AI, Migrations)
├── package.json            # Scripts and dependency management
├── .env                    # Environment secrets (Keys, DB Credentials)
├── Coffaine_Premium_Presentation_2.html # Final presentation file (Premium)
├── public/                 # Static assets
│   ├── images/             # Uploaded product and system images
│   ├── favicon.ico         # Original site icon
│   └── index.html          # React entry HTML
└── src/                    # React Frontend source
    ├── App.js              # Main React routing and layout config
    ├── index.js            # React DOM mounting
    ├── admin/              # Administrative Modules
    │   ├── AdminLayout.js  # Main Dashboard container & Navigation
    │   ├── AdminLogin.js   # Secure login portal
    │   ├── pages/          # Individual Dashboard Modules (12 Modules)
    │   │   ├── AIAssistant.js # BI Chat interface
    │   │   ├── Dashboard.js   # Real-time KPIs and Revenue Chart
    │   │   ├── Inventory.js   # Stock management & Thresholds
    │   │   ├── LeaderDashboard.js # Super-admin audit & PDF control
    │   │   ├── Orders.js      # Live order tracking & Lifecycle
    │   │   └── Products.js    # Comprehensive CRUD for menu items
    ├── components/         # Reusable UI components (Menu, Navbar, etc.)
    ├── context/            # Global state (CartContext, StoreContext)
    └── hooks/              # Custom logic (useAdminAuth, useReveal)
```

---

## 4. Database Analysis (MySQL Schema)

CaffAIne utilizes 14 interlinked tables to maintain absolute data integrity and professional auditing.

### **Key Tables & Relationships**
| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| `orders` | Core transaction log | `id`, `total_amount`, `status`, `order_type`, `estimated_ready_at` |
| `order_items` | Individual items per order | `order_id` (FK), `product_id` (FK), `quantity`, `price` |
| `menu_items` | Product catalog | `id`, `name`, `price_num`, `category_id` (FK), `available` |
| `inventory` | Stock levels | `id`, `item_name`, `quantity`, `min_threshold` |
| `recipes` | Ingredient mapping | `menu_item_id` (FK), `inventory_id` (FK), `quantity_required` |
| `admin_logs` | **Audit Trail** | `admin_email`, `admin_name`, `action`, `details` |
| `addons` | Product modifiers | `id`, `name`, `price`, `inventory_id` (FK) |
| `careers` | Job postings | `title`, `type`, `active` (flag) |
| `job_applications` | Applicant data | `name`, `email`, `cover_letter`, `status` |

### **Architecture: Atomic Transactions**
The system uses **SQL Transactions (BEGIN/COMMIT)** for order placement:
1. Check stock availability for all ingredients in the cart.
2. Insert Order record.
3. Insert all Order Items.
4. Deduct inventory based on Recipe-Inventory links.
5. Deduct inventory for all selected Add-ons.
6. Commit if all succeed, otherwise **ROLLBACK** to prevent data corruption.

---

## 5. Flow & Data Lifecycle

### **User Order Flow**
1. **Selection:** Customer browses `Menu.js`, selects items, and configures add-ons.
2. **Checkout:** `CartContext.js` calculates totals. User submits contact/delivery info.
3. **API Call:** `POST /api/orders` sends the payload to `server.js`.
4. **Validation:** Server verifies stock availability via the `recipes` table.
5. **Fulfillment:** Order appears in `admin/pages/Orders.js` with a live countdown timer.
6. **Completion:** Admin marks order as "Ready". Inventory is already permanently deducted.

### **Administrative Audit Flow**
1. **Action:** Admin performs a sensitive operation (e.g., Deletes a Product).
2. **Middleware:** `server.js` intercepts the request, extracting `X-Admin-Email` from headers.
3. **Logging:** `INSERT INTO admin_logs` records the specific change, time, and actor.
4. **Oversight:** The Team Leader views this trail in `LeaderDashboard.js`.

---

## 6. AI Intelligence Layer (Dual-Tier)

### **Sophie (Customer AI Barista)**
- **Endpoint:** `/api/ai-chat`
- **Context:** Injects the current menu, active offers, and store hours.
- **Personality:** Professional, friendly barista.
- **Logic:** Provides product recommendations and answers FAQ without admin data access.

### **CaffAIne (Admin BI Intelligence)**
- **Endpoint:** `/api/ai-assistant`
- **Context:** Executes 19 parallel database queries (Revenue, Trends, Top Products, Stock Levels, Admin Logs).
- **Personality:** High-level Business Consultant.
- **Logic:** Enables the Leader to ask complex questions like *"Who changed the price of V60 and how has it affected our revenue this week?"*

---

## 7. Key Functionality & Features

### **Real-Time Dashboards**
- **30s Auto-Poll:** The dashboard (`Dashboard.js`) refreshes every 30 seconds to ensure KPIs (Today's Sales, Orders, Low Stock) are always current.
- **Visual Analytics:** SVG-based revenue charts showing the last 7 days of growth.

### **Production-Grade PDF Reporting**
- Located in `LeaderDashboard.js`, this allows for exporting the full audit trail or sales summary into a professional PDF format for business reconciliation.

### **Bilingual Search & Voice**
- The system supports voice search in both English and Arabic.
- Integrated dictionary mapping converts Arabic search terms (e.g., "قهوة") to backend queries for "coffee".

---

## 8. Configuration & Build Scripts

### **Environment Variables (.env)**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL connection details.
- `OPENAI_API_KEY`: API key for GPT-4o-mini logic.
- `PORT`: Server port (default 8080 for Azure compatibility).

### **Build Commands**
- `npm run build`: Generates the production React bundle in `/build`.
- `npm start`: Runs the Express server (serves the build folder + APIs).

---

## 9. Conclusion
CaffAIne is a mission-critical application designed for the professional environment of Faculty Coffee. It prioritizes **data integrity, administrative accountability, and intelligent analytics**, making it a benchmark for modern full-stack graduation projects.

**Status:** Mission Ready & Production Verified.
**Maintainer:** Omar Al-Ajarma & Team.
