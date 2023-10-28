const dotenv = require('dotenv')
dotenv.config({ path: './.env/local.env' })

const axios = require('axios');
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

// IoT
app.post('/api/post/iot/message', async (req, res) => {
  console.log('/api/post/iot/message');

  const responseJSON = {};

  const content = req.body.message;

  // 結果表示
  responseJSON.response = await iotPrompt(content);
  console.log(responseJSON);

  res.send(responseJSON);
});

app.post('/api/post/message', async (req, res) => {
  console.log('/api/post/message');

  const content = req.body.message;

  const responseJSON = await firstPrompt(content);

  res.send(responseJSON);
});

// obniz へのメッセージング処理
messageObniz = async ( _messageString ) => {

  console.log("messageObniz");

  const currentURL = process.env.OBNIZ_URL + "?data=" + _messageString;

  console.log(currentURL);

  const configAPI = {
    url:currentURL,
    method:'get'
  };

  let response;
  
  try {
    response = await axios.request(configAPI);
  } catch (e){
    response = {
      "data":{
        "type":"obniz error" ,
        "error":e ,
        "chatGPTResponse":_messageString
      }
    }
  }
  
  console.log(response.data);
}

messageNodeRED = async (_target, _message) => {

  console.log("messageNodeRED");

  const currentRequestData = {};
  currentRequestData.message = `${_target} : ${_message}`;

  console.log(currentRequestData.message);

  const configAPI = {
    url:process.env.NODERED_URL,
    method:'post',
    data:currentRequestData
  }

  const response = await axios.request(configAPI);
  
  console.log(response.data);
}

iotPrompt = async (_content) => {
  
  console.log(`質問内容 : ${_content}`);
  await messageNodeRED("自分",_content);

  const functions = [
    {
        "name": "rgb_json",
        "description": "色名から RGB 値の情報を得られた場合",
        "parameters": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "description": "led という値が固定値を入力されます"
                },
                "result": {
                    "type": "boolean",
                    "description": "色名が RGB値 で認識されたので true は認識が入ります。"
                },
                "r": {
                    "type": "number",
                    "description": "色名から RGB 値の情報を得たときの R 値"
                },
                "g": {
                    "type": "number",
                    "description": "色名から RGB 値の情報を得たときの G 値"
                },
                "b": {
                    "type": "number",
                    "description": "色名から RGB 値の情報を得たときの B 値"
                },
                "message": {
                    "type": "string",
                    "description": "色名がRGB値に認識されたときの追加の説明。"
                }
            },
            "required": [
                "type",
                "result",
                "r",
                "g",
                "b",
                "message"
            ]
        }
    },
    {
        "name": "rgb_json_not_found",
        "description": "色名から RGB 値の情報を得られなかった場合",
        "parameters": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "description": "led という値が固定値を入力されます"
                },
                "result": {
                    "type": "boolean",
                    "description": "色名が RGB値 で認識されなかったので false が入ります。"
                },
                "message": {
                    "type": "string",
                    "description": "色名が RGB 値に認識されなかったときの説明。あるいは、色名がRGB値に認識されなかったときの説明。色名の例外は「色名が認識されない例外処理です」と説明します。"
                }
            },
            "required": [
                "type",
                "result",
                "message"
            ]
        }
    }
  ];

  const _prompt = {
    messages: [],
    model: "gpt-3.5-turbo-0613",
    functions:functions,
    function_call: "auto"
  };

  const _command = `
- 色名がRGB値で認識されたら rgb_json を使います。
- 色名がRGB値で認識されない例外処理は rgb_json_not_found を使います。
  
今回はこのルールで「${_content}」でお願いします
`;

  _prompt.messages.push({ role: "user", content: _command });

  const completion = await openai.chat.completions.create(_prompt);

  // 結果表示
  const arguments = completion.choices[0].message.function_call.arguments;
  const message = JSON.parse(arguments);

  await messageNodeRED("ChatGPT",arguments);

  // obniz
  const obnizMessageString = `{"type":"${message.type}","r":${message.r},"g":${message.g},"b":${message.b},"message":"OK"}`;
  if(message.result){
    console.log("結果：色名が認識されました！");
    // obniz へ命令する
    await messageObniz(obnizMessageString);
  } else {
    console.log("結果：色名が認識されない例外処理です");
  }

  return message;
}

firstPrompt = async (_content) => {

  console.log(`質問内容 : ${_content}`);
  await messageNodeRED("自分",_content);

  const responseJSON = {};

  const _prompt = {
    messages: [],
    model: "gpt-3.5-turbo"
  };

  if(process.env.OPENAI_SYSTEM_VALUE){
    console.log(`システム値あり : ${process.env.OPENAI_SYSTEM_VALUE}`);
    _prompt.messages.push({ role: "system", content: process.env.OPENAI_SYSTEM_VALUE });
  }

  _prompt.messages.push({ role: "user", content: _content });

  const completion = await openai.chat.completions.create(_prompt);

  // 結果表示
  responseJSON.message = completion.choices[0].message.content;
  console.log(responseJSON);
  await messageNodeRED("ChatGPT",responseJSON.message);

  return responseJSON;
}

app.post('/api/post/log', async (req, res) => {
  console.log('/api/post/log');

  const responseJSON = {};
  responseJSON.result = "OK";

  console.log(req.body.message);

  res.send(responseJSON)
});

app.get('/api/get/message', async (req, res) => {
  console.log('/api/get/message');

  const content = req.query.message;

  const responseJSON = await firstPrompt(content);

  res.send(responseJSON);
});


app.get('/api/get/iot/message', async (req, res) => {
  console.log('/api/get/iot/message');

  const responseJSON = {};

  const content = req.query.message;

  // 結果表示
  responseJSON.message = await iotPrompt(content);
  // 文字列化
  responseJSON.message = JSON.stringify(responseJSON.message, null ,"");
  console.log(responseJSON);

  res.send(responseJSON);
});

app.listen(process.env.PORT || 8080, () => {
  console.log("server start!");
  console.log(`app listening at http://localhost:${process.env.PORT || 8080}`)
})