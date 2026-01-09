# Real-Time Chat Application

A full‑stack **real‑time chat application** that enables users to communicate instantly with each other using WebSockets. The project is built with a modern **React + Vite frontend** and a **Node.js + Express backend**, using **Socket.IO** for real‑time messaging and **MongoDB** for data persistence.

---

##  Features

* User authentication (JWT-based)
* Secure password hashing with bcrypt
* Real-time one-to-one chat using Socket.IO
* Instant message delivery without page refresh
* Persistent chat history stored in MongoDB
* Online / Offline user status (real-time)
* Typing indicator when a user is composing a message
* Message seen / read receipts
* Responsive UI built with React
* REST APIs for user and message handling

---

##  Tech Stack

### Frontend

* React
* Vite
* JavaScript 
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB (Mongoose)
* JSON Web Token (JWT)
* bcrypt (password hashing)

---


##  Installation & Setup

###  Clone the repository


git clone https://github.com/satishreddy955/Real-Time-Chat-Application.git
cd Real-Time-Chat-Application


### Backend Setup


cd backend
npm install

Create a `.env` file in the backend folder:


PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key


Start the backend server:


node index.js


###  Frontend Setup


cd frontend
npm install
npm run dev


---

## Usage

1. Register a new user or log in
2. Connect with another user
3. Start chatting in real time
4. Messages are delivered instantly using Socket.IO

---

##  Future Improvements

* Group chat functionality
* File and image sharing
* Deployment with Docker & CI/CD

---

## Author

**Satish Reddy**
GitHub: [https://github.com/satishreddy955](https://github.com/satishreddy955)

---

⭐ If you like this project, don’t forget to star the repository!
