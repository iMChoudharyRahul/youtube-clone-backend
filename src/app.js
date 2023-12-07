import express from "express";

const app = express();

app.use("/", (req, resp)=> {
  resp.send(<h2>Hello! Restart the Learning</h2>);
})

app.listen(process.env.PORT);

export { app }