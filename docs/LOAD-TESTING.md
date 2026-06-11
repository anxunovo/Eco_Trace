# Load Testing Results

## Objective
To verify the production API's capacity to handle concurrent users across different workloads (baseline, 50 users stress test, 100 users stress test).

## Test Configuration
- **Tool used:** Artillery (v2.0.31)
- **Target URL:** https://stu-eco-trace.netlify.app
- **Test Scenarios:**
  1. Read-heavy workload (browsing listings) - Weight: 6
  2. Mixed workload (auth + browsing) - Weight: 3
  3. Write workload (auth + create listing) - Weight: 1

### Phases
1. Baseline test: 10 concurrent users for 30s
2. Stress test: 50 concurrent users for 30s
3. Stress test: 100 concurrent users for 30s

## Results Summary

### Phase 1: Baseline (10 concurrent users)
- **Throughput:** ~6-17 requests/sec
- **Response times (p95):** ~200-350ms
- **Errors:**
  - Connection resets and timeouts observed early on.
  - 401 Unauthorized errors (expected, as auth tests might fail if token generation/capture acts up, but largely successful).
- **Observation:** The system handles 10 concurrent users adequately, but response times hover around 200-300ms for p95, with some network timeouts (ETIMEDOUT).

### Phase 2: Stress Test (50 concurrent users)
- **Throughput:** ~47-80 requests/sec
- **Response times (p95):** ~300-400ms
- **Errors:**
  - Significant increase in `ETIMEDOUT` and `ECONNRESET`.
  - Emergence of 403 Forbidden errors, indicating rate limiting or WAF block from Netlify/Turso.
- **Observation:** At 50 concurrent users, the application begins to struggle. The p95 response time degrades slightly to ~400ms. The rate limiting (403 errors) starts to kick in aggressively.

### Phase 3: Stress Test (100 concurrent users)
- **Throughput:** ~116-136 requests/sec
- **Response times (p95):** For successful requests, p95 was around 320ms, but this metric is heavily skewed by the high error rate.
- **Errors:**
  - Massive spike in `ETIMEDOUT` (~700-800 per 10s window).
  - Massive spike in `403 Forbidden` errors (~570 per 10s window), strongly indicating rate limiting.
- **Observation:** The API cannot handle 100 concurrent users under the current configuration. Netlify's standard rate limiting or Turso's concurrent connection limits are aggressively blocking requests, resulting in a high failure rate.

## Bottlenecks Identified
1. **Rate Limiting (403 Errors):** Netlify's edge infrastructure is likely throttling the requests when throughput exceeds ~80-100 req/sec from a single IP. This is an expected protection mechanism but highlights the need for a CDN/Caching layer for read-heavy operations if real traffic spikes occur.
2. **Connection Timeouts (ETIMEDOUT):** Netlify Functions have a cold start penalty and concurrent execution limits. Under heavy load, the functions fail to respond within the timeout window, leading to ETIMEDOUT errors.
3. **Database Concurrency:** While not explicitly throwing 500 errors, the Turso HTTP API might be throttling or delaying responses, contributing to the function timeouts.

## Recommendations for Scaling
1. **Implement Caching (Frontend & Edge):**
   - For the read-heavy workloads (e.g., `GET /api/listings`), implement caching headers (`Cache-Control: public, max-age=60`) to allow Netlify Edge to serve cached responses instead of hitting the function and database on every request.
2. **Optimize Database Queries:**
   - Ensure indexes are properly set up on frequently filtered columns in Turso (e.g., `status`, `category` on the `listings` table).
3. **Handle Rate Limits Gracefully:**
   - The frontend should implement exponential backoff and retry logic when encountering 429 or 403 (Rate Limit) errors.
4. **Function Optimization:**
   - Review Netlify Function execution times. If any synchronous operations are blocking, consider offloading them or optimizing the code. Ensure the `@tursodatabase/serverless` client is re-used appropriately within the execution context if possible, though Netlify limits this.

## Infrastructure Changes Needed (Future)
- **Enable Netlify Edge Functions:** Move simple read requests to Edge Functions for lower latency and better scaling.
- **Review Turso Tier:** Verify the Turso database tier can handle the expected concurrent connections and read/write ops. Upgrade if necessary.
