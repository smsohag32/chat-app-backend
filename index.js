const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./models/messageInfo");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

mongoose.connect(
  "mongodb+srv://sohag:XjpiDkQEPSI0jHiH@cluster0.upa1smp.mongodb.net/chatDB?retryWrites=true&w=majority", // Replace with your MongoDB connection URI
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const conversationMap = new Map();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (data) => {
    socket.join(data.room);
    console.log(`User with ID: ${socket.id} joined room: ${data.room}`);

    try {
      const roomConversation = await Message.find({ room: data.room }).exec();
      socket.emit("previous_conversation", roomConversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  });

  socket.on("send_message", async (data) => {
    socket.to(data.room).emit("receive_message", data);

    if (!conversationMap.has(data.room)) {
      conversationMap.set(data.room, []);
    }

    const newMessage = new Message({
      room: data.room,
      user: data.user,
      text: data.text,
      time: data.time,
    });

    try {
      await newMessage.save();
      conversationMap.get(data.room).push(newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("Server is running on port 3001");
});
