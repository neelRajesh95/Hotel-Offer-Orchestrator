import { Worker } from '@temporalio/worker';
import * as activities from './activities/hotelActivities';

async function run() {
  // Create a Worker connected to the Temporal server
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows/hotelWorkflow'),
    activities,
    taskQueue: 'hotel-task-queue',
  });

  // Start accepting tasks
  await worker.run();
}

run().catch((err) => {
  console.error('Worker error:', err);
  process.exit(1);
});