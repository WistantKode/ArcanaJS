import { Request, Response } from "arcanajs/server";

export default class HomeController {
  home(_req: Request, res: Response) {
    res.renderPage("HomePage");
  }
}
