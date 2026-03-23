import type { GenerateResponse } from '../../../types';
import { Outlet3D } from './Outlet3D';
import { Panel3D } from './Panel3D';
import { Switch3D } from './Switch3D';
import { Wire3D } from './Wire3D';

type Props = { result: GenerateResponse };

export function ElectricalLayer3D({ result }: Props) {
  return (
    <>
      {result.outlets.map((o, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable index for generated layout
        <Outlet3D key={i} outlet={o} />
      ))}
      {result.switches.map((s, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable index for generated layout
        <Switch3D key={i} sw={s} />
      ))}
      {result.wires.map((w, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable index for generated layout
        <Wire3D key={i} wire={w} />
      ))}
      <Panel3D panel={result.panel} />
    </>
  );
}
