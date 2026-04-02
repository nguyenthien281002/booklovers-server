import { Server } from "socket.io";
import messageService from "../services/messageService";
import orderService from "../services/orderService";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // join room theo userId
    socket.on("join_room", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    // gửi tin nhắn realtime
    socket.on("send_message", async (data) => {
      try {
        const { messageData, notification } = await messageService.saveMessage(
          data
        );

        io.to(data.user_id).emit("receive_message", messageData);
        io.to("admin_room").emit("receive_message", messageData);

        if (notification) {
          if (notification.user_id === 0) {
            // gửi cho admin
            io.to("admin_room").emit("receive_notification", notification);
          } else {
            // gửi cho user
            io.to(notification.user_id).emit(
              "receive_notification",
              notification
            );
          }
        }
      } catch (error) {
        socket.emit("error_message", {
          message: "Gửi tin nhắn thất bại",
        });
      }
    });
    socket.on("order_created", async (data) => {
      try {
        const { notification } = await orderService.createOrderSocket(data);

        io.to("admin_room").emit("receive_notification", notification);
      } catch (error) {
        socket.emit("error_message", {
          message: "Không tạo được thông báo",
        });
      }
    });
    socket.on("mark_seen", async ({ user_id }) => {
      try {
        await messageService.markMessagesAsSeen(user_id);

        // update lại list user realtime
        io.to("admin_room").emit("refresh_users");
      } catch (error) {
        console.error("mark_seen error:", error);
      }
    });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

// để dùng ở controller/service nếu cần
const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

export { initSocket, getIO };
