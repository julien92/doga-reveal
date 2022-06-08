import { faMars, faVenus } from "@fortawesome/free-solid-svg-icons";
import FAIcon from "../FAIcon";

const Sex = ({ sex }: { sex: "Male" | "Female" }) => {
  return sex === "Male" ? (
    <FAIcon size={16} icon={faMars} />
  ) : (
    <FAIcon size={16} icon={faVenus} />
  );
};

export default Sex;
