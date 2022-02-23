const express = require("express");
const router = new express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");

/*
500 - Internal Server Error
404 - Not Found
403 - Forbidden
401 - Unauthorized
400 - Bad Request
*/

router.post("/tasks", auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    
    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(500).send(error);
    }

})

// GET /tasks?completed=true (veya false)
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc         
router.get("/tasks", auth, async (req, res) => {
    const match = {};
    const sort = {};

    if(req.query.completed){
        match.completed = req.query.completed === "true";    
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(":");
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    try {
       
        await req.user.populate({
            path: "tasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }   
        }).execPopulate();
        res.status(200).send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }

})

router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({_id, owner: req.user._id})

        if(!task)
            return res.status(404).send("Task not found");
        res.status(200).send(task);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.patch("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ["description", "completed"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send("Error: Invalid update. Given field is not found");
    }
    try {
        
        const task = await Task.findOne({_id, owner: req.user._id});

        if(!task){
            return res.status(404).send("Task not found");
        }
        
        updates.forEach((update) => {
            task[update] = req.body[update];
        })
        await task.save();

        res.status(200).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.delete("/tasks/:id", auth,async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({_id, owner: req.user._id});
        if(!task){
            return res.status(404).send("Task not found");
        }
        res.status(200).send("Task deleted successfully!");
    } catch (error) {
        res.status(500).send(error);
    }
})

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove();

        res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = router;
