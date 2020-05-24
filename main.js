"use strict";

//Require the necessary modules
const express = require("express"),
    app = express(),
    layouts = require("express-ejs-layouts"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    http = require("http"),
    server = http.Server(app),
    io = require("socket.io")(server),
    Card = require("./models/card");

//Connects either to the procution database, docker db or our local database
mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/board_db",
    {useNewUrlParser: true, useFindAndModify: false}
);

//Get a db instance to work with
const db = mongoose.connection;

//Notfication when connection to db was successfull
db.once("open", () => {
    console.log("Connected to MongoDB");
});

//In order to parse JSON for our application
app.use(
    express.urlencoded({
        extended: true
    })
);
app.use(bodyParser.json());
app.use(express.json());
//Tell node to use layouts and to look in the public folder for static files
app.use(layouts);
app.use(express.static("public"));

//Sets the necessary variables
app.set("view engine", "ejs");
app.set("port", process.env.NODEPORT || process.env.PORT || 8080);


server.listen(app.get("port"), () => {
    console.log(`Server running at http://localhost:${app.get("port")}`);
});

io.sockets.on("connection", function (socket) {
    console.log("A new user is connected with the id: " + socket.id);
});

// Routes
app.get("/:boardId", get_board);
app.get("/board/:boardId", get_cards);
app.post("/update-pos", update_pos);
app.post("/update-text", update_text); //or maybe PUT?
app.post("/", save_card);
app.post("/delete-card", delete_card);

module.exports = app;

// Controller
function get_board(req, res) {
    res.render("boards/index");
}

function save_card(req, res) {
    const card = new Card(
        {
            _id: new mongoose.mongo.ObjectId(),
            backgroundColor: req.body.color,
            position: {
                left: null,
                top: null
            },
            boardId: req.body.boardId
        });
    card.save((err) => {
        if (err)
            res.sendStatus(500);
        io.emit("new-card", JSON.stringify(card));
        res.sendStatus(200);

    });
}

function get_cards(req, res) {
    let boardId = req.params.boardId;
    Card.find({boardId: boardId}, (err, cards) => {
        res.send(cards);
    });
}

function update_pos(req, res) {

    const filter = {_id: mongoose.Types.ObjectId(req.body._id)};
    const update = {position: {left: req.body.position.left, top: req.body.position.top}};

    Card.findOneAndUpdate(filter, update, {new: true},
        function (err) {
            if (err) {
                console.log("Something wrong when updating data!");
            }
            io.emit("pos-update", JSON.stringify({
                _id: req.body._id,
                position: {
                    left: req.body.position.left,
                    top: req.body.position.top
                },
                boardId: req.body.boardId
            }));
            res.sendStatus(200);
        }
    );
}

function delete_card(req, res) {
    const filter = {_id: mongoose.Types.ObjectId(req.body._id)};

    Card.deleteOne(filter,
        function (err) {
            if (err) {
                console.log("Something wrong when deleting data!");
            }
            io.emit("delete-card", JSON.stringify({
                _id: req.body._id,
                boardId: req.body.boardId
            }));
            res.sendStatus(200);
        }
    );
}

function update_text(req, res) {
    const filter = {_id: mongoose.Types.ObjectId(req.body._id)};
    const update = {text: req.body.text};

    Card.findOneAndUpdate(filter, update, {new: true},
        function (err) {
            if (err) {
                console.log("Something wrong when updating data!");
            }
            io.emit("text-update", JSON.stringify({
                _id: req.body._id,
                text: req.body.text,
                boardId: req.body.boardId
            }));
            res.sendStatus(200);
        }
    );
}

