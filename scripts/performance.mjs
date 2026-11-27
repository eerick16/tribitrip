
import { performance } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';
import assert from 'node:assert/strict';

const allowedUrl =
  'https://tribitrip-testing.onrender.com/api/health';

function percentile(values, p) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;

  return sorted[index];
}

function statistics(values) {
  if (!values.length) return null;

  return {
    min: Math.min(...values).toFixed(2),
    promedio: (
      values.reduce((a, b) => a + b, 0) / values.length
    ).toFixed(2),
    max: Math.max(...values).toFixed(2),
    p50: percentile(values, 50).toFixed(2),
    p95: percentile(values, 95).toFixed(2),
    p99: percentile(values, 99).toFixed(2),
  };
}

// Validación local de los cálculos, sin solicitudes HTTP.
if (process.argv[2] === '--self-test') {
  assert.equal(percentile([10, 20, 30, 40, 50], 50), 30);
  assert.equal(percentile([10, 20, 30, 40, 50], 95), 50);
  assert.equal(percentile([], 95), null);
  assert.equal(statistics([10, 20, 30]).promedio, '20.00');

  console.log('Validación local de cálculos aprobada.');
  process.exit(0);
}

// Parámetros predeterminados.
const args = {
  url: allowedUrl,
  concurrency: 1,
  duration: 30,
  timeout: 5000,
};

// Leer argumentos de terminal.
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i].replace(/^--/, '');
  const value = process.argv[i + 1];

  if (
    !Object.hasOwn(args, key) ||
    !process.argv[i].startsWith('--') ||
    value === undefined
  ) {
    console.error('Argumento inválido:', process.argv[i]);
    process.exit(1);
  }

  args[key] = key === 'url' ? value : Number(value);
}

// Validar parámetros.
if (
  args.url !== allowedUrl ||
  !Number.isInteger(args.concurrency) ||
  args.concurrency < 1 ||
  args.concurrency > 10 ||
  !Number.isInteger(args.duration) ||
  args.duration < 1 ||
  args.duration > 60 ||
  !Number.isInteger(args.timeout) ||
  args.timeout < 1 ||
  args.timeout > 30000
) {
  console.error('Parámetros fuera de los límites permitidos.');
  process.exit(1);
}

const successfulLatencies = [];
const failedLatencies = [];

const errors = {
  http: 0,
  content: 0,
  network: 0,
  timeout: 0,
};

let consecutiveFailures = 0;
let stopped = false;
let stopReason = '';

function stop(reason) {
  if (!stopped) {
    stopped = true;
    stopReason = reason;
  }
}

process.on('SIGINT', () => {
  stop('Interrupción manual mediante Ctrl+C');
});

process.on('SIGTERM', () => {
  stop('Interrupción del proceso');
});

const date = new Date().toISOString();
const start = performance.now();
const end = start + args.duration * 1000;

async function worker() {
  while (!stopped && performance.now() < end) {
    const requestStart = performance.now();

    let success = false;
    let errorType = 'network';
    let status;

    try {
      const response = await fetch(args.url, {
        method: 'GET',
        redirect: 'error',
        signal: AbortSignal.timeout(args.timeout),
      });

      status = response.status;

      if (status === 429 || status === 503) {
        stop(`Señal de saturación HTTP ${status}`);
      }

      const body = await response.text();

      if (status !== 200) {
        errorType = 'http';
      } else {
        try {
          const data = JSON.parse(body);

          if (data.conectado === true) {
            success = true;
          } else {
            errorType = 'content';
          }
        } catch {
          errorType = 'content';
        }
      }
    } catch (error) {
      errorType =
        error.name === 'TimeoutError' ||
        error.name === 'AbortError'
          ? 'timeout'
          : 'network';
    }

    const latency = performance.now() - requestStart;

    if (success) {
      successfulLatencies.push(latency);
      consecutiveFailures = 0;
    } else {
      failedLatencies.push(latency);
      errors[errorType]++;
      consecutiveFailures++;

      if (consecutiveFailures >= 5) {
        stop('Cinco fallos consecutivos');
      }
    }

    if (!stopped && performance.now() < end) {
      await sleep(250);
    }
  }
}

console.log('\n--- INICIO DE PRUEBA DE RENDIMIENTO ---\n');
console.log('Fecha:', date);
console.log('URL:', args.url);
console.log('Concurrencia:', args.concurrency);
console.log('Duración configurada:', args.duration, 's');
console.log('Timeout:', args.timeout, 'ms');

await Promise.all(
  Array.from(
    { length: args.concurrency },
    () => worker()
  )
);

const elapsed = (performance.now() - start) / 1000;
const successful = successfulLatencies.length;
const failed = failedLatencies.length;
const total = successful + failed;

const errorRate = total ? (failed / total) * 100 : null;
const throughput = total / elapsed;
const p95 = percentile(successfulLatencies, 95);

const evaluable = total > 0 && successful > 0;
const passed =
  evaluable &&
  p95 <= 1000 &&
  errorRate < 1 &&
  !stopped;

console.log('\n--- RESULTADOS GENERALES ---\n');

console.table({
  'Duración real (s)': elapsed.toFixed(2),
  'Solicitudes totales': total,
  'Solicitudes exitosas': successful,
  'Solicitudes fallidas': failed,
  'Porcentaje de error (%)':
    errorRate === null ? 'N/A' : errorRate.toFixed(2),
  'Solicitudes por segundo': throughput.toFixed(2),
});

console.log('\nLatencias exitosas (ms):');
console.table(statistics(successfulLatencies) ?? { resultado: 'N/A' });

console.log('\nLatencias fallidas (ms):');
console.table(statistics(failedLatencies) ?? { resultado: 'N/A' });

console.log('\nClasificación de errores:');
console.table(errors);

console.log('\nMétodo de percentiles: rango más cercano.');

console.log('\n--- EVALUACIÓN ---\n');

console.log(
  'p95 <= 1000 ms:',
  p95 === null ? 'NO EVALUABLE' :
    p95 <= 1000 ? 'CUMPLE' : 'NO CUMPLE'
);

console.log(
  'Errores < 1%:',
  errorRate === null ? 'NO EVALUABLE' :
    errorRate < 1 ? 'CUMPLE' : 'NO CUMPLE'
);

console.log(
  'Resultado general:',
  !evaluable ? 'NO EVALUABLE' :
    passed ? 'APROBADO' : 'NO APROBADO'
);

if (stopped) {
  console.log('Motivo de detención:', stopReason);
}

process.exitCode = passed ? 0 : 1;
