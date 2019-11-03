"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
exports.router = express.Router();
exports.router.get('/ping', function (_REQ, res) {
    res.json({ alive: 'yes' }).status(200);
});
