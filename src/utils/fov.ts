import * as ROT from 'rot-js';
import { World, inBounds } from '../world/World';
import { FogState, blocksLight } from '../world/Tile';
import { FOV_RADIUS } from '../game/constants';

export class FOVComputer {
  private previouslyVisible: Array<{ x: number; y: number }> = [];

  private makeFOV(world: World): InstanceType<typeof ROT.FOV.PreciseShadowcasting> {
    return new ROT.FOV.PreciseShadowcasting((x: number, y: number) => {
      if (!inBounds(x, y)) return false;
      return !blocksLight(world.grid[y][x]);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compute(world: World, px: number, py: number): void {
    for (const { x, y } of this.previouslyVisible) {
      if (world.grid[y][x].fog === FogState.VISIBLE) {
        world.grid[y][x].fog = FogState.REMEMBERED;
      }
    }
    this.previouslyVisible = [];

    const fov = this.makeFOV(world);
    fov.compute(px, py, FOV_RADIUS, (x: number, y: number) => {
      if (!inBounds(x, y)) return;
      world.grid[y][x].fog = FogState.VISIBLE;
      this.previouslyVisible.push({ x, y });
    });
  }
}
