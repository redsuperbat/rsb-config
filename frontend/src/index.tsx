/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";

import "bootstrap/dist/css/bootstrap.min.css";
import { App } from "./App";

const root = document.getElementById("root");

render(() => <App />, root!);
