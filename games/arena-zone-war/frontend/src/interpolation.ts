let prevState: any = null;
let currState: any = null;
let lastUpdate = Date.now();

export function updateState(newState: any) {
  prevState = currState;
  currState = newState;
  lastUpdate = Date.now();
}

export function getInterpolatedState() {
  if (!prevState || !currState) return currState;

  const now = Date.now();
  const alpha = Math.min((now - lastUpdate) / 200, 1); // 200ms tick

  const players = currState.players.map((p: any) => {
    const prev = prevState.players.find((pp: any) => pp.id === p.id);
    if (!prev) return p;

    return {
      ...p,
      x: prev.x + (p.x - prev.x) * alpha,
      y: prev.y + (p.y - prev.y) * alpha,
    };
  });

  return {
    ...currState,
    players,
  };
}