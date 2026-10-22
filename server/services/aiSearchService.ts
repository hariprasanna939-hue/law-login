import { db } from '../db.js';

export interface PlotSearchParams {
  projectId?: string;
  nlQuery?: string;
  sizeOperator?: 'more_than' | 'less_than' | 'equal_to';
  sizeValue?: number;
  sizeUnit?: 'cents' | 'sqft' | 'acres';
  roadWidthFt?: number;
}

export interface PlotResult {
  id: string;
  project_id: string;
  project_name: string;
  property_id: string;
  property_name: string;
  plot_number: string;
  size_cents: number;
  size_sqft: number;
  road_width_ft: number;
  direction: string;
  availability: string;
  price_inr: number;
  metadata?: string;
}

export interface ParsedNLQuery {
  extractedDirection?: string;
  extractedAvailability?: string;
  extractedSizeOp?: 'more_than' | 'less_than' | 'equal_to';
  extractedSizeCents?: number;
  extractedRoadWidthFt?: number;
  extractedProject?: string;
}

export function parseNaturalLanguageQuery(query: string): ParsedNLQuery {
  const q = query.toLowerCase().trim();
  const result: ParsedNLQuery = {};

  if (!q) return result;

  // Directions
  if (q.includes('north-east') || q.includes('northeast') || q.includes('north east') || q.includes('ne ')) {
    result.extractedDirection = 'North-East';
  } else if (q.includes('north-west') || q.includes('northwest') || q.includes('north west') || q.includes('nw ')) {
    result.extractedDirection = 'North-West';
  } else if (q.includes('south-east') || q.includes('southeast') || q.includes('south east') || q.includes('se ')) {
    result.extractedDirection = 'South-East';
  } else if (q.includes('south-west') || q.includes('southwest') || q.includes('south west') || q.includes('sw ')) {
    result.extractedDirection = 'South-West';
  } else if (q.includes('north')) {
    result.extractedDirection = 'North';
  } else if (q.includes('south')) {
    result.extractedDirection = 'South';
  } else if (q.includes('east')) {
    result.extractedDirection = 'East';
  } else if (q.includes('west')) {
    result.extractedDirection = 'West';
  }

  // Availability
  if (q.includes('available')) {
    result.extractedAvailability = 'Available';
  } else if (q.includes('booked')) {
    result.extractedAvailability = 'Booked';
  } else if (q.includes('sold')) {
    result.extractedAvailability = 'Sold';
  }

  // Size parsing
  // e.g. "more than 2 cents", "greater than 3 cents", "> 2 cents", "less than 4 cents", "equal to 2.5 cents", "3 cents"
  const moreSize = q.match(/(?:more than|greater than|>|above|over|exceeding)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:cents?|cent)/);
  if (moreSize) {
    result.extractedSizeOp = 'more_than';
    result.extractedSizeCents = parseFloat(moreSize[1]);
  } else {
    const lessSize = q.match(/(?:less than|smaller than|<|under|below)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:cents?|cent)/);
    if (lessSize) {
      result.extractedSizeOp = 'less_than';
      result.extractedSizeCents = parseFloat(lessSize[1]);
    } else {
      const eqSize = q.match(/(?:equal to|around|=|about)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:cents?|cent)/);
      if (eqSize) {
        result.extractedSizeOp = 'equal_to';
        result.extractedSizeCents = parseFloat(eqSize[1]);
      } else {
        const directSize = q.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:cents?|cent)/);
        if (directSize) {
          result.extractedSizeOp = 'more_than';
          result.extractedSizeCents = parseFloat(directSize[1]);
        }
      }
    }
  }

  // Road width parsing
  // e.g. "facing 30 feet road", "30 ft road", "30 feet road", "9 m road" (counts as 30 feet)
  if (q.includes('9 m road') || q.includes('9m road') || q.includes('9 meter') || q.includes('9 metre')) {
    result.extractedRoadWidthFt = 30;
  } else {
    const roadMatch = q.match(/(?:facing\s+)?([0-9]+(?:\.[0-9]+)?)\s*(?:feet|ft|foot)\s*(?:road|facing|width)?/);
    if (roadMatch) {
      result.extractedRoadWidthFt = parseFloat(roadMatch[1]);
    }
  }

  // Project mentions
  if (q.includes('perur')) {
    result.extractedProject = 'prj-perur';
  } else if (q.includes('heritage')) {
    result.extractedProject = 'prj-heritage';
  } else if (q.includes('sulur')) {
    result.extractedProject = 'prj-sulur';
  } else if (q.includes('vishnu')) {
    result.extractedProject = 'prj-vishnu';
  } else if (q.includes('ismail')) {
    result.extractedProject = 'prj-ismail';
  }

  return result;
}

export function searchPlots(params: PlotSearchParams): {
  plots: PlotResult[];
  appliedCriteria: string[];
  totalMatches: number;
} {
  let whereClauses: string[] = [];
  let sqlParams: any[] = [];
  let appliedCriteria: string[] = [];

  // Parse natural language if present
  let nlParsed: ParsedNLQuery = {};
  if (params.nlQuery && params.nlQuery.trim()) {
    nlParsed = parseNaturalLanguageQuery(params.nlQuery);
  }

  // 1. Project filtering
  const targetProject = params.projectId && params.projectId !== 'all' ? params.projectId : nlParsed.extractedProject;
  if (targetProject && targetProject !== 'all') {
    whereClauses.push('p.project_id = ?');
    sqlParams.push(targetProject);
    const prjRow = db.prepare('SELECT name FROM projects WHERE id = ?').get(targetProject) as { name: string } | undefined;
    appliedCriteria.push(`Project: ${prjRow ? prjRow.name : targetProject}`);
  }

  // 2. Direction filtering from NL
  if (nlParsed.extractedDirection) {
    whereClauses.push('p.direction = ?');
    sqlParams.push(nlParsed.extractedDirection);
    appliedCriteria.push(`Facing: ${nlParsed.extractedDirection}`);
  }

  // 3. Availability filtering from NL
  if (nlParsed.extractedAvailability) {
    whereClauses.push('p.availability = ?');
    sqlParams.push(nlParsed.extractedAvailability);
    appliedCriteria.push(`Status: ${nlParsed.extractedAvailability}`);
  }

  // 4. Size filtering: evaluate structured input first, fallback to NL
  let op = params.sizeOperator || nlParsed.extractedSizeOp;
  let val = params.sizeValue !== undefined && !isNaN(params.sizeValue) ? params.sizeValue : nlParsed.extractedSizeCents;
  let unit = params.sizeUnit || 'cents';

  if (val !== undefined && val > 0 && op) {
    // Normalize to cents
    let centsValue = val;
    if (unit === 'sqft') {
      centsValue = val / 435.6;
    } else if (unit === 'acres') {
      centsValue = val * 100;
    }

    if (op === 'more_than') {
      whereClauses.push('p.size_cents >= ?');
      sqlParams.push(centsValue);
      appliedCriteria.push(`Size ≥ ${val} ${unit}`);
    } else if (op === 'less_than') {
      whereClauses.push('p.size_cents <= ?');
      sqlParams.push(centsValue);
      appliedCriteria.push(`Size ≤ ${val} ${unit}`);
    } else if (op === 'equal_to') {
      // Prompt specification: "Equal to" finds plots within 2% of the size
      const minCents = centsValue * 0.98;
      const maxCents = centsValue * 1.02;
      whereClauses.push('p.size_cents BETWEEN ? AND ?');
      sqlParams.push(minCents, maxCents);
      appliedCriteria.push(`Size within 2% of ${val} ${unit}`);
    }
  }

  // 5. Road width filtering
  const roadWidth = params.roadWidthFt !== undefined && !isNaN(params.roadWidthFt) ? params.roadWidthFt : nlParsed.extractedRoadWidthFt;
  if (roadWidth !== undefined && roadWidth > 0) {
    whereClauses.push('p.road_width_ft >= ?');
    sqlParams.push(roadWidth);
    appliedCriteria.push(`Road Width ≥ ${roadWidth} ft`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const querySql = `
    SELECT
      p.id,
      p.project_id,
      prj.name as project_name,
      p.property_id,
      COALESCE(prop.name, prj.name) as property_name,
      p.plot_number,
      p.size_cents,
      p.size_sqft,
      p.road_width_ft,
      p.direction,
      p.availability,
      p.price_inr,
      p.metadata
    FROM plots p
    JOIN projects prj ON prj.id = p.project_id
    LEFT JOIN properties prop ON prop.id = p.property_id
    ${whereSql}
    ORDER BY p.plot_number ASC
  `;

  const rows = db.prepare(querySql).all(...sqlParams) as PlotResult[];

  return {
    plots: rows,
    appliedCriteria,
    totalMatches: rows.length,
  };
}
