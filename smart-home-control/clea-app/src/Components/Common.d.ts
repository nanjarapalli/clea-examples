type Status = {
  value: boolean;
};

type Fan = {
  status: Status;
  speed: {
    value: number;
  };
};

type Light = {
  dimming: Status;
  green: Status;
  red: Status;
  brightness: {
    value: number;
  };
};

export type Config = {
  fan: Fan;
  light: Light;
};
