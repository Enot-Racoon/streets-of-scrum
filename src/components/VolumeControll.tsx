import { useRef, useState } from "react";
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

  const lastVolumeRef = useRef<number>(initialValue);

  const min = 0;
  const max = 0.4;
  const step = 0.01;
  const audioEnabled = volume > min;

  const toggleVolume = () => setShowVolume((v) => !v);

  const changeVolume = (v: number) => {
    setVolume(v);
    onChange(v);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeVolume(parseFloat(e.target.value));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setShowVolume(false);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (audioEnabled) {
      lastVolumeRef.current = volume;
      changeVolume(min);
    } else {
      changeVolume(lastVolumeRef.current);
    }
  };

  return (
    <div className="flex justify-center relative">
      <button
        title="Volume SFX"
        className={`p-1.5 rounded transition outline-none ${
          audioEnabled
            ? "text-slate-300 hover:text-white"
            : "text-slate-500 hover:text-slate-400"
        }`}
        onClick={toggleVolume}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleDoubleClick}
      >
        {volume > max * 0.5 ? (
          <Volume2 className="w-4 h-4" />
        ) : volume > min ? (
          <Volume1 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </button>

      <input
        className="absolute -bottom-[50%]"
        hidden={!showVolume}
        type="range"
        min={min}
        max={max}
        step={step}
        value={volume}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};
