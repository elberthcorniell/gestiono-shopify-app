import React from "react";
import { render } from "react-dom";
import { Root } from "./app";

const elementId = "app-container-1"
const element = document.getElementById(elementId)
element?.classList.add('col-span-full')
render(<Root />, element)