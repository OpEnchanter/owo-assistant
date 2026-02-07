import { ModuleBase, type ModuleResult } from "owomodule";
import { OwODB } from "owodb";
import { Module } from "./modules/homeassistant.ts";

const db = new OwODB('owodb.sqlite');

const hamod = new Module(db);

const res = await hamod.onQuery("set Tristan's lamp temperature 500");

console.log(res);