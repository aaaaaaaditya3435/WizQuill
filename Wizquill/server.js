const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

const rooms = {};
const words = ["apple", "car", "dog", "house", "tree"];

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("joinRoom", (room) => {
        socket.join(room);
        socket.room = room;

        if (!rooms[room]) {
            rooms[room] = {
                players: [],
                drawerIndex: 0,
                word: ""
            };
        }

        rooms[room].players.push(socket.id);

        startGame(room);
    });

    function startGame(room) {
        const game = rooms[room];
        if (!game) return;

        game.word = words[Math.floor(Math.random() * words.length)];
        const drawer = game.players[game.drawerIndex];

        io.to(drawer).emit("yourWord", game.word);
        io.to(room).emit("message", "🎨 New round started!");
    }

    // DRAW
    socket.on("draw", (data) => {
        if (socket.room) {
            socket.to(socket.room).emit("draw", data);
        }
    });

    // CHAT + GUESS (FIXED)
    socket.on("chat", (msg) => {
        const room = socket.room;
        const game = rooms[room];

        if (!game) return;

        // ✅ always show chat
        io.to(room).emit("chat", msg);

        // ✅ check guess
        if (msg.toLowerCase() === game.word.toLowerCase()) {
            io.to(room).emit("message", "🎉 Correct guess!");

            game.drawerIndex = (game.drawerIndex + 1) % game.players.length;

            startGame(room);
        }
    });

    socket.on("clear", () => {
        if (socket.room) {
            io.to(socket.room).emit("clear");
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});