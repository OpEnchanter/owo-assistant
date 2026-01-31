import express, { type Request, type Response } from "express";
import type { ResolutionMode } from "typescript";

const haModule = require("./modules/homeassistant.ts")

const app = express();
app.use(express.json());
const PORT = 8080;

function penis(query: String) {

}

let modules = []

app.get("/", (req: Request, res: Response) => {
    res.send("eeeee");
});

app.post("/query", (req: Request, res: Response) => {

});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});