import * as core from '@actions/core';
import { NetDiagClient, type CheckResponse } from '@netdiag/client';

async function run(): Promise<void> {
  try {
    // Get inputs
    const target = core.getInput('host', { required: true });
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
      host: target,
      port,
      regions,
    });

    // Log results
    core.info('');
    core.info('=== NetDiag Health Check Results ===');
    core.info(`Target: ${response.host}`);
    core.info(`Status: ${response.status}`);
    core.info(`Quorum: ${response.quorum.required}/${response.quorum.total} (met: ${response.quorum.met})`);
    core.info('');

    // Log per-region results
    for (const location of response.regions) {
      const icon = location.status === 'Healthy' ? '✓' : location.status === 'Warning' ? '⚠' : '✗';
      core.info(`${icon} ${location.region}: ${location.status}`);

      if (location.ping) {
        const pingMsg = location.ping.avgRttMs
          ? `${location.ping.avgRttMs.toFixed(1)}ms`
          : location.ping.error?.message ?? 'No response';
        core.info(`  Ping: ${pingMsg}`);
      }
      if (location.dns) {
        const dnsMsg = location.dns.resolvedAddresses.length > 0
          ? `Resolved ${location.dns.resolvedAddresses.length} address(es)`
          : location.dns.error?.message ?? 'No addresses';
        core.info(`  DNS: ${dnsMsg}`);
      }
      if (location.tls) {
        const tlsMsg = location.tls.daysUntilExpiry
          ? `Valid (${location.tls.daysUntilExpiry} days until expiry)`
          : location.tls.error?.message ?? 'Invalid certificate';
        core.info(`  TLS: ${tlsMsg}`);
      }
      if (location.http) {
        const httpMsg = location.http.statusCode
          ? `${location.http.statusCode} (${location.http.totalTimeMs}ms)`
          : location.http.error?.message ?? 'Request failed';
        core.info(`  HTTP: ${httpMsg}`);
      }
    }
    core.info('');

    // Set outputs
    core.setOutput('status', response.status);
    core.setOutput('quorum', `${response.quorum.required}/${response.quorum.total}`);
    core.setOutput('quorum-met', response.quorum.met);
    core.setOutput('json', JSON.stringify(response));

    // Fail if unhealthy
    if (response.status === 'Unhealthy') {
      core.setFailed(`Health check failed: ${response.host} is Unhealthy (${response.quorum.required}/${response.quorum.total} regions healthy)`);
    } else if (response.status === 'Warning') {
      core.warning(`Health check warning: ${response.host} has warnings but is operational`);
    } else {
      core.info(`Health check passed: ${response.host} is Healthy`);
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
