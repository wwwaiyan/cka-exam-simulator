import React, { useState, useEffect, useRef } from 'react';

function Timer({ durationMinutes, onTimeout }) {
    const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [durationMinutes, onTimeout]);

    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;

    const pad = (n) => n.toString().padStart(2, '0');

    let timerClass = 'timer';
    if (secondsLeft <= 300) timerClass += ' danger';      // 5 minutes
    else if (secondsLeft <= 900) timerClass += ' warning'; // 15 minutes

    return (
        <div className={timerClass}>
            <span className="timer-icon">⏱</span>
            <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
        </div>
    );
}

export default Timer;
