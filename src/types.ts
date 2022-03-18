export type Update = {
  id: string;
  action: 'kill' | 'resurrect';
};
export type Coordinate = [number, number];

export type VisibleWorld = {
  x: [number, number];
  y: [number, number];
};
