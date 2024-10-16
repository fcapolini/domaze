import { Global } from "../runtime/global";
import { Page } from "../runtime/page";
import { ServerGlobal } from "./server-global";

export class ServerPage extends Page {
  newGlobal(): Global {
    return new ServerGlobal(this);
  }
}
