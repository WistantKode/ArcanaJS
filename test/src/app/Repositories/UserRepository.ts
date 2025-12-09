import { Repository } from "arcanajs/di";
import { User } from "../Models/User";

@Repository()
class UserRepository {
  async findById(id: string) {
    return await User.find(id);
  }
}

export default UserRepository;
