var express = require("express")
var axios = require("axios")
var cors = require("cors")

app = express()
app.use(express.json())
app.use(cors())

app.post("/addtodo", (req, res) => {
    axios.post("http://192.168.0.100/mongo/addtodo", {
        username: req.body.username,
        todo: req.body.todo
    }).then(data => {
        res.json(data.data)
    })
})

app.get("/getalltodo", (req, res) => {
    axios.get("http://192.168.0.100/mongo/getalltodo").then((data) => {
        res.json(data.data)
    })
})

app.post("/gettodo", (req, res) => {
    axios.post("http://192.168.0.100/mongo/gettodo", {
        username: req.body.username
    }).then((data) => {
        res.json(data.data.list)
    })
})

app.post("/changestate", (req, res) => {
    axios.post("http://192.168.0.100/mongo/changestate", {
        username: req.body.username,
        todo: req.body.todo
    }).then(data => {
        res.json(data.data)
    })
})

app.listen(3003, () => {
    console.log("start todo server")
})