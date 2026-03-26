import type { Ayah } from "../types";
import "./AyahCard.css";

interface AyahCardProps {
  ayah: Ayah;
}

export function AyahCard({ ayah }: AyahCardProps) {
  return (
    <div className="ayah-card">
      <span className="ayah-number">{ayah.number}</span>
      <p className="ayah-arabic">{ayah.arabicText}</p>
      {ayah.englishTranslation && (
        <p className="ayah-translation">{ayah.englishTranslation}</p>
      )}
    </div>
  );
}

export default AyahCard;