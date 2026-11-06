import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowUpRightFromSquare, faBookOpen, faBookmark, faCamera, faCheck, faCircleExclamation, faClock, faClockRotateLeft, faCopy, faEllipsisVertical, faFire, faGear, faGlobe, faHouse, faLanguage, faLeaf, faMagnifyingGlass, faMicrophone, faPlay, faRotateRight, faTrashCan, faUser, faVolumeHigh, faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";

const icons: Record<string, IconDefinition> = { home: faHouse, translate: faLanguage, camera: faCamera, learn: faBookOpen, settings: faGear, profile: faUser, leaf: faLeaf, arrow: faArrowRight, open: faArrowUpRightFromSquare, bookmark: faBookmark, check: faCheck, error: faCircleExclamation, clock: faClock, history: faClockRotateLeft, copy: faCopy, menu: faEllipsisVertical, close: faXmark, streak: faFire, globe: faGlobe, search: faMagnifyingGlass, microphone: faMicrophone, play: faPlay, retry: faRotateRight, sparkle: faWandMagicSparkles, delete: faTrashCan, volume: faVolumeHigh };
export type IconName = keyof typeof icons;
export default function Icon({ name, className, label }: { name: IconName; className?: string; label?: string }) {
  return <FontAwesomeIcon icon={icons[name]} className={className} aria-hidden={label ? undefined : true} aria-label={label} title={label}/>;
}
