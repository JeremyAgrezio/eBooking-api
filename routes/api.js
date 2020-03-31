const express = require("express");
const authRouter = require("./auth");
const userRouter = require("./user");
const bookRouter = require("./book");
const rentRouter = require("./rent");
const publicationRouter = require("./publication");
const reservationRouter = require("./reservation");
const lockRouter = require("./lock");

const app = express();

app.use("/auth/", authRouter);
app.use("/user/", userRouter);
app.use("/book/", bookRouter);
app.use("/rent/", rentRouter);
app.use("/publication/", publicationRouter);
app.use("/reservation/", reservationRouter);
app.use("/lock/", lockRouter);

module.exports = app;