import { createApp } from "vue";
import App from "./App";
import "./styles/common.scss"
import "./Widgets/widgets.css";

import router from "./router"

createApp(App).use(router)
    .mount(document.getElementById("app"));