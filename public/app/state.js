const defaultState = {
  currentView: 'daily',
  user: { name: 'Bác sĩ phụ trách' },
  clinic: { name: 'PHÒNG KHÁM SẢN PHỤ KHOA', dbPath: 'Data/Database/app.db' },
  license: { status: 'valid', daysLeft: 30, type: 'trial' },
  today: new Date().toISOString().slice(0, 10),
};

let subscribers = [];
let state = { ...defaultState };

export function getState() {
  return state;
}

export function setState(partial) {
  state = { ...state, ...partial };
  subscribers.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  subscribers.push(fn);
  return () => {
    subscribers = subscribers.filter((s) => s !== fn);
  };
}

export function resetState() {
  state = { ...defaultState };
  subscribers.forEach((fn) => fn(state));
}
