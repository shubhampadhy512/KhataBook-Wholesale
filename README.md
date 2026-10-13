# 📒 KhataBook Wholesale — Smart Credit & Payment Management

<p align="center">
  <strong>Simplifying wholesale credit records, merchant dues, and payment verification.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Framework-Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Stack-MERN-7C3AED?style=for-the-badge" alt="MERN Stack" />
</p>

---

## 📌 About the Project

**KhataBook Wholesale** is a credit and payment management web application designed for grocery wholesalers (storemen) and merchants who purchase products on credit.

In traditional wholesale businesses, storemen often maintain customer credit records in physical notebooks. These records can be lost, damaged, or difficult to update. Tracking monthly dues, remembering payments, and verifying transactions manually can also become time-consuming.

KhataBook aims to digitize this process by providing a centralized platform where storemen can manage merchant accounts, record credit transactions, track outstanding balances, and verify payment submissions.

Merchants can view their monthly dues, check transaction history, submit payment details, and communicate with the storeman through an integrated chat interface.

**Project goal:** Build a full-stack MERN application that makes wholesale credit management more organized, transparent, and efficient.

## ✨ Key Features

### 👨‍💼 Storeman Dashboard

- 📊 View total outstanding credit, received payments, and pending payment requests.
- 👥 Add and manage merchant accounts.
- 🧾 Record credit transactions for individual merchants.
- 💰 Track outstanding balances and monthly dues.
- ✅ Approve or reject merchant payment submissions.
- 📅 Monitor payment history and due dates.
- 📈 View financial summaries and transaction reports.

### 🏪 Merchant Dashboard

- 💳 View total outstanding balance and monthly dues.
- 📚 Access personal credit and payment history.
- 📤 Submit payment details for verification.
- 🔔 Track payment request status.
- 💬 Chat with the storeman.
- 📋 Review account statements and transaction records.

### 💬 Chat & Notifications

- WhatsApp-inspired chat interface.
- Conversation lists and message bubbles.
- Payment-related notifications.
- Status messages for pending, successful, and rejected payments.
- Real-time messaging planned for backend integration.

### 🔐 Payment Verification Workflow

1. The storeman records a credit transaction for a merchant.
2. The merchant views the outstanding balance.
3. The merchant submits a payment request with the amount and payment details.
4. The payment request is marked as **Pending Verification**.
5. The storeman reviews and approves or rejects the request.
6. When approved, the payment is recorded and the outstanding balance is updated.
7. When rejected, the balance remains unchanged and the merchant receives the rejection status.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| MongoDB | Database for users, merchant records, credit entries, and payments |
| Express.js | Backend framework for building REST APIs |
| React.js | Frontend UI and reusable components |
| Node.js | Server-side JavaScript runtime |
| Mongoose | MongoDB object modeling and schema validation |
| JavaScript (ES6+) | Application logic |
| Vite | Frontend development server and build tool |
| React Router | Client-side navigation |
| JWT | Authentication and session authorization |
| bcrypt / bcryptjs | Password hashing |
| Socket.IO | Planned real-time chat and notifications |
| Recharts | Dashboard charts and financial summaries |
| Lucide React | Icons and UI elements |
| Git & GitHub | Version control and project collaboration |

*Note: The technologies above describe the intended full-stack architecture. Features that have not yet been implemented should be treated as planned integrations.*

## 🏗️ Application Modules

| Module | Description |
|---|---|
| Authentication | Registration, login, and role-based access |
| Storeman Dashboard | Overview of credit, payments, and outstanding dues |
| Merchant Management | Merchant profiles and account records |
| Credit Ledger | Credit entries, payments, and balance tracking |
| Payment Verification | Review and process payment submissions |
| Merchant Dashboard | Personal dues and financial history |
| Chat System | Communication between storeman and merchants |
| Reports | Financial summaries and transaction history |

## 📂 Project Structure

A possible structure for the full-stack application:

```text
KhataBook-Wholesale/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

*The structure is illustrative; adjust it to match your actual repository.*

## ⚙️ Getting Started

### Prerequisites

Install the following tools before running the application:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- [MongoDB](https://www.mongodb.com/) or a MongoDB Atlas database
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/) for API testing

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/KhataBook-Wholesale.git
cd KhataBook-Wholesale
```

### 2. Set Up the Frontend

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173`.

### 3. Set Up the Backend

Open a second terminal:

```bash
cd server
npm install
npm run dev
```

Make sure the backend `package.json` contains a suitable development script, such as one using `nodemon`, before running this command.

### 4. Configure Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
NODE_ENV=development
```

Use your actual MongoDB connection string and a strong, private JWT secret. If the application uses additional services, configure their variables separately.

**Security:** Never commit `.env` files, passwords, database credentials, or JWT secrets to GitHub.

## 🧪 API Testing with Postman

Postman can be used to test backend REST APIs independently of the React frontend.

Example endpoints for the planned application:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/merchants` | Retrieve merchant records |
| POST | `/api/merchants` | Create a merchant record |
| GET | `/api/transactions` | Retrieve transaction records |
| POST | `/api/transactions` | Record a credit transaction |
| GET | `/api/payments` | Retrieve payment requests |
| PATCH | `/api/payments/:id/verify` | Approve or reject a payment |

These are example endpoint designs, not a claim that these APIs already exist. Update the table as you implement your actual routes.

## 🔒 Security Considerations

- Hash passwords before storing them.
- Use JWT authentication and enforce role-based authorization.
- Validate and sanitize incoming API data.
- Allow only authorized storemen to manage their merchant records.
- Prevent merchants from accessing other merchants' private information.
- Validate payment amounts and prevent duplicate payment processing.
- Maintain transaction and payment verification history.
- Keep secrets and credentials in environment variables.

## 🗺️ Development Roadmap

- [x] Define the wholesale credit management problem.
- [x] Plan the storeman and merchant workflows.
- [x] Design the frontend prototype and dashboard interfaces.
- [x] Design the payment verification workflow.
- [x] Plan the chat and notification interface.
- [ ] Develop REST APIs using Node.js and Express.js.
- [ ] Design MongoDB schemas using Mongoose.
- [ ] Implement authentication and role-based authorization.
- [ ] Connect React components to backend APIs.
- [ ] Implement persistent merchant and credit records.
- [ ] Implement payment submission and verification logic.
- [ ] Build real-time chat using Socket.IO.
- [ ] Add reporting and downloadable account statements.
- [ ] Test APIs and application workflows.
- [ ] Deploy the full-stack application.

## 🔮 Future Enhancements

- Automatic monthly due-date reminders.
- Downloadable PDF invoices and account statements.
- Search, filtering, and date-based reports.
- Real-time chat and notifications.
- Transaction audit logs.
- Mobile-friendly experience.
- Cloud deployment and database backups.
- Improved financial summaries for storemen and merchants.

## 🎯 Project Objective

KhataBook Wholesale aims to replace scattered paper-based credit records with a centralized digital system. It helps storemen maintain organized merchant accounts and track outstanding payments while giving merchants a transparent view of their dues and payment history.

The long-term goal is to deliver a reliable MERN stack application that simplifies day-to-day credit management for wholesale businesses.

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch to GitHub.
5. Open a pull request.

## 📄 License

This project is currently developed for learning and prototyping. Add a license file, such as the MIT License, if you intend to permit reuse and modification under its terms.

---

<p align="center">
  <strong>📒 KhataBook Wholesale — Making Credit Management Simple.</strong>
  <br />
  Built with ❤️ using the MERN stack.
</p>
