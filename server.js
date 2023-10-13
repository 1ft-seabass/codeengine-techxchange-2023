const dotenv = require('dotenv')
dotenv.config({ path: './.env/local.env' })

const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));

console.log(`LAUNCH_MODE : ${process.env.LAUNCH_MODE}`);

// bodyParser
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.listen(process.env.PORT || 8080, () => {
  console.log("server start!");
  console.log(`app listening at http://localhost:${process.env.PORT || 8080}`)
})