import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface FAIconProps {
  icon: IconDefinition;
  size?: number;
}

const FAIcon = ({ icon, size = 24 }: FAIconProps) => (
  <FontAwesomeIcon width={size} height={size} icon={icon} />
);

export default FAIcon;
