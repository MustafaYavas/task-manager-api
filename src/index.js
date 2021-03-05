const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

/*
    without middleware --->     new request --> run route handler
    with middleware -->         new request --> do smthng --> run route handler
*/

app.use(express.json());    // gelen istekleri (requestleri) json biçiminde otomatik olarak ayrıştırır
app.use(userRouter);        // yeni oluşturulan routerı programa kaydetmek için 
app.use(taskRouter);


app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})

// const Task = require("./models/task");
// const User = require("./models/user");

// const main = async () => {
//     // const task = await Task.findById("603c8df2fecfd509c4a7a409");
//     // await task.populate("owner").execPopulate();  // bir ilişkiden sahip olduğumuz verileri doldurmamızı sağlar
//     // console.log(task.owner);

//     const user = await User.findById("603c8cc664f0e43974dcc744");
//     await user.populate("tasks").execPopulate();
//     console.log(user.tasks);
// }

// main();

