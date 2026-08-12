/** Decorative pixel-tile mosaic painted from the four gradient stops; never an identity mark.
 * @startingPoint section="Brand" subtitle="Pixel mosaic brand motif" viewport="700x160"
 */
export interface PixelTilesProps {
  /** Grid rows. Default 3. */
  rows?: number;
  /** Grid columns. Default 8. */
  cols?: number;
  /** Tile size in px. Default 9. */
  size?: number;
  /** Gap in px. Default 2. */
  gap?: number;
  className?: string;
}
export declare function PixelTiles(props: PixelTilesProps): JSX.Element;
