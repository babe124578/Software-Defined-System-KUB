var express = require("express")
var mongoose = require("mongoose")

app = express()
app.use(express.json())

mongoose.connect('mongodb://192.168.0.100:27017/todolist', { useNewUrlParser: true })

const user = mongoose.model('user', { username: String })
const todolist = mongoose.model('todolist', { username: String, list: [{ todo: String, complete: false }] })

app.get("/getalluser", async (req, res) => {
    res.json(await user.find({}))
})

app.get("/getalltodo", async (req, res) => {
    res.json(await todolist.find({}))
})

app.post("/gettodo", async (req, res) => {
    let find_todo = await todolist.findOne({ username: req.body.username })
    res.json(find_todo)
})

app.post("/adduser", async (req, res) => {
    console.log(req.body)
    let find_user = await user.find({ username: req.body.username })
    if (find_user.length == 0) {
        let new_user = new user({ username: req.body.username })
        await new_user.save()
        let new_todo = new todolist({
            username: req.body.username,
            list: []
        })
        await new_todo.save()
        console.log(`Add ${req.body.username}`)
    }
    res.status(200).end()
})

app.post("/addtodo", async (req, res) => {
    let find_todo = await todolist.findOne({ username: req.body.username })
    find_todo.list.push({
        todo: req.body.todo,
        complete: false
    })
    console.log(find_todo.list)
    await todolist.updateOne({ username: req.body.username },
        {
            $set: { list: find_todo.list }
        })
    res.json(find_todo.list)

})

app.post("/changestate", async (req, res) => {
    let find_todo = await todolist.findOne({ username: req.body.username })
    for (var i = 0; i < find_todo.list.length; i++) {
        if (find_todo.list[i].todo == req.body.todo) {
            find_todo.list[i].complete = !find_todo.list[i].complete
        }
    }
    await todolist.updateOne({ username: req.body.username },
        {
            $set: { list: find_todo.list }
        })
    res.json(find_todo.list)
})

app.listen(3001, async () => {
    console.log("start database server")
    await user.deleteMany({})
    await todolist.deleteMany({})

    let base_user = require("./user.json")
    let base_todo = require("./todo.json")
    await user.insertMany(base_user)
    await todolist.insertMany(base_todo)
})
