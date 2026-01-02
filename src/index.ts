import * as core from '@actions/core';
import { NetDiagClient, type CheckResponse } from '@netdiag/client';

async function run(): Promise<void> {
  try {
    // Get inputs
    const target = core.getInput('target', { required: true });
    const apiKey = core.getInput('api-key') || undefined;
    const regions = core.getInput('regions') || undefined;
    const port = parseInt(core.getInput('port') || '443', 10);
    const timeout = parseInt(core.getInput('timeout') || '30', 10) * 1000;

    core.info(`Running NetDiag health check for: ${target}`);
    if (regions) {
      core.info(`Regions: ${regions}`);
    }

    // Initialize client
    const client = new NetDiagClient({
      apiKey,
      timeout,
    });

    // Run diagnostics
    const response: CheckResponse = await client.check({
      target,
      port,
      regions,
    });

    // Log results
    core.info('');
    core.info('=== NetDiag Health Check Results ===');
    core.info(`Target: ${response.target}`);
    core.info(`Status: ${response.status}`);
    core.info(`Quorum: ${response.quorum}`);
    core.info(`DNS Propagation: ${response.dnsPropagationStatus}`);
    core.info('');

    // Log per-region results
    for (const location of response.locations) {
      const icon = location.status === 'Healthy' ? '✓' : location.status === 'Warning' ? '⚠' : '✗';
      core.info(`${icon} ${location.region}: ${location.status}`);

      if (location.ping) {
        const pingMsg = location.ping.latencyMs
          ? `${location.ping.latencyMs.toFixed(1)}ms`
          : location.ping.message;
        core.info(`  Ping: ${pingMsg}`);
      }
      if (location.dns) {
        core.info(`  DNS: ${location.dns.message}`);
      }
      if (location.tls) {
        const tlsMsg = location.tls.daysUntilExpiry
          ? `Valid (${location.tls.daysUntilExpiry} days until expiry)`
          : location.tls.message;
        core.info(`  TLS: ${tlsMsg}`);
      }
      if (location.http) {
        core.info(`  HTTP: ${location.http.message}`);
      }
    }
    core.info('');

    // Set outputs
    core.setOutput('status', response.status);
    core.setOutput('quorum', response.quorum);
    core.setOutput('dns-propagation', response.dnsPropagationStatus);
    core.setOutput('json', JSON.stringify(response));

    // Fail if unhealthy
    if (response.status === 'Unhealthy') {
      core.setFailed(`Health check failed: ${response.target} is Unhealthy (${response.quorum} regions healthy)`);
    } else if (response.status === 'Warning') {
      core.warning(`Health check warning: ${response.target} has warnings but is operational`);
    } else {
      core.info(`Health check passed: ${response.target} is Healthy`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`NetDiag check failed: ${error.message}`);
    } else {
      core.setFailed('NetDiag check failed with an unknown error');
    }
  }
}

run();
