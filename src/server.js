require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketio = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// ==========================
// 1) CONNECT DATABASE
// ==========================
connectDB();

const app = express();
const server = http.createServer(app);

// ==========================
// 2) SOCKET.IO SETUP
// ==========================
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available in routes/controllers if needed
app.set("io", io);

// ==========================
// 3) GLOBAL MIDDLEWARE
// ==========================
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ==========================
// 4) ROUTES
// ==========================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/users", require("./routes/users"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/dashboard", require("./routes/dashboard"));

// 🔥 Chat Messages Route (المطلوب إضافته)
app.use("/api", require("./routes/messagesRoutes"));

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ROOT
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Ticketing System API",
    version: "1.0.0",
  });
});

// ==========================
// 5) ERROR HANDLER
// ==========================
app.use(errorHandler);

// ==========================
// 6) SOCKET.IO EVENTS
// ==========================
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-ticket", (ticketId) => {
    console.log(`User joined ticket room: ${ticketId}`);
    socket.join(ticketId);
  });

  socket.on("leave-ticket", (ticketId) => {
    socket.leave(ticketId);
  });

  socket.on("send-message", (data) => {
    // data: { ticketId, message }
    io.to(data.ticketId).emit("new-message", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ==========================
// 7) START SERVER
// ==========================
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Backend running on PORT ${PORT}`);
});
