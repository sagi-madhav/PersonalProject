import { BlockRecord } from '../../../db/types';

export interface PackedBlock {
  block: BlockRecord;
  column: number;
  totalColumns: number;
}

export function packColumns(blocks: BlockRecord[], maxColumns: number = 3): PackedBlock[] {
  // Filter only blocks that have start_min and duration_min
  const timed = blocks.filter(
    (b) => b.start_min != null && b.duration_min != null && b.duration_min > 0
  );

  // Sort by start time, then duration descending
  const sorted = [...timed].sort((a, b) => {
    if (a.start_min! !== b.start_min!) {
      return a.start_min! - b.start_min!;
    }
    return b.duration_min! - a.duration_min!;
  });

  if (sorted.length === 0) return [];

  // Group connected clusters of overlapping blocks
  const clusters: BlockRecord[][] = [];
  let currentCluster: BlockRecord[] = [];
  let clusterEnd = -1;

  for (const block of sorted) {
    const start = block.start_min!;
    const end = start + block.duration_min!;

    if (start < clusterEnd) {
      currentCluster.push(block);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }
      currentCluster = [block];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PackedBlock[] = [];

  for (const cluster of clusters) {
    // Greedy graph coloring for columns
    const columns: number[] = []; // track end time of each column
    const clusterPacked: { block: BlockRecord; col: number }[] = [];

    for (const block of cluster) {
      const start = block.start_min!;
      const end = start + block.duration_min!;

      let assignedCol = -1;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= start) {
          assignedCol = c;
          columns[c] = end;
          break;
        }
      }

      if (assignedCol === -1) {
        assignedCol = columns.length;
        columns.push(end);
      }

      clusterPacked.push({ block, col: Math.min(assignedCol, maxColumns - 1) });
    }

    const totalCols = Math.min(columns.length, maxColumns);
    for (const item of clusterPacked) {
      result.push({
        block: item.block,
        column: item.col,
        totalColumns: totalCols,
      });
    }
  }

  return result;
}
