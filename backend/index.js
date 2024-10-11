"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require('express');
var cors = require('cors');
var app = express();
var PORT = 5000;
app.use(cors());
app.use(express.json());
app.get('/', function (req, res) {
    res.send('Hello from the MemoRapp backend!');
});
app.listen(PORT, function () {
    console.log("Server is running on http://localhost:".concat(PORT));
});
