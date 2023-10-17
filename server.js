const dotenv = require('dotenv')
dotenv.config({ path: './.env/local.env' })

const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));

console.log(`LAUNCH_MODE : ${process.env.LAUNCH_MODE}`);

// bodyParser
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get('/get/sample', (req, res) => {
  console.log('/get/sample');
  res.send({"result":"GET OK!"})
});

app.get('/get/mode', (req, res) => {
  console.log('/get/mode');
  res.send({"LAUNCH_MODE":process.env.LAUNCH_MODE})
});

app.post('/post/message', (req, res) => {
  console.log('/post/message');

  const responseJSON = {};
  responseJSON.text = "こんにちは～！";

  res.send(responseJSON)
});


app.listen(process.env.PORT || 8080, () => {
  console.log("server start!");
  console.log(`app listening at http://localhost:${process.env.PORT || 8080}`)
})