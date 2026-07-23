import { useState, useEffect } from "react";
import { Hourglass } from "lucide-react";

export default function CountdownTimer({ endTime, onEnd }: { endTime: string; onEnd?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft("Ended");
        if (onEnd) onEnd();
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  return (
    <div className="flex items-center gap-2 text-sm font-mono font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
      <Hourglass className="w-4 h-4" />
      {timeLeft}
    </div>
  );
}
