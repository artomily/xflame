export type AmeMood = "idle" | "happy" | "loading";

const RATIO = 418 / 382; // viewBox width / height

/**
 * Ame — the xflame dino mascot.
 * `size` sets the rendered height in px; width follows the figure's aspect ratio.
 */
export default function Ame({
  size = 96,
  mood = "idle",
  className = "",
  title = "Ame the dino",
}: {
  size?: number;
  mood?: AmeMood;
  className?: string;
  title?: string;
}) {
  const bob = mood === "loading" ? " ame-bob" : "";
  const happy = mood === "happy";

  return (
    <svg
      width={Math.round(size * RATIO)}
      height={size}
      viewBox="82 98 418 382"
      role="img"
      aria-label={title}
      className={className + bob}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      {/* ground shadow */}
      <ellipse cx="322" cy="454" rx="162" ry="18" fill="#3A6B50" opacity="0.15" />

      {/* tail */}
      <path d="M196 356 C 118 356 92 296 120 258 Z" fill="#4E9E74" />
      <ellipse cx="128" cy="272" rx="10" ry="14" fill="#F06828" />

      {/* feet */}
      <ellipse cx="262" cy="444" rx="40" ry="23" fill="#4E9E74" />
      <ellipse cx="382" cy="444" rx="40" ry="23" fill="#4E9E74" />

      {/* body */}
      <ellipse cx="322" cy="300" rx="140" ry="158" fill="#63BC8C" />

      {/* back spikes */}
      <path d="M250 180 L262 140 L286 174 Z" fill="#F06828" />
      <path d="M286 174 L302 120 L328 170 Z" fill="#F59E68" />
      <path d="M328 170 L346 106 L370 168 Z" fill="#F06828" />
      <path d="M370 168 L388 122 L406 178 Z" fill="#F59E68" />
      <path d="M406 178 L420 146 L438 188 Z" fill="#F06828" />

      {/* belly */}
      <ellipse cx="322" cy="352" rx="82" ry="96" fill="#F5E6C8" />

      {/* arms */}
      <ellipse cx="200" cy="338" rx="28" ry="17" fill="#5AAE80" />
      <ellipse cx="430" cy="322" rx="30" ry="16" fill="#5AAE80" />
      <circle cx="460" cy="312" r="13" fill="#63BC8C" />

      {/* flame in hand — flickers while loading */}
      <g
        className={mood === "loading" ? "ame-flame" : ""}
        style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
      >
        <path
          d="M462 306 C 447 295 449 269 462 250 C 466 243 473 243 475 251 C 483 269 491 282 487 297 C 484 306 473 310 462 306 Z"
          fill="#F06828"
        />
        <path
          d="M462 303 C 452 295 454 273 463 258 C 466 252 472 252 474 259 C 480 273 484 284 481 294 C 478 302 470 305 462 303 Z"
          fill="#F59E68"
        />
        <ellipse cx="465" cy="288" rx="6" ry="10" fill="#FFDDA8" />
      </g>

      {/* eyes */}
      {happy ? (
        <>
          <path d="M262 262 Q280 244 298 262" fill="none" stroke="#2E2A24" strokeWidth="7" strokeLinecap="round" />
          <path d="M348 262 Q366 244 384 262" fill="none" stroke="#2E2A24" strokeWidth="7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="280" cy="256" r="31" fill="#FFFFFF" />
          <circle cx="366" cy="256" r="31" fill="#FFFFFF" />
          <circle cx="288" cy="260" r="15" fill="#2E2A24" />
          <circle cx="358" cy="260" r="15" fill="#2E2A24" />
          <circle cx="283" cy="254" r="5.5" fill="#FFFFFF" />
          <circle cx="353" cy="254" r="5.5" fill="#FFFFFF" />
        </>
      )}

      {/* cheeks */}
      <circle cx="246" cy="302" r="16" fill="#EF9A8A" opacity="0.6" />
      <circle cx="398" cy="302" r="16" fill="#EF9A8A" opacity="0.6" />

      {/* nose + mouth */}
      <circle cx="312" cy="300" r="3.5" fill="#4E9E74" />
      <circle cx="334" cy="300" r="3.5" fill="#4E9E74" />
      <path d="M304 314 Q323 336 342 314 Z" fill="#B5503F" />
      <ellipse cx="323" cy="325" rx="9" ry="6" fill="#F08C7C" />
    </svg>
  );
}
