import { useContext } from "react";
import RegisterAndLoginForm from "../pages/RegisterAndLoginForm";
import { UserContext } from "../context/userContext";

const Routes = () => {
  const { username, id } = useContext(UserContext);

  if (username) {
    return `logged in! ${username}`;
  }

  return <RegisterAndLoginForm />;
};

export default Routes;
