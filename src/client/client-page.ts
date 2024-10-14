import { Global } from "../runtime/global";
import { Page } from "../runtime/page";
import { ClientGlobal } from "./client-global";

export class ClientPage extends Page {

  newGlobal(): Global {
    return new ClientGlobal(this);
  }

}
