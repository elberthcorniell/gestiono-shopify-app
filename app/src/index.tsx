import React from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./app";

const elementId = `app-container-${process.env.GESTIONO_APP_ID}`
const element = document.getElementById(elementId)
element?.classList.add('col-span-full')
if (element) createRoot(element).render(<Root />)