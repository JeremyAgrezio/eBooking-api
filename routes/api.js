const express = require("express");
const authRouter = require("./auth");
const bookRouter = require("./book");
const rentRouter = require("./rent");
const publicationRouter = require("./publication");
const reservationRouter = require("./reservation");

const app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/rent/", rentRouter);
app.use("/publication/", publicationRouter);
app.use("/reservation/", reservationRouter);

module.exports = app;