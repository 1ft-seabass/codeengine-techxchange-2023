const dotenv = require('dotenv')
dotenv.config({ path: './.env/local.env' })

const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));

console.log(`LAUNCH_MODE : ${process.env.LAUNCH_MODE}`);

// OpenAI API キー
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// openai ライブラリの読み込み
const OpenAI = require("openai");

// OpenAI の API を使うために上記の設定を割り当てて準備
// 以後 openai というオブジェクトで使える
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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

app.post('/api/post/message', async (req, res) => {
  console.log('/api/post/message');

  const responseJSON = {};

  const content = req.body.message;

  console.log(`質問内容 : ${content}`);

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "user", content: content }
    ],
    model: "gpt-3.5-turbo", // モデルは gpt-3.5-turbo を今回使う。
  });

  // 結果表示
  responseJSON.message = completion.choices[0].message.content;
  console.log(responseJSON);

  res.send(responseJSON)
});

app.post('/api/post/log', async (req, res) => {
  console.log('/api/post/log');

  const responseJSON = {};
  responseJSON.result = "OK";

  console.log(req.body.message);

  res.send(responseJSON)
});

app.get('/api/get/message', async (req, res) => {
  console.log('/api/get/message');

  const responseJSON = {};

  const content = req.query.message;

  console.log(`質問内容 : ${content}`);

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "user", content: content }
    ],
    model: "gpt-3.5-turbo", // モデルは gpt-3.5-turbo を今回使う。
  });

  // 結果表示
  responseJSON.message = completion.choices[0].message.content;
  console.log(responseJSON);

  res.send(responseJSON)
});


app.listen(process.env.PORT || 8080, () => {
  console.log("server start!");
  console.log(`app listening at http://localhost:${process.env.PORT || 8080}`)
})