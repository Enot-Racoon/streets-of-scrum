import { useState } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";

export type VolumeControllProps = {
  initialValue: number;
  onChange: (value: number) => void;
};

export const VolumeControll = ({
  initialValue,
  onChange,
}: VolumeControllProps) => {
  const [volume, setVolume] = useState(initialValue);
  const [showVolume, setShowVolume] = useState(false);
  const toggleVolume = () => setShowVolume((v) => !v);
  const audioEnabled = volume > 0;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    onChange(v);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setShowVolume(false);
  };

  return (
    <div className="flex justify-center relative">
      <button
        onClick={toggleVolume}
        className={`p-1.5 rounded transition ${
          audioEnabled
            ? "text-slate-300 hover:text-white"
            : "text-slate-500 hover:text-slate-400"
        }`}
        title="Volume SFX"
      >
        {volume > 0.5 ? (
          <Volume2 className="w-4 h-4" />
        ) : volume > 0 ? (
          <Volume1 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </button>

      <input
        className="absolute -bottom-[50%]"
        hidden={!showVolume}
        type="range"
        min="0"
        max="0.4"
        step="0.01"
        defaultValue={volume}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};
