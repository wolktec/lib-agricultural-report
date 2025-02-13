import { Telemetry } from "../interfaces/telemetry";

export function calcMechanicalAvailabilitySeconds(
  totalMaintenance: number,
  countMaintenance: number,
  currentHour: number // 24 dia anterior ou hora atual
) {
  if (totalMaintenance === 0) {
    return 100.0;
  }
  const calc = normalizeCalc(
    ((currentHour * 3600 - totalMaintenance / countMaintenance) /
      (currentHour * 3600)) *
      100,
    2
  );

  if (calc > 100) {
    return 100.0;
  }

  if (calc < 0) {
    return 0;
  }

  return calc;
}

export function calcMechanicalAvailability(
  totalMaintenance: number,
  countMaintenance: number,
  currentHour: number // 24 dia anterior ou hora atual
) {
  if (totalMaintenance === 0) {
    return 100.0;
  }
  const calc = normalizeCalc(
    ((currentHour - totalMaintenance / countMaintenance) / currentHour) * 100,
    2
  );

  if (calc > 100) {
    return 100.0;
  }

  if (calc < 0) {
    return 0;
  }

  return calc;
}

export function normalizeCalc(value: number, fixed = 1) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  value = value * 1;
  return parseFloat(value.toFixed(fixed));
}

export const getTotalHourmeter = (
  hourmeters: Telemetry[],
  firstHourmeterValue?: number
): number => {
  if (!hourmeters || hourmeters.length === 0) {
    return 0;
  }
  const hourmeterWithoutAnomalies = removeOutliers(
    hourmeters.map((e) => Number(e.current_value))
  );
  let total = 0;
  if (hourmeterWithoutAnomalies.length > 0) {
    let firstHourmeter = Number(hourmeterWithoutAnomalies[0]);

    let lastHourmeter =
      hourmeterWithoutAnomalies.length > 1
        ? Number(
            hourmeterWithoutAnomalies[hourmeterWithoutAnomalies.length - 1]
          )
        : firstHourmeter;
    if (
      lastHourmeter <= firstHourmeter &&
      hourmeterWithoutAnomalies.length > 1
    ) {
      lastHourmeter = Number(
        hourmeterWithoutAnomalies[hourmeterWithoutAnomalies.length - 2]
      );
    }

    if (lastHourmeter > firstHourmeter) {
      total = lastHourmeter - firstHourmeter;
    }
  }
  return Number(total.toFixed(2));
};

export function removeOutliers(values: number[], totalDays = 1): number[] {
  let filteredData: number[] = [];

  // Verificar se o array tem menos de dois elementos
  if (values.length < 2) {
    return values;
  }

  if (values[values.length - 1] - values[0] < totalDays * 24) {
    return [values[0], values[values.length - 1]];
  }

  // Filtrar o primeiro item se não for anômalo
  let firstIsAnomaly = false;
  if (Math.abs(values[1] - values[0]) <= 5000 && values[1] - values[0] > 0) {
    filteredData.push(values[0]);
  } else {
    firstIsAnomaly = true;
  }

  let countSequence = 0;
  let lastValid = 0;
  // Verificar e filtrar os itens intermediários
  for (let i = 1; i < values.length - 1; i++) {
    lastValid = filteredData[filteredData.length - 1] ?? lastValid;

    const diffPrev = Math.abs(values[i] - lastValid);
    const diffNext = Math.abs(values[i] - values[i + 1]);
    if ((diffPrev <= 5000 || firstIsAnomaly) && diffNext <= 5000) {
      countSequence = 0;
      filteredData.push(values[i]);
    }

    if (diffPrev > 5000 || diffNext >= 5000) {
      countSequence++;
    }

    if (countSequence === 30) {
      countSequence = 0;
      filteredData = [];
      lastValid = values[i];
    }
  }

  // Filtrar o último item se não for anômalo
  const lastIndex = values.length - 1;
  if (Math.abs(values[lastIndex] - values[lastIndex - 1]) <= 5000) {
    filteredData.push(values[lastIndex]);
  }

  return filteredData;
}

export const groupTelemetryByEquipmentCode = (telemetry: Telemetry[]) => {
  return telemetry.reduce((acc, cur) => {
    if (cur.equipment_code && cur.current_value !== "0.0") {
      return {
        ...acc,
        [cur.equipment_code]: [...(acc[cur.equipment_code] || []), cur],
      };
    }
    return acc;
  }, {} as { [key: string]: Telemetry[] });
};
