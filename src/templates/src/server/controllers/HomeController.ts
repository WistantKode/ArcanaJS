import { Request, Response } from "arcanajs/server";

export default class HomeController {
  home(req: Request, res: Response) {
    res.renderPage("HomePage");
  }
}
