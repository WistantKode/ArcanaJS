import { Repository } from "arcanajs/server";
import { User } from "../Models/User";

@Repository()
class UserRepository {
  async findById(id: number) {
    return await User.find(id);
  }
}

export default UserRepository;
