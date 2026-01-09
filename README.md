# NetDiag Health Check Action

Run multi-region network diagnostics (DNS, TLS, HTTP, Ping) to verify endpoint health after deployment.

This GitHub Action uses the [NetDiag API](https://netdiag.dev) to run comprehensive network health checks from multiple geographic regions worldwide.

## Features

- **Multi-region checks** - Verify connectivity from US West, EU Central, and AP Southeast
- **Complete diagnostics** - DNS resolution, TLS certificate validation, HTTP response, and ICMP ping
- **Post-deploy verification** - Confirm your services are responding correctly after deployment
- **Actionable outputs** - Get status, quorum, and full JSON response for downstream steps

## Usage

### Basic Usage

```yaml
- name: Check endpoint health
  uses: XAKPC-Dev-Labs/netdiag-check@v1.1.0
  with:
    target: example.com
```

### With API Key (Higher Rate Limits)

```yaml
- name: Check endpoint health
  uses: XAKPC-Dev-Labs/netdiag-check@v1.1.0
  with:
    target: example.com
    api-key: ${{ secrets.NETDIAG_API_KEY }}
```

### Specific Regions

```yaml
- name: Check from US and EU
  uses: XAKPC-Dev-Labs/netdiag-check@v1.1.0
  with:
    target: example.com
    regions: us-west,eu-central
```

### Using Outputs

```yaml
- name: Check endpoint health
  id: health
  uses: XAKPC-Dev-Labs/netdiag-check@v1.1.0
  with:
    target: example.com

- name: Show results
  run: |
    echo "Status: ${{ steps.health.outputs.status }}"
    echo "Quorum: ${{ steps.health.outputs.quorum }}"
    echo "Quorum Met: ${{ steps.health.outputs.quorum-met }}"
```

### Post-Deploy Verification Workflow

```yaml
name: Deploy and Verify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: ./deploy.sh

      - name: Wait for deployment
        run: sleep 30

      - name: Check endpoint health
        uses: XAKPC-Dev-Labs/netdiag-check@v1.1.0
        with:
          target: example.com
          api-key: ${{ secrets.NETDIAG_API_KEY }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `target` | Target hostname or URL to check (e.g., `example.com`) | Yes | - |
| `api-key` | NetDiag API key for higher rate limits ([get one](https://netdiag.dev)) | No | - |
| `regions` | Comma-separated region codes: `us-west`, `eu-central`, `ap-southeast` | No | All regions |
| `port` | TCP port for TLS/HTTP checks (80, 443, 8080, 8443) | No | `443` |
| `timeout` | Request timeout in seconds | No | `30` |

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `status` | Overall health status | `Healthy`, `Warning`, or `Unhealthy` |
| `quorum` | Healthy regions count | `2/3` |
| `quorum-met` | Whether required quorum was achieved | `true` or `false` |
| `json` | Full JSON response for custom processing | `{"runId":"...","status":"Healthy",...}` |

## Status Values

| Status | Description | Action Result |
|--------|-------------|---------------|
| `Healthy` | All checks passed | Workflow continues |
| `Warning` | Working but needs attention (e.g., cert expiring soon) | Workflow continues with warning |
| `Unhealthy` | Critical failure (e.g., connection refused, timeout) | **Workflow fails** |

## Available Regions

| Region | Location |
|--------|----------|
| `us-west` | Hillsboro, Oregon, USA |
| `eu-central` | Falkenstein, Germany |
| `ap-southeast` | Singapore |

## Rate Limits

Free tier allows 10 requests per minute (no API key needed). For higher limits, get an API key at [netdiag.dev](https://netdiag.dev).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [NetDiag Website](https://netdiag.dev)
- [API Documentation](https://netdiag.dev/docs)
- [Report Issues](https://github.com/xakpc/netdiag-check/issues)
- [Terms of Service](https://netdiag.dev/terms/)
- [Privacy Policy](https://netdiag.dev/privacy/)
