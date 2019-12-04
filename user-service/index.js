var express = require("express")
var axios = require("axios")
var cors = require("cors")

app = express()
app.use(express.json())
app.use(cors())

app.post("/adduser", (req, res) => {
    console.log(req.body)
    axios.post("http://192.168.0.100/mongo/adduser", {
        username: req.body.username
    })
    res.status(200).end()
})

app.get("/getalluser", (req, res) => {
    axios.get("http://192.168.0.100/mongo/getalluser").then((data) => {
        res.json(data.data)
    })
})
app.listen(3002, () => {
    console.log("start user server")
})